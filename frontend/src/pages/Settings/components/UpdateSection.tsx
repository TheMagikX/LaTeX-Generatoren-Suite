// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 C. Meyer

import { useState } from 'react'
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowUpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal,
  Copy,
  Check,
  Clock,
} from 'lucide-react'
import { useUpdateCheck } from '../../../hooks/useUpdateCheck'

export function UpdateSection() {
  const {
    currentVersion,
    checkOnStartup,
    setCheckOnStartup,
    lastChecked,
    updateResult,
    isChecking,
    checkError,
    checkForUpdatesNow,
  } = useUpdateCheck()

  const [notesExpanded, setNotesExpanded] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [savingOptIn, setSavingOptIn] = useState(false)

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleToggleOptIn = async () => {
    setSavingOptIn(true)
    try {
      await setCheckOnStartup(!checkOnStartup)
    } finally {
      setSavingOptIn(false)
    }
  }

  const formattedLastChecked = lastChecked
    ? new Date(lastChecked).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const formattedPublishedAt = updateResult?.published_at
    ? new Date(updateResult.published_at).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null

  return (
    <section className="pt-4 border-t border-line">
      <div className="flex items-center gap-2 mb-3.5">
        <RefreshCw size={14} className="text-primary" />
        <h2 className="text-caption font-semibold">
          Systemaktualisierungen & GitHub-Releases
        </h2>
      </div>

      <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-6">
        {/* Top Status & Trigger Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-semibold text-ink text-sm">Installierte Version:</span>
              <span className="font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 text-xs">
                v{currentVersion}
              </span>

              {/* Status Badge */}
              {isChecking ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full bg-raised text-muted border border-rim">
                  <RefreshCw size={11} className="animate-spin text-primary" />
                  Prüfe GitHub...
                </span>
              ) : updateResult?.has_update ? (
                updateResult.is_security_update ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    <ShieldAlert size={12} />
                    Sicherheitsupdate verfügbar (v{updateResult.latest_version})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    <ArrowUpCircle size={12} />
                    Update verfügbar (v{updateResult.latest_version})
                  </span>
                )
              ) : updateResult && !updateResult.has_update ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={12} />
                  Auf dem neuesten Stand
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full bg-raised text-muted border border-rim">
                  <Clock size={11} />
                  Prüfung ausstehend
                </span>
              )}
            </div>

            <div className="text-xs text-muted">
              {formattedLastChecked ? (
                <span>Zuletzt geprüft: {formattedLastChecked}</span>
              ) : (
                <span>Bisher keine Update-Prüfung durchgeführt.</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => checkForUpdatesNow(true)}
            disabled={isChecking}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-50 font-medium text-xs shadow-xs transition-opacity shrink-0"
          >
            <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
            <span>Jetzt nach Updates suchen</span>
          </button>
        </div>

        {/* Error / Rate Limit message */}
        {checkError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-3.5 text-xs flex items-start gap-2.5">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">{checkError}</div>
          </div>
        )}

        {/* Opt-In Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink text-sm">
                Beim Start automatisch nach Updates suchen
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-raised text-muted border border-rim">
                Opt-In (Standard: Aus)
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Führt beim Laden der Anwendung im Hintergrund eine dezente, nicht-blockierende Prüfung gegen das offizielle GitHub-Repository durch. Standardmäßig deaktiviert, um vollständige Privatsphäre und Offline-Betrieb ohne automatische Netzwerk-Pings zu garantieren.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleOptIn}
            disabled={savingOptIn}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              checkOnStartup ? 'bg-primary' : 'bg-raised border-rim'
            } ${savingOptIn ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={checkOnStartup}
            title={checkOnStartup ? 'Automatische Prüfung deaktivieren' : 'Automatische Prüfung aktivieren'}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                checkOnStartup ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Update Details Card (Shown when update is available) */}
        {updateResult?.has_update && (
          <div
            className={`rounded-xl p-4 sm:p-5 border flex flex-col gap-4 mt-1 ${
              updateResult.is_security_update
                ? 'bg-amber-500/10 border-amber-500/25'
                : 'bg-raised/70 border-rim'
            }`}
          >
            {/* Security Warning Notice */}
            {updateResult.is_security_update && (
              <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-lg p-3">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="leading-relaxed">
                  <strong>Wichtiges Sicherheitsupdate:</strong> Dieses Release enthält kritische Sicherheitskorrekturen. Es wird dringend empfohlen, die Anwendung zeitnah zu aktualisieren.
                </div>
              </div>
            )}

            {/* Release Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
              <div>
                <div className="font-semibold text-ink text-sm">
                  {updateResult.release_name || `Version v${updateResult.latest_version}`}
                </div>
                {formattedPublishedAt && (
                  <div className="text-xs text-muted mt-0.5">
                    Veröffentlicht am {formattedPublishedAt}
                  </div>
                )}
              </div>

              {updateResult.release_url && (
                <a
                  href={updateResult.release_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium self-start sm:self-center"
                >
                  <span>Release auf GitHub anzeigen</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Release Notes */}
            {updateResult.release_notes && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setNotesExpanded(!notesExpanded)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors"
                >
                  {notesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{notesExpanded ? 'Release-Notes einklappen' : 'Release-Notes anzeigen'}</span>
                </button>

                {notesExpanded && (
                  <div className="bg-panel border border-line rounded-lg p-3.5 text-xs font-mono text-muted whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar leading-relaxed">
                    {updateResult.release_notes}
                  </div>
                )}
              </div>
            )}

            {/* Update Instructions */}
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Terminal size={14} className="text-primary" />
                <span>Anleitung zum Aktualisieren</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Git Method */}
                <div className="bg-panel border border-line rounded-lg p-3 flex flex-col justify-between gap-2">
                  <div className="text-xs font-medium text-ink">Lokale Installation (Git):</div>
                  <div className="flex items-center justify-between gap-2 bg-canvas/80 px-2.5 py-1.5 rounded font-mono text-[11px] text-muted border border-line">
                    <code className="truncate">git pull && .\start.ps1</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('git pull && .\\start.ps1', 'git')}
                      title="Befehl kopieren"
                      className="p-1 text-muted hover:text-ink transition-colors"
                    >
                      {copiedKey === 'git' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Docker Method */}
                <div className="bg-panel border border-line rounded-lg p-3 flex flex-col justify-between gap-2">
                  <div className="text-xs font-medium text-ink">Docker-Container:</div>
                  <div className="flex items-center justify-between gap-2 bg-canvas/80 px-2.5 py-1.5 rounded font-mono text-[11px] text-muted border border-line">
                    <code className="truncate">docker compose pull && docker compose up -d</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('docker compose pull && docker compose up -d', 'docker')}
                      title="Befehl kopieren"
                      className="p-1 text-muted hover:text-ink transition-colors"
                    >
                      {copiedKey === 'docker' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
