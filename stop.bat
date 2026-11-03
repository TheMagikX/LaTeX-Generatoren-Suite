@echo off
chcp 65001 >nul
title LaTeX-Generatoren-Suite -- Beenden
cd /d "%~dp0"

echo.
echo ================================================================================
echo   LaTeX-Generatoren-Suite -- Container beenden
echo   Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)
echo ================================================================================
echo.

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 goto :no_docker

docker info >nul 2>nul
if %ERRORLEVEL% neq 0 goto :no_docker

echo Stoppe Container 'generator-suite'...
docker compose down
echo.
echo ================================================================================
echo   [OK] Die Generator-Suite wurde sauber beendet.
echo   Deine Presets und Vorlagen in 'user_data/' sind sicher gespeichert.
echo ================================================================================
echo.
echo Druecke eine beliebige Taste, um dieses Fenster zu schliessen...
pause >nul
exit /b 0

:no_docker
echo [HINWEIS] Es wurde keine aktive Docker-Instanz gefunden.
echo.
pause
exit /b 0