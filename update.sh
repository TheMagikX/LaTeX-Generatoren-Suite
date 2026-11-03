#!/usr/bin/env bash
# LaTeX-Generatoren-Suite -- Linux Updater
# Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)

# In das Verzeichnis dieses Skripts wechseln
cd "$(dirname "$0")" || exit 1

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}================================================================================${NC}"
echo -e "${CYAN}  LaTeX-Generatoren-Suite -- System-Aktualisierung (Linux)${NC}"
echo -e "${CYAN}  Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)${NC}"
echo -e "${CYAN}================================================================================${NC}"
echo ""

# 1. Git-Prüfung
if [ -d ".git" ]; then
    if ! command -v git >/dev/null 2>&1; then
        echo -e "${RED}[FEHLER] Git wurde nicht auf diesem Computer gefunden.${NC}"
        echo "Bitte stelle sicher, dass Git installiert ist (z. B. sudo apt install git)."
        echo ""
        read -n 1 -s -r -p "Drücke eine beliebige Taste zum Beenden..."
        echo ""
        exit 1
    fi

    echo -e "${YELLOW}[1/3] Prüfe auf Aktualisierungen im GitHub-Repository...${NC}"
    if ! git pull; then
        echo ""
        echo -e "${RED}[WARNUNG] 'git pull' konnte nicht fehlerfrei durchgeführt werden.${NC}"
        echo "Möglicherweise hast du lokale Änderungen vorgenommen."
        echo "Deine Presets und Vorlagen in 'user_data/' sind davon unberührt."
        echo ""
        read -n 1 -s -r -p "Drücke eine beliebige Taste zum Beenden..."
        echo ""
        exit 1
    fi
else
    echo -e "${GREEN}[INFO] ZIP-Download erkannt (kein .git-Verzeichnis). Quellcode-Update übersprungen.${NC}"
fi

echo ""
echo -e "${YELLOW}[2/3] Erkenne Ausführungsumgebung (Docker vs. Nativ)...${NC}"

# 2. Docker-Prüfung
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo -e "${GREEN}[INFO] Docker ist aktiv. Aktualisiere Docker-Container...${NC}"
    echo ""
    echo "      Lade neuestes Image von Docker Hub herunter..."
    if docker compose pull; then
        echo ""
        echo "      Starte Container mit neuem Image neu..."
        if ! docker compose up -d; then
            echo ""
            echo -e "${YELLOW}[INFO] Behebe möglichen Namenskonflikt mit bestehendem Container...${NC}"
            docker rm -f generator-suite >/dev/null 2>&1
            docker compose up -d
        fi
    else
        echo ""
        echo -e "${YELLOW}[HINWEIS] Vorkompiliertes Image auf Docker Hub noch nicht verfügbar.${NC}"
        echo "          Baue Container lokal aus Quellcode neu..."
        if ! docker compose up -d --build; then
            echo ""
            echo -e "${YELLOW}[INFO] Behebe möglichen Namenskonflikt mit bestehendem Container...${NC}"
            docker rm -f generator-suite >/dev/null 2>&1
            docker compose up -d --build
        fi
    fi
    echo ""
    echo "      Räume alte Docker-Images auf (Speicherplatz freigeben)..."
    docker image prune -f
elif [ -f "backend/.venv/bin/python" ]; then
    echo -e "${GREEN}[INFO] Natives Linux-Setup erkannt. Aktualisiere Python- und Node-Pakete...${NC}"
    echo ""
    echo "      Aktualisiere Python-Pakete..."
    backend/.venv/bin/python -m pip install -r backend/requirements.txt
    if [ -f "frontend/package.json" ]; then
        echo ""
        echo "      Aktualisiere Frontend-Pakete..."
        (cd frontend && npm install)
    fi
else
    echo -e "${YELLOW}[HINWEIS] Weder eine aktive Docker-Instanz noch 'backend/.venv' gefunden.${NC}"
    echo "Der Code wurde via Git erfolgreich aktualisiert."
fi

echo ""
echo -e "${GREEN}================================================================================${NC}"
echo -e "${GREEN}  [OK] Aktualisierung erfolgreich abgeschlossen!${NC}"
echo -e "${GREEN}  Deine Vorlagen und Einstellungen in 'user_data/' wurden beibehalten.${NC}"
echo -e "${GREEN}================================================================================${NC}"
echo ""
read -n 1 -s -r -p "Drücke eine beliebige Taste, um dieses Fenster zu schließen..."
echo ""
