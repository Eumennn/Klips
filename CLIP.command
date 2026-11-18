#!/bin/bash
# ============================================================
#  CLIP - Evrensel Video Panosu (macOS)
# ============================================================

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Restore executable permissions on all command scripts and binaries
chmod +x "$0" CLIP.command KURULUM.command start_clip.command CLIP.app/Contents/MacOS/CLIP yt-dlp ffmpeg 2>/dev/null

# Expand PATH to include Homebrew (Apple Silicon & Intel), MacPorts, pyenv, user binaries
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$HOME/.local/bin:$HOME/bin:$HOME/Library/Python/bin:$PATH"
export PYTHONDONTWRITEBYTECODE=1

echo "============================================================"
echo "  ⚡ CLIP - Evrensel Video Panosu (macOS)"
echo "============================================================"
echo ""

# 1. Python 3 tespiti (Homebrew, Framework, Conda, Pyenv, Sistem)
CANDIDATE_PYTHONS=(
    "/opt/homebrew/bin/python3"
    "/usr/local/bin/python3"
    "/Library/Frameworks/Python.framework/Versions/Current/bin/python3"
    "/Library/Frameworks/Python.framework/Versions/3.13/bin/python3"
    "/Library/Frameworks/Python.framework/Versions/3.12/bin/python3"
    "/Library/Frameworks/Python.framework/Versions/3.11/bin/python3"
    "/Library/Frameworks/Python.framework/Versions/3.10/bin/python3"
    "$HOME/.pyenv/shims/python3"
    "$HOME/miniconda3/bin/python3"
    "$HOME/anaconda3/bin/python3"
    "$(which python3 2>/dev/null)"
    "/usr/bin/python3"
)

PYTHON_CMD=""
for py in "${CANDIDATE_PYTHONS[@]}"; do
    if [ -n "$py" ] && [ -x "$py" ]; then
        if "$py" -c "import sys" 2>/dev/null; then
            PYTHON_CMD="$py"
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "[HATA] Bilgisayarınızda python3 bulunamadı!"
    echo "Python indirme sayfası açılıyor..."
    open "https://www.python.org/downloads/"
    exit 1
fi

echo "Python tespit edildi: $PYTHON_CMD"

# 2. İzole .venv ortamı dene (destekleniyorsa)
PYTHON_BIN="$PYTHON_CMD"
PIP_BIN="$PYTHON_CMD -m pip"

if [ ! -d ".venv" ]; then
    "$PYTHON_CMD" -m venv .venv 2>/dev/null
fi

if [ -f ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
    PIP_BIN=".venv/bin/pip"
fi

# 3. yt-dlp hazırlığı (pip veya doğrudan standalone binary)
HAS_YTDLP=0
if [ -f "$DIR/yt-dlp" ] && [ -x "$DIR/yt-dlp" ]; then
    HAS_YTDLP=1
elif command -v yt-dlp &> /dev/null; then
    HAS_YTDLP=1
elif $PYTHON_BIN -c "import yt_dlp" 2>/dev/null; then
    HAS_YTDLP=1
fi

if [ $HAS_YTDLP -eq 0 ]; then
    echo "yt-dlp motoru hazırlanıyor..."
    $PIP_BIN install yt-dlp --break-system-packages 2>/dev/null || $PIP_BIN install yt-dlp 2>/dev/null
    
    # Pip çalışmazsa resmi standalone ikiliyi doğrudan indir
    if ! $PYTHON_BIN -c "import yt_dlp" 2>/dev/null && ! command -v yt-dlp &> /dev/null; then
        echo "Stand-alone yt-dlp motoru çekiliyor..."
        curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$DIR/yt-dlp" 2>/dev/null
        chmod +x "$DIR/yt-dlp" 2>/dev/null
    fi
fi

# 4. imageio-ffmpeg veya FFmpeg kontrolü
$PYTHON_BIN -c "import imageio_ffmpeg" 2>/dev/null || $PIP_BIN install imageio-ffmpeg --break-system-packages 2>/dev/null || $PIP_BIN install imageio-ffmpeg 2>/dev/null

# 5. Eski çalışan servisi sonlandır
pkill -f "clip_helper.py" 2>/dev/null
sleep 0.4

# 6. CLIP Arka Plan Servisini Başlat
echo "CLIP servisi başlatılıyor..."
nohup "$PYTHON_BIN" -u -B "$DIR/clip_helper.py" > "$DIR/clip_helper.log" 2>&1 &
CLIP_PID=$!
disown $CLIP_PID 2>/dev/null

# 7. Sağlık kontrolü (en fazla 5 saniye)
HEALTH=""
for i in {1..20}; do
    sleep 0.25
    HEALTH=$(curl -s --max-time 1 http://127.0.0.1:48123/health 2>/dev/null)
    if [[ "$HEALTH" == *"ok"* ]]; then
        break
    fi
done

if [[ "$HEALTH" == *"ok"* ]]; then
    echo ""
    echo "============================================================"
    echo "  ✓ CLIP servisi başarıyla başlatıldı ve arka planda aktif!"
    echo "  Port: http://127.0.0.1:48123"
    echo "  Videolar artık ⌘V ile doğrudan panoya kopyalanabilir."
    echo "============================================================"
    "$PYTHON_BIN" -c "import setup_wizard; setup_wizard.set_autostart_reg(True)" 2>/dev/null
    osascript -e 'display notification "CLIP servisi başarıyla başlatıldı ve panoya kopyalamaya hazır!" with title "CLIP Aktif ⚡"' 2>/dev/null
else
    echo ""
    echo "[UYARI] Servis arka planda başlatılamadı. Detaylar: clip_helper.log"
    if [ -f "$DIR/clip_helper.log" ]; then
        echo "--- clip_helper.log Son Satırlar ---"
        tail -n 10 "$DIR/clip_helper.log"
    fi
fi

sleep 1.5
exit 0
