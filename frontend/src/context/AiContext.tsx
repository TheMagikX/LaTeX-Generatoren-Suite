// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getAiStatus,
  getAiConfig,
  setAiProvider,
  saveGeminiKey,
  testGeminiConnection,
  stopOllama,
  extractApiErrorMessage,
  type AiStatusResponse,
  type AiProviderType,
  type GeminiTestResponse,
  type StopOllamaResponse
} from '../api/client'

interface AiContextType {
  aiEnabled: boolean
  toggleAiEnabled: (targetState?: boolean) => Promise<{ success: boolean; error?: string }>
  activeProvider: AiProviderType
  switchProvider: (provider: AiProviderType) => Promise<void>
  hasGeminiKey: boolean
  maskedGeminiKey: string | null
  geminiStatus: GeminiTestResponse | null
  setGeminiStatus: React.Dispatch<React.SetStateAction<GeminiTestResponse | null>>
  saveKey: (key: string) => Promise<{ success: boolean; masked_key?: string | null; error?: string }>
  testGemini: (key?: string) => Promise<GeminiTestResponse>
  refreshAiConfig: () => Promise<void>
  autoStopOllama: boolean
  setAutoStopOllama: (value: boolean) => void
  autoStopMode: 'unload_models' | 'stop_server'
  setAutoStopMode: (mode: 'unload_models' | 'stop_server') => void
  ollamaStatus: AiStatusResponse | null
  isChecking: boolean
  isStopping: boolean
  checkOllama: (silent?: boolean) => Promise<AiStatusResponse>
  handleStopOllama: (mode?: 'unload_models' | 'stop_server') => Promise<StopOllamaResponse>
}

const AI_STORAGE_KEY = 'generator_ai_enabled'
const AUTOSTOP_STORAGE_KEY = 'generator_ai_autostop'
const AUTOSTOP_MODE_STORAGE_KEY = 'generator_ai_autostop_mode'

const AiContext = createContext<AiContextType | null>(null)

