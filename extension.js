const vscode = require('vscode');

const TAG = '[fsiovn] AI Autocomplete';
const DEBUG_MODE = typeof process !== 'undefined' && process?.env?.DEBUG_MODE === 'true';

const GET_GEMINI_API_KEY_BUTTON_LABEL = 'Get Gemini API key';
const GET_GEMINI_API_KEY_URL = 'https://aistudio.google.com/u/1/api-keys';

const GET_CEREBRAS_API_KEY_BUTTON_LABEL = 'Get Cerebras API key';
const GET_CEREBRAS_API_KEY_URL = 'https://cloud.cerebras.ai';

const GEMINI_API_SECRET_KEY_NAME = 'FSIOVN_GEMINI_API_KEY';
const INPUT_GEMINI_API_KEY_COMMAND = 'ai-autocomplete.inputGeminiAPIKey';

const SELECT_MODEL_COMMAND = "ai-autocomplete.selectModel"

const INPUT_GEMINI_API_KEY_BUTTON_LABEL = 'Input API Key';
const CHANGE_GEMINI_API_KEY_BUTTON_LABEL = 'Change API Key';

const FILENAME_SENSITIVE_KEYWORDS = [
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

const FIM_INSTRUCTION = 'You are a code completion assistant\n'
	+ 'Your name is fsiovn - AI Autocomplete\n'
	+ 'FIM mode(Fill-In-the-Middle)\n'
	+ 'Output format <fim_middle></fim_middle>\n'
	+ 'Example output <fim_middle>int x = 1;\\nint y = 1;\\nSystem.out.print("x + y = ", x + y);</fim_middle>\n'
	+ 'Always suggest code snippets longer than 9 characters\n'
	+ 'Return empty if no valid suggestion <fim_middle></fim_middle>\n'
	+ 'Syntax must be valid\n'
	+ 'No explanations, only code completions\n'
	+ 'Do not add markdown blocks\n';

let fimCounter = 0;

// This method is called when your extension is activated
/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	try {

		console.log(TAG, 'The open source AI code autocomplete extension for Visual Studio Code');

		try {
			registerInputGeminiAPIKeyCommand(context);
			getGeminiAPIKey(context);
			promptInputGeminiAPIKey(context);
		} catch (error) {
			console.error(TAG, error);
		}

		try {

			await registerInlineCompletionItemProvider(context);

		} catch (error) {

			console.error(TAG, error);
		}

		try {

			registerSelectModelCommand(context);

		} catch (error) {

			console.error(TAG, error);

		}

	} catch (error) {

		console.error(TAG, error);

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

		console.error(TAG, error);

	}

}

async function registerSelectModelCommand(context) {

	try {

		const selectModelCommandDisposable = vscode.commands.registerCommand(SELECT_MODEL_COMMAND, async function () {

			const models = ['default'];

			const apiKey = await context.secrets.get(GEMINI_API_SECRET_KEY_NAME);

			if (String(apiKey).startsWith('csk-')) {
				models.push('qwen-3-235b-a22b-instruct-2507', 'gpt-oss-120b', 'llama-3.3-70b', 'qwen-3-32b', 'llama3.1-8b', 'zai-glm-4.6')
			}

			if (String(apiKey).startsWith('AIza')) {
				models.push('gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-pro')
			}

			const model = await vscode.window.showQuickPick(models, {
				title: 'Select model',
				placeHolder: 'Recommended model is default',
			});

			if (model) {
				await context.globalState.update('ai-autocomplete.model', model);
			}

		});

		context.subscriptions.push(selectModelCommandDisposable);

	} catch (error) {

		console.error(TAG, error);

	}

}

