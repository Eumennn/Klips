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
import platform

IS_WINDOWS = sys.platform.startswith("win")
IS_MAC = sys.platform == "darwin"
IS_LINUX = sys.platform.startswith("linux")

# Suppress console window flashes for all subprocess calls on Windows
CREATE_NO_WINDOW = 0x08000000 if IS_WINDOWS else 0
_SUBPROCESS_FLAGS = {"creationflags": CREATE_NO_WINDOW} if IS_WINDOWS else {}

if IS_WINDOWS:
    try:
        import winreg
        import ctypes
        from ctypes import wintypes
    except ImportError:
        winreg = None
        ctypes = None
        wintypes = None
else:
    winreg = None
    ctypes = None
    wintypes = None

# Auto-install any missing core dependencies on first launch (Windows only; macOS handled by launcher)
def ensure_core_packages():
    if IS_WINDOWS:
        missing = []
        try:
            import yt_dlp
        except ImportError:
            missing.append("yt-dlp")
        try:
            import imageio_ffmpeg
        except ImportError:
            missing.append("imageio-ffmpeg")
        try:
            import PIL
        except ImportError:
            missing.append("Pillow")
        try:
            import pystray
        except ImportError:
            missing.append("pystray")

        if missing:
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", *missing, "--quiet", "--no-warn-script-location"], check=False, **_SUBPROCESS_FLAGS)
            except Exception:
                pass

ensure_core_packages()

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
            if os.path.isfile(fpath) and f.endswith((".mp4", ".mkv", ".webm", ".mp3", ".m4a", ".part", ".tmp")):
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

# Locate FFmpeg for WhatsApp/Discord compatible H.264/AAC faststart merging and MP3 conversion
FFMPEG_PATH = None
try:
    import imageio_ffmpeg
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"🎬 [CLIP] FFmpeg detected: {FFMPEG_PATH}")
except Exception:
    FFMPEG_PATH = None

if not FFMPEG_PATH:
    which_ffmpeg = shutil.which("ffmpeg")
    if which_ffmpeg:
        FFMPEG_PATH = which_ffmpeg
        print(f"🎬 [CLIP] FFmpeg detected (PATH): {FFMPEG_PATH}")

if not FFMPEG_PATH:
    fallback_paths = [
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
        os.path.expanduser("~/homebrew/bin/ffmpeg"),
        os.path.expanduser("~/.local/bin/ffmpeg"),
        os.path.join(current_dir, "ffmpeg"),
        r"C:\Users\pc\AppData\Local\Programs\Python\Python312\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe",
        r"C:\Users\pc\miniconda3\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe",
    ]
    for p in fallback_paths:
        if os.path.exists(p):
            FFMPEG_PATH = p
            print(f"🎬 [CLIP] FFmpeg detected (fallback): {FFMPEG_PATH}")
            break

if not FFMPEG_PATH:
    # Scan Python environment site-packages for bundled imageio-ffmpeg binaries
    try:
        import site
        sp_dirs = site.getsitepackages() if hasattr(site, "getsitepackages") else []
        if hasattr(site, "getusersitepackages"):
            sp_dirs.append(site.getusersitepackages())
        for sp in sp_dirs:
            bin_dir = os.path.join(sp, "imageio_ffmpeg", "binaries")
            if os.path.isdir(bin_dir):
                for f in os.listdir(bin_dir):
                    if f.startswith("ffmpeg"):
                        cand = os.path.join(bin_dir, f)
                        if os.path.isfile(cand) and (cand.endswith(".exe") or os.access(cand, os.X_OK)):
                            FFMPEG_PATH = cand
                            print(f"🎬 [CLIP] FFmpeg detected (site-packages scan): {FFMPEG_PATH}")
                            break
            if FFMPEG_PATH:
                break
    except Exception:
        pass

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
        if os.path.exists(icon_path):
            IMG_ACTIVE = Image.open(icon_path).convert("RGBA")
            r, g, b, a = IMG_ACTIVE.split()
            gray = ImageOps.grayscale(IMG_ACTIVE.convert("RGB"))
            dim_a = a.point(lambda p: int(p * 0.75))
            IMG_INACTIVE = Image.merge("RGBA", (gray, gray, gray, dim_a))
    except Exception as e:
        print(f"Icon generation error: {e}")

    # Fallback to programmatic icon if file load fails
    if IMG_ACTIVE is None:
        try:
            from PIL import Image
            IMG_ACTIVE = Image.new("RGBA", (32, 32), (168, 85, 247, 255))
            IMG_INACTIVE = Image.new("RGBA", (32, 32), (100, 100, 100, 200))
        except Exception:
            pass

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
    if IS_MAC:
        try:
            ct = title.replace('\\', '\\\\').replace('"', '\\"')
            cm = message.replace('\\', '\\\\').replace('"', '\\"')
            subprocess.run(["osascript", "-e", f'display notification "{cm}" with title "{ct}"'], capture_output=True, timeout=3)
            return
        except Exception:
            pass
    if TRAY_ICON and hasattr(TRAY_ICON, "notify"):
        try:
            TRAY_ICON.notify(title=title, message=message)
        except Exception:
            pass

RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
APP_NAME = "CLIP_Companion"
LAUNCH_AGENT_DIR = os.path.expanduser("~/Library/LaunchAgents")
LAUNCH_AGENT_PLIST = os.path.join(LAUNCH_AGENT_DIR, "com.clip.helper.plist")

def is_autostart_enabled():
    if IS_WINDOWS and winreg:
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_READ) as key:
                val, _ = winreg.QueryValueEx(key, APP_NAME)
                return bool(val)
        except Exception:
            return False
    elif IS_MAC:
        return os.path.exists(LAUNCH_AGENT_PLIST)
    return False

def set_autostart(enable=True):
    if IS_WINDOWS and winreg:
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
    elif IS_MAC:
        try:
            if enable:
                os.makedirs(LAUNCH_AGENT_DIR, exist_ok=True)
                script_path = os.path.abspath(__file__)
                working_dir = os.path.dirname(script_path)
                venv_python = os.path.join(working_dir, ".venv", "bin", "python")
                python_bin = venv_python if os.path.exists(venv_python) else sys.executable
                log_file = os.path.join(working_dir, "clip_helper.log")
                plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.clip.helper</string>
    <key>WorkingDirectory</key>
    <string>{working_dir}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{python_bin}</string>
        <string>-u</string>
        <string>-B</string>
        <string>{script_path}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{log_file}</string>
    <key>StandardErrorPath</key>
    <string>{log_file}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>"""
                with open(LAUNCH_AGENT_PLIST, "w", encoding="utf-8") as f:
                    f.write(plist_content)
                subprocess.run(["launchctl", "unload", LAUNCH_AGENT_PLIST], capture_output=True)
                subprocess.run(["launchctl", "load", LAUNCH_AGENT_PLIST], capture_output=True)
            else:
                if os.path.exists(LAUNCH_AGENT_PLIST):
                    subprocess.run(["launchctl", "unload", LAUNCH_AGENT_PLIST], capture_output=True)
                    os.remove(LAUNCH_AGENT_PLIST)
            return True
        except Exception as e:
            print(f"Autostart error: {e}")
            return False
    return False

if IS_WINDOWS and ctypes:
    class DROPFILES(ctypes.Structure):
        _fields_ = [
            ("pFiles", wintypes.DWORD),
            ("pt", wintypes.POINT),
            ("fNC", wintypes.BOOL),
            ("fWide", wintypes.BOOL),
        ]
else:
    DROPFILES = None

def copy_file_to_windows_clipboard(file_path):
    """Copies the file to Windows Clipboard using CF_HDROP (native Ctrl+V file paste)"""
    if not (IS_WINDOWS and ctypes and DROPFILES):
        return False

    abs_path = os.path.abspath(file_path)
    if not os.path.exists(abs_path):
        print(f"⚠️ [CLIP] Cannot copy to clipboard, file does not exist: {abs_path}")
        return False

    try:
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
        is_audio = abs_path.lower().endswith((".mp3", ".m4a", ".wav", ".aac"))
        title = "CLIP — Ses Panoda! 🎵" if is_audio else "CLIP — Video Panoda! 📋"
        notify_user(title, "WhatsApp veya Discord'a doğrudan Ctrl+V yapabilirsiniz.")
        try:
            cleanup_temp_files()
        except Exception:
            pass
        return True
    except Exception as e:
        print(f"⚠️ [CLIP] Windows clipboard copy failed: {e}")
        return False

def copy_file_to_macos_clipboard(file_path):
    """
    Copies the video file to macOS Clipboard (Pasteboard) so user can press Cmd+V in WhatsApp, Discord, Finder, etc.
    1. Native Cocoa via macOS JavaScript for Automation (JXA via osascript)
       - Built-in on 100% of macOS systems (zero extra pip packages or Xcode required).
       - Writes BOTH NSURL (public.file-url) AND NSFilenamesPboardType for universal app compatibility.
    2. Native Cocoa via PyObjC AppKit (if installed)
    3. Swift Cocoa one-liner (/usr/bin/swift)
    4. AppleScript Finder fallback
    """
    abs_path = os.path.abspath(file_path)
    if not os.path.exists(abs_path):
        print(f"⚠️ [CLIP] Cannot copy to clipboard, file does not exist: {abs_path}")
        return False

    # Method 1: macOS JavaScript for Automation (JXA via osascript) - Instant, native Cocoa
    try:
        escaped_jxa = abs_path.replace('\\', '\\\\').replace('"', '\\"')
        jxa_script = (
            'ObjC.import("AppKit");'
            'var pb = $.NSPasteboard.generalPasteboard;'
            'pb.clearContents;'
            f'var pathStr = $(" {escaped_jxa} ".trim());'
            'var url = $.NSURL.fileURLWithPath(pathStr);'
            'pb.writeObjects($.NSArray.arrayWithObject(url));'
            'pb.setPropertyListForType($.NSArray.arrayWithObject(pathStr), "NSFilenamesPboardType");'
        )
        res = subprocess.run(["osascript", "-l", "JavaScript", "-e", jxa_script], capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            print(f"📋 [CLIP] Copied to macOS Clipboard (Native Cocoa JXA): {abs_path}")
            is_audio = abs_path.lower().endswith((".mp3", ".m4a", ".wav", ".aac"))
            title = "CLIP — Ses Panoda! 🎵" if is_audio else "CLIP — Video Panoda! 📋"
            notify_user(title, "WhatsApp veya Discord'a doğrudan ⌘V yapabilirsiniz.")
            cleanup_temp_files()
            return True
        else:
            print(f"⚠️ [CLIP] JXA copy notice: {res.stderr.strip()}")
    except Exception as e:
        print(f"⚠️ [CLIP] JXA copy error: {e}")

    # Method 2: PyObjC / AppKit
    try:
        from AppKit import NSPasteboard, NSArray, NSURL
        pb = NSPasteboard.generalPasteboard()
        pb.clearContents()
        url = NSURL.fileURLWithPath_(abs_path)
        pb.writeObjects_(NSArray.arrayWithObject_(url))
        pb.setPropertyList_forType_(NSArray.arrayWithObject_(abs_path), "NSFilenamesPboardType")
        print(f"📋 [CLIP] Copied to macOS Clipboard (PyObjC AppKit): {abs_path}")
        notify_user("CLIP — Video Panoda! 📋", "WhatsApp veya Discord'a doğrudan ⌘V yapabilirsiniz.")
        cleanup_temp_files()
        return True
    except Exception:
        pass

    # Method 3: Swift Cocoa one-liner (uses built-in /usr/bin/swift on macOS)
    if shutil.which("swift"):
        try:
            escaped_swift = abs_path.replace('\\', '\\\\').replace('"', '\\"')
            swift_cmd = (
                f'import Cocoa; let pb = NSPasteboard.general; pb.clearContents(); '
                f'let u = NSURL(fileURLWithPath: "{escaped_swift}"); '
                f'pb.writeObjects([u]); '
                f'pb.setPropertyList(["{escaped_swift}"], forType: .init("NSFilenamesPboardType"))'
            )
            res = subprocess.run(["swift", "-e", swift_cmd], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                print(f"📋 [CLIP] Copied to macOS Clipboard (Swift bridge): {abs_path}")
                notify_user("CLIP — Video Panoda! 📋", "WhatsApp veya Discord'a doğrudan ⌘V yapabilirsiniz.")
                cleanup_temp_files()
                return True
        except Exception:
            pass

    # Method 4: Finder fallback
    try:
        escaped_as = abs_path.replace('\\', '\\\\').replace('"', '\\"')
        res = subprocess.run(
            ["osascript", "-e", f'tell application "Finder" to set the clipboard to (POSIX file "{escaped_as}")'],
            capture_output=True, text=True, timeout=5
        )
        if res.returncode == 0:
            print(f"📋 [CLIP] Copied to macOS Clipboard (Finder): {abs_path}")
            notify_user("CLIP — Video Panoda! 📋", "WhatsApp veya Discord'a doğrudan ⌘V yapabilirsiniz.")
            cleanup_temp_files()
            return True
    except Exception as e:
        print(f"⚠️ [CLIP] macOS clipboard copy error: {e}")

    return False

def copy_file_to_clipboard(file_path):
    if IS_WINDOWS:
        return copy_file_to_windows_clipboard(file_path)
    elif IS_MAC:
        return copy_file_to_macos_clipboard(file_path)
    else:
        return False

def open_folder_native(path):
    try:
        if IS_WINDOWS:
            os.startfile(path)
        elif IS_MAC:
            subprocess.Popen(["open", path])
        else:
            subprocess.Popen(["xdg-open", path])
        return True
    except Exception as e:
        print(f"Error opening folder: {e}")
        return False

def open_file_native(path):
    abs_path = os.path.abspath(path)
    try:
        if IS_WINDOWS:
            subprocess.Popen(f'explorer.exe /select,"{abs_path}"')
        elif IS_MAC:
            subprocess.Popen(["open", "-R", abs_path])
        else:
            subprocess.Popen(["xdg-open", os.path.dirname(abs_path)])
        return True
    except Exception as e:
        print(f"Error opening file: {e}")
        return False

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

def ensure_whatsapp_compatible(file_path, skip_if_compliant=False):
    """
    Ensures video is 100% compatible with WhatsApp Web / Desktop on Windows:
    - Codec: H.264 (avc1)
    - Audio: AAC (mp4a) — If video has no audio (e.g. muted Instagram Reel), adds a silent stereo track
    - Pixel format: yuv420p with even dimensions (width/height divisible by 2)
    - moov atom at start: +faststart (0.1s instant load in WhatsApp Ctrl+V)

    skip_if_compliant=True: returns file_path as-is when already fully H.264+AAC+yuv420p MP4
    (use when yt-dlp postprocessor already applied +faststart, skips the extra FFmpeg pass entirely)
    """
    if not file_path or not os.path.exists(file_path):
        return file_path

    # Audio files (MP3, M4A, etc.) are already audio-compliant, return as-is
    if file_path.lower().endswith((".mp3", ".m4a", ".wav", ".aac")):
        return file_path

    if not FFMPEG_PATH:
        return file_path

    try:
        probe = subprocess.run([FFMPEG_PATH, "-i", file_path], capture_output=True, text=True, errors="ignore", **_SUBPROCESS_FLAGS)
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
        is_mp4_container = file_path.lower().endswith(".mp4")

        base_dir, base_name = os.path.split(file_path)
        out_path = os.path.join(base_dir, f"wa_{base_name}")

        # If already fully compliant H.264 + AAC + yuv420p in MP4 container:
        if is_h264 and is_aac and is_yuv420p and is_mp4_container:
            if skip_if_compliant:
                # Caller guarantees faststart already applied (e.g. yt-dlp postprocessor)
                # Skip FFmpeg entirely — instant return
                return file_path
            # Stream-copy + faststart only (fast remux, no re-encode)
            cmd = [
                FFMPEG_PATH, "-y", "-i", file_path,
                "-c", "copy",
                "-movflags", "+faststart",
                out_path
            ]
        elif is_h264 and is_yuv420p and is_mp4_container and has_audio:
            # Video is already compliant H.264! Do NOT re-encode video! Just transcode audio to AAC (0.1s)!
            cmd = [
                FFMPEG_PATH, "-y", "-i", file_path,
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "128k",
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

        subprocess.run(cmd, capture_output=True, check=True, **_SUBPROCESS_FLAGS)
        if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            try:
                os.remove(file_path)
            except Exception:
                pass
            return out_path
    except Exception as e:
        print(f"⚠️ [CLIP] FFmpeg faststart/remux pass failed: {e}")
        return file_path

    return file_path

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
                copy_file_to_clipboard(final_file)
                print(f"⚡ [CLIP] Direct stream downloaded & copied: {final_file} ({os.path.getsize(final_file)} bytes)")
                return {"path": final_file}
            else:
                print("⚠️ [CLIP] Direct stream validation failed (corrupt or audio-only).")
    except Exception as e:
        print(f"⚠️ [CLIP] Direct stream download failed: {e}")
    return None

def download_twitter_fallback(url):
    """
    Robust fallback for Twitter (X) videos.
    Extracts tweet ID and queries:
    1. Official Twitter Syndication API (cdn.syndication.twimg.com)
    2. FixTweet / FxTwitter API (api.fxtwitter.com)
    """
    try:
        match = re.search(r'status/(\d+)', url)
        if not match:
            return None
        tweet_id = match.group(1)

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "*/*"
        }

        def get_resolution(u):
            m = re.search(r'(\d+)x(\d+)', u)
            return int(m.group(1)) * int(m.group(2)) if m else 0

        # 1. Primary: Official Twitter Syndication API
        try:
            syn_url = f"https://cdn.syndication.twimg.com/tweet-result?id={tweet_id}&token=1"
            req = urllib.request.Request(syn_url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode())
                variants = data.get("video", {}).get("variants", [])
                if not variants and data.get("mediaDetails"):
                    for m in data["mediaDetails"]:
                        if m.get("video_info", {}).get("variants"):
                            variants.extend(m["video_info"]["variants"])
                mp4s = []
                for v in variants:
                    v_url = v.get("src") or v.get("url")
                    if v_url and ".mp4" in v_url and not any(k in v_url for k in ["init", "frag", ".m4s"]):
                        mp4s.append(v_url)
                if mp4s:
                    best_url = max(mp4s, key=get_resolution)
                    print(f"⚡ [CLIP] Twitter Syndication API resolved MP4: {best_url[:60]}...")
                    res = download_direct_stream(best_url, "twitter")
                    if res:
                        return res
        except Exception as e:
            print(f"⚠️ [CLIP] Twitter Syndication attempt: {e}")

        # 2. Secondary: FxTwitter API
        try:
            fx_url = f"https://api.fxtwitter.com/x/status/{tweet_id}"
            req = urllib.request.Request(fx_url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode())
                videos = data.get("tweet", {}).get("media", {}).get("videos", [])
                if not videos:
                    all_media = data.get("tweet", {}).get("media", {}).get("all", [])
                    videos = [m for m in all_media if m.get("type") == "video"]
                mp4s = []
                for v in videos:
                    variants = v.get("variants", []) or v.get("formats", [])
                    for var in variants:
                        var_url = var.get("url") or var.get("src")
                        if var_url and ".mp4" in var_url and not any(k in var_url for k in ["init", "frag", ".m4s"]):
                            mp4s.append(var_url)
                    if v.get("url") and ".mp4" in v["url"] and not any(k in v["url"] for k in ["init", "frag", ".m4s"]):
                        mp4s.append(v["url"])
                if mp4s:
                    best_url = max(mp4s, key=get_resolution)
                    print(f"⚡ [CLIP] FxTwitter API resolved MP4: {best_url[:60]}...")
                    res = download_direct_stream(best_url, "twitter")
                    if res:
                        return res
        except Exception as e:
            print(f"⚠️ [CLIP] FxTwitter attempt: {e}")

    except Exception as e:
        print(f"⚠️ [CLIP] Twitter fallback error: {e}")
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

def get_ytdlp_cmd():
    # 1. Local standalone binary in script directory
    local_ytdlp = os.path.join(current_dir, "yt-dlp")
    if os.path.exists(local_ytdlp) and os.access(local_ytdlp, os.X_OK):
        return [local_ytdlp]

    # 2. Python module yt_dlp
    try:
        import yt_dlp
        return [sys.executable, "-m", "yt_dlp"]
    except ImportError:
        pass

    # 3. System yt-dlp binary in PATH
    which_ytdlp = shutil.which("yt-dlp")
    if which_ytdlp:
        return [which_ytdlp]

    # 4. Common macOS paths
    for p in [
        "/opt/homebrew/bin/yt-dlp",
        "/usr/local/bin/yt-dlp",
        os.path.expanduser("~/bin/yt-dlp"),
        os.path.expanduser("~/.local/bin/yt-dlp")
    ]:
        if os.path.exists(p) and os.access(p, os.X_OK):
            return [p]

    return [sys.executable, "-m", "yt_dlp"]

def download_video_ytdlp(url, is_pro=True, dom_src=None, start_time=None, end_time=None, media_format="mp4"):
    req_start_ts = time.time()
    clean_url = (url or "").strip()
    is_mp3 = (str(media_format).lower() == "mp3")
    if is_mp3:
        dom_src = None  # Strictly ignore DOM video streams when MP3 audio is requested
    print(f"⚡ [CLIP] Processing video: {clean_url} (format: {media_format}, dom_src: {bool(dom_src)}, range: {start_time}-{end_time})")

    start_sec = parse_time_sec(start_time)
    end_sec = parse_time_sec(end_time)
    has_time_range = start_sec is not None and end_sec is not None and end_sec > start_sec

    is_twitter = ("twitter.com" in clean_url or "x.com" in clean_url)
    is_instagram = "instagram.com" in clean_url

    # 1. Direct stream provided (ONLY for non-Twitter and valid progressive MP4s, and NOT when MP3 is requested)
    # Twitter streams in browser are always .m4s fragments and Instagram has audio-only streams
    if not is_mp3 and not is_twitter and not is_instagram and dom_src and is_valid_progressive_video_url(dom_src) and not has_time_range:
        print("⚡ [CLIP] Direct progressive HTTP stream provided, downloading directly...")
        res = download_direct_stream(dom_src, "direct_video")
        if res:
            return res

    # 1b. Instagram DM direct stream support:
    # In Instagram DM (/direct/) or when clean_url is a direct video/CDN stream
    has_ig_shortcode = bool(re.search(r'instagram\.com/(?:reel|reels|p|tv)/([A-Za-z0-9_-]{9,15})', clean_url))
    if not is_mp3 and any(k in clean_url.lower() for k in ["cdninstagram.com", "fbcdn.net"]) and is_valid_progressive_video_url(clean_url):
        print("⚡ [CLIP] Instagram direct CDN URL detected, downloading directly...")
        res = download_direct_stream(clean_url, "instagram_dm")
        if res:
            return res

    if not is_mp3 and is_instagram and not has_time_range and dom_src and is_valid_progressive_video_url(dom_src):
        print("⚡ [CLIP] Instagram progressive CDN stream detected, downloading directly...")
        res = download_direct_stream(dom_src, "instagram")
        if res:
            return res

    # 2. TikTok specific optimizations: try TikWM first for watermark-free MP4
    if not is_mp3 and "tiktok.com" in clean_url and not has_time_range:
        if "/video/" in clean_url:
            tikwm_res = download_tiktok_tikwm(clean_url)
            if tikwm_res:
                return tikwm_res

    # 3. If it's a generic feed URL without ID and no direct stream
    has_ig_shortcode = bool(re.search(r'instagram\.com/(?:reel|reels|p|tv)/([A-Za-z0-9_-]{9,15})', clean_url))
    has_yt_id = bool(re.search(r'(?:shorts/|v=|youtu\.be/)([a-zA-Z0-9_-]{11})', clean_url))
    has_tw_id = bool(re.search(r'status/(\d+)', clean_url))
    is_generic_feed = (
        (is_twitter and not has_tw_id) or
        ("tiktok.com" in clean_url and not "/video/" in clean_url and not "/messages" in clean_url and (not dom_src or not is_valid_progressive_video_url(dom_src))) or
        ("instagram.com" in clean_url and not has_ig_shortcode and not "/direct/" in clean_url and (not dom_src or not is_valid_progressive_video_url(dom_src))) or
        (("youtube.com" in clean_url or "youtu.be" in clean_url) and not has_yt_id) or
        ((clean_url.rstrip("/").endswith("tiktok.com") or clean_url.rstrip("/").endswith("instagram.com") or clean_url.rstrip("/").endswith("youtube.com")) and (not dom_src or not is_valid_progressive_video_url(dom_src)))
    )
    if is_generic_feed and (not dom_src or dom_src.startswith("blob:")):
        return {"error": "feed_url", "message": "Tweet veya video bağlantısı tespit edilemedi. Lütfen tweet'i açıp tekrar deneyin."}

    out_template = os.path.join(CLIP_DIR, "%(id)s_%(epoch)s.%(ext)s")

    if is_mp3:
        cmd = get_ytdlp_cmd() + [
            "--paths", CLIP_DIR,
            "--paths", f"temp:{CLIP_DIR}",
            "--no-playlist",
            "--force-overwrites",
            "--extractor-args", "youtube:player_client=android,web",
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "-o", out_template,
            "--print", "after_move:filepath",
        ]
    else:
        # Format: prefer AVC H.264 + AAC 1080p, with fast fallback to 1080p best
        video_format = "bestvideo[vcodec^=avc][height<=1080]+bestaudio[acodec^=mp4a]/bestvideo[height<=1080]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[ext=mp4][height<=1080]/best"
        cmd = get_ytdlp_cmd() + [
            "--paths", CLIP_DIR,
            "--paths", f"temp:{CLIP_DIR}",
            "--no-playlist",
            "--force-overwrites",
            "--extractor-args", "youtube:player_client=android,web",
            "--concurrent-fragments", "5",
            "-f", video_format,
            "--merge-output-format", "mp4",
            "-o", out_template,
            "--print", "after_move:filepath",
        ]

    # Enable Node.js runtime for solving YouTube JS challenges if installed
    if shutil.which("node"):
        cmd.extend(["--js-runtimes", "node"])

    # Enforce section limits if user specifically trimmed (fast stream cut without forced re-encode)
    if has_time_range:
        section_str = f"*{int(start_sec)}-{int(end_sec)}"
        cmd.extend(["--download-sections", section_str])

    if FFMPEG_PATH:
        cmd.extend(["--ffmpeg-location", FFMPEG_PATH])
        if not is_mp3:
            cmd.extend(["--postprocessor-args", "ffmpeg:-movflags +faststart"])

    cmd.append(clean_url)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, **_SUBPROCESS_FLAGS)
        out_path = result.stdout.strip().splitlines()[-1] if result.stdout and result.stdout.strip() else None
        if out_path and os.path.exists(out_path):
            if is_mp3:
                if not out_path.lower().endswith(".mp3"):
                    base_no_ext = os.path.splitext(out_path)[0]
                    if os.path.exists(base_no_ext + ".mp3"):
                        out_path = base_no_ext + ".mp3"
                copy_file_to_clipboard(out_path)
                return {"path": out_path}
            final_file = ensure_whatsapp_compatible(out_path, skip_if_compliant=True)
            if final_file and os.path.exists(final_file):
                copy_file_to_clipboard(final_file)
                return {"path": final_file}
    except Exception as e:
        err_msg = getattr(e, "stderr", "") or str(e)
        print(f"⚠️ [CLIP] Error during yt-dlp execution:\n{err_msg}")

        # Fallback for Twitter (X): Syndication & FxTwitter APIs
        if is_twitter and not is_mp3:
            tw_res = download_twitter_fallback(clean_url)
            if tw_res:
                return tw_res

        # Fallback for TikTok: TikWM API
        if not is_mp3 and "tiktok.com" in clean_url and "/video/" in clean_url:
            tikwm_res = download_tiktok_tikwm(clean_url)
            if tikwm_res:
                return tikwm_res

        # Fallback for Instagram (e.g. DM / private reel): try direct stream if available
        if not is_mp3 and is_instagram and dom_src and is_valid_progressive_video_url(dom_src):
            print("⚡ [CLIP] yt-dlp failed on Instagram, attempting direct stream fallback...")
            direct_res = download_direct_stream(dom_src, "instagram_dm")
            if direct_res:
                return direct_res

        # Fallback for TikTok DM direct stream if yt-dlp and TikWM fail
        if not is_mp3 and "tiktok.com" in clean_url and dom_src and is_valid_progressive_video_url(dom_src):
            print("⚡ [CLIP] TikTok direct stream fallback...")
            direct_res = download_direct_stream(dom_src, "tiktok_dm")
            if direct_res:
                return direct_res

    # For MP3 requests: strictly search for audio files created during this request
    if is_mp3:
        audio_files = [
            os.path.join(CLIP_DIR, f) for f in os.listdir(CLIP_DIR)
            if f.lower().endswith((".mp3", ".m4a", ".aac", ".opus", ".ogg", ".wav", ".weba"))
            and os.path.getmtime(os.path.join(CLIP_DIR, f)) >= req_start_ts - 0.5
        ]
        if audio_files:
            mp3_matches = [f for f in audio_files if f.lower().endswith(".mp3")]
            latest_audio = max(mp3_matches, key=os.path.getmtime) if mp3_matches else max(audio_files, key=os.path.getmtime)
            if not latest_audio.lower().endswith(".mp3") and FFMPEG_PATH:
                target_mp3 = os.path.splitext(latest_audio)[0] + ".mp3"
                try:
                    subprocess.run(
                        [FFMPEG_PATH, "-y", "-i", latest_audio, "-vn", "-c:a", "libmp3lame", "-q:a", "0", target_mp3],
                        check=True, capture_output=True, **_SUBPROCESS_FLAGS
                    )
                    if os.path.exists(target_mp3):
                        latest_audio = target_mp3
                except Exception as fe:
                    print(f"⚠️ [CLIP] FFmpeg transcode to mp3 error: {fe}")
            if os.path.exists(latest_audio):
                copy_file_to_clipboard(latest_audio)
                return {"path": latest_audio}
        return None

    # Search strictly for video files created in CLIP_DIR during this specific request
    new_files = [
        os.path.join(CLIP_DIR, f) for f in os.listdir(CLIP_DIR)
        if f.lower().endswith((".mp4", ".mkv", ".webm")) and os.path.getmtime(os.path.join(CLIP_DIR, f)) >= req_start_ts - 0.5
    ]
    if new_files:
        latest = max(new_files, key=os.path.getmtime)
        final_file = ensure_whatsapp_compatible(latest, skip_if_compliant=True)
        if final_file and os.path.exists(final_file):
            copy_file_to_clipboard(final_file)
            return {"path": final_file}

    # Final attempt for Twitter if yt-dlp didn't throw but created nothing
    if is_twitter and not is_mp3:
        tw_res = download_twitter_fallback(clean_url)
        if tw_res:
            return tw_res

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
                "version": "2.1.3",
                "platform": "darwin" if IS_MAC else ("windows" if IS_WINDOWS else "linux"),
                "has_ffmpeg": bool(FFMPEG_PATH),
                "clip_dir": CLIP_DIR
            }).encode())
            return

        if parsed.path == "/open_folder":
            ok = open_folder_native(CLIP_DIR)
            self.send_response(200 if ok else 500)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": ok}).encode())
            return

        if parsed.path == "/open_wizard":
            try:
                subprocess.Popen([sys.executable, os.path.join(current_dir, "setup_wizard.py")])
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
                ok = open_file_native(path)
                self.send_response(200 if ok else 500)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": ok}).encode())
            else:
                self.send_response(404)
                self.send_cors_headers()
                self.end_headers()
            return

        if parsed.path == "/copy":
            query = urllib.parse.parse_qs(parsed.query)
            path = query.get("path", [None])[0]
            if path and os.path.exists(path):
                ok = copy_file_to_clipboard(path)
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
            media_format = query.get("format", ["mp4"])[0].lower()

            if not url and not dom_src:
                self.send_response(400)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(b'{"error": "No URL or stream provided"}')
                return

            res = download_video_ytdlp(url or dom_src, is_pro=True, dom_src=dom_src, start_time=start_time, end_time=end_time, media_format=media_format)

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
                self.wfile.write(json.dumps({"success": False, "error": "Video veya ses indirilemedi."}).encode())
            return

        if parsed.path.startswith("/video/"):
            fname = urllib.parse.unquote(parsed.path[7:])
            fpath = os.path.join(CLIP_DIR, fname)
            if os.path.exists(fpath):
                size = os.path.getsize(fpath)
                self.send_response(200)
                self.send_cors_headers()
                content_type = "audio/mpeg" if fname.lower().endswith(".mp3") else "video/mp4"
                self.send_header("Content-Type", content_type)
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
    # On macOS, pystray initializes an AppKit NSApplication run loop that aborts (SIGABRT)
    # when executed from a detached background daemon (nohup). macOS uses a silent background service.
    if not IS_WINDOWS:
        return None

    try:
        import pystray
        act_img, inact_img = get_tray_images()
        if not act_img:
            return None

        current_img = act_img if IS_ACTIVE else inact_img

        def on_open_folder(icon, item):
            open_folder_native(CLIP_DIR)

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

        def on_open_setup(icon, item):
            try:
                setup_script = os.path.join(current_dir, "setup_wizard.py")
                if os.path.exists(setup_script):
                    subprocess.Popen([sys.executable, setup_script])
            except Exception:
                pass

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
            pystray.MenuItem("⚙️ Kurulum Sihirbazı & Ayarlar", on_open_setup),
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

def free_port_if_needed(port):
    if not is_port_in_use(port):
        return
    cur_pid = os.getpid()
    if IS_WINDOWS:
        try:
            # Use netstat directly without shell=True to avoid cmd.exe flash
            out = subprocess.check_output(
                ["netstat", "-ano"],
                text=True, stderr=subprocess.DEVNULL,
                **_SUBPROCESS_FLAGS
            )
            for line in out.strip().splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and "LISTENING" in parts and f":{port}" in parts[1]:
                    pid = int(parts[-1])
                    if pid != cur_pid:
                        try:
                            subprocess.run(
                                ["taskkill", "/F", "/PID", str(pid)],
                                capture_output=True, **_SUBPROCESS_FLAGS
                            )
                            time.sleep(0.4)
                        except Exception:
                            pass
        except Exception:
            pass
    else:
        try:
            out = subprocess.check_output(f"lsof -ti :{port}", shell=True, text=True, stderr=subprocess.DEVNULL)
            for line in out.strip().splitlines():
                if line.strip():
                    pid = int(line.strip())
                    if pid != cur_pid:
                        try:
                            os.kill(pid, 9)
                        except Exception:
                            pass
            time.sleep(0.4)
        except Exception:
            pass

def main():
    free_port_if_needed(PORT)
    if is_port_in_use(PORT):
        print(f"⚡ [CLIP] Port {PORT} kullanımda.")
        return

    cleanup_temp_files()
    cleaner_thread = threading.Thread(target=periodic_cleanup_loop, daemon=True)
    cleaner_thread.start()

    from http.server import ThreadingHTTPServer
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("127.0.0.1", PORT), ClipHTTPHandler)
    server.daemon_threads = True

    # Arka planda HTTP sunucusunu çalıştır (ana servis)
    server_thread = threading.Thread(target=server.serve_forever, daemon=False)
    server_thread.start()

    print("=" * 60)
    print("⚡ CLIP Helper — HD Video & Panoya Kopyalama Servisi")
    print(f"💻 Sistem: {platform.system()} ({platform.release()})")
    print(f"🚀 Port: http://127.0.0.1:{PORT}")
    print(f"📂 Dizin: {CLIP_DIR}")
    print(f"🎞️ FFmpeg: {'Aktif (H.264 / AAC + faststart)' if FFMPEG_PATH else 'Pasif'}")
    print("🧹 Otomatik Temizleme: Aktif (Maks 5 klip / 120MB / 10 dk ömür)")
    print("=" * 60)

    def on_tray_ready(icon):
        icon.visible = True
        try:
            icon.notify("CLIP Hazır! ⚡", "Sistem tepsisinde aktif. Videolar tek tıkla panoya kopyalanabilir.")
        except Exception:
            pass

    tray_started = False
    if IS_WINDOWS:
        try:
            tray = setup_tray(server)
            if tray:
                tray_started = True
                tray.run(setup=on_tray_ready)
        except KeyboardInterrupt:
            try:
                server.shutdown()
            except Exception:
                pass
            return
        except Exception as e:
            print(f"Tray notice: {e}")

    # Tray aktif değilse veya macOS üzerindeyse HTTP sunucusunun yaşamaya devam etmesini sağla
    if not tray_started:
        try:
            server_thread.join()
        except KeyboardInterrupt:
            try:
                server.shutdown()
            except Exception:
                pass

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        with open(os.path.join(current_dir, "error.log"), "w", encoding="utf-8") as f:
            import traceback
            traceback.print_exc(file=f)
