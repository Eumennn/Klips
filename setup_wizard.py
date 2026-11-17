"""
CLIP — Kurulum Sihirbazı & Masaüstü Başlatıcı (Setup Wizard)
Açık Kaynak, modern arayüzlü ve kullanıcı dostu kurulum aracı.
"""

import os
import sys
import shutil
import subprocess
import webbrowser
import threading
import tkinter as tk
from tkinter import ttk, messagebox

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ICON_PATH = os.path.join(CURRENT_DIR, "icons", "icon48.png")
ICO_PATH = os.path.join(CURRENT_DIR, "icons", "icon.ico")
BAT_PATH = os.path.join(CURRENT_DIR, "CLIP.bat")

def check_dependencies():
    status = {}
    
    # Python
    status["python"] = {"name": f"Python ({sys.version.split()[0]})", "ok": True}
    
    # yt-dlp
    try:
        import yt_dlp
        status["ytdlp"] = {"name": f"yt-dlp ({yt_dlp.version.__version__})", "ok": True}
    except Exception:
        status["ytdlp"] = {"name": "yt-dlp", "ok": False}
        
    # Pillow
    try:
        import PIL
        status["pil"] = {"name": "Pillow (Görsel İşleme)", "ok": True}
    except Exception:
        status["pil"] = {"name": "Pillow", "ok": False}

    # pystray
    try:
        import pystray
        status["pystray"] = {"name": "Pystray (Sistem Tepsisi / Görev Çubuğu)", "ok": True}
    except Exception:
        status["pystray"] = {"name": "Pystray", "ok": False}

    # FFmpeg
    ffmpeg_ok = False
    try:
        import imageio_ffmpeg
        p = imageio_ffmpeg.get_ffmpeg_exe()
        if p and os.path.exists(p):
            ffmpeg_ok = True
    except Exception:
        pass
    if not ffmpeg_ok and shutil.which("ffmpeg"):
        ffmpeg_ok = True
    status["ffmpeg"] = {"name": "FFmpeg (H.264 / AAC Birleştirici)", "ok": ffmpeg_ok}

    # Node.js
    status["node"] = {"name": "Node.js (YouTube İmza Çözücü)", "ok": bool(shutil.which("node"))}

    return status

def create_desktop_shortcut():
    try:
        if sys.platform == "darwin":
            desktop = os.path.expanduser("~/Desktop")
            target = os.path.join(CURRENT_DIR, "start_clip.command")
            link = os.path.join(desktop, "CLIP")
            if not os.path.exists(link) and os.path.exists(target):
                os.symlink(target, link)
            return True
        else:
            ps_cmd = (
                f'$WshShell = New-Object -ComObject WScript.Shell; '
                f'$Shortcut = $WshShell.CreateShortcut("$([Environment]::GetFolderPath(\'Desktop\'))\\CLIP.lnk"); '
                f'$Shortcut.TargetPath = "{BAT_PATH}"; '
                f'$Shortcut.WorkingDirectory = "{CURRENT_DIR}"; '
                f'$Shortcut.Description = "CLIP — Evrensel Video Panosu"; '
            )
            if os.path.exists(ICO_PATH):
                ps_cmd += f'$Shortcut.IconLocation = "{ICO_PATH}"; '
            ps_cmd += '$Shortcut.Save()'
            subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True)
            return True
    except Exception as e:
        print(f"Shortcut error: {e}")
        return False

