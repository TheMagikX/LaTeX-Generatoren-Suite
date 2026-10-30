// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import {
  Sparkles, AlertCircle, RefreshCw, Server, Cloud, Key,
  CheckCircle2, Power
} from 'lucide-react'
import { useAi } from '../../../context/AiContext'

export function AiSettingsSection() {
  const {
    aiEnabled, toggleAiEnabled, activeProvider, switchProvider,
    hasGeminiKey, maskedGeminiKey, geminiStatus,
    saveKey, testGemini,
    autoStopOllama, setAutoStopOllama, autoStopMode, setAutoStopMode,
    ollamaStatus, isChecking, isStopping, checkOllama, handleStopOllama
  } = useAi()

  const [geminiInputKey, setGeminiInputKey] = useState('')
  const [isSavingKey, setIsSavingKey] = useState(false)
  const [isTestingGemini, setIsTestingGemini] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  // Wenn Ollama verfügbar ist, alten Toggle-Fehler ausblenden
  const displayedToggleError = ollamaStatus?.available ? null : toggleError

  const handleSaveGeminiKey = async () => {
    if (!geminiInputKey.trim()) return
    setIsSavingKey(true)
    try {
      const res = await saveKey(geminiInputKey.trim())
      if (res.success) {
        setGeminiInputKey('')
        setActionMsg('Gemini API-Schlüssel erfolgreich gespeichert.')
        setTimeout(() => setActionMsg(null), 4000)
      } else {
        setToggleError(res.error || 'Fehler beim Speichern.')
      }
    } finally {
      setIsSavingKey(false)
    }
  }

  const handleTestGeminiKey = async () => {
    setIsTestingGemini(true)
    try {
      const res = await testGemini(geminiInputKey.trim() || undefined)
      if (res.available) {
        setActionMsg(`Gemini API erreichbar (Modell: ${res.model || res.default_model}).`)
      } else {
        setToggleError(res.error || 'Gemini API Verbindung fehlgeschlagen.')
      }
      setTimeout(() => {
        setActionMsg(null)
      }, 4000)
    } finally {
      setIsTestingGemini(false)
    }
  }

  const handleToggleAi = async () => {
    setToggleError(null)
    setActionMsg(null)
    const res = await toggleAiEnabled()
    if (!res.success && res.error) {
      setToggleError(res.error)
    }
  }

  const handleManualCheck = async () => {
    setToggleError(null)
    setActionMsg(null)
    const res = await checkOllama(false)
    if (res.available) {
      setActionMsg(`Ollama erreichbar (${res.models.length} Modell(e): ${res.models.join(', ')}).`)
    } else {
      setToggleError('Ollama ist unter http://localhost:11434 nicht erreichbar.')
    }
    setTimeout(() => {
      setActionMsg(null)
    }, 4000)
  }

  const handleCheckAndEnable = async () => {
    setToggleError(null)
    setActionMsg(null)
    const res = await toggleAiEnabled(true)
    if (!res.success && res.error) {
      setToggleError(res.error)
    }
  }

  const handleManualStop = async () => {
    setToggleError(null)
    setActionMsg(null)
    const res = await handleStopOllama(autoStopMode)
    if (res.ok) {
      setActionMsg(res.message || 'Ollama erfolgreich gestoppt.')
    } else {
      setToggleError(res.error || 'Fehler beim Stoppen von Ollama.')
    }
    setTimeout(() => {
      setActionMsg(null)
      setToggleError(null)
    }, 5000)
  }

  return (
    <section className="pt-4 border-t border-line">
      <div className="flex items-center gap-2 mb-3.5">
        <Sparkles size={14} className="text-amber-500" />
        <h2 className="text-caption font-semibold">
          KI-Generierung & Assistent
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
          {activeProvider === 'gemini' ? 'Google Gemini Cloud' : 'Ollama Local'}
        </span>
      </div>

      <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
        {/* 1. Haupt-Slider: KI-Generierung An/Aus */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink text-sm">KI-Unterstützung für Generatoren</span>
              {aiEnabled ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Aktiviert
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-raised text-muted border border-line">
                  Deaktiviert
                </span>
              )}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Aktiviert den Button „KI-Assistent“ in den Generatoren (z. B. Baumdiagramm), um Konfigurationen per natürlicher Sprache entweder über die lokale GPU/CPU (Ollama) oder per Cloud-Turbo (Google Gemini Flash) zu erstellen.
            </p>
            {displayedToggleError && (
              <div className="text-xs text-red-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0 text-red-500" />
                  <span>{displayedToggleError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckAndEnable}
                  disabled={isChecking}
                  className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 font-semibold text-[11px] flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
                >
                  <RefreshCw size={11} className={isChecking ? 'animate-spin' : ''} />
                  <span>Jetzt prüfen & aktivieren</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleAi}
            disabled={isChecking}
            className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer disabled:opacity-80 disabled:cursor-wait ${
              aiEnabled ? 'bg-amber-500' : 'bg-raised border-rim'
            }`}
            role="switch"
            aria-checked={aiEnabled}
            title={aiEnabled ? 'KI-Generierung deaktivieren' : 'KI-Generierung aktivieren'}
          >
            <span
              className={`pointer-events-none flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                aiEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {isChecking && <RefreshCw size={11} className="animate-spin text-amber-600" />}
            </span>
          </button>
        </div>

        {/* 2. Provider Wahl (Lokal vs Cloud) */}
        <div className="pt-4 border-t border-line space-y-3">
          <label className="text-xs font-semibold text-ink block">KI-Engine wählen</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => switchProvider('ollama')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeProvider === 'ollama'
                  ? 'border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'border-line bg-panel hover:border-line hover:bg-raised/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-ink flex items-center gap-2">
                  <Server size={15} className="text-indigo-400" />
                  <span>Lokal (Ollama)</span>
                </div>
                {activeProvider === 'ollama' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
                    AKTIV
                  </span>
                )}
              </div>
              <div className="text-xs text-muted mt-1.5 leading-relaxed">
                100% offline, datenschutzkonform auf deiner eigenen Hardware (Port 11434).
              </div>
            </button>

            <button
              type="button"
              onClick={() => switchProvider('gemini')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeProvider === 'gemini'
                  ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30'
                  : 'border-line bg-panel hover:border-line hover:bg-raised/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-ink flex items-center gap-2">
                  <Cloud size={15} className="text-amber-500" />
                  <span>Cloud (Google Gemini)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold">
                    TURBO
                  </span>
                  {activeProvider === 'gemini' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold">
                      AKTIV
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted mt-1.5 leading-relaxed">
                Extrem schnell (Gemini 3.5 Flash), kein GPU-Bedarf, kostenloser Google AI Studio API-Key.
              </div>
            </button>
          </div>
        </div>

        {/* 3. Provider-spezifische Konfiguration */}
        {activeProvider === 'gemini' ? (
          /* Gemini Cloud Konfiguration */
          <div className="pt-4 border-t border-line space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <Key size={14} className="text-amber-500" />
                  <span>Google Gemini API-Schlüssel</span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Hinterlege deinen persönlichen API-Schlüssel. Der Key wird lokal in <code>ai_secrets.json</code> gespeichert und nicht im Git exponiert.
                </p>
              </div>
            </div>

            {hasGeminiKey && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                  <span>Aktiv hinterlegt: <code className="font-mono font-bold">{maskedGeminiKey}</code></span>
                </span>
                <span className="text-[11px] text-muted">✓ In ai_secrets.json gesichert</span>
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault()
                handleSaveGeminiKey()
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="password"
                autoComplete="new-password"
                placeholder={hasGeminiKey ? 'Neuen API-Schlüssel eingeben (überschreibt bestehenden)...' : 'Google Gemini API-Key hier einfügen...'}
                value={geminiInputKey}
                onChange={e => setGeminiInputKey(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-raised border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-ink placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={!geminiInputKey.trim() || isSavingKey}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition cursor-pointer self-start sm:self-auto"
              >
                {isSavingKey ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={handleTestGeminiKey}
                disabled={isTestingGemini || (!hasGeminiKey && !geminiInputKey.trim())}
                className="px-3.5 py-2 text-xs font-medium text-ink bg-raised hover:bg-overlay border border-line disabled:opacity-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw size={12} className={isTestingGemini ? 'animate-spin' : ''} />
                <span>{isTestingGemini ? 'Prüfe...' : 'Verbindung testen'}</span>
              </button>
            </form>

            {/* Statusanzeige des Tests */}
            {geminiStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                geminiStatus.available
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}>
                {geminiStatus.available ? (
                  <>
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                    <span>✓ Verbunden mit Modell: <strong>{geminiStatus.model || geminiStatus.default_model}</strong></span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} className="shrink-0 text-red-500" />
                    <span>✕ Verbindung fehlgeschlagen: {typeof geminiStatus.error === 'string' ? geminiStatus.error : JSON.stringify(geminiStatus.error)}</span>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Ollama Local Konfiguration */
          <>
            {/* Ollama Server prüfen & Status */}
            <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-ink">
                  <Server size={14} className="text-muted" />
                  <span>Ollama Server-Status:</span>
                  {ollamaStatus?.available ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Verbunden (Port 11434)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-500 font-medium">
                      <AlertCircle size={13} /> Nicht erreichbar
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted">
                  {ollamaStatus?.available ? (
                    ollamaStatus.models.length > 0 ? (
                      `Verfügbare Modelle: ${ollamaStatus.models.join(', ')}`
                    ) : (
                      'Server läuft, aber keine Modelle installiert. (Tipp: "ollama pull qwen2.5:3b" im Terminal)'
                    )
                  ) : (
                    'Ollama muss auf deinem PC laufen (z. B. im Terminal "ollama run qwen2.5:3b" ausführen).'
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="px-3.5 py-2 rounded-xl bg-raised hover:bg-overlay border border-line text-xs font-medium text-ink flex items-center gap-2 shrink-0 transition-colors cursor-pointer self-start sm:self-center"
              >
                <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
                <span>Ollama Server prüfen</span>
              </button>
            </div>

            {/* Ollama Server stoppen & Autostop-Optionen */}
            <div className="pt-4 border-t border-line flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-ink">Ollama automatisch stoppen / entladen</div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Gibt nach erfolgreicher Generierung oder beim Deaktivieren der Option automatisch den Arbeitsspeicher (VRAM/RAM) frei.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoStopOllama(!autoStopOllama)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoStopOllama ? 'bg-amber-500' : 'bg-raised border-rim'
                  }`}
                  role="switch"
                  aria-checked={autoStopOllama}
                  title={autoStopOllama ? 'Autostop deaktivieren' : 'Autostop aktivieren'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      autoStopOllama ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Autostop Modus & Manueller Stopp-Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted">Stopp-Methode:</span>
                  <select
                    value={autoStopMode}
                    onChange={e => setAutoStopMode(e.target.value as 'unload_models' | 'stop_server')}
                    className="bg-raised border border-line rounded-lg px-2.5 py-1 text-xs text-ink focus:outline-none"
                  >
                    <option value="unload_models">Modelle entladen (VRAM/RAM freigeben, empfohlen)</option>
                    <option value="stop_server">Ollama-Prozess vollständig beenden</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleManualStop}
                  disabled={isStopping || !ollamaStatus?.available}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-center"
                >
                  <Power size={13} className={isStopping ? 'animate-spin' : ''} />
                  <span>{isStopping ? 'Wird gestoppt...' : 'Ollama jetzt stoppen'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {actionMsg && (
          <div className="text-xs text-emerald-500 flex items-center gap-1.5 mt-1 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 size={13} className="shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}
      </div>
    </section>
  )
}