async function registerInlineCompletionItemProvider(context) {

	try {

		/** @type {vscode.DocumentSelector} */
		const inlineCompletionItemDocumentSelector = { pattern: '**' };

		/** @type {vscode.InlineCompletionItemProvider} */
		const inlineCompletionItemProvider = {

			/**
			 * @type {vscode.InlineCompletionItemProvider['provideInlineCompletionItems']} 
			 */
			provideInlineCompletionItems: async (document, position, inlineCompletionContext, token) => {

				try {

					// Using getText for multi lines
					// Using substring for single line for better performance

					const currentLine = document.lineAt(position.line);
					const linePrefix = currentLine.text.substring(0, position.character);

					if (linePrefix === '}') {
						return null;
					}

					if (String(linePrefix).startsWith('</') && String(linePrefix).endsWith('>')) {
						return null;
					}

					// const lineSuffix = currentLine.text.substring(position.character);

					const filename = document.fileName;

					if (FILENAME_SENSITIVE_KEYWORDS.some(filenameSensitiveKeyword => filename.toLowerCase().includes(filenameSensitiveKeyword))) {

						console.debug(TAG, 'Skip sensitive file', filename);

						return null;
					}

					// Cancel on change
					if (token.isCancellationRequested) {
						console.debug(TAG, 'Cancel on change');
						return null;
					}

					const geminiAPIKey = await context.secrets.get(GEMINI_API_SECRET_KEY_NAME);

					if (!String(geminiAPIKey).startsWith('csk-') && inlineCompletionContext?.triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
						return null;
					}

					const delayRatio = String(geminiAPIKey).startsWith('csk-') ? 1 : 2;

					// Debounce
					await new Promise(resolve => setTimeout(resolve, 500 * delayRatio));

					// Cancel on change
					if (token.isCancellationRequested) {
						console.debug(TAG, 'Cancel on change after delay');
						return null;
					}

					// Allow tab
					if (linePrefix?.trim()?.length === 0) {
						// Debounce
						await new Promise(resolve => setTimeout(resolve, 1000 * delayRatio));

						// Cancel on change
						if (token.isCancellationRequested) {
							console.debug(TAG, 'Cancel on change after delay for tab');
							return null;
						}
					}

					const startPosition = new vscode.Position(0, 0);
					const prefix = document.getText(new vscode.Range(startPosition, position));

					const lastLine = document.lineCount - 1;
					const endPosition = document.lineAt(lastLine).range.end;
					const suffix = document.getText(new vscode.Range(position, endPosition));

					const insertText = await fillInMiddle(context, token, filename, document?.languageId, prefix, suffix);

					if (!insertText || !insertText?.trim() || insertText?.trim().length < 9) {
						console.debug(TAG, 'Skip short suggestion', { insertText: insertText });
						return null;
					}

					const inlineCompletionItems = [];

					try {
						const keywordPrefix = linePrefix.replace(/\./g, '').split(/\s+/).pop();

						if (keywordPrefix && (linePrefix.length < 9 || keywordPrefix.length > 1) && String(insertText).startsWith(keywordPrefix)) {
							inlineCompletionItems.push(
								new vscode.InlineCompletionItem(
									insertText.slice(keywordPrefix.length),
									new vscode.Range(position, position)
								)
							);
						}
					} catch (error) {
						console.error(TAG, 'Deduplicate prefix of keyword ', error);
					}

					inlineCompletionItems.push(
						new vscode.InlineCompletionItem(
							insertText,
							new vscode.Range(position, position)
						)
					);

					if (String(linePrefix).endsWith('.')) {
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								String(insertText).replace(/^[\s.]+/, ''),
								new vscode.Range(position, position)
							)
						);
					} else if (String(linePrefix).endsWith(' ')) {
						inlineCompletionItems.push(
							new vscode.InlineCompletionItem(
								String(insertText).replace(/^[\s.]+/, ''),
								new vscode.Range(position, position)
							)
						);
					} else if (String(linePrefix).endsWith(';')) {
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

					console.error(TAG, error);

				}

			}

		}

		const inlineCompletionItemProviderDisposable = vscode.languages.registerInlineCompletionItemProvider(
			inlineCompletionItemDocumentSelector,
			inlineCompletionItemProvider
		);

		context.subscriptions.push(inlineCompletionItemProviderDisposable);

	} catch (error) {

		console.error(TAG, 'registerInlineCompletionItemProvider', error);

	}

}

async function fillInMiddle(context, token, filename, programmingLanguage, prefix, suffix) {

	try {

		fimCounter++;

		if (fimCounter % 999 === 0) {
			await promptInputGeminiAPIKey(context);

			try {

				// Cancel on change
				if (token.isCancellationRequested) {
					console.debug(TAG, 'Cancel on change - FIM');
					return null;
				}

			} catch (error) {

				console.error(TAG, 'fillInMiddle', error);

			}
		}

		const geminiAPIKey = await context.secrets.get(GEMINI_API_SECRET_KEY_NAME);

		if (!geminiAPIKey) {
			return await fsiovnFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix);
		}

		if (String(geminiAPIKey).startsWith('csk-')) {
			return await cerebrasFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, geminiAPIKey);
		}

		return await geminiFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, geminiAPIKey);

	} catch (error) {

		console.error(TAG, 'fillInMiddle', error);

	}

}

async function geminiFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, apiKey) {

	const baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
	const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-pro'];

	const model = await context.globalState.get('ai-autocomplete.model');

	return String(apiKey).startsWith('AIza') ? await openAICompatibleFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, baseURL, apiKey, models.includes(model) ? [model] : models) : null;

}

