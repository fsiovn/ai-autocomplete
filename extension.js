const vscode = require('vscode');

const OUTPUT_CHANNEL = vscode.window.createOutputChannel('AI Autocomplete');

const GET_GEMINI_API_KEY_BUTTON_LABEL = 'Get Gemini API key';
const GET_GEMINI_API_KEY_URL = 'https://aistudio.google.com/u/1/api-keys';

const GET_CEREBRAS_API_KEY_BUTTON_LABEL = 'Get Cerebras API key';
const GET_CEREBRAS_API_KEY_URL = 'https://cloud.cerebras.ai';

const GEMINI_API_SECRET_KEY_NAME = 'FSIOVN_GEMINI_API_KEY';
const INPUT_GEMINI_API_KEY_COMMAND = 'ai-autocomplete.inputGeminiAPIKey';

const INPUT_GEMINI_API_KEY_BUTTON_LABEL = 'Input API Key';
const CHANGE_GEMINI_API_KEY_BUTTON_LABEL = 'Change API Key';

const FIM_INSTRUCTION = 'You are a code completion assistant\n'
	+ 'Your name is fsiovn - AI Autocomplete\n'
	+ 'FIM mode(Fill-In-the-Middle)\n'
	+ 'Output format <fim_middle></fim_middle>\n'
	+ 'Eg: <fim_middle>console.log</fim_middle>\n'
	+ 'Eg: <fim_middle>System.out.print</fim_middle>\n'
	+ 'Eg: <fim_middle>int x = 1;\nint y = 1;\\nSystem.out.print("x + y = ", x + y);</fim_middle>\n'
	+ 'Always suggest code snippets longer than 9 characters\n'
	+ 'Return empty if no valid suggestion <fim_middle></fim_middle>\n'
	+ 'Syntax must be valid\n'
	+ 'No explanations, only code completions\n';

// This method is called when your extension is activated
/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	try {

		console.log('[fsiovn] AI Autocomplete', 'The open source AI code autocomplete extension for Visual Studio Code');

		try {
			registerInputGeminiAPIKeyCommand(context);
			getGeminiAPIKey(context);
			promptInputGeminiAPIKey(context);
		} catch (error) {
			console.error('[fsiovn] AI Autocomplete', error);
			log(error);
		}

		try {

			await registerInlineCompletionItemProvider(context);

		} catch (error) {

			console.error('[fsiovn] AI Autocomplete', error);
			log(error);

		}

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', error);
		log(error);

	}

}

async function registerInputGeminiAPIKeyCommand(context) {

	try {

		const inputGeminiAPIKeyCommandDisposable = vscode.commands.registerCommand(INPUT_GEMINI_API_KEY_COMMAND, async function () {

			const geminiAPIKey = await vscode.window.showInputBox({
				title: 'Input Gemini/Cerebras API key',
				prompt: '................................................................ Enter your Gemini/Cerebras API key ................................................................ .............................. Get free Cerebras API key at https://cloud.cerebras.ai (recommended) .............................. ............................... Get free Gemini API key at https://aistudio.google.com/u/1/api-keys ............................... --------------------------------------------------------------------------------------------------------------',
				placeHolder: `Paste your Gemini/Cerebras API key here. ${await context.secrets.get(GEMINI_API_SECRET_KEY_NAME) ? 'Type DELETE to remove saved key.' : ''}`,
				password: true, // Mark input characters for security
				ignoreFocusOut: true, // Keep the input box open when clicking outside
				validateInput: (text) => {
					return text && text?.trim()?.length > 0 ? null : 'Gemini/Cerebras API key cannot be empty.';
				}
			});

			if (geminiAPIKey) {
				if (geminiAPIKey.toUpperCase() === 'DELETE') {
					await context.secrets.delete(GEMINI_API_SECRET_KEY_NAME);
					vscode.window.showInformationMessage(`${geminiAPIKey?.startsWith('csk-') ? 'Cerebras' : 'Gemini'} API key deleted.`);
				} else {
					await context.secrets.store(GEMINI_API_SECRET_KEY_NAME, geminiAPIKey?.trim());
					vscode.window.showInformationMessage(`${geminiAPIKey?.startsWith('csk-') ? 'Cerebras' : 'Gemini'} API key saved.`);
				}
			} else {
				vscode.window.showErrorMessage('Gemini/Cerebras API key input cancelled.');
			}

			promptInputGeminiAPIKey(context);

		});

		context.subscriptions.push(inputGeminiAPIKeyCommandDisposable);

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', error);
		log(error);

	}

}

