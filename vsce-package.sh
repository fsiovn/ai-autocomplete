#!/bin/sh

# chmod +x vsce-package.sh

npm install

npm install -g @vscode/vsce

vsce package
