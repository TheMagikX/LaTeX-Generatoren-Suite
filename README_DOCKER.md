# 🐳 Docker Deployment Guide: Generator-Suite

Diese Anleitung beschreibt das Erstellen und Ausführen der Generator-Suite als isolierter Docker-Container für den lokalen Einsatz (**Single-User Desktop Companion**) auf dem eigenen Rechner.

---

## 📋 Voraussetzungen

- **Docker** & **Docker Compose** (z. B. Docker Desktop unter Windows/Mac oder Docker Engine mit Compose-Plugin unter Linux).

---

## 🚀 Schnellstart

### Methode A: Doppelklick (Empfohlen für Kollegium & Desktop)

Die Generator-Suite bringt plattformübergreifende Starter-Dateien mit, die das Starten, Stoppen und Aktualisieren vollautomatisch per einfachem Doppelklick erledigen:

| Aktion | Windows | macOS | Linux |
| :--- | :--- | :--- | :--- |
| **Starten & Browser öffnen** | Doppelklick auf `start.bat` | Doppelklick auf `start.command` | Ausführen von `./start.sh` |
| **Beenden / Stoppen** | Doppelklick auf `stop.bat` | Doppelklick auf `stop.command` | Ausführen von `./stop.sh` |
| **System-Aktualisierung** | Doppelklick auf `update.bat` | Doppelklick auf `update.command` | Ausführen von `./update.sh` |

*Beim Starten wird der Container im Hintergrund hochgefahren und die Web-App automatisch in deinem Standardbrowser unter [http://localhost:8000](http://localhost:8000) geöffnet.*

---

### Methode B: Terminal & Power-User

#### 1. Container starten (via Docker Hub oder lokalem Build)

Im Hauptverzeichnis des Projekts im Terminal ausführen:

```bash
# Lädt das vorkompilierte Multi-Arch-Image blitzschnell von Docker Hub herunter und startet:
docker compose pull && docker compose up -d
```
*(Alternativ: Wer den Code selbst anpassen möchte, kann das Image weiterhin mit `docker compose up -d --build` lokal bauen.)*

### 2. Im Browser aufrufen
- **Lokal auf dem Rechner:** [http://localhost:8000](http://localhost:8000) (oder [http://127.0.0.1:8000](http://127.0.0.1:8000))

> **🔒 Localhost-Only:** Standardmäßig ist der Container an `127.0.0.1` gebunden und somit **nur direkt auf diesem Rechner erreichbar**. Kein Zugriff aus dem lokalen Netzwerk oder Internet.

### 3. Zum Beenden
```bash
docker compose down
```

---

## 🔄 Updates per Doppelklick

Die Generator-Suite bringt plattformübergreifende Starter-Dateien mit, die das Ziehen von Updates, den Container-Neustart und die Bereinigung alter Images vollautomatisch per einfachem Doppelklick erledigen:

* **Windows:** Doppelklick auf `update.bat`
* **macOS:** Doppelklick auf `update.command` (öffnet automatisch das Mac-Terminal)
* **Linux:** Ausführen von `./update.sh`

Die Skripte führen im Hintergrund `git pull`, `docker compose pull`, `docker compose up -d` und ein automatisches `docker image prune -f` durch, damit kein ungenutzter Festplattenspeicher belegt bleibt.

---

## 🔒 Sicherheits- & Betriebsmodell

Die Generator-Suite ist architektonisch als **lokales Einzelnutzer-Werkzeug (Localhost Companion)** konzipiert – vergleichbar mit lokalen Desktop-Tools wie Jupyter Notebooks, Ollama oder ComfyUI:

1. **Isolierte Python-Codeausführung (Arbeitsblatt-Generator):**  
   Im Arbeitsblatt-Generator können Lehrkräfte Python-Code und Jinja2-Templates eingeben, um Aufgaben, Zufallswerte und mathematische Variablen dynamisch zu berechnen. Die Python-Ausführung erfolgt vollständig clientseitig im Browser innerhalb eines isolierten WebAssembly-WebWorkers (Pyodide) mit 5-Sekunden-Timeout; serverseitig werden nur noch reine JSON-Werte in einer `ImmutableSandboxedEnvironment` (Jinja2) gerendert.
2. **Eingeschränkter LaTeX-Dateizugriff & Host-Header-Schutz:**  
   Die LaTeX-Kompilierung läuft im Container mit `-no-shell-escape`, `openin_any=p` und `openout_any=p` sowie einer applikationsseitigen Pfad- und Primitiven-Prüfung. Zudem prüft das Backend den HTTP-`Host`- und `Origin`-Header gegen `ALLOWED_HOSTS` (Standard: `localhost,127.0.0.1`), um DNS-Rebinding- und CSRF-Angriffe aus dem Browser abzuwehren.
3. **Keine integrierte Benutzerverwaltung:**  
   Um die lokale Nutzung so einfach wie möglich zu halten, besitzt die Suite bewusst kein integriertes Loginsystem für Presets und API-Keys.
4. **⚠️ Wichtiger Hinweis für Netzwerkfreigaben (Reverse-Proxy-Pflicht):**  
   Exponiere Port 8000 **niemals ungeschützt** in ein offenes Schul-WLAN, Gastnetzwerk oder das öffentliche Internet! Wenn die Anwendung außerhalb von `127.0.0.1` bereitgestellt werden soll, **muss zwingend ein authentifizierender Reverse-Proxy** (z. B. Caddy, Traefik oder Nginx mit HTTP Basic Auth / OAuth) vorgeschaltet werden. Details zum Sicherheitsmodell findest du in der [README.md](./README.md#-ganz-wichtig-sicherheits---betriebsmodell).

---

## ⚙️ Konfiguration & Persistenz

### Presets & Eigene LaTeX-Dateien
Alle Vorlagen sowie benutzerdefinierte LaTeX-Dateien (`commands.tex`, `Pakete.tex`, eigene `.sty`-Pakete) werden automatisch über das gemountete Volume im lokalen Projektordner `./user_data` persistiert:
* Vorlagen der Generatoren: `./user_data/presets/<generator_id>/...`
* Hochgeladene LaTeX-Dateien: `./user_data/custom_latex/...`

Diese Dateien bleiben auch bei Container-Updates oder Neustarts dauerhaft erhalten und können direkt auf dem Host-Rechner mit einem beliebigen Texteditor bearbeitet werden.

### Port anpassen
In der `docker-compose.yml` ist der Port standardmäßig auf Localhost beschränkt:
```yaml
ports:
  - "127.0.0.1:8000:8000"
```
Falls Port 8000 auf deinem Rechner bereits belegt ist, kannst du den Host-Port einfach anpassen (z. B. `"127.0.0.1:8080:8000"`).

---

## 🛠️ Nützliche Docker-Befehle

| Aktion | Befehl |
| :--- | :--- |
| **Status anzeigen** | `docker compose ps` |
| **Logs ansehen (Echtzeit)** | `docker compose logs -f` |
| **Aktualisieren (Docker Hub)** | `docker compose pull && docker compose up -d` |
| **Container stoppen** | `docker compose down` |
| **Neu starten** | `docker compose restart` |
| **Neu bauen aus Quellcode** | `docker compose up -d --build` |
| **Alte Images aufräumen** | `docker image prune -f` |
