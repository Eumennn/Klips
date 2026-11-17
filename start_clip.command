#!/bin/bash
cd "$(dirname "$0")"
export PYTHONDONTWRITEBYTECODE=1

if ! command -v python3 &> /dev/null; then
    echo "[HATA] macOS üzerinde python3 bulunamadı!"
    echo "Lütfen Python 3 kurun. İndirme sayfası açılıyor..."
    open https://www.python.org/downloads/
    exit 1
fi

# Arka planda çalıştır
nohup python3 -u -B clip_helper.py > /dev/null 2>&1 &
echo "CLIP başlatıldı! Ekranın sağ üstündeki menü çubuğundan kontrol edebilirsiniz."
sleep 1
