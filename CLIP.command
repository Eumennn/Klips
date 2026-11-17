#!/bin/bash
cd "$(dirname "$0")"
export PYTHONDONTWRITEBYTECODE=1

echo "============================================================"
echo "  CLIP - Evrensel Video Panosu (macOS)"
echo "============================================================"
echo ""

if ! command -v python3 &> /dev/null; then
    echo "[HATA] macOS üzerinde python3 bulunamadı!"
    echo "Lütfen Python 3 kurun. İndirme sayfası açılıyor..."
    open https://www.python.org/downloads/
    exit 1
fi

# Gerekli paketleri kontrol et ve yükle
python3 -c "import pystray, PIL, yt_dlp, imageio_ffmpeg" &> /dev/null
if [ $? -ne 0 ]; then
    echo "Gerekli Python kütüphaneleri yükleniyor..."
    python3 -m pip install -r requirements.txt --quiet
fi

# Arka planda servisi başlat
pkill -f "clip_helper.py" 2>/dev/null
nohup python3 -u -B clip_helper.py > /dev/null 2>&1 &

# Otomatik başlatma ve masaüstü kısayolu
python3 -c "import setup_wizard; setup_wizard.create_desktop_shortcut(); setup_wizard.set_autostart_reg(True)" &>/dev/null

echo "✓ CLIP başarıyla başlatıldı!"
echo "Ekranın sağ üstündeki menü çubuğundan durumu kontrol edebilirsiniz."
sleep 2
exit 0
