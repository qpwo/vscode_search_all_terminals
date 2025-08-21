#!/usr/bin/env bash
set -ex
rm -v *.vsix icon.png screencap.gif || true
convert icon_orig.png -resize 128x128 icon.png
ffmpeg -i screencap.mp4 -vf "fps=15,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 screencap.gif

./node_modules/.bin/vsce package
code --install-extension *.vsix
