# ⚡ CLIP — Universal Video Clipboard (Klips)

> **Evrensel Video Panosu (Universal Video Clipboard) — Chrome / Chromium Eklentisi**  
> Bağlantı kopyalamayı unutun; doğrudan **videoyu** panonuza kopyalayın!

CLIP, internetteki videoları indirme, dosya arama ve yeniden yükleme zahmetini tamamen ortadan kaldırır. YouTube, TikTok, Instagram Reels ve X'teki videoları tek tıkla yakalayın ve **Windows Panosu (`CF_HDROP`)** sayesinde doğrudan **WhatsApp, Discord, Telegram veya Masaüstünüze `Ctrl + V` ile yapıştırın.**

---

## 🎯 Temel Özellikler

1. **⚡ Windows Panosuna Doğrudan Kopyalama (`Ctrl + V`):**
   - Video arka planda WhatsApp ve Discord uyumlu **H.264 / AAC (+faststart)** formatına dönüştürülür.
   - İndirme bittiği an Windows panosuna dosya olarak yazılır. WhatsApp veya Discord'a geçip `Ctrl + V` yapmanız yeterlidir!

2. **✂️ YouTube Video Zaman Aralığı Kırpıcı (Time Range Trimmer):**
   - Normal YouTube videolarında `CLIP` butonuna basıldığında modern kırpma arayüzü açılır.
   - İstediğiniz başlangıç ve bitiş saniyelerini slider veya zaman kutularından seçin.
   - Tek tıkla `"Son 15 sn"`, `"Son 30 sn"`, `"Son 60 sn"` hazır ayarlarıyla anında kırpıp panoya kopyalayın.

3. **📱 Shorts & Reels & TikTok Kusursuz Entegrasyon:**
   - **YouTube Shorts:** Beğeni (Like) butonunun hemen üstünde yerleşik minimalist buton.
   - **Instagram Reels:** Beğeni butonunun hemen üstünde özel dikey aksiyon butonu.
   - **TikTok:** Yan araç çubuğunda video ile hizalı tek tık kopyalama butonu.

4. **🏝️ Apple Dynamic Island Bildirim Kapsülü:**
   - Kopyalama tamamlandığında ekranın üstünde beliren şık kapsül.
   - Tek tıkla geçici klipler klasörünü açma (`📁`), sürükle-bırak (`🎯`) veya MP4 olarak kaydetme (`⬇️`).

---

## 🚀 Kurulum (1 Dakika)

### 1. Yerel Yardımcı Servisi Başlatın:
Klasörün içindeki `start_clip.bat` dosyasına çift tıklayın. Servis arka planda port `48123` üzerinde sessizce çalışacaktır.

### 2. Eklentiyi Chrome'a Yükleyin:
1. Tarayıcınızın adres çubuğuna şunu yazıp Enter'a basın:
   ```text
   chrome://extensions
   ```
2. Sağ üst köşedeki **"Geliştirici Modu" (Developer Mode)** anahtarını açın.
3. Sol üstte beliren **"Paketlenmemiş Öğe Yükle" (Load unpacked)** butonuna tıklayın.
4. Bu klasörü seçin:
   ```text
   C:\Users\pc\Downloads\CLIP
   ```
5. **Hazır!** Eklenti anında aktifleşir.

---

## 🛠️ Proje Mimarisi

* `manifest.json`: Chrome Manifest V3 yapılandırması
* `clip_helper.py`: Python & FFmpeg tabanlı yerel indirme, H.264 remux ve `CF_HDROP` Windows panosu servisi
* `start_clip.bat`: Servisi tek tıkla başlatan Windows toplu iş dosyası
* `background/background.js`: Servis çalışanı (Medya koklayıcı, tab bazlı akış yakalama, API yönlendirme)
* `content/content.js`: YouTube Trimmer, Shorts, Reels, TikTok ve Twitter DOM entegrasyonu
* `content/content.css`: Apple Dynamic Island & Glassmorphism koyu tema tasarım sistemi
* `popup/`: Eklenti açılır penceresi (manuel URL yakalama, klip geçmişi, ayarlar)
* `icons/`: Yüksek çözünürlüklü ikon seti

