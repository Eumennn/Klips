"""
CLIP — Local Media & Windows Clipboard Helper
Acts as a silent companion service for the CLIP Chrome Extension.
Provides real yt-dlp downloading with FFmpeg HD merge and direct CF_HDROP clipboard injection.
Always produces H.264/AAC with +faststart for instant WhatsApp, Discord & Telegram pasting.
"""

import os
import sys
import shutil

# Guarantee bytecode is never written and remove any rogue __pycache__ immediately
os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
sys.dont_write_bytecode = True

current_dir = os.path.dirname(os.path.abspath(__file__))
pycache_dir = os.path.join(current_dir, "__pycache__")
if os.path.exists(pycache_dir):
    try:
        shutil.rmtree(pycache_dir, ignore_errors=True)
    except Exception:
        pass

import http.server
import json
import subprocess
import tempfile
import urllib.parse
import urllib.request
import time
import re
import threading
import socket
import winreg
import ctypes
from ctypes import wintypes

# Force UTF-8 encoding for Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

PORT = 48123
CLIP_DIR = os.path.join(tempfile.gettempdir(), "CLIP")
os.makedirs(CLIP_DIR, exist_ok=True)

def cleanup_temp_files(max_age_seconds=600, max_files=5, max_total_bytes=120 * 1024 * 1024):
    """
    Automatic Temp Cleaner:
    Guarantees zero PC disk buildup by automatically sweeping old temporary video files.
    - Preserves the active clip so user has ample time (10 min) to paste (Ctrl+V) into WhatsApp/Discord.
    - Limits total cached clips to max 5 files and 120 MB.
    - Automatically purges anything older than 10 minutes.
    """
    if not os.path.exists(CLIP_DIR):
        return

    now = time.time()
    try:
        files = []
        for f in os.listdir(CLIP_DIR):
            fpath = os.path.join(CLIP_DIR, f)
            if os.path.isfile(fpath) and f.endswith((".mp4", ".mkv", ".webm", ".part", ".tmp")):
                try:
                    mtime = os.path.getmtime(fpath)
                    size = os.path.getsize(fpath)
                    files.append((fpath, mtime, size))
                except Exception:
                    pass

        # Sort newest first
        files.sort(key=lambda x: x[1], reverse=True)

        total_size = 0
        for i, (fpath, mtime, size) in enumerate(files):
            age = now - mtime
            should_delete = False

            if i >= max_files:
                should_delete = True
            elif age > max_age_seconds and i > 0:
                should_delete = True
            elif total_size + size > max_total_bytes and i > 0:
                should_delete = True

            if should_delete:
                try:
                    os.remove(fpath)
                    print(f"🧹 [CLIP Auto-Clean] Removed expired temp file: {os.path.basename(fpath)}")
                except Exception:
                    pass
            else:
                total_size += size
    except Exception as e:
        print(f"⚠️ [CLIP Auto-Clean] Error: {e}")

def periodic_cleanup_loop():
    """Silent daemon thread running every 30 seconds to keep Temp clean"""
    while True:
        time.sleep(30)
        cleanup_temp_files()

# Locate FFmpeg for WhatsApp-compatible H.264/AAC faststart merging
try:
    import imageio_ffmpeg
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"🎬 [CLIP] FFmpeg detected: {FFMPEG_PATH}")
except Exception as e:
    FFMPEG_PATH = None

if not FFMPEG_PATH:
    fallback_paths = [
        r"C:\Users\pc\AppData\Local\Programs\Python\Python312\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe",
        r"C:\Users\pc\miniconda3\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe",
    ]
    for p in fallback_paths:
        if os.path.exists(p):
            FFMPEG_PATH = p
            print(f"🎬 [CLIP] FFmpeg detected (fallback): {FFMPEG_PATH}")
            break

if not FFMPEG_PATH:
    print("⚠️ [CLIP] FFmpeg not found, falling back to progressive streams.")

# Win32 Clipboard Definitions
CF_HDROP = 15
GHND = 0x0042

TRAY_ICON = None
IS_ACTIVE = True
IMG_ACTIVE = None
IMG_INACTIVE = None