export const AiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aiEnabled, setAiEnabledState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AI_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [activeProvider, setActiveProvider] = useState<AiProviderType>('gemini')
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false)
  const [maskedGeminiKey, setMaskedGeminiKey] = useState<string | null>(null)
  const [geminiStatus, setGeminiStatus] = useState<GeminiTestResponse | null>(null)

  const [autoStopOllama, setAutoStopOllamaState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTOSTOP_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [autoStopMode, setAutoStopModeState] = useState<'unload_models' | 'stop_server'>(() => {
    try {
      const saved = localStorage.getItem(AUTOSTOP_MODE_STORAGE_KEY)
      return saved === 'stop_server' ? 'stop_server' : 'unload_models'
    } catch {
      return 'unload_models'
    }
  })

  const [ollamaStatus, setOllamaStatus] = useState<AiStatusResponse | null>(null)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [isStopping, setIsStopping] = useState<boolean>(false)

  const setAutoStopOllama = (value: boolean) => {
    setAutoStopOllamaState(value)
    try {
      localStorage.setItem(AUTOSTOP_STORAGE_KEY, String(value))
    } catch {}
  }

  const setAutoStopMode = (mode: 'unload_models' | 'stop_server') => {
    setAutoStopModeState(mode)
    try {
      localStorage.setItem(AUTOSTOP_MODE_STORAGE_KEY, mode)
    } catch {}
  }

  const refreshAiConfig = useCallback(async () => {
    try {
      const conf = await getAiConfig()
      setActiveProvider(conf.active_provider)
      setHasGeminiKey(conf.has_gemini_key)
      setMaskedGeminiKey(conf.masked_gemini_key)
    } catch (e) {
      console.error('Fehler beim Abruf der AI Konfiguration:', e)
    }
  }, [])

  const checkOllama = useCallback(async (silent = false): Promise<AiStatusResponse> => {
    if (!silent) setIsChecking(true)
    try {
      const res = await getAiStatus()
      setOllamaStatus(res)
      if (res.active_provider) {
        setActiveProvider(res.active_provider)
      }
      if (typeof res.has_gemini_key === 'boolean') {
        setHasGeminiKey(res.has_gemini_key)
      }
      if (res.masked_gemini_key !== undefined) {
        setMaskedGeminiKey(res.masked_gemini_key)
      }
      return res
    } catch (e: unknown) {
      const fallback: AiStatusResponse = {
        available: false,
        url: 'http://localhost:11434',
        models: [],
        error: (e as Error)?.message || 'Verbindungsfehler'
      }
      setOllamaStatus(fallback)
      return fallback
    } finally {
      if (!silent) setIsChecking(false)
    }
  }, [])

  const switchProvider = async (provider: AiProviderType) => {
    try {
      await setAiProvider(provider)
      setActiveProvider(provider)
      await checkOllama(true)
    } catch (err) {
      console.error('Provider Switch Error:', err)
    }
  }

  const saveKey = async (key: string): Promise<{ success: boolean; masked_key?: string | null; error?: string }> => {
    try {
      const res = await saveGeminiKey(key)
      setMaskedGeminiKey(res.masked_key)
      setHasGeminiKey(true)
      await refreshAiConfig()
      return { success: true, masked_key: res.masked_key }
    } catch (err: unknown) {
      const msg = extractApiErrorMessage(err, 'Fehler beim Speichern des Schlüssels')
      return { success: false, error: msg }
    }
  }

  const testGemini = async (key?: string): Promise<GeminiTestResponse> => {
    try {
      const res = await testGeminiConnection(key)
      // Sicherstellen, dass auch Fehler im Response-Body echte Strings sind
      const sanitizedRes: GeminiTestResponse = {
        ...res,
        error: res.error ? (typeof res.error === 'string' ? res.error : JSON.stringify(res.error)) : null
      }
      setGeminiStatus(sanitizedRes)
      return sanitizedRes
    } catch (err: unknown) {
      const fallback: GeminiTestResponse = {
        available: false,
        error: extractApiErrorMessage(err, 'Verbindungsfehler zur Gemini API')
      }
      setGeminiStatus(fallback)
      return fallback
    }
  }

  // Initial check on mount + Window Focus & Polling
  useEffect(() => {
    refreshAiConfig()
    checkOllama(false)

    // Automatisch prüfen, sobald der Nutzer aus dem Terminal/Desktop zurück in den Browser klickt
    const handleFocus = () => {
      checkOllama(true)
    }
    window.addEventListener('focus', handleFocus)

    // Sanftes Hintergrund-Polling alle 5 Sekunden, damit der Status synchronisiert bleibt
    const interval = setInterval(() => {
      checkOllama(true)
    }, 5000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [checkOllama, refreshAiConfig])

  const handleStopOllama = async (mode?: 'unload_models' | 'stop_server'): Promise<StopOllamaResponse> => {
    setIsStopping(true)
    const targetMode = mode || autoStopMode
    try {
      const res = await stopOllama(targetMode)
      // Status nach dem Stoppen neu abfragen
      await checkOllama(false)
      return res
    } catch (err: unknown) {
      return {
        ok: false,
        mode: targetMode,
        stopped: false,
        error: (err as Error)?.message || 'Fehler beim Stoppen von Ollama'
      }
    } finally {
      setIsStopping(false)
    }
  }

  const toggleAiEnabled = async (targetState?: boolean): Promise<{ success: boolean; error?: string }> => {
    const nextState = targetState !== undefined ? targetState : !aiEnabled

    if (nextState) {
      if (activeProvider === 'gemini') {
        if (!hasGeminiKey) {
          setAiEnabledState(false)
          try {
            localStorage.setItem(AI_STORAGE_KEY, 'false')
          } catch {}
          return {
            success: false,
            error: 'Bitte hinterlege zuerst deinen Google Gemini API-Schlüssel in den Einstellungen!'
          }
        }
        setAiEnabledState(true)
        try {
          localStorage.setItem(AI_STORAGE_KEY, 'true')
        } catch {}
        return { success: true }
      }

      // Bei lokalem Ollama:
      let current = ollamaStatus
      if (!current || !current.available) {
        current = await checkOllama(false)
      }

      if (!current.available) {
        setAiEnabledState(false)
        try {
          localStorage.setItem(AI_STORAGE_KEY, 'false')
        } catch {}
        return {
          success: false,
          error: `Ollama ist unter ${current.url || 'http://localhost:11434'} nicht erreichbar. Bitte starte Ollama zuerst auf deinem PC!`
        }
      }

      setAiEnabledState(true)
      try {
        localStorage.setItem(AI_STORAGE_KEY, 'true')
      } catch {}
      return { success: true }
    } else {
      // Ausschalten
      setAiEnabledState(false)
      try {
        localStorage.setItem(AI_STORAGE_KEY, 'false')
      } catch {}

      // Falls gewünscht und Ollama aktiv, Ollama beim Deaktivieren stoppen/entladen
      if (activeProvider === 'ollama' && autoStopOllama) {
        handleStopOllama(autoStopMode).catch(() => {})
      }

      return { success: true }
    }
  }

  return (
    <AiContext.Provider
      value={{
        aiEnabled,
        toggleAiEnabled,
        activeProvider,
        switchProvider,
        hasGeminiKey,
        maskedGeminiKey,
        geminiStatus,
        setGeminiStatus,
        saveKey,
        testGemini,
        refreshAiConfig,
        autoStopOllama,
        setAutoStopOllama,
        autoStopMode,
        setAutoStopMode,
        ollamaStatus,
        isChecking,
        isStopping,
        checkOllama,
        handleStopOllama,
      }}
    >
      {children}
    </AiContext.Provider>
  )
}

export const useAi = (): AiContextType => {
  const context = useContext(AiContext)
  if (!context) {
    throw new Error('useAi must be used within an AiProvider')
  }
  return context
}
