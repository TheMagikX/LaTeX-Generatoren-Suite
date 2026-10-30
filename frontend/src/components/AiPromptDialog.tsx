// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles, X, RefreshCw, AlertCircle, CheckCircle2,
  Cpu, Send, RotateCcw, Undo2, ChevronRight, HelpCircle, Cloud
} from 'lucide-react'
import {
  getAiStatus,
  chatToConfig,
  extractApiErrorMessage,
  type AiStatusResponse,
  type AiChatMessage
} from '../api/client'
import { useAi } from '../context/AiContext'
import { Button } from './ui'

export interface ChatMessageItem<T> {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  configSnapshot?: T
}

interface AiPromptDialogProps<T> {
  generator: string
  generatorTitle: string
  isOpen: boolean
  onClose: () => void
  onApplyConfig: (config: T) => void
  currentConfig?: T
  promptExamples?: { label: string; text: string }[]
}

const DEFAULT_FOLLOWUP_SUGGESTIONS = [
  'Wahrscheinlichkeiten als Brüche angeben',
  'Beschriftungen der Knoten anpassen',
  'Farben und Hervorhebungen ändern',
  'Eine weitere Stufe hinzufügen'
]

export function AiPromptDialog<T extends object>({
  generator,
  generatorTitle,
  isOpen,
  onClose,
  onApplyConfig,
  currentConfig,
  promptExamples = [],
}: AiPromptDialogProps<T>) {
  const { autoStopOllama, autoStopMode, handleStopOllama, activeProvider, hasGeminiKey } = useAi()

  const [inputPrompt, setInputPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessageItem<T>[]>([])
  const [activeConfig, setActiveConfig] = useState<T | undefined>(currentConfig)
  const initialConfigRef = useRef<T | undefined>(currentConfig)

  const [status, setStatus] = useState<AiStatusResponse | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isGenerating, isOpen])

  // Sync initial config on opening
  useEffect(() => {
    if (isOpen) {
      if (!initialConfigRef.current && currentConfig) {
        initialConfigRef.current = JSON.parse(JSON.stringify(currentConfig))
      }
      setActiveConfig(currentConfig)
      checkStatus()
      setErrorMsg(null)
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isOpen])

  const checkStatus = async () => {
    setIsCheckingStatus(true)
    setErrorMsg(null)
    try {
      const res = await getAiStatus()
      setStatus(res)
      if (res.available && res.models && res.models.length > 0) {
        if (!selectedModel || !res.models.includes(selectedModel)) {
          setSelectedModel(res.default_model || res.models[0])
        }
      } else if (activeProvider === 'gemini' && !selectedModel) {
        setSelectedModel(res.default_model || res.model || 'gemini-3-flash-preview')
      }
    } catch (e: unknown) {
      setStatus({
        available: false,
        url: 'http://localhost:11434',
        models: [],
        error: (e as Error)?.message || 'Verbindungsfehler zu Ollama'
      })
    } finally {
      setIsCheckingStatus(false)
    }
  }

  if (!isOpen) return null

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend !== undefined ? textToSend : inputPrompt).trim()
    if (!promptText || isGenerating) return

    setErrorMsg(null)
    setInputPrompt('')

    const userMessageId = `user_${Date.now()}`
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userItem: ChatMessageItem<T> = {
      id: userMessageId,
      role: 'user',
      content: promptText,
      timestamp: timeStr,
    }

    const newHistory = [...messages, userItem]
    setMessages(newHistory)
    setIsGenerating(true)

    // Build payload for API: only send role & content to keep context lean
    const apiMessages: AiChatMessage[] = newHistory.map(m => ({
      role: m.role,
      content: m.content
    }))

    try {
      const res = await chatToConfig<T>({
        generator,
        messages: apiMessages,
        current_config: (activeConfig || currentConfig) as Record<string, unknown> | undefined,
        model: selectedModel || undefined,
        provider: activeProvider,
      })

      if (res.ok && res.config) {
        const assistantItem: ChatMessageItem<T> = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: res.message || 'Konfiguration wurde erfolgreich aktualisiert.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          configSnapshot: res.config,
        }

        setMessages(prev => [...prev, assistantItem])
        setActiveConfig(res.config)
        // Apply directly to generator for live background updates
        onApplyConfig(res.config)
      } else {
        setErrorMsg('Die Konfiguration konnte vom Modell nicht erzeugt werden.')
      }
    } catch (err: unknown) {
      console.error('Chat to config error:', err)
      const detail = extractApiErrorMessage(err, 'Unbekannter Fehler bei der Generierung')
      setErrorMsg(detail)
    } finally {
      setIsGenerating(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleRollback = (snapshot?: T) => {
    if (!snapshot) return
    setActiveConfig(snapshot)
    onApplyConfig(snapshot)
  }

  const handleResetChat = () => {
    setMessages([])
    setErrorMsg(null)
    if (initialConfigRef.current) {
      setActiveConfig(initialConfigRef.current)
      onApplyConfig(initialConfigRef.current)
    }
  }

  const handleCloseAndFinalize = () => {
    if (activeProvider === 'ollama' && autoStopOllama) {
      handleStopOllama(autoStopMode).catch(err => console.warn('Autostop failed:', err))
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-panel border border-rim rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden h-[85vh] max-h-[780px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-raised/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-ink text-base font-display">
                  KI-Assistent & Chat
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {generatorTitle}
                </span>
              </div>
              <p className="text-xs text-muted">
                {activeProvider === 'gemini'
                  ? 'Iterative Verfeinerung & Konfiguration via Google Gemini (Cloud Turbo)'
                  : 'Iterative Verfeinerung und Konfiguration über dein lokales Ollama'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleResetChat}
                className="p-2 rounded-xl text-muted hover:text-ink hover:bg-raised transition-colors flex items-center gap-1.5 text-xs"
                title="Chatverlauf leeren und auf Ursprungszustand zurücksetzen"
              >
                <RotateCcw size={15} />
                <span className="hidden sm:inline">Neuer Chat</span>
              </button>
            )}
            <button
              onClick={handleCloseAndFinalize}
              className="p-2 rounded-xl text-muted hover:text-ink hover:bg-raised transition-colors"
              title="Schließen"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* AI Status Bar (Dual-Provider: Ollama / Gemini) */}
        <div className="px-6 py-2.5 bg-raised/20 border-b border-line flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {activeProvider === 'gemini' ? (
              status?.available ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Gemini Cloud bereit ({status.model || status.default_model || 'gemini-3.5-flash'})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  <AlertCircle size={14} className="text-amber-500" />
                  {hasGeminiKey ? 'Gemini API nicht erreichbar' : 'Kein Gemini API-Schlüssel hinterlegt'}
                </span>
              )
            ) : (
              status?.available ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Ollama bereit
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  <AlertCircle size={14} className="text-amber-500" />
                  Ollama offline ({status?.url || 'http://localhost:11434'})
                </span>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeProvider === 'gemini' ? (
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted bg-panel border border-line px-2 py-1 rounded-lg">
                <Cloud size={13} className="text-amber-500" />
                <span>{selectedModel || status?.model || 'gemini-3.5-flash'}</span>
              </div>
            ) : (
              status?.available && status.models && status.models.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Cpu size={13} className="text-primary" />
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-panel border border-line rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    {status.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}

            <button
              onClick={checkStatus}
              disabled={isCheckingStatus}
              className="p-1 rounded-lg text-muted hover:text-ink hover:bg-panel transition-colors"
              title="KI-Verbindung neu prüfen"
            >
              <RefreshCw size={13} className={isCheckingStatus ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center max-w-md mx-auto py-8 space-y-5">
              <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <Sparkles size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-ink text-base font-display">
                  Wie soll dein {generatorTitle} aussehen?
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Beschreibe dein didaktisches Vorhaben in natürlicher Sprache. Danach kannst du jederzeit im Chat Feinheiten nachjustieren.
                </p>
              </div>

              {promptExamples.length > 0 && (
                <div className="w-full space-y-2 text-left pt-2">
                  <div className="text-[11px] font-medium text-muted flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-amber-500" />
                    <span>Beliebte Schnellstart-Beispiele:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {promptExamples.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(ex.text)}
                        disabled={isGenerating || (!status?.available && !(activeProvider === 'gemini' && hasGeminiKey))}
                        className="p-3 rounded-2xl bg-raised/70 hover:bg-raised border border-line hover:border-amber-500/30 text-left transition-all group flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-medium text-ink group-hover:text-amber-500 transition-colors">
                            {ex.label}
                          </div>
                          <div className="text-[11px] text-muted line-clamp-2 mt-0.5">
                            {ex.text}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-ghost group-hover:text-ink shrink-0 mt-1 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col ${
                  item.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    item.role === 'user'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-ink rounded-tr-sm'
                      : 'bg-raised/80 border border-line text-ink rounded-tl-sm'
                  }`}
                >
                  {item.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 mb-1">
                      <Sparkles size={13} />
                      <span>KI-Assistent</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{item.content}</p>

                  <div className="flex items-center justify-between gap-3 mt-2 text-[10px] text-muted">
                    <span>{item.timestamp}</span>

                    {item.role === 'assistant' && item.configSnapshot && (
                      <button
                        type="button"
                        onClick={() => handleRollback(item.configSnapshot)}
                        className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                        title="Diesen Konfigurationsstand im Generator aktivieren"
                      >
                        <Undo2 size={11} /> Stand laden
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isGenerating && (
            <div className="flex flex-col items-start">
              <div className="bg-raised/80 border border-line rounded-3xl rounded-tl-sm px-4 py-3 text-sm text-muted flex items-center gap-2.5">
                <RefreshCw size={14} className="animate-spin text-amber-500" />
                <span className="text-xs">
                  Modell <span className="font-mono text-ink">{selectedModel || 'Ollama'}</span> berechnet Konfiguration...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-6 mb-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Follow-up Chips (if chat is active) */}
        {messages.length > 0 && !isGenerating && (
          <div className="px-6 py-1.5 bg-raised/10 border-t border-line/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-muted whitespace-nowrap">Vorschläge:</span>
            {DEFAULT_FOLLOWUP_SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-raised hover:bg-overlay border border-line text-muted hover:text-ink whitespace-nowrap transition-colors"
              >
                + {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-raised/30 border-t border-line">
          <div className="flex items-end gap-2 bg-panel border border-rim rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
            <textarea
              ref={textareaRef}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                messages.length === 0
                  ? `z. B. 2-facher Münzwurf oder Urne mit 4 roten Kugeln... (Enter zum Senden)`
                  : 'Schreibe eine Verfeinerung oder Änderung... (Enter zum Senden)'
              }
              rows={2}
              disabled={isGenerating || (!status?.available && !(activeProvider === 'gemini' && hasGeminiKey))}
              className="flex-1 bg-transparent border-0 resize-none text-xs text-ink placeholder:text-ghost focus:outline-none p-1.5 max-h-28"
            />

            <Button
              onClick={() => handleSendMessage()}
              disabled={!status?.available || !inputPrompt.trim() || isGenerating}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold p-2.5 rounded-xl h-auto shrink-0 shadow-sm disabled:opacity-50"
              title="Nachricht senden (Enter)"
            >
              {isGenerating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-3 text-[11px] text-muted px-1">
            <span>
              Tipp: <kbd className="px-1 py-0.5 bg-raised border border-line rounded text-[10px]">Enter</kbd> zum Senden, <kbd className="px-1 py-0.5 bg-raised border border-line rounded text-[10px]">Shift+Enter</kbd> für Zeilenumbruch
            </span>

            <button
              type="button"
              onClick={handleCloseAndFinalize}
              className="font-medium text-ink hover:text-primary transition-colors"
            >
              Fertig & Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