def get_tray_images():
    global IMG_ACTIVE, IMG_INACTIVE
    if IMG_ACTIVE is not None and IMG_INACTIVE is not None:
        return IMG_ACTIVE, IMG_INACTIVE
    try:
        from PIL import Image, ImageOps
        icon_path = os.path.join(current_dir, "icons", "icon48.png")
        if not os.path.exists(icon_path):
            icon_path = os.path.join(current_dir, "icons", "icon128.png")
        IMG_ACTIVE = Image.open(icon_path).convert("RGBA")
        r, g, b, a = IMG_ACTIVE.split()
        gray = ImageOps.grayscale(IMG_ACTIVE.convert("RGB"))
        dim_a = a.point(lambda p: int(p * 0.75))
        IMG_INACTIVE = Image.merge("RGBA", (gray, gray, gray, dim_a))
    except Exception as e:
        print(f"Icon generation error: {e}")
    return IMG_ACTIVE, IMG_INACTIVE

def toggle_active_state(icon=None, item=None):
    global IS_ACTIVE, TRAY_ICON
    target = icon or TRAY_ICON
    IS_ACTIVE = not IS_ACTIVE
    act_img, inact_img = get_tray_images()
    if target:
        if IS_ACTIVE:
            if act_img:
                target.icon = act_img
            target.title = "CLIP — Aktif (Açık)"
            notify_user("CLIP: Aktif ⚡", "Servis açıldı (Mor mod), videolar kopyalanabilir.")
        else:
            if inact_img:
                target.icon = inact_img
            target.title = "CLIP — Kapalı (Duraklatıldı)"
            notify_user("CLIP: Kapalı ⏸️", "Servis duraklatıldı (Renksiz mod). Açmak için tekrar tıklayın.")
        try:
            target.update_menu()
        except Exception:
            pass

def notify_user(title, message):
    if TRAY_ICON and hasattr(TRAY_ICON, "notify"):
        try:
            TRAY_ICON.notify(title=title, message=message)
        except Exception:
            pass

RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
APP_NAME = "CLIP_Companion"

def is_autostart_enabled():
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_READ) as key:
            val, _ = winreg.QueryValueEx(key, APP_NAME)
            return bool(val)
    except FileNotFoundError:
        return False
    except Exception:
        return False

def set_autostart(enable=True):
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as key:
            if enable:
                pythonw = sys.executable
                if pythonw.endswith("python.exe"):
                    pythonw = pythonw[:-10] + "pythonw.exe"
                script_path = os.path.abspath(__file__)
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

class DROPFILES(ctypes.Structure):
    _fields_ = [
        ("pFiles", wintypes.DWORD),
        ("pt", wintypes.POINT),
        ("fNC", wintypes.BOOL),
        ("fWide", wintypes.BOOL),
    ]

def copy_file_to_windows_clipboard(file_path):
    """Copies the file to Windows Clipboard using CF_HDROP (native Ctrl+V file paste)"""
    abs_path = os.path.abspath(file_path)
    if not os.path.exists(abs_path):
        print(f"⚠️ [CLIP] Cannot copy to clipboard, file does not exist: {abs_path}")
        return False

    file_bytes = (abs_path + "\0\0").encode("utf-16le")
    dropfiles = DROPFILES()
    dropfiles.pFiles = ctypes.sizeof(DROPFILES)
    dropfiles.fWide = True

    total_size = ctypes.sizeof(DROPFILES) + len(file_bytes)

    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    kernel32.GlobalAlloc.restype = wintypes.HGLOBAL
    kernel32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
    kernel32.GlobalLock.restype = ctypes.c_void_p
    kernel32.GlobalLock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalUnlock.argtypes = [wintypes.HGLOBAL]

    user32.OpenClipboard.argtypes = [wintypes.HWND]
    user32.SetClipboardData.argtypes = [wintypes.UINT, wintypes.HANDLE]

    h_global = kernel32.GlobalAlloc(GHND, total_size)
    p_global = kernel32.GlobalLock(h_global)

    ctypes.memmove(p_global, ctypes.byref(dropfiles), ctypes.sizeof(DROPFILES))
    ctypes.memmove(p_global + ctypes.sizeof(DROPFILES), file_bytes, len(file_bytes))

    kernel32.GlobalUnlock(h_global)

    user32.OpenClipboard(None)
    user32.EmptyClipboard()
    user32.SetClipboardData(CF_HDROP, h_global)
    user32.CloseClipboard()
    print(f"📋 [CLIP] Copied to Windows Clipboard (CF_HDROP): {abs_path}")
    notify_user("CLIP — Video Panoda! 📋", "WhatsApp veya Discord'a doğrudan Ctrl+V yapabilirsiniz.")
    try:
        cleanup_temp_files()
    except Exception:
        pass
    return True

