@echo off
title Generator-Suite Frontend -- Copyright (C) 2026 C. Meyer -- GNU AGPLv3 (AGPL-3.0-or-later)
cd /d "%~dp0frontend"
if defined FRONTEND_PORT (npm run dev -- --port %FRONTEND_PORT%) else (npm run dev)

