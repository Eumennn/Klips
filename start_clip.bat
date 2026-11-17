@echo off
setlocal
title CLIP
set "CURRENT_DIR=%~dp0"
set PYTHONDONTWRITEBYTECODE=1
if exist "%CURRENT_DIR%__pycache__" rd /s /q "%CURRENT_DIR%__pycache__"

set "PYTHONW_EXE=pythonw"
if exist "C:\Users\pc\AppData\Local\Programs\Python\Python312\pythonw.exe" (
    set "PYTHONW_EXE=C:\Users\pc\AppData\Local\Programs\Python\Python312\pythonw.exe"
)

start "" "%PYTHONW_EXE%" -u -B "%CURRENT_DIR%clip_helper.py"
exit