def is_valid_progressive_video_url(url):
    """Checks whether a URL is a valid complete progressive video (not segmented, not audio)"""
    if not url or not url.startswith("http"):
        return False
    u = url.lower()
    # Reject segmented streams or playlists
    if any(ext in u for ext in [".m4s", ".m3u8", ".mpd", ".ts"]):
        return False
    # Reject audio-only streams
    if any(k in u for k in ["_audio", "audio_", "dash_ln_heaac", "dash_heaac", ".m4a"]):
        return False
    return True

def ensure_whatsapp_compatible(file_path):
    """
    Ensures video is 100% compatible with WhatsApp Web / Desktop on Windows:
    - Codec: H.264 (avc1)
    - Audio: AAC (mp4a) — If video has no audio (e.g. muted Instagram Reel), adds a silent stereo track
    - Pixel format: yuv420p with even dimensions (width/height divisible by 2)
    - moov atom at start: +faststart (0.1s instant load in WhatsApp Ctrl+V)
    """
    if not FFMPEG_PATH or not os.path.exists(file_path):
        return file_path

    try:
        probe = subprocess.run([FFMPEG_PATH, "-i", file_path], capture_output=True, text=True, errors="ignore")
        stderr = probe.stderr or ""

        has_video = "Video:" in stderr
        if not has_video:
            print("⚠️ [CLIP] File does not contain a video stream! Rejecting.")
            try:
                os.remove(file_path)
            except Exception:
                pass
            return None

        has_audio = "Audio:" in stderr
        is_h264 = ("Video: h264" in stderr or "avc1" in stderr)
        is_aac = ("Audio: aac" in stderr or "mp4a" in stderr)
        is_yuv420p = "yuv420p" in stderr and "yuv420p10" not in stderr

        base_dir, base_name = os.path.split(file_path)
        out_path = os.path.join(base_dir, f"wa_{base_name}")

        # If already fully compliant H.264 + AAC + yuv420p, just faststart
        if is_h264 and is_aac and is_yuv420p:
            cmd = [
                FFMPEG_PATH, "-y", "-i", file_path,
                "-c", "copy",
                "-movflags", "+faststart",
                out_path
            ]
        elif has_audio:
            # Transcode video to H.264 yuv420p and audio to AAC
            cmd = [
                FFMPEG_PATH, "-y", "-i", file_path,
                "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast", "-crf", "22",
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                out_path
            ]
        else:
            # Video only (e.g. muted Instagram Reel)! Add silent AAC audio so WhatsApp doesn't reject it
            print("⚡ [CLIP] Video has no audio track, generating silent stereo AAC for WhatsApp...")
            cmd = [
                FFMPEG_PATH, "-y", "-i", file_path,
                "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast", "-crf", "22",
                "-c:a", "aac", "-b:a", "128k",
                "-shortest",
                "-movflags", "+faststart",
                out_path
            ]

        subprocess.run(cmd, capture_output=True, check=True)
        if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            try:
                os.remove(file_path)
            except Exception:
                pass
            return out_path
    except Exception as e:
        print(f"⚠️ [CLIP] FFmpeg faststart/remux pass failed: {e}")

    return None

