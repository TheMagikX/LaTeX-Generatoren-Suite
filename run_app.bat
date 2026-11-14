@echo off
title Generator-Suite v5.1.4 -- Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)
:: Generator Suite Launcher - delegiert an scripts\start.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
    echo [FEHLER] Start fehlgeschlagen (Exit-Code %EXIT_CODE%).
    pause
)
exit /b %EXIT_CODE%
