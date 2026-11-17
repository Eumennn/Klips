@echo off
chcp 65001 >nul
setlocal
title CLIP — Kurulum Sihirbazı
set "CURRENT_DIR=%~dp0"
cd /d "%CURRENT_DIR%"

set PYTHONDONTWRITEBYTECODE=1
if exist "%CURRENT_DIR%__pycache__" rd /s /q "%CURRENT_DIR%__pycache__"

echo ============================================================
echo   CLIP — Evrensel Video Panosu Kurulum Sihirbazı
echo ============================================================
echo.

set "PYTHON_EXE="
where python >nul 2>&1
if %errorlevel% equ 0 set "PYTHON_EXE=python"

if "%PYTHON_EXE%"=="" (
    where py >nul 2>&1
    if %errorlevel% equ 0 set "PYTHON_EXE=py -3"
)

if "%PYTHON_EXE%"=="" (
    if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" (
        set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
    )
)

if "%PYTHON_EXE%"=="" (
    echo [HATA] Bilgisayarınızda Python bulunamadı!
    echo CLIP'in çalışabilmesi için Python 3.10 veya üzeri gereklidir.
    echo.
    echo Python indirme sayfası açılıyor...
    start https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Gerekli kütüphaneler kontrol ediliyor...
%PYTHON_EXE% -m pip install -r "%CURRENT_DIR%requirements.txt"

echo Kurulum sihirbazı başlatılıyor...
start "" %PYTHON_EXE% -u -B "%CURRENT_DIR%setup_wizard.py"
exit /b 0
