// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useEffect, useState } from 'react'
import { Check, Copy, FileText, Palette, Play, RotateCcw } from 'lucide-react'
import { Button, ConfirmDialog } from './ui'

type PaletteColor = {
  name: string
  hex: string
}

const DEFAULT_COLOR_PALETTE: PaletteColor[] = [
  { name: 'Schwarz', hex: '#09090B' },
  { name: 'Anthrazit', hex: '#334155' },
  { name: 'Dunkelgrau', hex: '#475569' },
  { name: 'Mittelgrau', hex: '#64748B' },
  { name: 'Grau', hex: '#94A3B8' },
  { name: 'Hellgrau', hex: '#CBD5E1' },
  { name: 'Silber', hex: '#E2E8F0' },
  { name: 'Rot', hex: '#EF4444' },
  { name: 'Karminrot', hex: '#E11D48' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Bernstein', hex: '#F59E0B' },
  { name: 'Grün', hex: '#22C55E' },
  { name: 'Smaragd', hex: '#10B981' },
  { name: 'Türkis', hex: '#06B6D4' },
  { name: 'Blau', hex: '#3B82F6' },
  { name: 'Königsblau', hex: '#2563EB' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Violett', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
]

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '')
  const expanded = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized

  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  }
}

const formatHexSnippet = (hex: string) => `hexcol=${hex.replace('#', '').toUpperCase()}`

const formatLatexRgbSnippet = (hex: string) => {
  const { r, g, b } = hexToRgb(hex)
  return `{rgb,255:red,${r}; green,${g}; blue,${b}}`
}

