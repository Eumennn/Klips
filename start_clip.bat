@echo off
setlocal
title CLIP
set "CURRENT_DIR=%~dp0"
cd /d "%CURRENT_DIR%"
set PYTHONDONTWRITEBYTECODE=1
if exist "%CURRENT_DIR%__pycache__" rd /s /q "%CURRENT_DIR%__pycache__"

set "PYTHONW_EXE="
if exist "C:\Users\pc\AppData\Local\Programs\Python\Python312\pythonw.exe" (
    set "PYTHONW_EXE=C:\Users\pc\AppData\Local\Programs\Python\Python312\pythonw.exe"
)

if "%PYTHONW_EXE%"=="" (
    where pythonw >nul 2>&1
    if %errorlevel% equ 0 set "PYTHONW_EXE=pythonw"
)

if "%PYTHONW_EXE%"=="" (
    where python >nul 2>&1
    if %errorlevel% equ 0 set "PYTHONW_EXE=python"
)

if "%PYTHONW_EXE%"=="" (
    start "" "%CURRENT_DIR%KURULUM.bat"
    exit /b 1
)

start "" "%PYTHONW_EXE%" -u -B "%CURRENT_DIR%clip_helper.py"
exit /b 0
