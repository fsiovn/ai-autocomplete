#!/bin/sh

# chmod +x vsce-pre-release.sh

npm install

npm install -g @vscode/vsce

vsce package --pre-release

vsce publish --pre-release
