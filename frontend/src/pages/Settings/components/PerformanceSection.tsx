// SPDX-License-Identifier: AGPL-3.0-or-later

import { Zap } from 'lucide-react'
import { useDebug } from '../../../context/DebugContext'

export function PerformanceSection() {
  const { debugMode, setDebugMode, compilerEngine, setCompilerEngine } = useDebug()

  return (
    <section className="pt-4 border-t border-line">
      <div className="flex items-center gap-2 mb-3.5">
        <Zap size={14} className="text-primary" />
        <h2 className="text-caption font-semibold">
          Entwickler- & Performance-Optionen
        </h2>
      </div>
      <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink text-sm">Debug-Modus & Performance-Profiling</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Live Badge
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Aktiviert ein persistentes Floating-Badge am unteren Bildschirmrand, das bei jeder Kompilierung detaillierte Timings (Code-Generierung, LaTeX-Compiler, PDF-zu-PNG-Rasterung, Netzwerk-RTT) und Artefaktgrößen aufschlüsselt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDebugMode(!debugMode)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              debugMode ? 'bg-primary' : 'bg-raised border-rim'
            }`}
            role="switch"
            aria-checked={debugMode}
            title={debugMode ? 'Debug-Modus deaktivieren' : 'Debug-Modus aktivieren'}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                debugMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Compiler Engine Switcher */}
        {debugMode && (
          <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="space-y-0.5">
              <div className="font-medium text-xs text-ink">Standard LaTeX-Compiler-Engine</div>
              <div className="text-[11px] text-muted">
                Wähle das TeX-Kompilierungsprogramm (Standard: XeLaTeX für Fontspec & UTF-8).
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-raised/70 rounded-xl border border-rim self-start sm:self-center">
              {(['xelatex', 'pdflatex'] as const).map(eng => {
                const isSel = compilerEngine === eng
                const label = eng === 'pdflatex' ? 'pdfLaTeX' : 'XeLaTeX'
                return (
                  <button
                    key={eng}
                    type="button"
                    onClick={() => setCompilerEngine(eng)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      isSel
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted hover:text-ink hover:bg-raised'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
