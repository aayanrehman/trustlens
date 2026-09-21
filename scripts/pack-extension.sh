#!/bin/sh
# Builds public/trustlens-extension.zip (for the download page) and dist/trustlens-extension-store.zip (for the Web Store upload).
cd "$(dirname "$0")/.." || exit 1
rm -rf dist/trustlens-extension && mkdir -p dist/trustlens-extension public
cp extension/manifest.json extension/background.js extension/content.js extension/sidepanel.html extension/sidepanel.js extension/icon128.png extension/logo.png dist/trustlens-extension/
(cd dist && rm -f trustlens-extension-store.zip && zip -qr trustlens-extension-store.zip trustlens-extension -x '.*' && cd trustlens-extension && zip -qr ../trustlens-extension-store-flat.zip . -x '.*')
cp dist/trustlens-extension-store.zip public/trustlens-extension.zip
echo "public/trustlens-extension.zip (download page) and dist/trustlens-extension-store-flat.zip (upload this one to the Web Store)"
