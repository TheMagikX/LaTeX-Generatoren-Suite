// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  FileCode,
  FileImage,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useDebug } from '../context/DebugContext'

const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`
}

const formatSeconds = (sec?: number): string => {
  if (sec === undefined || sec === null) return '-'
  if (sec < 0.01) return '< 0.01s'
  return `${sec.toFixed(2)}s`
}

export const FloatingDebugBadge: React.FC = () => {
  const { debugMode, compilerEngine, setCompilerEngine, telemetry, history, clearTelemetry } = useDebug()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!debugMode) {
    return null
  }

  const hasData = !!telemetry
  const isRunning = telemetry?.status === 'running'
  const isError = telemetry?.status === 'error'
  const activeEngine = telemetry?.engine || compilerEngine

  const compileTime = telemetry?.compileTime ?? 0
  const convertTime = telemetry?.convertTime ?? 0
  const buildCodeTime = telemetry?.buildCodeTime ?? 0
  const networkRtt = telemetry?.networkRtt ?? 0
  const totalTime = telemetry?.totalTime ?? ((telemetry?.totalBackendTime ?? 0) + networkRtt)

  // Segment percentages for visual bar
  const validTotal = Math.max(totalTime, 0.001)
  const pctBuild = Math.min(100, Math.max(0, (buildCodeTime / validTotal) * 100))
  const pctCompile = Math.min(100, Math.max(0, (compileTime / validTotal) * 100))
  const pctConvert = Math.min(100, Math.max(0, (convertTime / validTotal) * 100))
  const pctNetwork = Math.min(100, Math.max(0, (networkRtt / validTotal) * 100))

  const formatEngine = (eng?: string) => {
    if (eng === 'pdflatex') return 'pdfLaTeX'
    return 'XeLaTeX'
  }

  const handleCopy = async () => {
    if (!telemetry) return
    const report = `--- GENERATOR SUITE DEBUG REPORT ---
Zeitstempel: ${telemetry.timestamp}
Status: ${telemetry.status}
Compiler Engine: ${formatEngine(telemetry.engine || compilerEngine)}
Gesamtzeit: ${formatSeconds(telemetry.totalTime)}
- Code-Generierung: ${formatSeconds(telemetry.buildCodeTime)}
- ${formatEngine(telemetry.engine || compilerEngine)} Kompilierung: ${formatSeconds(telemetry.compileTime)}
- PDF->PNG Konvertierung: ${formatSeconds(telemetry.convertTime)}
- Backend Gesamtzeit: ${formatSeconds(telemetry.totalBackendTime)}
- Netzwerk & RTT: ${formatSeconds(telemetry.networkRtt)}

