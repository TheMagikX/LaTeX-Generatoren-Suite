#!/usr/bin/env bash
# LaTeX-Generatoren-Suite -- Linux Starter
# Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)

cd "$(dirname "$0")" || exit 1

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}================================================================================${NC}"
echo -e "${CYAN}  LaTeX-Generatoren-Suite -- Anwendungsstart (Linux)${NC}"
echo -e "${CYAN}  Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)${NC}"
echo -e "${CYAN}================================================================================${NC}"
echo ""

# 1. Docker-Prüfung
if command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}[1/2] Prüfe Docker-Umgebung...${NC}"
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}[FEHLER] Docker-Daemon läuft nicht oder fehlende Berechtigungen (sudo usermod -aG docker $USER).${NC}"
        read -n 1 -s -r -p "Drücke eine beliebige Taste zum Beenden..."
        echo ""
        exit 1
    fi

    echo -e "${YELLOW}[2/2] Starte Generator-Suite Container...${NC}"
    if ! docker compose up -d; then
        echo -e "${YELLOW}[INFO] Behebe möglichen Namenskonflikt...${NC}"
        docker rm -f generator-suite >/dev/null 2>&1
        docker compose up -d
    fi

    echo ""
    echo -e "${GREEN}================================================================================${NC}"
    echo -e "${GREEN}  [OK] Generator-Suite erfolgreich gestartet!${NC}"
    echo -e "${GREEN}  Die Web-App wird jetzt in deinem Standardbrowser geöffnet:${NC}"
    echo -e "${GREEN}  👉 http://localhost:8000${NC}"
    echo -e "${GREEN}================================================================================${NC}"
    echo ""
    echo "Hinweis: Zum Beenden kannst du './stop.sh' ausführen."
    echo ""

    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:8000" >/dev/null 2>&1 &
    fi
    sleep 2
    exit 0
elif [ -f "backend/.venv/bin/python" ]; then
    echo -e "${GREEN}[INFO] Natives Linux-Setup erkannt. Starte Server...${NC}"
    (cd backend && .venv/bin/uvicorn main:app --port 9000) &
    (cd frontend && npm run dev) &
    sleep 3
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:8000" >/dev/null 2>&1 &
    fi
    wait
else
    echo -e "${RED}[FEHLER] Docker wurde nicht gefunden.${NC}"
    echo "Bitte installiere Docker und Docker Compose."
    read -n 1 -s -r -p "Drücke eine beliebige Taste zum Beenden..."
    echo ""
    exit 1
fi
