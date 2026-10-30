# 🐳 Docker Deployment Guide: Generator-Suite

Diese Anleitung beschreibt das Erstellen und Ausführen der Generator-Suite als isolierter Docker-Container für den lokalen Einsatz (**Single-User Desktop Companion**) auf dem eigenen Rechner.

---

## 📋 Voraussetzungen

- **Docker** & **Docker Compose** (z. B. Docker Desktop unter Windows/Mac oder Docker Engine mit Compose-Plugin unter Linux).

---

## 🚀 Schnellstart

### 1. Container bauen und starten
Im Hauptverzeichnis des Projekts im Terminal ausführen:

```bash
docker compose up -d --build
```

### 2. Im Browser aufrufen
- **Lokal auf dem Rechner:** [http://localhost:8000](http://localhost:8000) (oder [http://127.0.0.1:8000](http://127.0.0.1:8000))

> **🔒 Localhost-Only:** Standardmäßig ist der Container an `127.0.0.1` gebunden und somit **nur direkt auf diesem Rechner erreichbar**. Kein Zugriff aus dem lokalen Netzwerk oder Internet.

### 3. Zum Beenden
```bash
docker compose down
```

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
Alle Vorlagen sowie benutzerdefinierte LaTeX-Dateien (`commands.tex`, `Pakete.tex`, eigene `.sty`-Pakete) werden automatisch über das gemountete Volume im lokalen Projektordner `./presets` persistiert:
* Vorlagen der Generatoren: `./presets/<generator_id>/...`
* Hochgeladene LaTeX-Dateien: `./presets/custom_latex/...`

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
| **Container stoppen** | `docker compose down` |
| **Neu starten** | `docker compose restart` |
| **Neu bauen nach Code-Änderungen** | `docker compose up -d --build` |
