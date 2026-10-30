// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState, useEffect } from 'react'
import {
  ChevronDown, ChevronUp, ChevronLeft, RotateCw, XCircle,
  Download, FileText, Clipboard, Copy, Check, CheckCircle2,
  Plus, Minus, Maximize2, X, AlertTriangle,
} from 'lucide-react'
import { extractTikzCode } from '../utils/extractTikzCode'

/* ─── Button ─────────────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-amber-400 text-canvas font-semibold shadow-sm',
  secondary: 'bg-raised hover:bg-overlay text-muted hover:text-ink border border-line shadow-none',
  ghost: 'bg-transparent hover:bg-raised text-ghost hover:text-muted shadow-none',
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg' }
>(({ className = '', variant = 'primary', size = 'md', ...props }, ref) => (
  <button
    ref={ref}
    className={`rounded-xl font-display transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] ${BUTTON_VARIANTS[variant]} ${size === 'sm' ? 'px-3 py-1 text-xs' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
      } ${className}`}
    {...props}
  />
))
Button.displayName = 'Button'

/* ─── Input ──────────────────────────────────────────────────────────────────── */

export const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full px-3 py-2 bg-raised border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-sm text-ink placeholder:text-ghost transition-all h-[38px] ${className}`}
    {...props}
  />
)

/* ─── Select ─────────────────────────────────────────────────────────────────── */

export const Select = ({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={`w-full px-3 py-2 bg-raised border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-sm text-ink transition-all cursor-pointer h-[38px] ${className}`}
    {...props}
  />
)

/* ─── Label ──────────────────────────────────────────────────────────────────── */

export const Label = ({ className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`block text-caption mb-2 ${className}`} {...props} />
)

/* ─── Card ───────────────────────────────────────────────────────────────────── */

export const Card = ({ className = '', style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-panel border border-line rounded-2xl overflow-hidden shrink-0 ${className}`} style={style} {...props} />
)

/* ─── NumberInput ────────────────────────────────────────────────────────────── */

