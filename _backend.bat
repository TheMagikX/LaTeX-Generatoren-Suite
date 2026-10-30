@echo off
title Generator-Suite Backend -- Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)
cd /d "%~dp0backend"
if defined BACKEND_PORT (set PORT=%BACKEND_PORT%) else (set PORT=9000)
if "%DEV_RELOAD%"=="1" (
    python -m uvicorn main:app --reload --host 127.0.0.1 --port %PORT%
) else (
    python -m uvicorn main:app --host 127.0.0.1 --port %PORT%
)