async function registerInlineCompletionItemProvider(context) {

	try {

		const inlineCompletionItemDocumentSelector = { pattern: '**' };

		const inlineCompletionItemProvider = {

			provideInlineCompletionItems: async (document, position, provideInlineCompletionItemsContext, token) => {

				try {

					// Using getText for multi lines
					// Using substring for single line for better performance

					const currentLine = document.lineAt(position.line);
					const linePrefix = currentLine.text.substring(0, position.character);

					if (linePrefix === '}') {
						return null;
					}

					if (String(linePrefix)?.startsWith('</') && String(linePrefix)?.endsWith('>')) {
						return null;
					}

					const filename = document.fileName;

					const sensitivePatterns = [
						'_history',
						'.bak',
						'.bash',
						'.crt',
						'.db',
						'.dump',
						'.env',
						'.git',
						'.gitignore',
						'.hg',
						'.htaccess',
						'.htpasswd',
						'.key',
						'.log',
						'.p12',
						'.pem',
						'.pfx',
						'.pub',
						'.sql',
						'.sqlite',
						'.svn',
						'.swp',
						'.zsh',
						'api_key',
						'appsettings',
						'auth',
						'authorized_keys',
						'aws',
						'azure',
						'backup',
						'bitbucket',
						'config.',
						'credential',
						'credentials.json',
						'docker-compose',
						'dockerfile',
						'gcloud',
						'google-services',
						'id_dsa',
						'id_ed25519',
						'id_rsa',
						'keystore',
						'known_hosts',
						'oauth',
						'password',
						'php.ini',
						'secret',
						'secrets.json',
						'service-account',
						'settings.py',
						'token',
						'web.config',
						'wp-config'
					];

					if (sensitivePatterns.some(pattern => filename.toLowerCase().includes(pattern))) {

						log(`Skip sensitive file ${filename}`);

						return null;
					}

					// Cancel on change
					if (token.isCancellationRequested) {
						log('Cancel on change');
						return null;
					}

					const geminiAPIKey = await context.secrets.get(GEMINI_API_SECRET_KEY_NAME);

					if (!String(geminiAPIKey)?.startsWith('csk-') && provideInlineCompletionItemsContext?.triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
						return null;
					}

					const delayRatio = String(geminiAPIKey)?.startsWith('csk-') ? 1 : 2

					// Debounce
					await new Promise(resolve => setTimeout(resolve, 500 * delayRatio));

					// Cancel on change
					if (token.isCancellationRequested) {
						log('Cancel on change after delay');
						return null;
					}

					// Allow tab
					if (linePrefix?.trim()?.length === 0) {
						// Debounce
						await new Promise(resolve => setTimeout(resolve, 1000 * delayRatio));

						// Cancel on change
						if (token.isCancellationRequested) {
							log('Cancel on change after delay for tab');
							return null;
						}
					}

					const lineSuffix = currentLine.text.substring(position.character);

					const startPosition = new vscode.Position(0, 0);
					const prefix = document.getText(new vscode.Range(startPosition, position));

					const lastLine = document.lineCount - 1;
					const endPosition = document.lineAt(lastLine).range.end;
					const suffix = document.getText(new vscode.Range(position, endPosition));

					const insertText = await fillInMiddle(context, token, filename, document?.languageId, prefix, suffix);

					if (!insertText || !insertText?.trim() || insertText?.trim().length < 9) {
						log(`Skip short suggestion ${insertText}`);
						return null;
					}

					const inlineCompletionItems = [];

					inlineCompletionItems.push(
						new vscode.InlineCompletionItem(
							insertText,
							new vscode.Range(position, position)
						)
					);

					if (String(linePrefix)?.endsWith('.')) {
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								String(insertText)?.replace(/^[\s.]+/, ''),
								new vscode.Range(position, position)
							)
						);
					} else if (String(linePrefix)?.endsWith(' ')) {
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								String(insertText)?.replace(/^[\s.]+/, ''),
								new vscode.Range(position, position)
							)
						);
					} else if (String(linePrefix)?.endsWith(';')) {
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								`\n${insertText}`,
								new vscode.Range(position, position)
							)
						);
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								`\n\n${insertText}`,
								new vscode.Range(position, position)
							)
						);
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								`\n\n\n${insertText}`,
								new vscode.Range(position, position)
							)
						);
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								`\n\n\n\n${insertText}`,
								new vscode.Range(position, position)
							)
						);
					} else {
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								` ${insertText}`,
								new vscode.Range(position, position)
							)
						);
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								`\n${insertText}`,
								new vscode.Range(position, position)
							)
						);
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								`\n\n${insertText}`,
								new vscode.Range(position, position)
							)
						);
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								`\n\n\n${insertText}`,
								new vscode.Range(position, position)
							)
						);
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								`\n\n\n\n${insertText}`,
								new vscode.Range(position, position)
							)
						);
					}

					return inlineCompletionItems;

				} catch (error) {

					console.error('[fsiovn] AI Autocomplete', error);
					log(error);

				}

			}

		}

		const inlineCompletionProviderDisposable = vscode.languages.registerInlineCompletionItemProvider(
			inlineCompletionItemDocumentSelector,
			inlineCompletionItemProvider
		);

		context.subscriptions.push(inlineCompletionProviderDisposable);

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', error);
		log(error);

	}

}

