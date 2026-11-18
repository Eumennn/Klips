#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
chmod +x "$0" CLIP.command KURULUM.command start_clip.command CLIP.app/Contents/MacOS/CLIP 2>/dev/null
exec /bin/bash "$DIR/CLIP.command"
