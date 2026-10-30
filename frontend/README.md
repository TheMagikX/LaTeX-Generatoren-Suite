# Generator-Suite – Frontend

Dieses Verzeichnis enthält das Web-Frontend der **Generator-Suite** (React 19, TypeScript, Vite 8, Tailwind CSS 4).

## 🚀 Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (Standard-Port 6100)
npm run dev -- --port 6100

# Linter ausführen
npm run lint

# Für Produktion bauen (Type-Check & Bundle)
npm run build
```

## ⚙️ Konfiguration

Die API-URL wird über `frontend/.env` konfiguriert:

```env
VITE_API_URL=http://localhost:9000/api/
```

Ausführliche Anleitungen zur gesamten Anwendung, Installation und Architektur findest du in der Hauptdokumentation unter [../README.md](../README.md).