Größen & Metriken:
- LaTeX: ${telemetry.latexLines ?? '-'} Zeilen (${formatBytes(telemetry.latexSizeBytes)})
- PDF: ${formatBytes(telemetry.pdfSizeBytes)}
- PNG: ${formatBytes(telemetry.pngSizeBytes)}
- DPI: ${telemetry.dpi ?? 600}
${telemetry.errorMessage ? `\nFehlermeldung:\n${telemetry.errorMessage}` : ''}`

    await navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed bottom-4 right-6 z-50 flex flex-col items-end gap-2 font-mono text-xs select-none">
      {/* Expanded Popout Card */}
      {expanded && (
        <div className="w-[420px] max-w-[calc(100vw-2rem)] bg-panel/95 backdrop-blur-md border border-line rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 text-ink">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-raised/50 border-b border-line">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-primary" />
              <span className="font-semibold font-body text-sm text-ink">Performance & Profiling</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!hasData}
                title="Diagnosedaten in Zwischenablage kopieren"
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-raised transition-colors disabled:opacity-40"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                onClick={clearTelemetry}
                title="Messungen zurücksetzen"
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-raised transition-colors"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-raised transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar font-body">
            {/* Compiler Engine Quick Switcher */}
            <div className="p-3 rounded-xl bg-raised/40 border border-line space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink">Compiler-Engine:</span>
                <span className="font-mono text-[11px] text-primary font-semibold">{formatEngine(compilerEngine)}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['xelatex', 'pdflatex'] as const).map(eng => {
                  const isSel = compilerEngine === eng
                  return (
                    <button
                      key={eng}
                      type="button"
                      onClick={() => setCompilerEngine(eng)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                        isSel
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-raised/70 text-muted hover:text-ink hover:bg-raised border border-line'
                      }`}
                    >
                      {formatEngine(eng)}
                    </button>
                  )
                })}
              </div>
            </div>

            {!hasData ? (
              <div className="py-6 text-center text-muted">
                <Sparkles size={24} className="mx-auto mb-2 opacity-40 text-primary" />
                <p className="text-xs">Noch keine Kompilierung ausgeführt.</p>
                <p className="text-[11px] text-muted/70 mt-1">
                  Starte eine Generierung mit <strong>{formatEngine(compilerEngine)}</strong>, um Live-Timings zu sehen.
                </p>
              </div>
            ) : (
              <>
                {/* Status & Total Summary */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-raised/70 border border-line">
                  <div className="flex items-center gap-2.5">
                    {isRunning ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    ) : isError ? (
                      <AlertCircle size={18} className="text-red-500 shrink-0" />
                    ) : (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-ink">
                        {isRunning
                          ? 'Kompiliere...'
                          : isError
                          ? 'Fehler bei der Kompilierung'
                          : 'Erfolgreich generiert'}
                      </div>
                      <div className="text-[10px] font-mono text-muted">{telemetry.timestamp}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted">Gesamtdauer</div>
                    <div className="font-mono font-bold text-sm text-primary">
                      {formatSeconds(telemetry.totalTime)}
                    </div>
                  </div>
                </div>

                {/* Visual Pipeline Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>Phasen-Aufteilung</span>
                    <span className="font-mono">{formatSeconds(totalTime)}</span>
                  </div>
                  <div className="h-3.5 w-full bg-raised rounded-lg overflow-hidden flex border border-line/60">
                    {pctBuild > 0 && (
                      <div
                        style={{ width: `${pctBuild}%` }}
                        className="bg-sky-500/80 hover:brightness-110 transition-all"
                        title={`Code-Generierung: ${formatSeconds(buildCodeTime)} (${pctBuild.toFixed(0)}%)`}
                      />
                    )}
                    {pctCompile > 0 && (
                      <div
                        style={{ width: `${pctCompile}%` }}
                        className="bg-amber-500/80 hover:brightness-110 transition-all"
                        title={`XeLaTeX: ${formatSeconds(compileTime)} (${pctCompile.toFixed(0)}%)`}
                      />
                    )}
                    {pctConvert > 0 && (
                      <div
                        style={{ width: `${pctConvert}%` }}
                        className="bg-emerald-500/80 hover:brightness-110 transition-all"
                        title={`PDF->PNG: ${formatSeconds(convertTime)} (${pctConvert.toFixed(0)}%)`}
                      />
                    )}
                    {pctNetwork > 0 && (
                      <div
                        style={{ width: `${pctNetwork}%` }}
                        className="bg-purple-500/80 hover:brightness-110 transition-all"
                        title={`Netzwerk/Transfer: ${formatSeconds(networkRtt)} (${pctNetwork.toFixed(0)}%)`}
                      />
                    )}
                  </div>
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    {buildCodeTime > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-sky-500" />
                        <span className="text-muted truncate">Code-Gen:</span>
                        <span className="font-mono font-medium ml-auto">{formatSeconds(buildCodeTime)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm bg-amber-500" />
                      <span className="text-muted truncate">{formatEngine(telemetry.engine || compilerEngine)}:</span>
                      <span className="font-mono font-medium ml-auto">{formatSeconds(compileTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                      <span className="text-muted truncate">PDF $\to$ PNG:</span>
                      <span className="font-mono font-medium ml-auto">{formatSeconds(convertTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm bg-purple-500" />
                      <span className="text-muted truncate">Netzwerk:</span>
                      <span className="font-mono font-medium ml-auto">{formatSeconds(networkRtt)}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-raised/40 border border-line flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-muted text-[11px]">
                      <FileCode size={13} className="text-sky-500" />
                      <span>LaTeX Quelltext</span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-ink">
                      {telemetry.latexLines ?? '-'} Zeilen{' '}
                      <span className="font-normal text-muted font-mono text-[10px]">
                        ({formatBytes(telemetry.latexSizeBytes)})
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-raised/40 border border-line flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-muted text-[11px]">
                      <FileImage size={13} className="text-emerald-500" />
                      <span>PNG-Bild</span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-ink">
                      {formatBytes(telemetry.pngSizeBytes)}{' '}
                      <span className="font-normal text-muted font-mono text-[10px]">
                        @{telemetry.dpi ?? 600} DPI
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-raised/40 border border-line flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-muted text-[11px]">
                      <Layers size={13} className="text-amber-500" />
                      <span>PDF Dokument</span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-ink">
                      {formatBytes(telemetry.pdfSizeBytes)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-raised/40 border border-line flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-muted text-[11px]">
                      <Clock size={13} className="text-purple-500" />
                      <span>Backend Gesamt</span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-ink">
                      {formatSeconds(telemetry.totalBackendTime)}
                    </div>
                  </div>
                </div>

                {/* Error Box if any */}
                {telemetry.errorMessage && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 space-y-1">
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      <span>Compiler-Fehlermeldung:</span>
                    </div>
                    <pre className="font-mono text-[10px] whitespace-pre-wrap max-h-24 overflow-y-auto custom-scrollbar p-1.5 bg-black/30 rounded border border-red-500/20 text-red-200">
                      {telemetry.errorMessage}
                    </pre>
                  </div>
                )}

                {/* Recent History */}
                {history.length > 1 && (
                  <div className="pt-2 border-t border-line space-y-1.5">
                    <div className="text-[11px] text-muted font-medium">Verlauf (letzte {history.length})</div>
                    <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                      {history.slice(1, 5).map(h => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between text-[10px] font-mono p-1.5 rounded-lg bg-raised/30 hover:bg-raised/60 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={h.status === 'success' ? 'text-emerald-500' : 'text-red-500'}>
                              {h.status === 'success' ? '✓' : '✗'}
                            </span>
                            <span className="text-muted">{h.timestamp}</span>
                            <span className="text-muted/60 text-[9px]">({formatEngine(h.engine)})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted">TeX: {formatSeconds(h.compileTime)}</span>
                            <span className="text-primary font-semibold">Σ {formatSeconds(h.totalTime)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Persistent Floating Badge Button (Pill) */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
          expanded
            ? 'bg-primary/20 border-primary/50 text-ink ring-1 ring-primary/40'
            : isRunning
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
            : isError
            ? 'bg-red-500/20 border-red-500/40 text-red-300'
            : 'bg-panel/90 hover:bg-panel border-line hover:border-primary/40 text-ink'
        }`}
      >
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          <Zap size={14} className={isRunning ? 'animate-spin' : ''} />
          <span className="font-mono text-[11px]">DEBUG</span>
        </div>

        <div className="h-3.5 w-px bg-line" />

        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-raised border border-rim text-muted">
          {formatEngine(activeEngine)}
        </span>

        {isRunning ? (
          <span className="text-[11px] font-medium text-amber-300 font-body">Kompiliere...</span>
        ) : !hasData ? (
          <span className="text-[11px] text-muted font-body">Bereit</span>
        ) : (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-mono font-bold text-ink">
              {formatSeconds(totalTime)}
            </span>
            <span className="text-muted text-[10px] hidden sm:inline font-mono">
              (TeX: {formatSeconds(compileTime)} · PNG: {formatSeconds(convertTime)})
            </span>
            {telemetry?.pngSizeBytes ? (
              <span className="text-muted/80 text-[10px] hidden md:inline font-mono">
                · {formatBytes(telemetry.pngSizeBytes)}
              </span>
            ) : null}
          </div>
        )}

        <div className="text-muted group-hover:text-ink transition-colors ml-0.5">
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </button>
    </div>
  )
}
