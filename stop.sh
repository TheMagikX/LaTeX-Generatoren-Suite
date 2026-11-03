#!/usr/bin/env bash
# LaTeX-Generatoren-Suite -- Linux Stopp-Skript
# Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)

cd "$(dirname "$0")" || exit 1

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo -e "${CYAN}================================================================================${NC}"
echo -e "${CYAN}  LaTeX-Generatoren-Suite -- Container beenden (Linux)${NC}"
echo -e "${CYAN}  Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)${NC}"
echo -e "${CYAN}================================================================================${NC}"
echo ""

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "Stoppe Container 'generator-suite'..."
    docker compose down
    echo ""
    echo -e "${GREEN}================================================================================${NC}"
    echo -e "${GREEN}  [OK] Die Generator-Suite wurde sauber beendet.${NC}"
    echo -e "${GREEN}  Deine Presets und Vorlagen in 'user_data/' sind sicher gespeichert.${NC}"
    echo -e "${GREEN}================================================================================${NC}"
    echo ""
    sleep 2
    exit 0
else
    echo "Keine aktive Docker-Instanz gefunden."
    sleep 2
fi
