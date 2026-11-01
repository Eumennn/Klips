@echo off
title CLIP Helper Service
echo ===================================================
echo [CLIP] Copy videos, not links.
echo Arka plan video ve Windows panosu servisi baslatiliyor...
echo ===================================================
set PYTHONDONTWRITEBYTECODE=1
if exist "%~dp0__pycache__" rd /s /q "%~dp0__pycache__"
python -u -B "%~dp0clip_helper.py"
pause
