#!/usr/bin/env bash
set -ex
rm -v *.vsix || true
./node_modules/.bin/vsce package
code --install-extension *.vsix
