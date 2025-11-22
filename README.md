# fsiovn - AI Autocomplete

<p align="center">
   <a href="https://marketplace.visualstudio.com/items?itemName=fsiovn.ai-autocomplete"><img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/Visual_Studio_Code_Marketplace-latest-blue.png" alt="Visual Studio Code Marketplace" style="height: 24px"></a>
    <a href="https://github.com/fsiovn/ai-autocomplete/blob/main/LICENSE"><img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/License-Apache_2.0-blue.png" alt="License Apache 2.0" style="height: 24px"></a>
   <a href="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/LICENSE"><img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/License-Apache_2.0-green.png" alt="License Apache 2.0" style="height: 24px;"></a>
</p>

Support both [Visual Studio Code for the Web](https://vscode.dev/), [Visual Studio Code Desktop](https://code.visualstudio.com/) and [GitHub](https://github.dev/fsiovn/ai-autocomplete/)

**Require Gemini/Cerebras API key:**
   
   - *Get Cerebras API key at https://cloud.cerebras.ai (recommended)*

   - *Get Gemini API key at https://aistudio.google.com/u/1/api-keys*

# Overview

`AI Autocomplete` - The open [source](https://github.com/fsiovn/ai-autocomplete) AI code autocomplete extension for Visual Studio Code.

<p align="center">
   <img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/demo.gif" width="100%" />
</p>

`AI Autocomplete` - The lightweight Visual Studio Code extension for autocomplete.

```sh
├─ [Content_Types].xml 
├─ extension.vsixmanifest 
└─ extension/
   ├─ LICENSE.txt [11.09 KB]
   ├─ extension.js [17.77 KB]
   ├─ icon.png [33.58 KB]
   ├─ package.json [1.48 KB]
   └─ readme.md [3.42 KB]

 DONE  Packaged: /workspaces/ai-autocomplete/ai-autocomplete-0.1.0.vsix (7 files, 40.28 KB)
```

# Getting Started

1. Install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fsiovn.ai-autocomplete).

2. Obtain `your API key` from either Cerebras (recommended) or Gemini.

3. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) and run `fsiovn - AI Autocomplete: Input Gemini/Cerebras API key`.

4. Enter `your API key` when prompted and confirm.

5. Start coding and enjoy AI-powered autocomplete suggestions in real-time.

# Features

- Bring Your Own Key (BYOK)

- AI-generated code

- Inline suggestions

- Support for all programming languages

- Generate code with comments

<p align="center">
   <img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/demo-prompt.gif" width="100%" />
</p>

# Privacy & Policies

   - [Cerebras Polices](https://www.cerebras.ai/policies)

   - [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms)

   - [Cloudflare Terms of Use](https://www.cloudflare.com/website-terms/)

   - If you use your own API key, we do not collect or store any of your data.

   - If you do not provide an API key, the **fsiovn FIM endpoint** will be used by default.

      - The **fsiovn FIM endpoint** is only allowed to be used with the [AI Autocomplete](https://marketplace.visualstudio.com/items?itemName=fsiovn.ai-autocomplete) extension so all other uses are prohibited.

      - The **fsiovn FIM endpoint** may collect and store data so use your own API key if you're concerned about privacy.

   - We disclaim all responsibility.
