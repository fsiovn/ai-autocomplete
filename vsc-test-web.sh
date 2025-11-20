#!/bin/sh

# chmod +x vsc-test-web.sh

# npx playwright install-deps

npm install --save-dev @vscode/test-web && npx playwright install-deps && npx @vscode/test-web --extensionDevelopmentPath=. --browserType=none --host=0.0.0.0 .
