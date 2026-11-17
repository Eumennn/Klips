@echo off
setlocal
title CLIP
cd /d "%~dp0"
set "SCRIPT_PATH=%~dp0clip_helper.py"

set "PYTHON_EXE="
set "PYTHONW_EXE="

if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    set "PYTHONW_EXE=%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe"
)

if "%PYTHON_EXE%"=="" (
    where python >nul 2>&1
    if not errorlevel 1 set "PYTHON_EXE=python"
)

if "%PYTHONW_EXE%"=="" (
    where pythonw >nul 2>&1
    if not errorlevel 1 set "PYTHONW_EXE=pythonw"
)

if "%PYTHONW_EXE%"=="" set "PYTHONW_EXE=%PYTHON_EXE%"

if "%PYTHON_EXE%"=="" (
    echo [HATA] Python bulunamadi!
    start https://www.python.org/downloads/
    pause
    exit /b 1
)

"%PYTHON_EXE%" -c "import pystray, PIL, yt_dlp, imageio_ffmpeg" >nul 2>&1
if errorlevel 1 (
    echo Gerekli paketler yukleniyor...
    "%PYTHON_EXE%" -m pip install -r "%~dp0requirements.txt" --quiet --no-warn-script-location
)

"%PYTHON_EXE%" -c "import setup_wizard; setup_wizard.create_desktop_shortcut(); setup_wizard.set_autostart_reg(True)" >nul 2>&1

start "" "%PYTHONW_EXE%" -u -B "%SCRIPT_PATH%"
exit /b 0