export const ColorPaletteButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [customColor, setCustomColor] = useState('#00f900')
  const [copiedValue, setCopiedValue] = useState<string | null>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const copySnippet = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedValue(value)
    setTimeout(() => setCopiedValue(current => current === value ? null : current), 1400)
  }

  const customHexSnippet = formatHexSnippet(customColor)
  const customLatexSnippet = formatLatexRgbSnippet(customColor)

  return (
    <div ref={popoverRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className={`h-10 min-w-36 px-3 rounded-xl border flex items-center justify-center gap-2 font-display text-sm font-semibold whitespace-nowrap transition-all ${isOpen
          ? 'bg-primary/12 border-primary/40 text-primary shadow-sm'
          : 'bg-raised hover:bg-overlay border-line text-muted hover:text-ink'
          }`}
        title="Farbpalette"
        aria-label="Farbpalette öffnen"
        aria-expanded={isOpen}
      >
        <Palette size={18} />
        <span>Farbpalette</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-[min(38rem,calc(100vw-2rem))] rounded-2xl border border-rim bg-canvas/98 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-line px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-ink">Farb-Hexcodes</h2>
                <p className="text-xs text-muted mt-0.5">Hex und LaTeX RGB kopieren</p>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-line bg-raised px-2 py-1.5 cursor-pointer hover:bg-overlay transition-colors">
                <span
                  className="h-5 w-5 rounded-md border border-line"
                  style={{ backgroundColor: customColor }}
                />
                <input
                  type="color"
                  value={customColor}
                  onChange={event => setCustomColor(event.target.value)}
                  className="sr-only"
                  aria-label="Eigene Farbe wählen"
                />
              </label>
            </div>
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
              <SnippetButton value={customHexSnippet} copiedValue={copiedValue} onCopy={copySnippet} />
              <SnippetButton value={customLatexSnippet} copiedValue={copiedValue} onCopy={copySnippet} />
            </div>
          </div>

          <div className="max-h-[27rem] overflow-y-auto p-2">
            <div className="grid grid-cols-[minmax(6.5rem,1fr)_minmax(7rem,auto)_minmax(14rem,1.3fr)] gap-2 px-2 py-1 text-caption">
              <span>Farbe</span>
              <span>Hex</span>
              <span>LaTeX RGB</span>
            </div>
            {DEFAULT_COLOR_PALETTE.map(color => {
              const hexSnippet = formatHexSnippet(color.hex)
              const latexSnippet = formatLatexRgbSnippet(color.hex)

              return (
                <div
                  key={color.hex}
                  className="grid grid-cols-[minmax(6.5rem,1fr)_minmax(7rem,auto)_minmax(14rem,1.3fr)] gap-2 items-center rounded-xl px-2 py-1.5 hover:bg-raised/70"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-sm border border-line shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="truncate text-sm text-ink">{color.name}</span>
                  </div>
                  <SnippetButton value={hexSnippet} copiedValue={copiedValue} onCopy={copySnippet} compact />
                  <SnippetButton value={latexSnippet} copiedValue={copiedValue} onCopy={copySnippet} compact />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const SnippetButton = ({ value, copiedValue, onCopy, compact = false }: {
  value: string
  copiedValue: string | null
  onCopy: (value: string) => void
  compact?: boolean
}) => {
  const isCopied = copiedValue === value

  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className={`min-w-0 flex items-center justify-between gap-2 rounded-xl border text-left transition-colors ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} ${isCopied
        ? 'border-success/40 bg-success/12 text-success'
        : 'border-line bg-panel text-muted hover:bg-raised hover:text-ink'
        }`}
      title={value}
    >
      <code className="min-w-0 truncate text-[11px] font-mono">{value}</code>
      {isCopied ? <Check size={13} className="shrink-0" /> : <Copy size={13} className="shrink-0" />}
    </button>
  )
}

export const PageHeader = ({ title, description, icon, version }: {
  title: string; description?: string; icon: React.ReactNode; version?: string
}) => (
  <div className="mb-8 min-w-0">
    <div className="flex items-center gap-4 min-w-0">
      <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shrink-0">
        <div className="text-primary">{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight flex items-baseline gap-2 min-w-0">
          <span className="truncate pb-1">{title}</span>
          {version && (
            <span className="text-metadata text-muted/60 font-medium shrink-0 ml-1">v{version}</span>
          )}
        </h1>
        {description && <p className="text-sm text-muted mt-1 truncate pb-0.5">{description}</p>}
      </div>
    </div>
    <div className="mt-5 h-px bg-gradient-to-r from-primary/35 via-line to-transparent" />
  </div>
)

type GeneratorHeaderResetConfig = {
  title?: string
  message?: string
  confirmLabel?: string
  confirmClass?: string
}

export const GeneratorHeader = ({
  title,
  icon,
  version,
  showPalette = true,
  onReset,
  resetConfirmation,
  onCompile,
  isCompiling = false,
  showCompileSpinner = true,
  compileLabel = 'Kompilieren',
  compilingLabel = 'Kompiliere…',
  latexCode,
  texFilename,
  texLabel = '.tex',
  actionsBefore,
  actionsAfter,
}: {
  title: string
  icon: React.ReactNode
  version?: string
  showPalette?: boolean
  onReset?: () => void
  resetConfirmation?: false | GeneratorHeaderResetConfig
  onCompile?: () => void
  isCompiling?: boolean
  showCompileSpinner?: boolean
  compileLabel?: string
  compilingLabel?: string
  latexCode?: string | null
  texFilename?: string
  texLabel?: string
  actionsBefore?: React.ReactNode
  actionsAfter?: React.ReactNode
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const confirmConfig = resetConfirmation === false ? null : {
    title: resetConfirmation?.title ?? 'Konfiguration zurücksetzen',
    message: resetConfirmation?.message ?? 'Alle Einstellungen werden auf die Standardwerte zurückgesetzt. Nicht gespeicherte Änderungen gehen verloren.',
    confirmLabel: resetConfirmation?.confirmLabel ?? 'Zurücksetzen',
    confirmClass: resetConfirmation?.confirmClass ?? 'bg-red-600 hover:bg-red-500',
  }

  const handleResetClick = () => {
    if (!onReset) return
    if (!confirmConfig) {
      onReset()
      return
    }
    setShowResetConfirm(true)
  }

  const handleTexExport = () => {
    if (!latexCode || !texFilename) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([latexCode], { type: 'text/plain' }))
    link.download = texFilename
    link.click()
  }

  useEffect(() => {
    if (!onCompile) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((!event.ctrlKey && !event.metaKey) || event.key !== 'Enter' || event.repeat) return

      event.preventDefault()
      event.stopPropagation()
      if (!isCompiling) {
        onCompile()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isCompiling, onCompile])

  return (
    <>
      <div className="flex justify-between items-center min-w-0">
        <div className="min-w-0 flex-1">
          <PageHeader title={title} icon={icon} version={version} />
        </div>
        <div className="flex gap-2 items-center shrink-0 ml-4 mb-8">
          {showPalette && <ColorPaletteButton />}
          {actionsBefore}
          {onReset && (
            <Button
              onClick={handleResetClick}
              variant="secondary"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <RotateCcw size={16} /> Zurücksetzen
            </Button>
          )}
          {latexCode && texFilename && (
            <Button
              variant="secondary"
              className="flex items-center gap-2 whitespace-nowrap"
              onClick={handleTexExport}
            >
              <FileText size={18} /> {texLabel}
            </Button>
          )}
          {onCompile && (
            <Button
              onClick={onCompile}
              disabled={isCompiling}
              title={`${compileLabel} (Ctrl+Enter)`}
              aria-keyshortcuts="Control+Enter"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {isCompiling && showCompileSpinner
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Play size={16} />}
              {isCompiling && showCompileSpinner ? compilingLabel : compileLabel}
            </Button>
          )}
          {actionsAfter}
        </div>
      </div>

      {showResetConfirm && confirmConfig && (
        <ConfirmDialog
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          confirmClass={confirmConfig.confirmClass}
          onConfirm={() => {
            onReset?.()
            setShowResetConfirm(false)
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </>
  )
}