def set_autostart_reg(enable=True):
    if sys.platform == "darwin":
        agent_dir = os.path.expanduser("~/Library/LaunchAgents")
        plist_path = os.path.join(agent_dir, "com.clip.helper.plist")
        try:
            if enable:
                os.makedirs(agent_dir, exist_ok=True)
                script_path = os.path.join(CURRENT_DIR, "clip_helper.py")
                plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.clip.helper</string>
    <key>ProgramArguments</key>
    <array>
        <string>{sys.executable}</string>
        <string>-u</string>
        <string>-B</string>
        <string>{script_path}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>"""
                with open(plist_path, "w", encoding="utf-8") as f:
                    f.write(plist_content)
            else:
                if os.path.exists(plist_path):
                    os.remove(plist_path)
            return True
        except Exception as e:
            print(f"macOS autostart error: {e}")
            return False

    try:
        import winreg
        RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
        APP_NAME = "CLIP_Companion"
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as key:
            if enable:
                pythonw = sys.executable
                if pythonw.endswith("python.exe"):
                    pythonw = pythonw[:-10] + "pythonw.exe"
                script_path = os.path.join(CURRENT_DIR, "clip_helper.py")
                cmd = f'"{pythonw}" -u -B "{script_path}"'
                winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, cmd)
            else:
                try:
                    winreg.DeleteValue(key, APP_NAME)
                except FileNotFoundError:
                    pass
        return True
    except Exception as e:
        print(f"Autostart error: {e}")
        return False

def is_autostart_active():
    if sys.platform == "darwin":
        plist_path = os.path.expanduser("~/Library/LaunchAgents/com.clip.helper.plist")
        return os.path.exists(plist_path)

    try:
        import winreg
        RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
        APP_NAME = "CLIP_Companion"
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_READ) as key:
            val, _ = winreg.QueryValueEx(key, APP_NAME)
            return bool(val)
    except Exception:
        return False

class SetupWizard(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("⚡ CLIP — Evrensel Video Panosu Kurulum Sihirbazı")
        self.geometry("600x720")
        self.minsize(580, 680)
        self.configure(bg="#0b0e17")

        if os.path.exists(ICO_PATH):
            try:
                self.iconbitmap(ICO_PATH)
            except Exception:
                pass

        self.center_window()
        self.create_widgets()
        self.refresh_status()

    def center_window(self):
        self.update_idletasks()
        w = 600
        h = 720
        x = (self.winfo_screenwidth() // 2) - (w // 2)
        y = (self.winfo_screenheight() // 2) - (h // 2)
        self.geometry(f"{w}x{h}+{x}+{y}")

    def create_widgets(self):
        # Main Canvas with scrollbar for responsive layout
        container = tk.Frame(self, bg="#0b0e17")
        container.pack(fill="both", expand=True)

        canvas = tk.Canvas(container, bg="#0b0e17", highlightthickness=0)
        scrollbar = tk.Scrollbar(container, orient="vertical", command=canvas.yview)
        self.scrollable_frame = tk.Frame(canvas, bg="#0b0e17")

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw", width=580)
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True, padx=10, pady=10)
        scrollbar.pack(side="right", fill="y")

        # 1. Header
        header = tk.Frame(self.scrollable_frame, bg="#0b0e17")
        header.pack(fill="x", pady=(10, 15), padx=10)

        title_lbl = tk.Label(
            header,
            text="⚡ CLIP — Evrensel Video Panosu",
            font=("Segoe UI", 16, "bold"),
            fg="#f8fafc",
            bg="#0b0e17"
        )
        title_lbl.pack(anchor="w")

        subtitle_lbl = tk.Label(
            header,
            text="YouTube Shorts, TikTok, Instagram Reels ve X videolarını doğrudan panoya kopyalayın.",
            font=("Segoe UI", 10),
            fg="#94a3b8",
            bg="#0b0e17"
        )
        subtitle_lbl.pack(anchor="w", pady=(2, 0))

        # 2. Card: Sistem & Gereksinim Durumu
        card_deps = tk.LabelFrame(
            self.scrollable_frame,
            text="  1. Sistem & Kütüphane Durumu  ",
            font=("Segoe UI", 11, "bold"),
            fg="#c084fc",
            bg="#111625",
            padx=16,
            pady=12,
            bd=1,
            relief="solid"
        )
        card_deps.pack(fill="x", padx=10, pady=8)

        self.deps_container = tk.Frame(card_deps, bg="#111625")
        self.deps_container.pack(fill="x")

        self.btn_install_deps = tk.Button(
            card_deps,
            text="📦 Eksik Kütüphaneleri Otomatik Kur (pip install)",
            font=("Segoe UI", 9, "bold"),
            bg="#7c3aed",
            fg="#ffffff",
            activebackground="#6d28d9",
            activeforeground="#ffffff",
            relief="flat",
            padx=12,
            pady=6,
            cursor="hand2",
            command=self.install_requirements
        )

        # 3. Card: Masaüstü & Başlangıç Ayarları
        card_settings = tk.LabelFrame(
            self.scrollable_frame,
            text="  2. Başlatma & Kısayol Seçenekleri  ",
            font=("Segoe UI", 11, "bold"),
            fg="#c084fc",
            bg="#111625",
            padx=16,
            pady=12,
            bd=1,
            relief="solid"
        )
        card_settings.pack(fill="x", padx=10, pady=8)

        self.var_shortcut = tk.BooleanVar(value=True)
        chk_shortcut = tk.Checkbutton(
            card_settings,
            text="🖥️ Masaüstüne 'CLIP' kısayolu ekle",
            variable=self.var_shortcut,
            font=("Segoe UI", 10),
            fg="#e2e8f0",
            bg="#111625",
            selectcolor="#1e1b4b",
            activebackground="#111625",
            activeforeground="#ffffff"
        )
        chk_shortcut.pack(anchor="w", pady=3)

        self.var_autostart = tk.BooleanVar(value=is_autostart_active() or True)
        autostart_text = "🚀 Mac açıldığında otomatik başlat (Üst Menü Çubuğu)" if sys.platform == "darwin" else "🚀 Windows açıldığında otomatik başlat (Sistem Tepsisi — Yukarı Ok ^)"
        chk_autostart = tk.Checkbutton(
            card_settings,
            text=autostart_text,
            variable=self.var_autostart,
            font=("Segoe UI", 10),
            fg="#e2e8f0",
            bg="#111625",
            selectcolor="#1e1b4b",
            activebackground="#111625",
            activeforeground="#ffffff"
        )
        chk_autostart.pack(anchor="w", pady=3)

        # 4. Card: Tarayıcı Eklentisini Yükleme (Rehber)
        card_browser = tk.LabelFrame(
            self.scrollable_frame,
            text="  3. Tarayıcı Eklentisini Ekleme (Chrome / Brave / Edge)  ",
            font=("Segoe UI", 11, "bold"),
            fg="#c084fc",
            bg="#111625",
            padx=16,
            pady=12,
            bd=1,
            relief="solid"
        )
        card_browser.pack(fill="x", padx=10, pady=8)

        guide_text = (
            "Eklentiyi tarayıcınıza eklemek için 3 basit adım:\n\n"
            "1. Tarayıcınızda Eklentiler sayfasını açın (chrome://extensions veya brave://extensions)\n"
            "2. Sayfanın sağ üstündeki 'Geliştirici Modu' (Developer Mode) anahtarını açın.\n"
            "3. Sol üstte beliren 'Paketlenmemiş Öğe Yükle' butonuna basıp bu klasörü seçin."
        )
        lbl_guide = tk.Label(
            card_browser,
            text=guide_text,
            font=("Segoe UI", 9),
            fg="#cbd5e1",
            bg="#111625",
            justify="left",
            wraplength=520
        )
        lbl_guide.pack(anchor="w", pady=(0, 10))

        btn_row = tk.Frame(card_browser, bg="#111625")
        btn_row.pack(fill="x", pady=2)

        btn_open_ext = tk.Button(
            btn_row,
            text="🌐 Eklentiler Sayfasını Aç",
            font=("Segoe UI", 9, "bold"),
            bg="#2563eb",
            fg="#ffffff",
            activebackground="#1d4ed8",
            relief="flat",
            padx=10,
            pady=6,
            cursor="hand2",
            command=self.open_browser_extensions
        )
        btn_open_ext.pack(side="left", padx=(0, 8))

        btn_copy_path = tk.Button(
            btn_row,
            text="📋 Klasör Yolunu Kopyala",
            font=("Segoe UI", 9),
            bg="#1e293b",
            fg="#e2e8f0",
            activebackground="#334155",
            relief="flat",
            padx=10,
            pady=6,
            cursor="hand2",
            command=self.copy_folder_path
        )
        btn_copy_path.pack(side="left", padx=(0, 8))

        btn_open_folder = tk.Button(
            btn_row,
            text="📁 Klasörü Aç",
            font=("Segoe UI", 9),
            bg="#1e293b",
            fg="#e2e8f0",
            activebackground="#334155",
            relief="flat",
            padx=10,
            pady=6,
            cursor="hand2",
            command=lambda: os.startfile(CURRENT_DIR)
        )
        btn_open_folder.pack(side="left")

        # 5. Launch & Start Section
        launch_frame = tk.Frame(self.scrollable_frame, bg="#0b0e17")
        launch_frame.pack(fill="x", padx=10, pady=16)

        self.btn_finish = tk.Button(
            launch_frame,
            text="⚡ Kurulumu Tamamla ve CLIP'i Başlat",
            font=("Segoe UI", 12, "bold"),
            bg="#9333ea",
            fg="#ffffff",
            activebackground="#7e22ce",
            activeforeground="#ffffff",
            relief="flat",
            pady=12,
            cursor="hand2",
            command=self.finish_and_launch
        )
        self.btn_finish.pack(fill="x")

        tip_text = "Başlatıldığında servis üst menü çubuğuna (sağ üst) yerleşir ve tek tıkla açılıp kapanabilir." if sys.platform == "darwin" else "Başlatıldığında servis sağ alttaki sistem tepsisine (yukarı ok ^) yerleşir ve tek tıkla açılıp kapanabilir."
        status_tip = tk.Label(
            launch_frame,
            text=tip_text,
            font=("Segoe UI", 8.5),
            fg="#64748b",
            bg="#0b0e17"
        )
        status_tip.pack(pady=(6, 0))

    def refresh_status(self):
        for w in self.deps_container.winfo_children():
            w.destroy()

        deps = check_dependencies()
        all_ok = True

        for k, v in deps.items():
            row = tk.Frame(self.deps_container, bg="#111625")
            row.pack(fill="x", pady=2)

            icon = "✓" if v["ok"] else "✗"
            color = "#10b981" if v["ok"] else "#ef4444"

            lbl_icon = tk.Label(row, text=icon, font=("Segoe UI", 10, "bold"), fg=color, bg="#111625", width=2)
            lbl_icon.pack(side="left")

            lbl_name = tk.Label(row, text=v["name"], font=("Segoe UI", 9.5), fg="#f1f5f9" if v["ok"] else "#f87171", bg="#111625")
            lbl_name.pack(side="left", padx=4)

            if not v["ok"]:
                all_ok = False

        if not all_ok:
            self.btn_install_deps.pack(anchor="w", pady=(10, 0))
        else:
            self.btn_install_deps.pack_forget()

    def install_requirements(self):
        self.btn_install_deps.config(text="⏳ Paketler yükleniyor, lütfen bekleyin...", state="disabled")
        
        def run_pip():
            req_file = os.path.join(CURRENT_DIR, "requirements.txt")
            cmd = [sys.executable, "-m", "pip", "install", "-r", req_file]
            try:
                subprocess.run(cmd, check=True, capture_output=True)
            except Exception as e:
                print(f"Pip error: {e}")
            self.after(500, self.on_pip_done)

        threading.Thread(target=run_pip, daemon=True).start()

    def on_pip_done(self):
        self.btn_install_deps.config(text="📦 Eksik Kütüphaneleri Otomatik Kur (pip install)", state="normal")
        self.refresh_status()
        messagebox.showinfo("CLIP", "Gereksinimler kontrol edildi ve güncellendi!")

    def open_browser_extensions(self):
        # Open default browser extension page
        try:
            # Try chrome / brave URL
            webbrowser.open("chrome://extensions")
        except Exception:
            webbrowser.open("https://www.google.com/chrome/")

    def copy_folder_path(self):
        self.clipboard_clear()
        self.clipboard_append(CURRENT_DIR)
        messagebox.showinfo("CLIP", f"Klasör yolu panoya kopyalandı:\n\n{CURRENT_DIR}\n\n'Paketlenmemiş Öğe Yükle' penceresine yapıştırabilirsiniz.")

    def finish_and_launch(self):
        # 1. Desktop shortcut
        if self.var_shortcut.get():
            create_desktop_shortcut()

        # 2. Autostart
        set_autostart_reg(self.var_autostart.get())

        # 3. Launch background service
        try:
            subprocess.Popen([sys.executable, os.path.join(CURRENT_DIR, "clip_helper.py")])
        except Exception as e:
            subprocess.Popen([BAT_PATH], shell=True)

        location_msg = "üst menü çubuğuna (sağ üst)" if sys.platform == "darwin" else "görev çubuğundaki Sistem Tepsisine (Yukarı Ok ^ simgesi)"
        messagebox.showinfo(
            "CLIP Başlatıldı! ⚡",
            f"CLIP başarıyla başlatıldı ve {location_msg} yerleşti!\n\n"
            "• Açıp kapatmak için şimşek simgesine tıklayabilirsiniz.\n"
            "• YouTube Shorts, TikTok, Instagram Reels ve X videolarını artık tek tıkla panoya kopyalayabilirsiniz."
        )
        self.destroy()

if __name__ == "__main__":
    app = SetupWizard()
    app.mainloop()