def download_direct_stream(video_url, filename_prefix="clip"):
    """Downloads direct progressive stream URL (e.g. from Instagram CDN or TikTok CDN)"""
    if not is_valid_progressive_video_url(video_url):
        return None
    try:
        # Strip bytestart and byteend so Facebook/Instagram CDN gives the FULL video from byte 0
        clean_url = video_url
        clean_url = re.sub(r'[?&]bytestart=\d+', '', clean_url)
        clean_url = re.sub(r'[?&]byteend=\d+', '', clean_url)

        is_instagram = any(k in clean_url.lower() for k in ["instagram", "fbcdn", "cdninstagram"])
        is_tiktok = any(k in clean_url.lower() for k in ["tiktok", "byteoversea"])

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Range": "bytes=0-"
        }
        if is_instagram:
            headers["Referer"] = "https://www.instagram.com/"
            headers["Origin"] = "https://www.instagram.com"
        elif is_tiktok:
            headers["Referer"] = "https://www.tiktok.com/"

        clean_name = f"{filename_prefix}_{int(time.time())}.mp4"
        target_file = os.path.join(CLIP_DIR, clean_name)

        req = urllib.request.Request(clean_url, headers=headers)
        with urllib.request.urlopen(req, timeout=25) as resp, open(target_file, "wb") as out:
            while chunk := resp.read(65536):
                out.write(chunk)

        if os.path.exists(target_file) and os.path.getsize(target_file) > 15000:
            final_file = ensure_whatsapp_compatible(target_file)
            if final_file and os.path.exists(final_file) and os.path.getsize(final_file) > 15000:
                copy_file_to_windows_clipboard(final_file)
                print(f"⚡ [CLIP] Direct stream downloaded & copied: {final_file} ({os.path.getsize(final_file)} bytes)")
                return {"path": final_file}
            else:
                print("⚠️ [CLIP] Direct stream validation failed (corrupt or audio-only).")
    except Exception as e:
        print(f"⚠️ [CLIP] Direct stream download failed: {e}")
    return None

def download_twitter_vxtwitter(url):
    """Fallback for Twitter (X) videos using vxTwitter API"""
    try:
        match = re.search(r'status/(\d+)', url)
        if not match:
            return None
        tweet_id = match.group(1)
        api_url = f"https://api.vxtwitter.com/Twitter/status/{tweet_id}"
        req = urllib.request.Request(api_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
            media = data.get("media_extended") or []
            for item in media:
                if item.get("type") == "video" and item.get("url"):
                    video_url = item["url"]
                    print(f"⚡ [CLIP] vxTwitter API resolved MP4: {video_url[:60]}...")
                    return download_direct_stream(video_url, "twitter")
    except Exception as e:
        print(f"⚠️ [CLIP] vxTwitter attempt: {e}")
    return None

def download_tiktok_tikwm(url):
    """Downloads TikTok video watermark-free via TikWM API"""
    try:
        api_url = f"https://www.tikwm.com/api/?url={urllib.parse.quote(url)}"
        req = urllib.request.Request(api_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        })
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
            if data and data.get("code") == 0 and data.get("data") and data["data"].get("play"):
                play_url = data["data"]["play"]
                print(f"⚡ [CLIP] TikWM API resolved MP4: {play_url[:60]}...")
                return download_direct_stream(play_url, "tiktok")
    except Exception as e:
        print(f"⚠️ [CLIP] TikWM attempt: {e}")
    return None

def parse_time_sec(val):
    if val is None:
        return None
    val_str = str(val).strip()
    if not val_str:
        return None
    if ":" in val_str:
        parts = val_str.split(":")
        try:
            if len(parts) == 2:
                return float(parts[0]) * 60 + float(parts[1])
            elif len(parts) == 3:
                return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
        except ValueError:
            return None
    try:
        return float(val_str)
    except ValueError:
        return None