async function cerebrasFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, apiKey) {

	const baseURL = 'https://api.cerebras.ai/v1/chat/completions';
	const models = ['qwen-3-235b-a22b-instruct-2507', 'gpt-oss-120b', 'llama-3.3-70b', 'qwen-3-32b', 'llama3.1-8b', 'zai-glm-4.6'];

	const model = await context.globalState.get('ai-autocomplete.model');

	return String(apiKey).startsWith('csk-') ? await openAICompatibleFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, baseURL, apiKey, models.includes(model) ? [model] : models) : null;

}

async function openAICompatibleFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, baseURL, apiKey, models) {

	try {

		// Cancel on change
		if (token.isCancellationRequested) {
			DEBUG_MODE && console.debug(TAG, 'Cancel on change - OAI FIM');
			return null;
		}

	} catch (error) {

		console.error(TAG, 'openAICompatibleFillInMiddle', error);

	}

	try {

		const model = models?.shift();

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

		if (!response.ok && models?.length < 1) {
			vscode.window.showErrorMessage(`API call failed with status ${response.status}`);

			console.warn(TAG, 'API call failed', { model: model, response: response });

			return null;
		}

		/**
		 * @type {{ choices?: { message?: { content: string } }[]? }}
		 */
		const data = await response.json();
		const content = data?.choices?.[0]?.message?.content;

		if (content === '<fim_middle></fim_middle>') {
			return null;
		}

		const insertText = content?.trim()?.match(/^<fim_middle>([\s\S]*?)<\/fim_middle>$/s)?.[1] || null;

		if (!insertText && models?.length > 0) {
			return await openAICompatibleFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix, baseURL, apiKey, models);
		}

		DEBUG_MODE && console.debug(TAG, { model: model, filename: filename, programmingLanguage: programmingLanguage, prefix: prefix, suffix: suffix, insertText: insertText });

		if (!insertText || !insertText?.trim() || insertText?.trim().length < 9) {
			console.debug(TAG, 'Skip short suggestion', { insertText: insertText });
			return null;
		}

		return String(insertText).includes("\\n") && !String(insertText).includes("\n") ? insertText.replaceAll("\\n", "\n") : insertText;

	} catch (error) {

		console.error(TAG, 'openAICompatibleFillInMiddle', error);

	}

}

// The **fsiovn FIM endpoint** is only allowed to be used with the [AI Autocomplete](https://marketplace.visualstudio.com/items?itemName=fsiovn.ai-autocomplete) extension so all other uses are prohibited.
// The **fsiovn FIM endpoint** may collect and store data so use your own API key if you're concerned about privacy.
async function fsiovnFillInMiddle(context, token, filename, programmingLanguage, prefix, suffix) {

	try {

		// Cancel on change
		if (token.isCancellationRequested) {
			console.debug(TAG, 'Cancel on change - fsiovn FIM');
			return null;
		}

	} catch (error) {

		console.error(TAG, 'fsiovnFillInMiddle', error);

	}

	try {

		// The **fsiovn FIM endpoint** is only allowed to be used with the [AI Autocomplete](https://marketplace.visualstudio.com/items?itemName=fsiovn.ai-autocomplete) extension so all other uses are prohibited.
		// The **fsiovn FIM endpoint** may collect and store data so use your own API key if you're concerned about privacy.
		const baseURL = 'https://fs.io.vn/ai-autocomplete/api/fim';

		const body = {
			filename: filename,
			programmingLanguage: programmingLanguage,
			prefix: prefix,
			suffix: suffix
		};

		const response = await fetch(baseURL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			console.debug(TAG, 'API call failed', { response: response });
			return null;
		}

		const insertText = await response.text();

		if (!insertText || !insertText?.trim() || insertText?.trim().length < 9) {
			console.debug(TAG, 'Skip short suggestion', { insertText: insertText });
			return null;
		}

		return insertText;

	} catch (error) {

		console.error(TAG, 'fsiovnFillInMiddle', error);

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

		console.error(TAG, 'getGeminiAPIKey', error);

	}

}

async function promptInputGeminiAPIKey(context) {

	try {

		// Attempt to get key, otherwise prompt user to input key
		await context.secrets.get(GEMINI_API_SECRET_KEY_NAME) || await inputGeminiAPIKey();

	} catch (error) {

		console.error(TAG, 'promptInputGeminiAPIKey', error);

	}

}

// Require async/await
async function inputGeminiAPIKey() {

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

		console.error(TAG, 'inputGeminiAPIKey', error);

	}

}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
