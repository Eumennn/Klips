#!/bin/bash
cd "$(dirname "$0")"
export PYTHONDONTWRITEBYTECODE=1

echo "============================================================"
echo "  CLIP - macOS Kurulum Sihirbazı"
echo "============================================================"
echo ""

if ! command -v python3 &> /dev/null; then
    echo "[HATA] macOS üzerinde python3 bulunamadı!"
    echo "Lütfen Python 3 kurun. İndirme sayfası açılıyor..."
    open https://www.python.org/downloads/
    exit 1
fi

echo "Gerekli Python kütüphaneleri yükleniyor (yt-dlp, pystray, pillow, imageio-ffmpeg)..."
python3 -m pip install -r requirements.txt

echo ""
echo "Kurulum sihirbazı başlatılıyor..."
python3 -u -B setup_wizard.py
