#!/bin/bash
cd "$(dirname "$0")"
export PYTHONDONTWRITEBYTECODE=1

echo "============================================================"
echo "  CLIP - Evrensel Video Panosu (macOS)"
echo "============================================================"
echo ""

# 1. Python 3 kontrolü
if ! command -v python3 &> /dev/null; then
    echo "[HATA] Bilgisayarınızda python3 bulunamadı!"
    echo "Python indirme sayfası açılıyor..."
    open "https://www.python.org/downloads/"
    exit 1
fi

# 2. PEP 668 ve macOS izin sorunlarını aşmak için izole .venv ortamı
PYTHON_BIN="python3"
PIP_BIN="python3 -m pip"

if [ ! -d ".venv" ]; then
    echo "macOS için güvenli Python ortamı (.venv) oluşturuluyor..."
    python3 -m venv .venv 2>/dev/null
fi

if [ -f ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
    PIP_BIN=".venv/bin/pip"
fi

# 3. Kütüphaneleri kontrol et ve yükle
echo "Sistem kütüphaneleri kontrol ediliyor..."
$PYTHON_BIN -c "import yt_dlp, PIL, imageio_ffmpeg" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Gerekli kütüphaneler kuruluyor (yt-dlp, Pillow, imageio-ffmpeg, pystray)..."
    $PIP_BIN install -r requirements.txt --break-system-packages 2>/dev/null || $PIP_BIN install -r requirements.txt
fi

# 4. Eski çalışan servisi sonlandır
pkill -f "clip_helper.py" 2>/dev/null

# 5. CLIP Arka Plan Servisini Başlat
echo "CLIP servisi başlatılıyor..."
nohup $PYTHON_BIN -u -B clip_helper.py > clip_helper.log 2>&1 &

sleep 1.5

# 6. Sağlık kontrolü
HEALTH=$(curl -s --max-time 3 http://127.0.0.1:48123/health)
if [[ "$HEALTH" == *"ok"* ]]; then
    echo ""
    echo "============================================================"
    echo "  ✓ CLIP başarıyla başlatıldı ve menü çubuğuna bağlandı!"
    echo "  (Ekranın sağ üstündeki şimşek simgesinden kontrol edebilirsiniz)"
    echo "============================================================"
    $PYTHON_BIN -c "import setup_wizard; setup_wizard.set_autostart_reg(True)" 2>/dev/null
else
    echo ""
    echo "Servis arka planda çalışıyor. Detaylar: clip_helper.log"
fi

sleep 2
exit 0
