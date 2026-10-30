# 🎓 LaTeX-Generatoren-Suite

> **Die modulare Web-App zur Erstellung professioneller LaTeX-, TikZ- und Unterrichtsmaterialien für Mathematik, Physik und den Schulalltag.**

![Version](https://img.shields.io/badge/Version-5.0.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![LaTeX](https://img.shields.io/badge/LaTeX-XeLaTeX-008080?logo=latex&logoColor=white)
![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)

> [!NOTE]
> **🚀 Version 5.0.0 – Erstes öffentliches Open-Source-Release:**  
> Alle vorangegangenen Versionen (v1.x bis v4.x) waren rein interne, lokale Entwicklungsstände während der Entstehungsphase. Mit Version 5.0.0 wird die Generator-Suite nun erstmals offiziell als freies, quelloffenes Projekt der Öffentlichkeit zur Verfügung gestellt.

Die **Generator-Suite** verbindet eine reaktive, intuitive React-Benutzeroberfläche mit einem leistungsstarken FastAPI-Backend und einer vollwertigen XeLaTeX-Rendering-Pipeline. Lehrkräfte und MINT-Begeisterte können damit komplexe mathematische Schaubilder, physikalische Versuchsaufbauten, didaktische Visualisierungen und automatisierte Arbeitsblätter per Knopfdruck generieren, in Echtzeit betrachten und direkt als gestochen scharfe Grafiken (PNG, PDF, SVG) oder editierbaren LaTeX-Code exportieren.

---

## ✍️ Persönliches Vorwort des Autors

> [!NOTE]
> ### 📝 Persönliche Notiz / Vorwort (ernsthaft persönlich)
>
> Hallo zusammen und willkommen auf meinem Projekt. Bereits während des Studiums habe ich angefangen, viel mit LaTeX zu arbeiten, da mir die Möglichkeiten zum einheitlichen Layouten, die Arbeitsweise und einfach der cleane Look sehr gut gefallen haben. Jeder, der mal den Spaß an LaTeX gefunden hat und sich eingearbeitet hat, weiß wovon ich spreche.
>
> Beim Vorbereiten von Arbeitsblättern für meinen Unterricht habe ich aber schnell festgestellt, dass -- gerade nischige Befehle -- bspw. zum Erstellen von Koordinatensystemen usw. schnell in Vergessenheit geraten, wenn man sie nicht aktiv und regelmäßig verwendet. Auch sind verschiedenste Aspekte, wie bspw. Flaschenzüge, Strahlenoptiken usw. sehr schnell sehr mühsam zu erstellen.
>
> Aus diesem Bedarf ist bei mir die Idee entstanden, ein Tool zu bauen, welches einmal konfiguriert werden muss und danach einem schöne, einheitliche und vor allem abänderbare Abbildungen gestaltet, die man schnell als Bild, als .pdf oder als .svg speichern und/oder kopieren kann. Angefangen hat es mit einem einzigen kleinen Tool, mit dem man ein Koordinatensystem von ... bis ... mit kleinen Zwischenschritten erstellen konnte.
>
> Seit April 2025 ist -- natürlich auch dank künstlicher Intelligenz -- daraus ein sehr großes Projekt geworden. Die daraus entstandene WebApp benutze ich inzwischen so gut wie jeden Tag, ob damit die Zeit, die in der Entwicklung steckt, schon wieder reingeholt worden ist, sei mal dahingestellt, aber eine Erleichterung beim Erstellen von Darstellungen und vielem weiteren merke ich tagtäglich. Aus diesem Grund habe ich mich dafür entschieden, das Projekt Open Source zu machen. Ich hoffe sehr, dass sich andere finden, die vielleicht einen gewissen Nutzen aus dem Projekt ziehen können und/oder Ideen für eine Weiterentwicklung haben.
>
> Zur Transparenz: Ich kann in einem gewissen Umfang coden, code lesen, aber die Komplexität der Suite wäre ohne künstliche Intelligenz sicher nicht möglich gewesen. Manche Sachen sind bestimmt unnötig kompliziert, die Codebase ist aber auch über Monate hinweg gewachsen. Langer Rede, gar kein Sinn: Ich hoffe, ihr könnte damit was anfangen! Viel Spaß. Den Rest übernimmt die KI.

---

## 💡 Über dieses Projekt: Hobby, KI & Haftungsausschluss

* **Freies Hobbyprojekt:** Die Generator-Suite ist ein reines privates Freizeitprojekt. Es verfolgt keinerlei kommerzielle Absichten, sondern wurde in der Hoffnung erstellt, Kolleginnen und Kollegen sowie anderen Lehrkräften und MINT-Interessierten ein nützliches Werkzeug an die Hand zu geben.
* **Erstellt mit KI-Unterstützung:** Die Entwicklung dieser Codebase (Architektur, Frontend-Komponenten, LaTeX-Vorlagen und Backend-Logik) wurde maßgeblich durch den Einsatz moderner generativer KI-Assistenten ermöglicht und beschleunigt.
* **Ausschluss jeglicher Haftung (Disclaimer):**  
  Die Software wird **„wie besehen“ (AS IS)** und ohne jede ausdrückliche oder stillschweigende Gewährleistung zur Verfügung gestellt (gemäß den Bedingungen der GNU AGPL v3).  
  * Der Autor übernimmt keinerlei Haftung für die Richtigkeit, Aktualität oder Fehlerfreiheit der erzeugten Aufgaben, Grafiken, Lösungen oder Berechnungen.
  * Lehrkräfte sind selbst dafür verantwortlich, alle generierten Inhalte vor dem Einsatz im Unterricht oder in Prüfungen fachlich, didaktisch und formal zu überprüfen.
  * Es wird keine Haftung für eventuelle Datenverluste, Systemfehler oder Folgeschäden übernommen, die aus der Nutzung der Software entstehen.

---

## 🚨 GANZ WICHTIG: Sicherheits- & Betriebsmodell

> [!CAUTION]
> ### 🛑 NUR FÜR DEN LOKALEN EINZELPLATZBETRIEB (ISOLIERTER CONTAINER / LOCALHOST)!
> **Die Generator-Suite ist ein lokales Werkzeug für den eigenen PC und darf unter keinen Umständen ungesichert in einem lokalen Netzwerk (z. B. Schul-WLAN, Uni-Netzwerk, Firmen-LAN) oder gar im öffentlichen Internet freigegeben werden!**

### Warum bestehen drastische Sicherheitsrisiken im Netzwerkbetrieb?

1. **Python-Codeausführung im Browser (Pyodide WebAssembly Sandbox) & Jinja2-Sandbox:**  
   Im **Arbeitsblatt-Generator** können Lehrkräfte benutzerdefinierten Python-Code sowie Jinja2-Templates eingeben, um Aufgabenstellungen, Zufallswerte und mathematische Formeln dynamisch zu berechnen. Die Python-Ausführung erfolgt clientseitig im Browser innerhalb eines isolierten **Pyodide Web Workers (WebAssembly)** mit 5-Sekunden-Timeout (ohne Zugriff auf das Host-Dateisystem oder Server-Secrets), und Jinja2-Templates werden serverseitig in einer restriktiven `ImmutableSandboxedEnvironment` gerendert.
2. **Freie LaTeX- und XeLaTeX-Kompilierung:**  
   Die Editoren für LaTeX- und TikZ-Bilder erlauben das freie Eingeben und Rendern von TeX-Quelltext (`-no-shell-escape`, `openin_any=p` / `openout_any=p` für TeX Live sowie ein applikationsseitiger Pre-Compilation-Filter gegen Pfad-Traversals und TeX-I/O-Primitiven für Windows/MiKTeX sind aktiv; eigene `.tex`- und `.sty`-Dateien sind strikt auf das Projekt- bzw. `user_data/custom_latex`-Verzeichnis beschränkt).
3. **⚠️ Fremde Vorlagen (Presets) niemals arglos verwenden:**  
   Übernehme oder importiere Arbeitsblatt- und Generator-Presets (`.json`) sowie fremde `.tex`-/`sty`-Dateien **niemals ungesehen aus unbekannten Quellen**! Da Presets ausführbaren Python-, Jinja2- und LaTeX-Code enthalten können, solltest du fremde Vorlagen vor dem ersten Kompilieren stets auf verdächtige Befehle oder ungewohnte Dateipfade prüfen.
4. **Keine Authentifizierung oder Benutzerverwaltung:**  
   Um die lokale Nutzung so leicht und unkompliziert wie möglich zu halten, besitzt die Suite **kein Login-System, keine Passwortabfrage und kein Rollenmanagement**. Jede Person, die die Adresse aufrufen kann, hat vollen Zugriff auf alle Generatoren, Skripte, hinterlegte KI-Einstellungen und Presets.
5. **Localhost-Bindung, Origin-Guard & DNS-Rebinding-Schutz (`ALLOWED_HOSTS`):**  
   In der mitgelieferten `docker-compose.yml` sowie in den Startskripten ist der Dienst strikt an `127.0.0.1` gebunden. Zusätzlich prüft das Backend standardmäßig `Host`- und `Origin`-Header gegen `localhost` und `127.0.0.1` (`ALLOWED_HOSTS`), um CSRF- und DNS-Rebinding-Angriffe über fremde Webseiten im Browser zu unterbinden. Ändere diese Einstellungen niemals leichtfertig für einen ungeschützten Netzwerkbetrieb!
6. **Sicherheitslücken melden:**  
   Bitte melde Sicherheitsprobleme nicht in öffentlichen Issues, sondern nutze das **Private Vulnerability Reporting** im Reiter *Security* dieses GitHub-Repositorys.

---

## 📑 Inhaltsverzeichnis

- [Funktionsumfang & Generatoren](#-funktionsumfang--generatoren)
  - [Mathematik](#-mathematik)
  - [Geometrie](#-geometrie)
  - [Physik](#-physik)
  - [Werkzeuge & Didaktik](#-werkzeuge--didaktik)
  - [System & Personalisierung](#-system--personalisierung)
- [Installation & Schnellstart](#-installation--schnellstart)
  - [Methode 1: Mit Docker (Empfohlen)](#methode-1-mit-docker-empfohlen)
  - [Methode 2: Ohne Docker (Manuelle Installation)](#methode-2-ohne-docker-manuelle-installation)
    - [Windows](#-windows-manuell)
    - [macOS](#-macos-manuell)
    - [Linux](#-linux-manuell)
- [Architektur & Technologien](#-architektur--technologien)
- [Konfiguration & Persistenz](#-konfiguration--persistenz)
- [Tipps zur Fehlerbehebung (Troubleshooting)](#-tipps-zur-fehlerbehebung-troubleshooting)
- [Hinweise für Mitwirkende (Contributing)](#-hinweise-für-mitwirkende-contributing)
- [Lizenz](#-lizenz)

---

## ✨ Funktionsumfang & Generatoren

Die Suite umfasst aktuell **19 spezialisierte Generatoren und Fachwerkzeuge**, die alle einem einheitlichen Bedienkonzept folgen: Formularwerte anpassen, Live-Vorschau in Sekundenbruchteilen prüfen, Vorlagen speichern und das Ergebnis als PDF, PNG oder LaTeX-Quellcode übernehmen.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          GENERATOR-SUITE                               │
├─────────────────┬───────────────┬─────────────────┬────────────────────┤
│ 📐 MATHEMATIK   │ 🔺 GEOMETRIE  │ ⚡ PHYSIK       │ 🛠️ WERKZEUGE       │
│ • 2D-Koord.     │ • Geometrie   │ • Optische Bank │ • Arbeitsblatt     │
│ • 3D-Koord.     │               │ • Strahlenoptik │ • Sitzplan-Opt.    │
│ • Baumdiagramm  │               │ • Flaschenzug   │ • Erwartungshoriz. │
│ • Glücksrad     │               │ • Schaltplan    │ • QR-Code          │
│ • Brüche        │               │                 │ • LaTeX-Editor     │
│ • Statistik     │               │                 │ • TikZ-Editor      │
│ • Zahlenstrahl  │               │                 │                    │
│ • Stellenwert   │               │                 │                    │
└─────────────────┴───────────────┴─────────────────┴────────────────────┘
```

### 📐 Mathematik

| Generator | Beschreibung & Kernfunktionen |
| :--- | :--- |
| **[2D-Koordinatensystem](frontend/src/pages/Koordinatensystem/)** | Kartesische Koordinatensysteme für Analysis und Algebra. Unterstützt mathematische Funktionsgraphen (Polynome, Trigonometrie, Exponentialfunktionen etc.), Punkte, Vektoren, Tangenten, Sekanten, Flächen/Integrale, anpassbare Gitter und Achsenskalierungen. |
| **[3D-Koordinatensystem](frontend/src/pages/Koordinatensystem3D/)** | Dreidimensionale analytische Geometrie ($x_1, x_2, x_3$ bzw. $x, y, z$). Darstellung von Vektoren, Punkten, Geraden, Ebenen (inkl. Spurpunkten und Ebenenausschnitten), geometrischen Körpern (Quader, Pyramiden) und frei wählbaren Schrägbild-Projektionswinkeln. |
| **[Baumdiagramm](frontend/src/pages/Baumdiagramm/)** | Stochastische Baumdiagramme für ein- und mehrstufige Zufallsexperimente (z. B. Urnenmodelle mit/ohne Zurücklegen). Automatische Pfadführung, Wahrscheinlichkeitsbeschriftungen (Brüche, Dezimalzahlen, Prozent) und Pfadendwerte. |
| **[Glücksrad](frontend/src/pages/Glucksrad/)** | Didaktische Glücksräder für die Wahrscheinlichkeitsrechnung. Frei konfigurierbare Kreissektoren mit individuellen Winkeln, Farben und Beschriftungen sowie drehbarer Zeigerpfeil. |
| **[Bruch-Visualisierer](frontend/src/pages/Bruch/)** | Anschauliche Bruchrechnung für Unter- und Mittelstufe. Visualisierung von Brüchen und gemischten Zahlen als Tortendiagramm (Kreis), Rechteck-Raster, Bruchstreifen oder Balken mit farblicher Zähler-/Nenner-Kennzeichnung. |
| **[Statistik](frontend/src/pages/Statistik/)** | Beschreibende Statistik und Datenanalyse. Erstellung professioneller Boxplots (inkl. Ausreißer), Histogramme, Säulendiagramme, Häufigkeitstabellen sowie automatischer Berechnung von statistischen Kennwerten (Median, Quartile, Mittelwert). |
| **[Zahlenstrahl](frontend/src/pages/Zahlenstrahl/)** | Skalierbare Zahlenstrahlen für natürliche, ganze, rationale und reelle Zahlen. Anpassbare Schrittweiten, Teilstriche, Intervall-Markierungen, Wertmarken und Rechensprünge mit Pfeilen. |
| **[Stellenwerttafel](frontend/src/pages/Stellenwerttafel/)** | Stellenwerttafeln für den Primar- und Sekundarstufenunterricht (Einer, Zehner, Hunderter, Tausender bis hin zu Dezimalstellen und beliebigen Zahlensystemen). Wahlweise mit Zifferneintrag oder Plättchen-/Punkt-Darstellung. |

### 🔺 Geometrie

| Generator | Beschreibung & Kernfunktionen |
| :--- | :--- |
| **[Geometrie](frontend/src/pages/Geometrie/)** | Konstruktion und Visualisierung ebener geometrischer Figuren (Dreiecke, Vierecke, Polygone, Kreise). Automatische Berechnung und Beschriftung von Seiten, Winkeln (mit Bögen), Höhen, Mittelsenkrechten, Seitenhalbierenden, Winkelhalbierenden sowie In- und Umkreisen. |

### ⚡ Physik

| Generator | Beschreibung & Kernfunktionen |
| :--- | :--- |
| **[Optik (Optische Bank)](frontend/src/pages/Optik/)** | Versuchsaufbauten auf der optischen Bank. Platzierung von Sammel- und Zerstreuungslinsen, Hohl- und Wölbspiegeln, Lichtquellen, Spalten, Blenden, Gegenständen und Projektionsschirmen auf einer bemaßten optischen Schiene. |
| **[Strahlenoptik](frontend/src/pages/Strahlenoptik/)** | Geometrische Strahlenoptik und Wellenlehre. Konstruktion von Lichtstrahlen, Reflexion an Spiegeln, Brechung an Grenzflächen (Snellius-Brechungsgesetz), Totalreflexion, planparallelen Platten und Prismen mit konfigurierbaren Brechungsindizes ($n_1, n_2$). |
| **[Flaschenzug](frontend/src/pages/Flaschenzug/)** | Mechanische Rollensysteme für die Mittel- und Oberstufe. Unterstützung für gewöhnliche Flaschenzüge sowie Potenzflaschenzüge mit frei konfigurierbarer Anzahl fester und loser Rollen, realitätsnaher Seilführung, Lastgewichten und Zugkraftpfeilen. |
| **[Schaltplan](frontend/src/pages/Schaltplan/)** | Elektrische Schaltpläne auf Basis von `CircuiTikZ`. Erstellung von Stromkreisen (Reihen- und Parallelschaltungen) mit Spannungsquellen, Widerständen, Lampen, Schaltern, Kondensatoren, Spulen sowie Messgeräten (Voltmeter, Amperemeter). |

### 🛠️ Werkzeuge & Didaktik

| Werkzeug | Beschreibung & Kernfunktionen |
| :--- | :--- |
| **[Arbeitsblatt-Generator](frontend/src/pages/Arbeitsblatt/)** | Erstellung kompletter Aufgabenblätter mit separater Lösungsseite. Unterstützt dynamisches **Python-Scripting** zur automatischen Generierung von Zufallsaufgaben und Lösungsvariablen, integrierte Kopfzeilen, Schullogos und Bepunktungsraster. |
| **[Sitzplan](frontend/src/pages/Sitzplan/)** | Intelligente Sitzordnung für Klassenräume. Bietet verschiedene Raumlayouts (Reihen, Hufeisen, Gruppentische) und nutzt eine mathematische Optimierung (**Google OR-Tools**), um pädagogische Bedingungen (wer soll/darf nicht nebeneinander sitzen, Seh-/Hörhilfen nach vorne) automatisch zu lösen. |
| **[Erwartungshorizont](frontend/src/pages/Erwartungshorizont/)** | Strukturierte Erstellung von Erwartungshorizonten und Musterlösungen für Klassenarbeiten und Klausuren. Generiert Teilaufgaben (`subtask`) in exakter Zeilenbreite für die nahtlose Übernahme in Textverarbeitungsprogramme (wie Microsoft Word oder LibreOffice). |
| **[QR-Code](frontend/src/pages/QRCode/)** | Hochwertige, individualisierbare QR-Codes für Unterrichtsmaterialien (Verlinkung auf Erklärvideos, Online-Übungen, Recherchen). Anpassbare Punktmuster, Eckstile, Farben, Farbverläufe, Logo-Einbettung und Beschriftungszeilen. |
| **[LaTeX-Bild (Direkt-Editor)](frontend/src/pages/LatexImage/)** | Direkter LaTeX-Editor mit Live-Kompilierung. Ideal zum schnellen Rendern und Testen von Formelsätzen, Tabellen, Chemiestrukturen oder Textbausteinen. |
| **[TikZ-Bild (Direkt-Editor)](frontend/src/pages/TikzPicture/)** | Vollwertige TikZ-Kompilierungsumgebung mit Syntax-Highlighting und Vorlagen. Ermöglicht freies Zeichnen beliebiger PGF/TikZ-Vektorgrafiken mit Sofortvorschau. |

### ⚙️ System & Personalisierung

* **Preset-Manager:** Speichern, Exportieren und Wiederherstellen von benutzerdefinierten Generator-Konfigurationen als JSON-Dateien.
* **Optionaler KI-Assistent (Lokal & Cloud):** Unterstützte Generatoren bieten einen optionalen KI-Assistenten zur natürlichsprachlichen Diagrammerstellung – wahlweise komplett lokal über **Ollama** oder über einen eigenen **Google Gemini API-Key** (konfigurierbar in den Einstellungen).
* **Eigene LaTeX-Erweiterungen:** Einbindung eigener Makros (`commands.tex`), zusätzlicher LaTeX-Pakete (`Pakete.tex`) und `.sty`-Dateien über die Systemeinstellungen bzw. den `user_data/custom_latex`-Ordner.
* **Modernes UI & Theme-Support:** Mehrfarbige Design-Themes, Hell-, Dunkel- und System-Modus (Tailwind CSS 4), responsive Oberflächen und übersichtliche Seiten-Navigation.

---

## 🚀 Installation & Schnellstart

Wähle die für dein System passende Methode:

### Methode 1: Mit Docker (Empfohlen)

*Dies ist der einfachste und sauberste Weg: Keine manuelle Installation von Python, Node.js, LaTeX oder Hilfsprogrammen nötig – alles ist schlüsselfertig im Container isoliert.*

#### 1. Voraussetzungen
* **Docker Desktop** (Windows oder macOS): [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)  
  *oder Docker Engine mit Compose-Plugin unter Linux.*

#### 2. Repository klonen & Verzeichnis betreten
```bash
git clone https://github.com/TheMagikX/LaTeX-Generatoren-Suite.git
cd LaTeX-Generatoren-Suite
```

#### 3. Container starten
Führe im Terminal im Projektordner folgenden Befehl aus:
```bash
docker compose up -d --build
```
Beim ersten Aufruf lädt Docker das schlanke Basis-Image herunter und baut Frontend und LaTeX-Backend automatisch zusammen (dies kann je nach Internetverbindung ein paar Minuten dauern).

#### 4. Im Browser öffnen
Öffne anschließend deinen Webbrowser unter:  
👉 **[http://localhost:8000](http://localhost:8000)** *(oder [http://127.0.0.1:8000](http://127.0.0.1:8000))*

#### Nützliche Docker-Befehle
| Aktion | Befehl |
| :--- | :--- |
| **Logs in Echtzeit ansehen** | `docker compose logs -f` |
| **Status der Container prüfen** | `docker compose ps` |
| **Container stoppen** | `docker compose down` |
| **Neu starten** | `docker compose restart` |
| **Nach Updates neu bauen** | `docker compose up -d --build` |

---

### Methode 2: Ohne Docker (Manuelle Installation)

Falls du die Suite direkt nativ auf deinem Host-System ausführen möchtest:

#### Voraussetzungen (alle Betriebssysteme):
1. **Python 3.11+**: [python.org](https://www.python.org/)
2. **Node.js (LTS Version 20+)**: [nodejs.org](https://nodejs.org/)
3. **TeX-Distribution mit XeLaTeX & gängigen Paketen (`dvisvgm` für SVG-Export empfohlen):**
   - Windows: **MiKTeX** ([miktex.org](https://miktex.org/)) oder **TeX Live**
   - macOS: **MacTeX** ([tug.org/mactex](https://www.tug.org/mactex/))
   - Linux: **TeX Live** (`texlive-xetex`, `texlive-latex-extra`, `texlive-science`, `texlive-pictures`)
4. **Poppler Utilities (`pdftoppm` / `pdftocairo` / `pdfseparate`):** Notwendig für die Konvertierung der generierten PDF-Dateien in Bildvorschauen und Einzelseiten.

---

#### 🪟 Windows (Manuell)

1. **Programme installieren:**
   - Installiere Python (⚠️ Haken bei **„Add python.exe to PATH“** unbedingt setzen!).
   - Installiere Node.js LTS.
   - Installiere MiKTeX (in den Einstellungen das automatische Nachinstallieren von Paketen auf *„Yes“* stellen).
   - Lade **Poppler für Windows** herunter (z. B. via [oschwartz10612/poppler-windows/releases](https://github.com/oschwartz10612/poppler-windows/releases/)), entpacke es und füge den Pfad zum enthaltenen `Library\bin`-Ordner zu deiner System-Umgebungsvariable `PATH` hinzu.
2. **Einmalige Einrichtung (im Projektordner via PowerShell):**
   ```powershell
   # Backend vorbereiten
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   cd ..

   # Frontend vorbereiten
   cd frontend
   npm install
   cd ..
   ```
3. **App starten:**
   - **Komfortabel:** Doppelklick auf die beiliegende Datei **`run_app.bat`** (startet Backend und Frontend synchron in einem Terminalfenster).
   - **Oder via PowerShell:** `.\start.ps1` ausführen.
   - Die App öffnet sich automatisch im Browser unter **[http://localhost:6100](http://localhost:6100)** (Backend läuft auf Port 9000).

---

#### 🍏 macOS (Manuell)

1. **Voraussetzungen mit Homebrew installieren:**
   ```bash
   brew install python node poppler
   brew install --cask mactex-no-gui
   ```
2. **Einmalige Einrichtung:**
   ```bash
   # Backend-Umgebung
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cd ..

   # Frontend-Umgebung
   cd frontend
   npm install
   cd ..
   ```
3. **Starten (in zwei separaten Terminal-Fenstern):**
   - **Fenster 1 (Backend):**
     ```bash
     cd backend
     source .venv/bin/activate
     python -m uvicorn main:app --host 127.0.0.1 --port 9000
     ```
   - **Fenster 2 (Frontend):**
     ```bash
     cd frontend
     npm run dev -- --port 6100
     ```
   - Öffne anschließend **[http://localhost:6100](http://localhost:6100)** im Browser.

---

#### 🐧 Linux (Manuell, Debian/Ubuntu)

1. **Systempakete installieren:**
   ```bash
   sudo apt update
   sudo apt install -y python3 python3-venv python3-pip nodejs npm poppler-utils \
       texlive-xetex texlive-latex-extra texlive-science texlive-pictures texlive-fonts-recommended
   ```
2. **Einmalige Einrichtung:**
   ```bash
   # Backend
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cd ..

   # Frontend
   cd frontend
   npm install
   cd ..
   ```
3. **Starten:**
   Starte Backend (`python -m uvicorn main:app --host 127.0.0.1 --port 9000`) und Frontend (`npm run dev -- --port 6100`) in zwei Terminals und rufe `http://localhost:6100` auf.

---

## 🏗️ Architektur & Technologien

```text
┌──────────────────────────────────────────────────────────────────┐
│                   Browser / Frontend (Port 6100 / 8000)          │
│   React 19 • TypeScript • Vite 8 • Tailwind CSS 4 • Pyodide WASM │
└─────────────────────────────────┬────────────────────────────────┘
                                  │  REST API (JSON / HTTP)
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI, Port 9000 / 8000)            │
│   FastAPI • Pydantic V2 • Google OR-Tools • Jinja2 Sandbox       │
└─────────────────────────────────┬────────────────────────────────┘
                                  │  TeX-Dokumentensynthese
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Rendering-Pipeline (Lokal / Container)         │
│   XeLaTeX (Kompilierung) ──▶ PDF ──▶ Poppler / dvisvgm           │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼  Ergebnis:
                 PNG-Vorschau • Vektor-PDF • SVG • TeX-Code
```

### Komponenten-Übersicht

* **Frontend (`/frontend`):**
  - **Framework:** React 19 mit TypeScript und Vite 8 für extrem schnelle Lade- und Reaktionszeiten.
  - **Styling:** Tailwind CSS 4 mit integrierter Dark-/Light-Mode-Unterstützung.
  - **Editoren:** Integrierte Editoren für Python- und LaTeX-Code basierend auf `@uiw/react-codemirror` und `Ace`.
  - **Zustands- & Cacheverwaltung:** TanStack React Query für zuverlässiges Abrufen der Rendering-Ergebnisse.
* **Backend (`/backend`):**
  - **API-Framework:** FastAPI mit Pydantic für validierte Schemas und asynchrone Endpunkte.
  - **Rendering-Engine:** Automatisierte Erstellung vollständiger TeX-Dokumente (`core/latex_document.py`) und Kompilierung über Subprozesse mit Timeout-Schutz.
  - **Optimierungs-Engine:** Google OR-Tools zur Lösung des Constraint-Satisfaction-Problems bei Sitzordnungen.

---

## ⚙️ Konfiguration & Persistenz

### Presets & Eigene TeX-Vorlagen
Alle erstellten Generator-Presets sowie benutzerdefinierte TeX-Snippets werden im Ordner `./user_data` auf dem Rechner abgelegt:
* **Generator-Vorlagen:** `./user_data/presets/<generator_id>/meine_vorlage.json`
* **Eigene LaTeX-Befehle & Makros:** `./user_data/custom_latex/commands.tex`
* **Zusätzliche LaTeX-Pakete:** `./user_data/custom_latex/Pakete.tex`

> [!WARNING]
> **Fremde Presets & `.tex`-Vorlagen nicht arglos verwenden:**  
> Generator-Presets (`.json`) – insbesondere für den Arbeitsblatt-, LaTeX- und TikZ-Generator – sowie eigene `.tex`- und `.sty`-Dateien enthalten ausführbaren Python-, Jinja2- bzw. LaTeX-Code. Obwohl die Suite mehrstufige Schutzmechanismen (isolierter Pyodide-WebWorker im Browser, Jinja2-Sandbox, LaTeX-Dateizugriffsfilter) einsetzt, sollten fremde Vorlagen nur aus vertrauenswürdigen Quellen übernommen und vor der ersten Verwendung kurz im Editor geprüft werden.

> [!TIP]
> Bei der Docker-Installation ist dieser Ordner als Volume (`./user_data:/app/user_data`) eingebunden. Sämtliche Presets bleiben somit bei Updates des Docker-Images oder Container-Neustarts dauerhaft erhalten.

### Umgebungsvariablen (Nativ ohne Docker)

Bei Bedarf kann `.env.example` zu `.env` kopiert werden, um die Ports im Hauptverzeichnis anzupassen:
```env
BACKEND_PORT=9000
FRONTEND_PORT=6100
```
In `frontend/.env`:
```env
VITE_API_URL=http://localhost:9000/api/
```
*(Hinweis: Bei Docker-Betrieb bündelt ein einzelner Container Frontend und Backend auf Port 8000).*

---

## 🔍 Tipps zur Fehlerbehebung (Troubleshooting)

### Docker: Port 8000 ist bereits belegt
Falls auf deinem Rechner bereits ein anderer Dienst Port 8000 nutzt, passe die Portweiterleitung in `docker-compose.yml` an:
```yaml
ports:
  - "127.0.0.1:8080:8000"
```
Danach ist die Suite unter `http://localhost:8080` erreichbar.

### Poppler (`pdftoppm`) wird unter Windows nicht gefunden
*Prüfung:* Öffne eine neue Eingabeaufforderung und tippe `pdftoppm -v`.  
*Lösung:* Erscheint ein Fehler, muss der Pfad zu `poppler-...\Library\bin` in den Windows-Systemeinstellungen unter *Umgebungsvariablen -> Systemvariablen -> Path* eingetragen werden. Danach alle Terminal- und Editorfenster neu starten.

### LaTeX-Rendering schlägt fehl
*Prüfung:* Führe im Terminal `xelatex --version` aus.  
*Lösung bei MiKTeX:* Öffne die *MiKTeX Console*, gehe auf *Settings* und stelle sicher, dass bei *„Install missing packages on-the-fly“* entweder **„Yes“** oder **„Ask me first“** gewählt ist.

### Frontend findet das Backend nicht (Status 500 / Network Error)
*Prüfung:* Stelle sicher, dass das Backend läuft (im Browser testweise `http://localhost:9000/api/system/info` aufrufen). Bei manueller Installation müssen Port in `backend/` und `VITE_API_URL` in `frontend/.env` exakt übereinstimmen.

---

## 🤝 Hinweise für Mitwirkende (Contributing)

Beiträge, Fehlerkorrekturen und neue Generatoren-Ideen sind herzlich willkommen!

1. **Forke** das Repository und erstelle einen neuen Feature-Branch (`git checkout -b feature/mein-neuer-generator`).
2. **Qualitätsprüfungen vor dem Commit:**
   ```bash
   cd frontend
   npm run lint
   npm run build
   ```
3. **Backend testen:**
   Führe die automatisierte Test-Suite im Ordner `backend` via `pytest` aus. Für manuelles API-Debugging kann die interaktive Swagger-Dokumentation unter `http://localhost:9000/docs` über die Umgebungsvariable `ENABLE_API_DOCS=true` aktiviert werden (standardmäßig aus Sicherheitsgründen deaktiviert).
4. **Commits & PRs:**
   Beschreibe in Pull Requests kurz, welche didaktische Funktion oder Fehlerbehebung ergänzt wurde. Bitte keine sensiblen Dateien (`.env`, Cache-Dateien, `.venv`, temporäre `.tex`-Dateien) committen.

---

## 📄 Lizenz

Dieses Projekt ist freie Software unter der **GNU Affero General Public License Version 3 (oder jeder späteren Version)**.

* **Lizenztext:** Den vollständigen Wortlaut der AGPLv3 findest du in der Datei [COPYING](COPYING).
* **Nutzung von Unterrichtsmaterialien:** Alle mit dieser Suite erzeugten Materialien (PDFs, Bilder, Arbeitsblätter, Aufgaben) dürfen selbstverständlich **frei für Unterrichts-, Schul- und Bildungszwecke** verwendet, vervielfältigt und weitergegeben werden.
* **Kommerzieller Ausschluss für Vorlagen:** Materialien, die unmittelbar auf den mitgelieferten Beispielen, Grafiken oder Presets basieren, dürfen jedoch nicht kommerziell vertrieben werden (siehe [LICENSE](LICENSE)).
* **Quellcodeverfügbarkeit:** Gemäß § 13 der GNU AGPL steht der vollständige Quellcode allen Nutzerinnen und Nutzern zur Einsicht und Weiterentwicklung offen.

---

<div align="center">
  <sub>Entwickelt von C. Meyer mit Unterstützung moderner KI • Für besseren, moderneren Unterricht.</sub>
</div>
