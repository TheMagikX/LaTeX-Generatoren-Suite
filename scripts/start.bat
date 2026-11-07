@echo off
chcp 65001 >nul
title LaTeX-Generatoren-Suite -- Anwendungsstart
cd /d "%~dp0.."

echo.
echo ================================================================================
echo   LaTeX-Generatoren-Suite -- Anwendungsstart
echo   Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)
echo ================================================================================
echo.

:: 1. Pruefen, ob Docker ueberhaupt installiert ist
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 goto :check_native

:: 2. Pruefen, ob der Docker-Dienst laeuft
echo [1/2] Pruefe Docker-Umgebung...
docker info >nul 2>nul
if %ERRORLEVEL% equ 0 goto :start_container

:: Docker ist installiert, aber Dienst laeuft noch nicht
echo [INFO] Docker Desktop ist noch nicht vollstaendig hochgefahren.
echo        Versuche Docker Desktop automatisch zu starten...

if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
) else if exist "%LOCALAPPDATA%\Programs\Docker\Docker\Docker Desktop.exe" (
    start "" "%LOCALAPPDATA%\Programs\Docker\Docker\Docker Desktop.exe"
)

echo        Warte auf Docker-Dienst (kann bis zu 30 Sekunden dauern)...
set count=0

:wait_docker
ping 127.0.0.1 -n 4 >nul
docker info >nul 2>nul
if %ERRORLEVEL% equ 0 goto :start_container

set /a count=count+1
if %count% geq 10 goto :docker_timeout
goto :wait_docker

:docker_timeout
echo.
echo [WARNUNG] Docker Desktop antwortet noch nicht.
echo Bitte starte Docker Desktop manuell und fuehre diese Datei anschliessend erneut aus.
echo.
pause
exit /b 1

:start_container
echo [2/2] Starte Generator-Suite Container...
docker compose up -d
if %ERRORLEVEL% equ 0 goto :launch_browser

echo.
echo [INFO] Behebe moeglichen Namenskonflikt mit bestehendem Container...
docker rm -f generator-suite >nul 2>nul
docker compose up -d
if %ERRORLEVEL% equ 0 goto :launch_browser

echo.
echo [FEHLER] Container konnte nicht gestartet werden.
echo Bitte stelle sicher, dass Docker Desktop aktiv ist oder fuehre 'scripts\update.bat' aus.
echo.
pause
exit /b 1

:launch_browser
echo.
echo ================================================================================
echo   [OK] Generator-Suite erfolgreich gestartet!
echo   Die Web-App wird jetzt in deinem Standardbrowser geoeffnet:
echo   👉 http://localhost:8000
echo ================================================================================
echo.
echo Hinweis: Zum Beenden kannst du 'scripts\stop.bat' doppelklicken.
echo.
start http://localhost:8000
echo Druecke eine beliebige Taste, um dieses Konsolenfenster zu schliessen...
pause >nul
exit /b 0

:check_native
if exist "backend\.venv\Scripts\python.exe" (
    echo [INFO] Docker nicht gefunden, aber natives Setup vorhanden.
    echo        Starte native Umgebung via 'run_app.bat'...
    call "%~dp0..\run_app.bat"
    exit /b 0
)

echo [FEHLER] Docker Desktop wurde auf diesem Computer nicht gefunden.
echo.
echo Zur Ausfuehrung der LaTeX-Generatoren-Suite wird Docker Desktop benoetigt.
echo Bitte installiere Docker Desktop von:
echo 👉 https://www.docker.com/products/docker-desktop/
echo.
echo Nach der einmaligen Installation kannst du 'start.bat' erneut doppelklicken.
echo.
pause
exit /b 1