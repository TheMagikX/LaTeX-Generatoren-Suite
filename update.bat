@echo off
chcp 65001 >nul
title LaTeX-Generatoren-Suite -- System-Aktualisierung
cd /d "%~dp0"

echo.
echo ================================================================================
echo   LaTeX-Generatoren-Suite -- System-Aktualisierung
echo   Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)
echo ================================================================================
echo.

:: 1. Git-Prüfung
if not exist ".git" (
    echo [INFO] Kein Git-Repository gefunden [ZIP-Download erkannt].
    echo        Ueberspringe Quellcode-Aktualisierung...
    goto :check_env
)

where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [FEHLER] Git wurde nicht auf diesem Computer gefunden.
    echo Bitte stelle sicher, dass Git installiert und im Systempfad PATH hinterlegt ist.
    echo.
    pause
    exit /b 1
)

echo [1/3] Pruefe auf Aktualisierungen im GitHub-Repository...
git pull
if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNUNG] 'git pull' konnte nicht fehlerfrei durchgefuehrt werden.
    echo Möglicherweise hast du lokale Aenderungen an Quelldateien vorgenommen.
    echo Deine Presets und Vorlagen in 'user_data/' sind davon nicht betroffen.
    echo.
    pause
    exit /b 1
)

:check_env
echo.
echo [2/3] Erkenne Ausfuehrungsumgebung [Docker vs. Nativ]...

:: 2. Docker-Prüfung
where docker >nul 2>nul
if %ERRORLEVEL% equ 0 (
    docker info >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo [INFO] Docker Desktop ist aktiv. Aktualisiere Docker-Container...
        echo.
        echo       Lade neuestes Image von Docker Hub herunter...
        docker compose pull
        if %ERRORLEVEL% equ 0 (
            echo.
            echo       Starte Container mit neuem Image neu...
            docker compose up -d || (
                echo.
                echo [INFO] Behebe moeglichen Namenskonflikt mit bestehendem Container...
                docker rm -f generator-suite >nul 2>nul
                docker compose up -d
            )
        ) else (
            echo.
            echo [HINWEIS] Vorkompiliertes Image auf Docker Hub nicht verfuegbar.
            echo           Baue Container lokal aus Quellcode neu...
            docker compose up -d --build || (
                echo.
                echo [INFO] Behebe moeglichen Namenskonflikt mit bestehendem Container...
                docker rm -f generator-suite >nul 2>nul
                docker compose up -d --build
            )
        )
        if errorlevel 1 (
            echo.
            echo [FEHLER] Container konnte nicht gestartet werden.
            echo Bitte stelle sicher, dass Docker Desktop fehlerfrei laeuft.
            echo.
            pause
            exit /b 1
        )
        echo.
        echo       Raeume alte Docker-Images auf [Speicherplatz freigeben]...
        docker image prune -f
        goto :success
    )
)

:: 3. Natives Python/Node-Setup prüfen
if exist "backend\.venv\Scripts\python.exe" (
    echo [INFO] Natives Setup erkannt. Aktualisiere Backend- und Frontend-Abhaengigkeiten...
    echo.
    echo       Aktualisiere Python-Pakete...
    ".\backend\.venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
    if exist "frontend\package.json" (
        echo.
        echo       Aktualisiere Frontend-Pakete...
        pushd frontend
        call npm install
        popd
    )
    goto :success
)

echo [HINWEIS] Weder eine aktive Docker-Instanz noch ein natives Python-Venv ['backend\.venv'] gefunden.
echo Der Code wurde via Git erfolgreich aktualisiert.

:success
echo.
echo ================================================================================
echo   [OK] Aktualisierung erfolgreich abgeschlossen!
echo   Deine Vorlagen und Einstellungen in 'user_data/' wurden beibehalten.
echo ================================================================================
echo.
echo Druecke eine beliebige Taste, um dieses Fenster zu schliessen...
pause >nul
