@echo off
title CLIP Helper Service
echo ===================================================
echo [CLIP] Copy videos, not links.
echo Arka plan video ve Windows panosu servisi baslatiliyor...
echo ===================================================
set PYTHONDONTWRITEBYTECODE=1
if exist "%~dp0__pycache__" rd /s /q "%~dp0__pycache__"

set PYTHON_EXE=python
if exist "C:\Users\pc\AppData\Local\Programs\Python\Python312\python.exe" (
    set "PYTHON_EXE=C:\Users\pc\AppData\Local\Programs\Python\Python312\python.exe"
)

"%PYTHON_EXE%" -u -B "%~dp0clip_helper.py"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [HATA] CLIP Helper bir hata ile kapandi.
    pause
)