async function fillInMiddle(context, token, filename, programmingLanguage, prefix, suffix) {

	try {

		await promptInputGeminiAPIKey(context);

		try {

			// Cancel on change
			if (token.isCancellationRequested) {
				log('Cancel on change - FIM');
				return null;
			}

		} catch (error) {

			console.error('[fsiovn] AI Autocomplete', error);
			log(error);

		}

		const geminiAPIKey = await context.secrets.get(GEMINI_API_SECRET_KEY_NAME);

		if (!geminiAPIKey) {
			return null;
		}

		if (String(geminiAPIKey)?.startsWith('csk-')) {
			return await cerebrasFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, geminiAPIKey)
		}

		return await geminiFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, geminiAPIKey);

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', error);
		log(error);

	}

}

async function geminiFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, apiKey) {

	const baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
	const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-pro'];

	return String(apiKey)?.startsWith('AIza') ? await opneAICompatibleFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, baseURL, apiKey, models) : null;

}

async function cerebrasFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, apiKey) {

	const baseURL = 'https://api.cerebras.ai/v1/chat/completions';
	const models = ['qwen-3-235b-a22b-instruct-2507', 'gpt-oss-120b', 'llama-3.3-70b', 'qwen-3-32b', 'llama3.1-8b', 'zai-glm-4.6'];

	return String(apiKey)?.startsWith('csk-') ? await opneAICompatibleFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, baseURL, apiKey, models) : null;

}

async function opneAICompatibleFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, baseURL, apiKey, models) {

	try {

		// Cancel on change
		if (token.isCancellationRequested) {
			log('Cancel on change - OAI FIM');
			return null;
		}

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', error);
		log(error);

	}

	try {

		const model = models.shift();

		const body = {
			model: model,
			messages: [
				{
					role: 'system',
					content: FIM_INSTRUCTION
				},
				{
					role: 'user',
					content: `${FIM_INSTRUCTION}\n<filename>${filename}</filename>\n<programming_language>${programmingLanguage}</programming_language>\n<fim_prefix>${prefix}</fim_prefix>\n<fim_suffix>${suffix}</fim_suffix>`,
				},
			],
			temperature: 0.5,
		};

		const response = await fetch(baseURL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (!response.ok && models?.length <= 1) {
			vscode.window.showErrorMessage(`API call failed with status ${response.status}`);

			console.warn('[fsiovn] AI Autocomplete - API call failed', { model: models, response: response });

			log({ model: model, response: response });

			return null;
		}

		const data = await response.json();
		const content = data?.choices?.[0]?.message?.content;

		const insertText = content?.trim()?.match(/^<fim_middle>([\s\S]*?)<\/fim_middle>$/s)?.[1] || null;

		if (!insertText && models?.length > 1) {
			return opneAICompatibleFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, baseURL, apiKey, models);
		}

		log({
			model: model,
			filename: filename,
			programmingLanguage: programmingLanguage,
			prefix: prefix,
			suffix: suffix,
			insertText: insertText
		})

		if (!insertText || !insertText?.trim() || insertText?.trim().length < 9) {
			log(`Skip short suggestion ${insertText}`);
			return null;
		}

		return insertText;

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', error);
		log(error);

	}

}

