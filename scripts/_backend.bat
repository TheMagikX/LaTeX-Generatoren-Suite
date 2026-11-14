@echo off
title Generator-Suite Backend -- Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)
cd /d "%~dp0..\backend" || exit /b 1
if exist ".venv\Scripts\python.exe" (
    set "PY_EXE=.venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if errorlevel 1 (
        echo [FEHLER] Weder backend\.venv\Scripts\python.exe noch globales python im PATH gefunden.
        echo Bitte zuerst das Setup ausfuehren bzw. das virtuelle Environment anlegen.
        exit /b 1
    )
    echo [WARNUNG] backend\.venv\Scripts\python.exe nicht gefunden - nutze globales python.
    set "PY_EXE=python"
)
if defined BACKEND_PORT (set "PORT=%BACKEND_PORT%") else (set "PORT=9000")
if "%DEV_RELOAD%"=="1" (
    "%PY_EXE%" -m uvicorn main:app --reload --host 127.0.0.1 --port "%PORT%"
) else (
    "%PY_EXE%" -m uvicorn main:app --host 127.0.0.1 --port "%PORT%"
)
