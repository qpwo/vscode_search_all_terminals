#!/usr/bin/env bash
set -ex
rm -v *.vsix || true
convert icon_orig.png -resize 128x128 icon.png
./node_modules/.bin/vsce package
code --install-extension *.vsix
