#!/bin/bash
# ============================================================
#  CLIP - Evrensel Video Panosu (macOS)
# ============================================================

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Restore executable permissions on all command scripts and binaries
chmod +x "$0" CLIP.command KURULUM.command start_clip.command CLIP.app/Contents/MacOS/CLIP 2>/dev/null

# Expand PATH to include Homebrew (Apple Silicon & Intel), MacPorts, pyenv, user binaries
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$HOME/.local/bin:$HOME/Library/Python/bin:$PATH"
export PYTHONDONTWRITEBYTECODE=1

echo "============================================================"
echo "  ⚡ CLIP - Evrensel Video Panosu (macOS)"
echo "============================================================"
echo ""

# 1. Python 3 kontrolü
PYTHON_CMD=""
for cmd in python3 /opt/homebrew/bin/python3 /usr/local/bin/python3; do
    if command -v "$cmd" &> /dev/null; then
        PYTHON_CMD="$cmd"
        break
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "[HATA] Bilgisayarınızda python3 bulunamadı!"
    echo "Python indirme sayfası açılıyor..."
    open "https://www.python.org/downloads/"
    exit 1
fi

# 2. PEP 668 ve macOS izin sorunlarını aşmak için izole .venv ortamı
PYTHON_BIN="$PYTHON_CMD"
PIP_BIN="$PYTHON_CMD -m pip"

if [ ! -d ".venv" ]; then
    echo "macOS için güvenli Python ortamı (.venv) oluşturuluyor..."
    "$PYTHON_CMD" -m venv .venv 2>/dev/null
fi

if [ -f ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
    PIP_BIN=".venv/bin/pip"
fi

# 3. Kütüphaneleri kontrol et ve yükle
echo "Sistem kütüphaneleri kontrol ediliyor..."
$PYTHON_BIN -c "import yt_dlp, PIL, imageio_ffmpeg" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Gerekli kütüphaneler kuruluyor (yt-dlp, Pillow, imageio-ffmpeg)..."
    $PIP_BIN install -r requirements.txt --break-system-packages 2>/dev/null || $PIP_BIN install -r requirements.txt 2>/dev/null || $PIP_BIN install yt-dlp imageio-ffmpeg Pillow 2>/dev/null
fi

# 4. Eski çalışan servisi sonlandır
pkill -f "clip_helper.py" 2>/dev/null
sleep 0.5

# 5. CLIP Arka Plan Servisini Başlat
echo "CLIP servisi başlatılıyor..."
nohup "$PYTHON_BIN" -u -B "$DIR/clip_helper.py" > "$DIR/clip_helper.log" 2>&1 &
CLIP_PID=$!
disown $CLIP_PID 2>/dev/null

# 6. Sağlık kontrolü (en fazla 3 saniye)
HEALTH=""
for i in {1..10}; do
    sleep 0.3
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
    echo "Servis başlatıldı. Detaylar için clip_helper.log dosyasını inceleyebilirsiniz."
fi

sleep 1.5
exit 0
