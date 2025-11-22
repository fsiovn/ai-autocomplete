#!/bin/sh

# chmod +x vsce-package.sh

npm install

npm run lint

npm install -g @vscode/vsce

vsce package
