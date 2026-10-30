# Generator Suite - Start Script
# Startet Backend (FastAPI) und Frontend (Vite) in einem einzigen Fenster

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

# --- .env laden ---
$envFile = Join-Path $rootDir ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
        }
    }
}

if ($env:BACKEND_PORT)  { $backendPort  = $env:BACKEND_PORT  } else { $backendPort  = "9000" }
if ($env:FRONTEND_PORT) { $frontendPort = $env:FRONTEND_PORT } else { $frontendPort = "6100" }
$frontendUrl = "http://localhost:$frontendPort"
if ($env:SOURCE_CODE_URL) { $repoUrl = $env:SOURCE_CODE_URL } else { $repoUrl = "https://github.com/TheMagikX/80-Generatoren-WebApp" }

# Fixierter Fenstertitel mit Copyright und Lizenz
try {
    $Host.UI.RawUI.WindowTitle = "Generator-Suite v5.0.0 | Copyright (C) 2026 C. Meyer | GNU AGPLv3 (AGPL-3.0-or-later)"
} catch {}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  Generator-Suite v5.0.0" -ForegroundColor Cyan
Write-Host "  Copyright (C) 2026 C. Meyer" -ForegroundColor White
Write-Host "  License: GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)" -ForegroundColor White
Write-Host ""
Write-Host "  This program is free software: you can redistribute it and/or modify" -ForegroundColor Gray
Write-Host "  it under the terms of the GNU Affero General Public License as published by" -ForegroundColor Gray
Write-Host "  the Free Software Foundation, either version 3 of the License, or" -ForegroundColor Gray
Write-Host "  (at your option) any later version." -ForegroundColor Gray
Write-Host ""
Write-Host "  This program is distributed in the hope that it will be useful," -ForegroundColor Gray
Write-Host "  but WITHOUT ANY WARRANTY; without even the implied warranty of" -ForegroundColor Gray
Write-Host "  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the" -ForegroundColor Gray
Write-Host "  GNU Affero General Public License for more details." -ForegroundColor Gray
Write-Host ""
Write-Host "  Source Code: $repoUrl" -ForegroundColor DarkCyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend  -> http://localhost:$backendPort" -ForegroundColor Yellow
Write-Host "  Frontend -> $frontendUrl" -ForegroundColor Green
Write-Host "  Beenden  -> Ctrl+C" -ForegroundColor Gray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""


# --- Lokales concurrently pruefen (kein ungepinntes npx-Nachladen) ---
$localConcurrently = Join-Path $rootDir "frontend\node_modules\.bin\concurrently.cmd"
if (-not (Test-Path $localConcurrently)) {
    Write-Host "[FEHLER] Frontend-Abhaengigkeiten fehlen (concurrently nicht gefunden). Bitte zuerst in 'frontend' den Befehl 'npm install' ausfuehren." -ForegroundColor Red
    exit 1
}

# In Root-Verzeichnis wechseln, damit die relativen Bat-Pfade stimmen
Set-Location $rootDir

# Browser oeffnen, sobald der Vite-Server erreichbar ist
Start-Job -ScriptBlock {
    param($Url)

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 1 | Out-Null
            Start-Process $Url
            break
        } catch {
            Start-Sleep -Seconds 1
        }
    }
} -ArgumentList $frontendUrl | Out-Null

# Beide Services starten - relative Pfade vermeiden Probleme mit Leerzeichen im Pfad
& $localConcurrently `
    --names "BACKEND,FRONTEND" `
    --prefix-colors "yellow,green" `
    "_backend.bat" `
    "_frontend.bat"