export const NumberInput = ({
  value, onChange, className = '', step, min, max, ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const toDisplay = (v: unknown) => { if (v === null || v === undefined || v === '') return ''; const n = Number(v); return isNaN(n) ? '' : String(n).replace('.', ',') }
  const parseDisplay = (s: string) => parseFloat(s.replace(',', '.'))

  const [localStr, setLocalStr] = React.useState(() => toDisplay(value))
  const isFocused = React.useRef(false)

  React.useEffect(() => { if (!isFocused.current) setLocalStr(toDisplay(value)) }, [value])

  const stepVal = step !== undefined ? Number(step) : 1
  const minVal = min !== undefined ? Number(min) : -Infinity
  const maxVal = max !== undefined ? Number(max) : Infinity

  const fireChange = (newVal: number) => {
    if (!onChange) return
    onChange({ target: { value: String(newVal) } } as React.ChangeEvent<HTMLInputElement>)
  }

  const handleStep = (dir: 1 | -1) => {
    const base = isNaN(parseDisplay(localStr)) ? 0 : parseDisplay(localStr)
    const next = Math.min(maxVal, Math.max(minVal, base + dir * stepVal))
    const dec = (String(stepVal).split('.')[1] ?? '').length
    const rounded = parseFloat(next.toFixed(dec))
    setLocalStr(String(rounded).replace('.', ','))
    fireChange(rounded)
  }

  return (
    <div className={`flex rounded-lg overflow-hidden border border-line focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 bg-raised transition-all h-[38px] ${className}`}>
      <input
        type="text"
        inputMode="decimal"
        value={localStr}
        onFocus={() => { isFocused.current = true }}
        onBlur={() => {
          isFocused.current = false
          const parsed = parseDisplay(localStr)
          setLocalStr(isNaN(parsed) ? toDisplay(value) : String(parsed).replace('.', ','))
        }}
        onChange={(e) => {
          const normalized = e.target.value.replace(/[^0-9\-,.]/, '').replace('.', ',')
          setLocalStr(normalized)
          if (normalized === '') {
            if (onChange) onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
          } else {
            const parsed = parseDisplay(normalized)
            if (!isNaN(parsed) && onChange)
              onChange({ target: { value: String(parsed) } } as React.ChangeEvent<HTMLInputElement>)
          }
        }}
        className="flex-1 min-w-0 px-3 py-2 bg-transparent focus:outline-none text-sm text-ink"
        step={step} min={min} max={max} {...props}
      />
      <div className="flex flex-col border-l border-line shrink-0">
        <button type="button" tabIndex={-1} onClick={() => handleStep(1)}
          className="flex-1 flex items-center justify-center px-2 hover:bg-overlay active:bg-line transition-colors text-ghost hover:text-muted border-b border-line">
          <Plus size={11} strokeWidth={2.5} />
        </button>
        <button type="button" tabIndex={-1} onClick={() => handleStep(-1)}
          className="flex-1 flex items-center justify-center px-2 hover:bg-overlay active:bg-line transition-colors text-ghost hover:text-muted">
          <Minus size={11} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

/* ─── SegmentedControl ───────────────────────────────────────────────────────── */

type SegOption = string | { value: string; label: string }

export const SegmentedControl = ({
  value,
  options,
  onChange,
  className = '',
}: {
  value: string
  options: SegOption[]
  onChange: (v: string) => void
  className?: string
}) => {
  const normalized = options.map(o => typeof o === 'string' ? { value: o, label: o } : o)
  return (
    <div className={`flex gap-1 p-1 bg-panel rounded-lg border border-line ${className}`}>
      {normalized.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-display font-bold uppercase tracking-wider cursor-pointer transition-all ${value === v
            ? 'bg-raised text-primary shadow-sm'
            : 'text-ghost hover:text-ink hover:bg-raised'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/* ─── FontSelector ───────────────────────────────────────────────────────────── */

export const FontSelector = ({ value, onChange, label = "Schriftart" }: { value: string; onChange: (v: string) => void; label?: string }) => (
  <div className="flex flex-col gap-1.5">
    <Label className="mb-0">{label}</Label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-raised border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-sm text-ink transition-all hover:border-rim cursor-pointer"
    >
      <option value="">LaTeX Standard (Computer Modern)</option>
      <option value="Fira">Fira Sans (Serifenlos)</option>
      <option value="Inter">Inter</option>
      <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
    </select>
  </div>
)

/* ─── Switch ─────────────────────────────────────────────────────────────────── */

export const Switch = ({ checked, onChange, label, description, className = '', title }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string; className?: string; title?: string
}) => (
  <label className={`flex items-center justify-between cursor-pointer group py-0.5 shrink-0 ${className}`} title={title}>
    {(label || description) && (
      <div className="flex flex-col gap-0.5 pr-4">
        {label && <span className="text-sm font-medium text-ink group-hover:text-ink/90 transition-colors">{label}</span>}
        {description && <span className="text-xs text-muted">{description}</span>}
      </div>
    )}
    <div className="relative inline-flex items-center flex-shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="w-10 h-5 bg-overlay peer-focus:outline-none rounded-full peer
        peer-checked:after:translate-x-5 peer-checked:after:border-white
        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
        after:bg-ghost after:border-line after:border after:rounded-full
        after:h-4 after:w-4 after:transition-all
        peer-checked:bg-primary peer-checked:after:bg-canvas
        duration-200 shadow-inner" />
    </div>
  </label>
)

/* ─── SecHead ────────────────────────────────────────────────────────────────── */

export const SecHead = ({ children, icon }: { children: string; icon?: React.ReactNode }) => (
  <h3 className="flex items-center gap-2 text-caption mb-4 shrink-0">
    {icon && <span className="text-primary/70">{icon}</span>}
    {children}
  </h3>
)

/* ─── Field ──────────────────────────────────────────────────────────────────── */

export const Field = ({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-1.5 shrink-0 ${className}`}>
    <label className="text-caption">{label}</label>
    {children}
  </div>
)

/* ─── Accordion ──────────────────────────────────────────────────────────────── */

export const Accordion = ({ title, icon, defaultOpen = false, children }: {
  title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className={`flex-shrink-0 border rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? 'bg-panel/80 border-rim/60 shadow-md' : 'bg-raised/40 border-line hover:bg-raised/60 hover:border-line/80'
      }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-overlay/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <div className={`transition-colors ${isOpen ? 'text-primary' : 'text-muted'}`}>{icon}</div>}
          <span className={`font-display font-semibold text-sm tracking-wide transition-colors ${isOpen ? 'text-ink' : 'text-muted'}`}>
            {title}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-ghost transition-transform duration-100 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`transition-all duration-100 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 pt-0 border-t border-line/50 mx-5 mt-3">
          <div className="space-y-5 pt-5">{children}</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Collapsible ────────────────────────────────────────────────────────────── */

export const Collapsible = ({ title, children, open, onToggle, defaultOpen = false, onRemove, enabled, onToggleEnabled, className = '' }: {
  title: string; children: React.ReactNode; open?: boolean; onToggle?: () => void; defaultOpen?: boolean; onRemove?: () => void;
  enabled?: boolean; onToggleEnabled?: () => void; className?: string
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleToggle = () => {
    if (onToggle) onToggle()
    if (!isControlled) setInternalOpen(prev => !prev)
  }

  const isDisabled = enabled === false
  return (
    <div className={`flex-shrink-0 border rounded-xl overflow-hidden transition-all duration-150 ${isDisabled ? 'opacity-50' : ''
      } ${isOpen ? 'bg-overlay/40 border-rim/40 shadow-sm' : 'bg-raised/20 border-line hover:bg-raised/40'
      } ${className}`}>
      <div className="flex items-center justify-between px-3 py-2">
        <button onClick={handleToggle} className="flex-1 flex items-center gap-2 text-left group">
          <ChevronDown size={13} className={`text-ghost transition-transform duration-150 ${isOpen ? '' : '-rotate-90'}`} />
          <span className={`text-section-label transition-colors ${isOpen ? 'text-ink' : 'text-muted group-hover:text-ink/80'}`}>
            {title}
          </span>
        </button>
        {onToggleEnabled && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleEnabled() }}
            title={isDisabled ? 'Aktivieren' : 'Deaktivieren'}
            className={`p-1 rounded-md transition-all ${isDisabled ? 'text-ghost hover:text-ink' : 'text-primary hover:text-primary/70'}`}
          >
            {isDisabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1 text-ghost hover:text-error hover:bg-error/10 rounded-md transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
      <div className={`transition-opacity duration-200 ease-in-out ${isOpen ? 'opacity-100' : 'hidden opacity-0'}`}>
        <div className="px-4 pb-4 pt-2 border-t border-line/40">{children}</div>
      </div>
    </div>
  )
}

/* ─── Slider ─────────────────────────────────────────────────────────────────── */

export const Slider = ({ label, value, min, max, step = 1, disabled = false, onChange, className = '' }: {
  label: string; value: number; min: number; max: number; step?: number; disabled?: boolean;
  onChange: (val: number) => void; className?: string
}) => (
  <div className={`flex flex-col gap-2 shrink-0 ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}>
    <div className="flex-label-row">
      <Label className="mb-0">{label}</Label>
      <span className="text-metadata text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md">{value}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value} disabled={disabled}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full cursor-pointer disabled:cursor-not-allowed"
    />
  </div>
)

/* ─── SliderNumberInput ──────────────────────────────────────────────────────── */

export const SliderNumberInput = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
  label,
  className = '',
  disabled = false,
}: {
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  label?: string
  className?: string
  disabled?: boolean
}) => {
  const currentVal = isNaN(Number(value)) ? min : Number(value)

  return (
    <div className={`flex items-center gap-2.5 flex-1 min-w-[170px] ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}>
      {label && <span className="text-caption text-muted whitespace-nowrap">{label}:</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentVal}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 min-w-[60px] cursor-pointer"
      />
      <div className="flex items-center gap-1 shrink-0">
        <NumberInput
          step={String(step)}
          min={String(min)}
          max={String(max)}
          value={currentVal}
          onChange={e => {
            const parsed = parseFloat(e.target.value)
            if (!isNaN(parsed)) {
              onChange(Math.min(max, Math.max(min, parsed)))
            }
          }}
          className="h-7 w-20 text-xs text-center shrink-0"
        />
        {unit && <span className="text-caption text-ghost">{unit}</span>}
      </div>
    </div>
  )
}

/* ─── LatexErrorPanel ────────────────────────────────────────────────────────── */

export const LatexErrorPanel = ({ log }: { log: string }) => {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const lines = log.split('\n')
  const firstLine = lines[0]?.trim() || 'Unbekannter Fehler'
  const rest = lines.slice(1).join('\n').trim()

  const handleCopy = () => {
    navigator.clipboard.writeText(firstLine)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col w-full max-w-lg bg-error/8 border border-error/25 rounded-2xl p-5 text-error shadow-xl gap-3">
      <div className="flex items-center gap-2">
        <XCircle size={16} className="text-error shrink-0" />
        <span className="text-sm font-semibold text-error font-display">LaTeX Kompilierfehler</span>
      </div>
      <div className="flex items-center gap-2 bg-canvas/60 border border-error/20 rounded-xl px-3 py-2">
        <code className="text-xs text-red-200 flex-1 break-all font-mono">{firstLine}</code>
        <button onClick={handleCopy} className="shrink-0 p-1 rounded hover:bg-error/20 transition-colors" title="Fehlermeldung kopieren">
          {copied ? <Check size={13} className="text-success" /> : <Copy size={13} className="text-error/70" />}
        </button>
      </div>
      {rest && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-error/60 hover:text-error/90 text-left flex items-center gap-1 transition-colors"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'Details ausblenden' : 'Details anzeigen'}
          </button>
          {expanded && (
            <pre className="text-xs text-left bg-canvas/60 p-4 rounded-xl w-full overflow-auto max-h-64 border border-error/15 font-mono whitespace-pre-wrap break-words text-red-300/80">
              {rest}
            </pre>
          )}
        </>
      )}
    </div>
  )
}

/* ─── PreviewCard ────────────────────────────────────────────────────────────── */

export const PreviewCard = ({ isLoading, isCompiling, imgSrc, errorLog, emptyIcon }: {
  isLoading: boolean; isCompiling: boolean; imgSrc: string | null; errorLog: string | null; emptyIcon: React.ReactNode
}) => {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  return (
    <>
      <Card className="flex-1 flex flex-col relative overflow-hidden border-rim/50 shadow-2xl rounded-2xl">
        {/* Grid paper bg */}
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-secondary/4 pointer-events-none" />

        {imgSrc && !isCompiling && !isLoading && (
          <button
            onClick={() => setFullscreen(true)}
            title="Vollbild"
            className="absolute top-3 left-3 z-20 p-1.5 rounded-lg bg-panel/90 hover:bg-overlay border border-line text-ghost hover:text-muted transition-all"
          >
            <Maximize2 size={15} />
          </button>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center p-8 relative z-10 w-full h-full">
          {isCompiling || isLoading ? (
            <div className="flex flex-col items-center gap-4 text-muted">
              <div className="animate-spin text-primary"><RotateCw size={28} /></div>
              <span className="text-sm font-medium tracking-wide animate-pulse font-display">Rendere LaTeX…</span>
            </div>
          ) : imgSrc ? (
            <img
              src={imgSrc}
              alt="Vorschau"
              className="max-w-full max-h-full object-contain drop-shadow-xl hover:scale-[1.015] transition-transform duration-500 will-change-transform"
            />
          ) : errorLog ? (
            <LatexErrorPanel log={errorLog} />
          ) : (
            <div className="flex flex-col items-center text-ghost gap-3">
              <div className="opacity-15">{emptyIcon}</div>
              <span className="text-sm font-medium text-ghost">Keine Vorschau verfügbar</span>
            </div>
          )}
        </div>
      </Card>

      {fullscreen && imgSrc && (
        <div
          className="fixed inset-0 z-[9999] bg-canvas/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-raised border border-line hover:bg-overlay text-muted hover:text-ink transition-all"
            title="Schließen (Esc)"
          >
            <X size={18} />
          </button>
          <img
            src={imgSrc}
            alt="Vorschau (Vollbild)"
            className="max-w-[90vw] max-h-[90vh] object-contain drop-shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

/* ─── ToolbarActionBtn (internal) ────────────────────────────────────────────── */

const ToolbarActionBtn = ({ onClick, disabled = false, title, icon, label, primary = false, active = false }: {
  onClick?: () => void; disabled?: boolean; title?: string; icon: React.ReactNode;
  label: string; primary?: boolean; active?: boolean
}) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    title={title}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active
      ? 'bg-success/15 border border-success/40 text-success'
      : primary
        ? 'bg-primary hover:bg-amber-400 text-canvas border border-transparent shadow-sm'
        : 'bg-raised hover:bg-overlay text-muted hover:text-ink border border-line'
      } ${disabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
  >
    {icon}
    <span>{label}</span>
  </button>
)

/* ─── FloatingToolbar ────────────────────────────────────────────────────────── */

export const FloatingToolbar = ({ dpi, setDpi, isReady, onDownloadPng, onDownloadPdf, onCopyPng, onDownloadSvg }: {
  dpi: number; setDpi: (v: number) => void; isReady: boolean;
  onDownloadPng: () => void; onDownloadPdf?: () => void;
  onCopyPng?: () => void | Promise<void>; onDownloadSvg?: () => void
}) => {
  const [show, setShow] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!onCopyPng || !isReady) return
    try { await onCopyPng(); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch (e) { console.error(e) }
  }

  return (
    <div className="absolute bottom-4 right-0 z-20 pointer-events-none" style={{ width: '260px' }}>
      <div
        className="flex transition-transform duration-300 ease-out pointer-events-auto"
        style={{ transform: show ? 'translateX(0)' : 'translateX(200px)' }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {/* Handle tab */}
        <div className="w-[60px] shrink-0 flex flex-col items-center justify-center gap-3 py-5 bg-panel/95 backdrop-blur-xl border border-r-0 border-line rounded-l-2xl shadow-xl cursor-pointer">
          <ChevronLeft size={12} className={`text-ghost transition-transform duration-300 ${show ? '' : 'rotate-180'}`} />
          <div className="w-4 h-px bg-line" />
          <div className="flex flex-col items-center gap-0.5" title="PNG">
            <Download size={12} className={isReady ? 'text-primary' : 'text-ghost'} />
            <span className={`text-caption ${isReady ? 'text-primary' : 'text-ghost'}`}>PNG</span>
          </div>
          <div className="flex flex-col items-center gap-0.5" title="SVG">
            <Download size={12} className={onDownloadSvg && isReady ? 'text-secondary' : 'text-ghost'} />
            <span className={`text-caption ${onDownloadSvg && isReady ? 'text-secondary' : 'text-ghost'}`}>SVG</span>
          </div>
          <div className="flex flex-col items-center gap-0.5" title="PDF">
            <FileText size={12} className={onDownloadPdf && isReady ? 'text-muted' : 'text-ghost'} />
            <span className={`text-caption ${onDownloadPdf && isReady ? 'text-muted' : 'text-ghost'}`}>PDF</span>
          </div>
          {onCopyPng && (
            <div className="flex flex-col items-center gap-0.5" title="Kopieren">
              <Clipboard size={11} className={isReady ? 'text-ghost' : 'text-ghost/50'} />
            </div>
          )}
        </div>

        {/* Content panel */}
        <div className="flex flex-col gap-2 p-3 bg-canvas/98 backdrop-blur-xl border border-line rounded-r-2xl shadow-2xl" style={{ width: '200px' }}>
          <div className="pb-2 border-b border-line/60">
            <Slider
              label="Auflösung (DPI)"
              min={150} max={1200} step={50}
              value={dpi}
              onChange={setDpi}
              className="[&>div>span]:text-metadata [&>div>label]:text-caption [&>div]:mb-0"
            />
          </div>
          <ToolbarActionBtn
            onClick={handleCopy}
            disabled={!onCopyPng || !isReady}
            icon={copied ? <Check size={13} className="text-success" /> : <Clipboard size={13} />}
            label={copied ? 'Kopiert!' : 'Kopieren'}
            active={copied}
          />
          <ToolbarActionBtn
            onClick={isReady ? onDownloadPng : undefined}
            disabled={!isReady}
            icon={<Download size={13} />}
            label="PNG"
            primary
          />
          <ToolbarActionBtn
            onClick={onDownloadSvg}
            disabled={!onDownloadSvg || !isReady}
            icon={<Download size={13} />}
            label="SVG"
          />
          <ToolbarActionBtn
            onClick={onDownloadPdf}
            disabled={!onDownloadPdf || !isReady}
            icon={<FileText size={13} />}
            label="PDF"
          />
        </div>
      </div>
    </div>
  )
}

/* ─── ConfirmDialog ──────────────────────────────────────────────────────────── */

export const ConfirmDialog = ({
  title, message, confirmLabel = 'Bestätigen',
  confirmClass = 'bg-primary hover:bg-amber-400 text-canvas',
  onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel?: string;
  confirmClass?: string; onConfirm: () => void; onCancel: () => void
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm">
    <div className="bg-panel border border-rim rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} className="text-warning shrink-0" />
        <h3 className="font-semibold text-ink text-base font-display">{title}</h3>
      </div>
      <p className="text-sm text-muted leading-relaxed">{message}</p>
      <div className="flex gap-2 justify-end mt-1">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-muted hover:text-ink bg-raised hover:bg-overlay rounded-xl transition-all border border-line"
        >
          Abbrechen
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${confirmClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
)

/* ─── CodeSection ────────────────────────────────────────────────────────────── */

export const CodeSection = ({ code, isLoading, onCopy }: {
  code?: string; isLoading: boolean; onCopy: () => void
}) => {
  const [copied, setCopied] = React.useState(false)
  const tikzCode = code ? extractTikzCode(code) : null

  const showCopiedState = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopy = () => {
    onCopy()
    showCopiedState()
  }

  const handleCopyTikz = async () => {
    if (!tikzCode) return
    await navigator.clipboard.writeText(tikzCode)
    showCopiedState()
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex justify-between items-center px-1">
        <Label className="mb-0 flex items-center gap-1.5 pt-2">
          <FileText size={11} /> LaTeX-Source
        </Label>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-metadata text-success transition-all duration-300 ${copied ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <CheckCircle2 size={10} /> Kopiert!
          </span>
          {tikzCode && (
            <button
              onClick={handleCopyTikz}
              className="text-caption text-primary/80 hover:text-primary flex items-center gap-1 font-bold transition-colors pt-2"
            >
              <Copy size={11} /> TikZ kopieren
            </button>
          )}
          {code && (
            <button
              onClick={handleCopy}
              className="text-caption text-primary/80 hover:text-primary flex items-center gap-1 font-bold transition-colors pt-2"
            >
              <Clipboard size={11} /> Gesamten Code kopieren
            </button>
          )}
        </div>
      </div>
      <textarea
        readOnly
        value={code || (isLoading ? 'Generiere LaTeX-Code…' : 'Warte auf Eingabe…')}
        className="w-full h-48 px-3 py-2 bg-canvas border border-line rounded-lg text-mono-xs text-muted focus:outline-none resize-none"
      />
    </div>
  )
}
