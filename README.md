# fsiovn - AI Autocomplete

<p align="center">
   <a href="https://marketplace.visualstudio.com/items?itemName=fsiovn.ai-autocomplete"><img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/Visual_Studio_Code_Marketplace-latest-blue.png" alt="Visual Studio Code Marketplace" style="height: 24px"></a>
    <a href="https://github.com/fsiovn/ai-autocomplete/blob/main/LICENSE"><img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/License-Apache_2.0-blue.png" alt="License Apache 2.0" style="height: 24px"></a>
</p>

   - 🧩 Supports [Visual Studio Code for the Web](https://vscode.dev/), [Visual Studio Code Desktop](https://code.visualstudio.com/) and [GitHub](https://github.dev/fsiovn/ai-autocomplete/)

   - 🛠️ **Requires a Gemini or Cerebras API key:**

      - *Cerebras (recommended):* https://cloud.cerebras.ai 📌

      - *Gemini:* https://aistudio.google.com/u/1/api-keys

# Overview

   - 📌 `AI Autocomplete` - The open [source](https://github.com/fsiovn/ai-autocomplete) AI code autocomplete extension for Visual Studio Code.

<p align="center">
   <img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/demo.gif" alt="Demo of AI autocomplete suggesting code in VS Code" width="600px" />
</p>

   - 🌟 `AI Autocomplete` - The lightweight Visual Studio Code extension for autocomplete.

      ```sh
      ├─ [Content_Types].xml 
      ├─ extension.vsixmanifest 
      └─ extension/
         ├─ LICENSE.txt [11.09 KB]
         ├─ extension.js [18.16 KB]
         ├─ icon.png [33.58 KB]
         ├─ package.json [1.48 KB]
         └─ readme.md [6.67 KB]
      ```
# Features

   - 🚀 Bring Your Own Key (BYOK)

   - ✨ AI-generated code

   - ⚡ Inline suggestions

   - 💡 Support for all programming languages

   - 🔧 Generate code with comments

<p align="center">
   <img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/demo-prompt.gif" alt="Demo of AI autocomplete suggesting code in VS Code" width="600px" />
</p>

# Why choose this extension?

   - 🔓 Open-source and transparent: The entire codebase is publicly available, allowing for community contributions and audits.

   - 🏗️ Lightweight and efficient: Minimal resource usage ensures smooth performance without slowing down your editor.

   - 🔑 Bring Your Own Key (BYOK): Full control over your API keys and data privacy with support for Cerebras and Gemini.

   - 🌐 Cross-platform compatibility: Works seamlessly across VS Code Web, Desktop, and GitHub environments.

   - 🤖 Real-time AI suggestions: Get intelligent code completions as you type, powered by state-of-the-art language models.

   - 📄 Comment-to-code generation: Write comments and let the AI generate the corresponding code automatically.

   - 🧪 Actively maintained: Regular updates and improvements based on user feedback and emerging technologies.

# Playground

   > No installation required, works instantly in your browser.

   1. Go to https://github.dev.

   2. Install `AI-Autocomplete` extension.

   3. Enjoy inline autocomplete.

# Install

   1. Install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fsiovn.ai-autocomplete).

   2. Obtain an `API key` from Cerebras (recommended) or Gemini.

   3. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) and run `fsiovn - AI Autocomplete: Input Gemini/Cerebras API key`.

   4. Enter your `API key` when prompted and confirm.

   5. Start coding and enjoy AI-powered autocomplete suggestions in real-time.

# Privacy & Policies

   - [Cerebras Policies](https://www.cerebras.ai/policies)

   - [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms)

   - [Cloudflare Terms of Use](https://www.cloudflare.com/website-terms/)

   - If you use your own API key, we do not collect or store any of your data.

   - If you do not provide an API key, the **fsiovn FIM (Fill-in-the-middle) endpoint** will be used by default.

      - The **fsiovn FIM endpoint** is only allowed to be used with the [AI Autocomplete](https://marketplace.visualstudio.com/items?itemName=fsiovn.ai-autocomplete) extension so all other uses are prohibited.

      - The **fsiovn FIM endpoint** may collect and store data so use your own API key if you're concerned about privacy.

   - We disclaim all responsibility.

# Compare with GitHub Copilot

   > GitHub Copilot remains a more full-featured product overall.

   - Pros:

      1. Web support:

         GitHub Copilot still doesn't fully support VS Code for the Web (github.dev, vscode.dev).
         This extension works seamlessly in web environments, making it ideal for contributing to public repositories without a local setup.

      2. Lightweight:
      
         This extension is extremely small - around 40 KB, compared to 33 MB for GitHub Copilot + Copilot Chat.

      3. Focused on autocomplete:
         
         The extension is dedicated purely to autocomplete.
         Users who prefer external chat tools (Cline, KiloCode, ClaudeCode, Codex CLI, etc.) can combine them as they like.

      4. Privacy-friendly (BYOK):

         When users bring their own API key, the extension does not collect or store any code or usage data.

      5. No additional subscription needed:

         Users with a Cerebras Code Pro/Max or Gemini subscription don't need a GitHub Copilot plan.

      6. Better free tiers:

         Cerebras and Gemini both offer more generous free tiers compared to GitHub Copilot's current free tier.

   - Cons:

      1. Copilot is generally more capable overall:

         While inline suggestions work similarly, GitHub Copilot tends to perform better in certain scenarios - especially with more advanced features like Next Edit, multi-file reasoning, and deep context understanding.

      2. No built-in chat:

         Unlike Copilot Chat, this extension intentionally does not include an integrated chat experience (though users can combine it with third-party tools if needed).

      3. Model quality depends on user's API key provider:

         Performance will vary depending on whether users choose Cerebras or Gemini and what tier they're on.
   
   > Overall, GitHub Copilot remains a more comprehensive solution, but this extension focuses on being lightweight, open-source, and flexible.

---

Report issue: https://github.com/fsiovn/ai-autocomplete/issues

---

<p align="center">
   <a href="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/LICENSE"><img src="https://raw.githubusercontent.com/fsiovn/ai-autocomplete/refs/heads/main/License-Apache_2.0-green.png" alt="License Apache 2.0" style="height: 24px;"></a>
</p>