def download_video_ytdlp(url, is_pro=False, dom_src=None, start_time=None, end_time=None):
    req_start_ts = time.time()
    clean_url = (url or "").strip()
    print(f"⚡ [CLIP] Processing video: {clean_url} (Pro: {is_pro}, dom_src: {bool(dom_src)}, range: {start_time}-{end_time})")

    start_sec = parse_time_sec(start_time)
    end_sec = parse_time_sec(end_time)
    has_time_range = start_sec is not None and end_sec is not None and end_sec > start_sec

    if has_time_range:
        clip_duration = end_sec - start_sec
        if not is_pro and clip_duration > 61:
            return {"error": "pro_required", "message": f"Kırpılan süre ({int(clip_duration)} sn) 1 dakikadan uzun. 1 dakikadan uzun klipler CLIP PRO gerektirir."}

    is_twitter = ("twitter.com" in clean_url or "x.com" in clean_url)
    is_instagram = "instagram.com" in clean_url

    # 1. Direct stream provided (ONLY for non-Twitter and valid progressive MP4s)
    # Twitter streams in browser are always .m4s fragments and Instagram has audio-only streams
    if not is_twitter and not is_instagram and dom_src and is_valid_progressive_video_url(dom_src) and not has_time_range:
        print("⚡ [CLIP] Direct progressive HTTP stream provided, downloading directly...")
        res = download_direct_stream(dom_src, "direct_video")
        if res:
            return res

    # 2. TikTok specific optimizations: try TikWM first for watermark-free MP4
    if "tiktok.com" in clean_url and not has_time_range:
        if "/video/" in clean_url:
            tikwm_res = download_tiktok_tikwm(clean_url)
            if tikwm_res:
                return tikwm_res

    # 3. If it's a generic feed URL without ID and no direct stream
    has_ig_shortcode = bool(re.search(r'instagram\.com/(?:reel|reels|p|tv)/([A-Za-z0-9_-]{9,15})', clean_url))
    is_generic_feed = (
        ("tiktok.com" in clean_url and not "/video/" in clean_url) or
        ("instagram.com" in clean_url and not has_ig_shortcode) or
        (clean_url.rstrip("/").endswith("tiktok.com") or clean_url.rstrip("/").endswith("instagram.com"))
    )
    if is_generic_feed and (not dom_src or dom_src.startswith("blob:")):
        return {"error": "feed_url", "message": "Video akışı tespit edilemedi. Lütfen videodaki CLIP butonuna tekrar basın."}

    out_template = os.path.join(CLIP_DIR, "%(id)s_%(epoch)s.%(ext)s")

    video_format = (
        "bestvideo[vcodec^=avc][height<=1080]+bestaudio[acodec^=mp4a]/bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best"
        if is_pro else
        "bestvideo[vcodec^=avc][height<=720]+bestaudio[acodec^=mp4a]/bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best"
    )

    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--paths", CLIP_DIR,
        "--paths", f"temp:{CLIP_DIR}",
        "--no-playlist",
        "--force-overwrites",
        "-f", video_format,
        "--merge-output-format", "mp4",
        "-o", out_template,
        "--print", "after_move:filepath",
    ]

    # Enforce section or full video limits
    if has_time_range:
        section_str = f"*{int(start_sec)}-{int(end_sec)}"
        cmd.extend(["--download-sections", section_str, "--force-keyframes-at-cuts"])
    elif not is_pro:
        cmd.extend(["--match-filter", "duration <=? 60"])

    if FFMPEG_PATH:
        cmd.extend(["--ffmpeg-location", FFMPEG_PATH])
        cmd.extend(["--postprocessor-args", "ffmpeg:-movflags +faststart"])

    cmd.append(clean_url)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        combined_output = (result.stdout or "") + (result.stderr or "")
        if "does not pass filter" in combined_output or "skipping" in combined_output:
            return {"error": "pro_required", "message": "Bu video 1 dakikadan uzun. 1 dakikadan uzun videolar CLIP PRO gerektirir."}

        out_path = result.stdout.strip().splitlines()[-1] if result.stdout and result.stdout.strip() else None
        if out_path and os.path.exists(out_path):
            final_file = ensure_whatsapp_compatible(out_path)
            if final_file and os.path.exists(final_file):
                copy_file_to_windows_clipboard(final_file)
                return {"path": final_file}

        if not is_pro and not out_path:
            return {"error": "pro_required", "message": "Bu video 1 dakikadan uzun. 1 dakikadan uzun videolar CLIP PRO gerektirir."}
    except subprocess.CalledProcessError as e:
        print(f"⚠️ [CLIP] Error during yt-dlp execution:\n{e.stderr}")
        err_out = (e.stdout or "") + (e.stderr or "")
        if "does not pass filter" in err_out or "skipping" in err_out:
            return {"error": "pro_required", "message": "Bu video 1 dakikadan uzun. 1 dakikadan uzun videolar CLIP PRO gerektirir."}

        # Fallback for Twitter (X): vxTwitter API
        if is_twitter:
            vx_res = download_twitter_vxtwitter(clean_url)
            if vx_res:
                return vx_res

        # Fallback for TikTok: TikWM API
        if "tiktok.com" in clean_url and "/video/" in clean_url:
            tikwm_res = download_tiktok_tikwm(clean_url)
            if tikwm_res:
                return tikwm_res

    # Search strictly for files created in CLIP_DIR during this specific request
    new_files = [
        os.path.join(CLIP_DIR, f) for f in os.listdir(CLIP_DIR)
        if f.endswith((".mp4", ".mkv", ".webm")) and os.path.getmtime(os.path.join(CLIP_DIR, f)) >= req_start_ts - 0.5
    ]
    if new_files:
        latest = max(new_files, key=os.path.getmtime)
        final_file = ensure_whatsapp_compatible(latest)
        copy_file_to_windows_clipboard(final_file)
        return {"path": final_file}

    return None

class ClipHTTPHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress console logging for pythonw / system tray silent mode

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/health":
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok" if IS_ACTIVE else "paused",
                "active": IS_ACTIVE,
                "service": "CLIP Helper",
                "has_ffmpeg": bool(FFMPEG_PATH),
                "clip_dir": CLIP_DIR
            }).encode())
            return

        if parsed.path == "/open_folder":
            try:
                os.startfile(CLIP_DIR)
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"success": true}')
            except Exception as e:
                self.send_response(500)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())
            return

        if parsed.path == "/open_file":
            query = urllib.parse.parse_qs(parsed.query)
            path = query.get("path", [None])[0]
            if path and os.path.exists(path):
                try:
                    subprocess.Popen(f'explorer.exe /select,"{os.path.abspath(path)}"')
                    self.send_response(200)
                    self.send_cors_headers()
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(b'{"success": true}')
                except Exception as e:
                    self.send_response(500)
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())
            else:
                self.send_response(404)
                self.send_cors_headers()
                self.end_headers()
            return

        if parsed.path == "/copy":
            query = urllib.parse.parse_qs(parsed.query)
            path = query.get("path", [None])[0]
            if path and os.path.exists(path):
                ok = copy_file_to_windows_clipboard(path)
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": ok}).encode())
            else:
                self.send_response(404)
                self.send_cors_headers()
                self.end_headers()
            return

        if parsed.path == "/clip":
            if not IS_ACTIVE:
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "CLIP şu anda Sistem Tepsisinden kapatıldı (duraklatıldı). Açmak için sağ alttaki simgeye bir kez tıklayın."
                }).encode())
                return

            query = urllib.parse.parse_qs(parsed.query)
            url = query.get("url", [None])[0]
            dom_src = query.get("dom_src", [None])[0]
            is_pro = query.get("is_pro", ["0"])[0] in ["1", "true", "True"]
            start_time = query.get("start_time", [None])[0]
            end_time = query.get("end_time", [None])[0]

            if not url and not dom_src:
                self.send_response(400)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(b'{"error": "No URL or stream provided"}')
                return

            res = download_video_ytdlp(url or dom_src, is_pro=is_pro, dom_src=dom_src, start_time=start_time, end_time=end_time)
            if isinstance(res, dict) and res.get("error") == "pro_required":
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "isProRequired": True, "error": res["message"]}).encode())
                return

            if isinstance(res, dict) and res.get("error") == "feed_url":
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": res["message"]}).encode())
                return

            if res and isinstance(res, dict) and res.get("path") and os.path.exists(res["path"]):
                saved_path = res["path"]
                filename = os.path.basename(saved_path)
                resp = {
                    "success": True,
                    "filename": filename,
                    "filePath": saved_path,
                    "videoUrl": f"http://127.0.0.1:{PORT}/video/{urllib.parse.quote(filename)}"
                }
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(resp).encode())
            else:
                self.send_response(500)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Video indirilemedi."}).encode())
            return

        if parsed.path.startswith("/video/"):
            fname = urllib.parse.unquote(parsed.path[7:])
            fpath = os.path.join(CLIP_DIR, fname)
            if os.path.exists(fpath):
                size = os.path.getsize(fpath)
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "video/mp4")
                self.send_header("Content-Length", str(size))
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                with open(fpath, "rb") as f:
                    while chunk := f.read(65536):
                        self.wfile.write(chunk)
                return
            else:
                self.send_response(404)
                self.end_headers()
                return

        if parsed.path == "/clean":
            cleanup_temp_files(max_age_seconds=0, max_files=0, max_total_bytes=0)
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"success": true, "cleaned": true}')
            return

        self.send_response(404)
        self.end_headers()

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def setup_tray(server):
    global TRAY_ICON
    try:
        import pystray
        act_img, inact_img = get_tray_images()
        if not act_img:
            return None

        current_img = act_img if IS_ACTIVE else inact_img

        def on_open_folder(icon, item):
            try:
                os.startfile(CLIP_DIR)
            except Exception:
                pass

        def on_clean(icon, item):
            cleanup_temp_files(max_age_seconds=0, max_files=0, max_total_bytes=0)
            notify_user("CLIP", "Geçici video dosyaları temizlendi.")

        def on_toggle_autostart(icon, item):
            currently_enabled = is_autostart_enabled()
            set_autostart(not currently_enabled)
            try:
                icon.update_menu()
            except Exception:
                pass
            if not currently_enabled:
                notify_user("CLIP", "Bilgisayar açıldığında otomatik başlama aktif edildi.")
            else:
                notify_user("CLIP", "Otomatik başlama kapatıldı.")

        def on_exit(icon, item):
            icon.stop()
            try:
                server.shutdown()
            except Exception:
                pass
            os._exit(0)

        def get_status_title(item):
            return "⚡ Durum: Aktif (Açık — Kapatmak için tıkla)" if IS_ACTIVE else "⏸️ Durum: Kapalı (Açmak için tıkla)"

        menu = pystray.Menu(
            pystray.MenuItem(get_status_title, toggle_active_state, default=True),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("📁 Klipler Klasörünü Aç (Temp)", on_open_folder),
            pystray.MenuItem("🚀 Bilgisayarla Birlikte Başlat", on_toggle_autostart, checked=lambda item: is_autostart_enabled()),
            pystray.MenuItem("🧹 Geçici Hafızayı Temizle", on_clean),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("❌ Çıkış", on_exit)
        )

        TRAY_ICON = pystray.Icon("CLIP", current_img, "CLIP — Aktif (Açık)" if IS_ACTIVE else "CLIP — Kapalı", menu)
        return TRAY_ICON
    except Exception as e:
        print(f"Tray setup notice: {e}")
        return None