// Require async/await
async function getGeminiAPIKey(context) {

	try {

		// Waiting for user to click button
		const result = await vscode.window.showInformationMessage(
			'Open source AI code autocomplete for Visual Studio Code. [fsiovn] AI Autocomplete',
			GET_CEREBRAS_API_KEY_BUTTON_LABEL,
			GET_GEMINI_API_KEY_BUTTON_LABEL,
			await context.secrets.get(GEMINI_API_SECRET_KEY_NAME) ? CHANGE_GEMINI_API_KEY_BUTTON_LABEL : INPUT_GEMINI_API_KEY_BUTTON_LABEL
		);

		// User clicked button

		if (result === GET_CEREBRAS_API_KEY_BUTTON_LABEL) {
			vscode.env.openExternal(vscode.Uri.parse(GET_CEREBRAS_API_KEY_URL));
			promptInputGeminiAPIKey(context);
		}
		if (result === GET_GEMINI_API_KEY_BUTTON_LABEL) {
			vscode.env.openExternal(vscode.Uri.parse(GET_GEMINI_API_KEY_URL));
			promptInputGeminiAPIKey(context);
		}
		if (result === INPUT_GEMINI_API_KEY_BUTTON_LABEL || result === CHANGE_GEMINI_API_KEY_BUTTON_LABEL) {
			vscode.commands.executeCommand(INPUT_GEMINI_API_KEY_COMMAND);
		}

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', error);
		log(error);

	}

}

async function promptInputGeminiAPIKey(context) {

	try {

		// Attempt to get key, otherwise prompt user to input key
		await context.secrets.get(GEMINI_API_SECRET_KEY_NAME) || await inputGeminiAPIKey(context);

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', error);
		log(error);

	}

}

// Require async/await
async function inputGeminiAPIKey(context) {

	try {

		// Waiting for user to click button
		const result = await vscode.window.showErrorMessage(
			'Input API key to use AI Autocomplete extension. Gemini/Cerebras API key not found.',
			INPUT_GEMINI_API_KEY_BUTTON_LABEL,
			GET_CEREBRAS_API_KEY_BUTTON_LABEL,
			GET_GEMINI_API_KEY_BUTTON_LABEL
		);

		// User clicked button

		if (result === INPUT_GEMINI_API_KEY_BUTTON_LABEL) {
			vscode.commands.executeCommand(INPUT_GEMINI_API_KEY_COMMAND);
		}
		if (result === GET_CEREBRAS_API_KEY_BUTTON_LABEL) {
			vscode.env.openExternal(vscode.Uri.parse(GET_CEREBRAS_API_KEY_URL));
		}
		if (result === GET_GEMINI_API_KEY_BUTTON_LABEL) {
			vscode.env.openExternal(vscode.Uri.parse(GET_GEMINI_API_KEY_URL));
		}

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', error);
		log(error);

	}

}

async function log(...messages) {

	try {

		OUTPUT_CHANNEL.appendLine('\n---\n');

		for (const message of messages) {
			try {
				OUTPUT_CHANNEL.appendLine(`[fsiovn] AI Autocomplete\n${message}\n${JSON.stringify(message, null, 4)}`);
			} catch (error) {
				console.error('[fsiovn] AI Autocomplete', message, error);
			}
		}

		OUTPUT_CHANNEL.appendLine('\n---\n');

	} catch (error) {

		console.error('[fsiovn] AI Autocomplete', messages, error);

	}

}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
