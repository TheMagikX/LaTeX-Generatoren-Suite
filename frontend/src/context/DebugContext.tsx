// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

export type CompilerEngine = 'xelatex' | 'pdflatex'

export interface DebugTelemetry {
  id: string
  timestamp: string
  generatorName?: string
  status: 'idle' | 'running' | 'success' | 'error'
  engine?: CompilerEngine
  // Timings (in seconds)
  buildCodeTime?: number // Zeit zur Erstellung des LaTeX-Codes (Generator / Solver)
  compileTime?: number // XeLaTeX / pdfLaTeX Engine-Zeit (Backend)
  convertTime?: number // PDF -> PNG / SVG Konvertierung (Backend)
  totalBackendTime?: number // Backend Gesamtzeit
  networkRtt?: number // Gesamte Client-Roundtrip-Laufzeit (Netzwerk + Backend)
  totalTime?: number // Gesamtlaufzeit vom Klick bis zum fertigen Rendering
  // Metriken & Größen
  latexChars?: number
  latexLines?: number
  latexSizeBytes?: number
  pdfSizeBytes?: number
  pngSizeBytes?: number
  dpi?: number
  errorMessage?: string
}

interface DebugContextType {
  debugMode: boolean
  setDebugMode: (enabled: boolean) => void
  compilerEngine: CompilerEngine
  setCompilerEngine: (engine: CompilerEngine) => void
  telemetry: DebugTelemetry | null
  history: DebugTelemetry[]
  recordTelemetry: (telemetry: Partial<DebugTelemetry>) => void
  clearTelemetry: () => void
}

const DEBUG_STORAGE_KEY = 'generator_debug_mode'
const ENGINE_STORAGE_KEY = 'generator_compiler_engine'

export const getGlobalCompilerEngine = (): CompilerEngine => {
  try {
    const saved = localStorage.getItem(ENGINE_STORAGE_KEY)
    if (saved === 'pdflatex' || saved === 'xelatex') {
      return saved
    }
    if (saved === 'lualatex') {
      localStorage.setItem(ENGINE_STORAGE_KEY, 'xelatex')
    }
  } catch {}
  return 'xelatex'
}

// Global telemetry dispatcher so api/client can push telemetry updates even outside React lifecycle if needed
type TelemetryListener = (telemetry: Partial<DebugTelemetry>) => void
const telemetryListeners = new Set<TelemetryListener>()

export const emitGlobalTelemetry = (telemetry: Partial<DebugTelemetry>) => {
  telemetryListeners.forEach(fn => fn(telemetry))
}

const DebugContext = createContext<DebugContextType | undefined>(undefined)

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [debugMode, setDebugModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DEBUG_STORAGE_KEY)
      return saved !== null ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  const [compilerEngine, setCompilerEngineState] = useState<CompilerEngine>(getGlobalCompilerEngine)

  const setCompilerEngine = useCallback((engine: CompilerEngine) => {
    setCompilerEngineState(engine)
    try {
      localStorage.setItem(ENGINE_STORAGE_KEY, engine)
    } catch (e) {
      console.warn('Failed to save compiler engine to localStorage', e)
    }
  }, [])

  const [telemetry, setTelemetry] = useState<DebugTelemetry | null>(null)
  const [history, setHistory] = useState<DebugTelemetry[]>([])
  const activeTelemetryRef = useRef<DebugTelemetry | null>(null)

  const setDebugMode = useCallback((enabled: boolean) => {
    setDebugModeState(enabled)
    try {
      localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(enabled))
    } catch (e) {
      console.warn('Failed to save debug mode to localStorage', e)
    }
  }, [])

  const recordTelemetry = useCallback((update: Partial<DebugTelemetry>) => {
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`

    setTelemetry(prev => {
      const isNew = !prev || (update.status === 'running' && prev.status !== 'running') || (update.id !== undefined && update.id !== prev.id)
      const base: DebugTelemetry = isNew ? {
        id: update.id || Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        status: 'running',
        ...update,
      } : {
        ...prev,
        timestamp: update.timestamp || timeStr,
        ...update,
      }
      activeTelemetryRef.current = base

      if (base.status === 'success' || base.status === 'error') {
        setHistory(h => [base, ...h.slice(0, 19)]) // Keep last 20
      }

      return base
    })
  }, [])

  const clearTelemetry = useCallback(() => {
    setTelemetry(null)
    setHistory([])
    activeTelemetryRef.current = null
  }, [])

  useEffect(() => {
    const listener: TelemetryListener = (update) => {
      recordTelemetry(update)
    }
    telemetryListeners.add(listener)
    return () => {
      telemetryListeners.delete(listener)
    }
  }, [recordTelemetry])

  return (
    <DebugContext.Provider
      value={{
        debugMode,
        setDebugMode,
        compilerEngine,
        setCompilerEngine,
        telemetry,
        history,
        recordTelemetry,
        clearTelemetry,
      }}
    >
      {children}
    </DebugContext.Provider>
  )
}

export const useDebug = () => {
  const context = useContext(DebugContext)
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider')
  }
  return context
}