def main():
    if is_port_in_use(PORT):
        print(f"⚡ [CLIP] Port {PORT} zaten kullanımda. Servis sistem tepsisinde aktif!")
        try:
            user32 = ctypes.windll.user32
            user32.MessageBoxW(0, "CLIP zaten ekranın sağ altındaki Sistem Tepsisinde (System Tray) çalışıyor!", "CLIP", 0x40)
        except Exception:
            pass
        return

    cleanup_temp_files()
    cleaner_thread = threading.Thread(target=periodic_cleanup_loop, daemon=True)
    cleaner_thread.start()

    http.server.HTTPServer.allow_reuse_address = True
    server = http.server.HTTPServer(("127.0.0.1", PORT), ClipHTTPHandler)

    # Arka planda HTTP sunucusunu çalıştır
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    print("=" * 60)
    print("⚡ CLIP Helper — HD Video & Windows Panosu Servisi")
    print(f"🚀 Port: http://127.0.0.1:{PORT}")
    print(f"📂 Dizin: {CLIP_DIR}")
    print(f"🎞️ FFmpeg: {'Aktif (WhatsApp H.264 / AAC + faststart)' if FFMPEG_PATH else 'Pasif'}")
    print("🧹 Otomatik Temizleme: Aktif (Maks 5 klip / 120MB / 10 dk ömür)")
    print("=" * 60)

    tray = setup_tray(server)
    if tray:
        def on_tray_ready(icon):
            icon.visible = True
            try:
                icon.notify("CLIP Hazır! ⚡", "Sistem tepsisinde aktif. TikTok, Instagram ve X videoları tek tıkla panoya kopyalanabilir.")
            except Exception:
                pass

        # Sistem tepsisi döngüsünü ana iş parçacığında çalıştır
        try:
            tray.run(setup=on_tray_ready)
        except KeyboardInterrupt:
            tray.stop()
            server.shutdown()
    else:
        try:
            server_thread.join()
        except KeyboardInterrupt:
            server.shutdown()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        with open(os.path.join(current_dir, "error.log"), "w", encoding="utf-8") as f:
            import traceback
            traceback.print_exc(file=f)
