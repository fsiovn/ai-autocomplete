#!/bin/sh

# chmod +x vsce-install.sh

npm install

npm run lint

rm -f ai-autocomplete-*.vsix

npm install -g @vscode/vsce

vsce package

VSIX_FILE=$(ls ai-autocomplete-*.vsix 2>/dev/null | head -n 1)

echo "\n\n\n${VSIX_FILE}\n\n\n"

code --install-extension "$VSIX_FILE"
