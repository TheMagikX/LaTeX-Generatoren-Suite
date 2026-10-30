// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2, Check, Pipette } from 'lucide-react'
import { Card, Switch, Button, Field, Input, NumberInput, Collapsible } from '../../../../components/ui'
import { StyleCopyMenu } from '../StyleCopyMenu'
import { COLOR_PRESETS } from '../../constantsStylePresets'
import type { PointItem } from '../../typesKoord'

interface KoordPointCardProps {
  point: PointItem
  index: number
  expanded: boolean
  onToggleExpand: () => void
  onUpdate: (key: keyof PointItem, value: unknown) => void
  onDuplicate: () => void
  onRemove: () => void
  onCopyStyle?: () => void
  onPasteStyle?: () => void
  onApplyStyleToAll?: () => void
  hasCopiedStyle?: boolean
}

export const POINT_MARKER_OPTIONS = [
  { value: '*', label: 'Punkt (*)', symbol: '●' },
  { value: 'x', label: 'Kreuz (x)', symbol: '✕' },
  { value: '+', label: 'Plus (+)', symbol: '+' },
  { value: '-', label: 'Minus (-)', symbol: '—' },
  { value: '|', label: 'Vertikaler Strich (|)', symbol: '|' },
  { value: 'o', label: 'Kreis (o)', symbol: '○' },
  { value: 'asterisk', label: 'Stern (asterisk)', symbol: '✻' },
  { value: 'star', label: '5-Stern (star)', symbol: '★' },
  { value: '10-pointed star', label: '10-Stern (10-pointed star)', symbol: '✴' },
  { value: 'oplus', label: 'Kreis mit Plus (oplus)', symbol: '⊕' },
  { value: 'otimes', label: 'Kreis mit Kreuz (otimes)', symbol: '⊗' },
  { value: 'square', label: 'Quadrat (square)', symbol: '■' },
  { value: 'triangle', label: 'Dreieck (triangle)', symbol: '▲' },
  { value: 'diamond', label: 'Raute (diamond)', symbol: '◆' },
]

export const POINT_ANCHOR_OPTIONS = [
  { value: 'west', label: 'Rechts (west)' },
  { value: 'east', label: 'Links (east)' },
  { value: 'north', label: 'Unten (north)' },
  { value: 'south', label: 'Oben (south)' },
  { value: 'north west', label: 'Unten rechts (north west)' },
  { value: 'north east', label: 'Unten links (north east)' },
  { value: 'south west', label: 'Oben rechts (south west)' },
  { value: 'south east', label: 'Oben links (south east)' },
  { value: 'center', label: 'Zentriert (center)' },
]

export const KoordPointCard = ({
  point,
  index,
  expanded,
  onToggleExpand,
  onUpdate,
  onDuplicate,
  onRemove,
  onCopyStyle,
  onPasteStyle,
  onApplyStyleToAll,
  hasCopiedStyle
}: KoordPointCardProps) => {
  const currentColor = point.color || '#1e293b'
  const currentAnchor = point.anchor || 'west'

  const isColorActive = (presetColor: string) => {
    const c = currentColor.toLowerCase()
    const pc = presetColor.toLowerCase()
    if (c === pc) return true
    if (c === 'black' && pc === '#1e293b') return true
    if (c === 'blue' && pc === '#2563eb') return true
    if (c === 'red' && pc === '#ef4444') return true
    if (c === 'green' && pc === '#10b981') return true
    if (c === 'purple' && pc === '#8b5cf6') return true
    if (c === 'orange' && pc === '#f97316') return true
    if (c === 'teal' && pc === '#06b6d4') return true
    return false
  }

  const isCustomColor = !COLOR_PRESETS.some(cp => isColorActive(cp.color))
  const isCustomMarker = !POINT_MARKER_OPTIONS.some(opt => opt.value === point.mark)
  const isCustomAnchor = !POINT_ANCHOR_OPTIONS.some(opt => opt.value === currentAnchor)

  return (
    <Card className="border-line bg-canvas/40 overflow-hidden transition-all hover:border-rim">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggleExpand()}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-raised/20 transition-colors cursor-pointer"
      >
        {expanded ? <ChevronDown size={14} className="text-primary shrink-0" /> : <ChevronRight size={14} className="text-ghost shrink-0" />}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-xs"
            style={{ backgroundColor: currentColor.startsWith('#') ? currentColor : '#1e293b' }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-ink">Punkt {index + 1}</span>
            {!expanded && (
              <span className="text-metadata truncate max-w-[220px]">
                P{index + 1}: {point.label || '(kein Label)'} ({point.x}, {point.y})
              </span>
            )}
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Switch checked={point.show} onChange={(v: boolean) => onUpdate('show', v)} />
          {onCopyStyle && (
            <StyleCopyMenu
              onCopyStyle={onCopyStyle}
              onPasteStyle={onPasteStyle}
              onApplyToAll={onApplyStyleToAll}
              hasCopiedStyle={hasCopiedStyle}
              itemTypeName="Punkt"
            />
          )}
          <Button onClick={onDuplicate} className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2" title="Duplizieren">
            <Copy size={15} />
          </Button>
          <Button onClick={onRemove} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2" title="Löschen">
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-line/50 space-y-4 pt-4">
          {/* 1. Koordinaten, Label & Ausrichtung (Anchor) in 4 Spalten */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Field label="x-Koordinate">
              <NumberInput
                step="0.5"
                value={point.x}
                onChange={e => onUpdate('x', parseFloat(e.target.value))}
                className="h-9"
              />
            </Field>
            <Field label="y-Koordinate">
              <NumberInput
                step="0.5"
                value={point.y}
                onChange={e => onUpdate('y', parseFloat(e.target.value))}
                className="h-9"
              />
            </Field>
            <Field label="Label (LaTeX)">
              <Input
                value={point.label}
                onChange={e => onUpdate('label', e.target.value)}
                className="h-9 font-mono text-xs"
                placeholder="z. B. P_1"
              />
            </Field>
            <Field label="Ausrichtung (Anchor)">
              <select
                value={currentAnchor}
                onChange={e => onUpdate('anchor', e.target.value)}
                className="w-full h-9 px-2.5 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {POINT_ANCHOR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                {isCustomAnchor && currentAnchor && (
                  <option value={currentAnchor}>
                    {currentAnchor} (Benutzerdefiniert)
                  </option>
                )}
              </select>
            </Field>
          </div>

          {/* 2. Stil-Leiste: Farbe, Marker-Symbol & Marker-Größe in einer Zeile */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
            {/* Farbe */}
            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.map(cp => {
                const isActive = isColorActive(cp.color)
                return (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => onUpdate('color', cp.color)}
                    className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-panel scale-110 border-white/40 shadow-xs'
                        : 'border-black/20 hover:scale-105 opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: cp.color }}
                    title={cp.label}
                  >
                    {isActive && <Check size={11} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" strokeWidth={3} />}
                  </button>
                )
              })}
              <label
                className={`h-6 px-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ml-0.5 ${
                  isCustomColor
                    ? 'border-primary bg-primary/20 ring-2 ring-primary/40 text-primary shadow-xs'
                    : 'border-line hover:border-rim bg-panel/90 text-ghost hover:text-ink'
                }`}
                title={`Eigene Farbe wählen (Farbpipette, aktuell: ${currentColor})`}
              >
                <Pipette size={12} className={isCustomColor ? 'text-primary' : 'text-muted'} />
                <span
                  className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs"
                  style={{ backgroundColor: currentColor.startsWith('#') ? currentColor : '#1e293b' }}
                />
                <input
                  type="color"
                  value={currentColor.startsWith('#') ? currentColor : '#1e293b'}
                  onChange={e => onUpdate('color', e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="h-4 w-px bg-line/60 hidden sm:block" />

            {/* Marker-Symbol */}
            <div className="flex-1 min-w-[140px] max-w-[200px]">
              <select
                value={point.mark}
                onChange={e => onUpdate('mark', e.target.value)}
                className="w-full h-7 px-2 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                title="Marker-Symbol"
              >
                {POINT_MARKER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.symbol}  {opt.label}
                  </option>
                ))}
                {isCustomMarker && point.mark && (
                  <option value={point.mark}>
                    {point.mark} (Benutzerdefiniert)
                  </option>
                )}
              </select>
            </div>

            <div className="h-4 w-px bg-line/60 hidden sm:block" />

            {/* Marker-Größe */}
            <div className="flex items-center gap-1.5 shrink-0" title="Marker-Größe (pt)">
              <span className="text-caption text-muted whitespace-nowrap">Größe:</span>
              <NumberInput
                step="0.5"
                min="0.5"
                value={point.size}
                onChange={e => onUpdate('size', parseFloat(e.target.value))}
                className="h-7 w-22 text-xs text-center shrink-0"
              />
              <span className="text-caption text-ghost">pt</span>
            </div>
          </div>

          {/* 3. Weitere Optionen (Freie LaTeX-Optionen) */}
          <Collapsible title="Weitere Optionen (LaTeX)">
            <div className="pt-2">
              <Field label="Zusätzliche LaTeX-Optionen (optional)">
                <Input
                  value={point.custom_label_style || ''}
                  onChange={e => onUpdate('custom_label_style', e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="z. B. font=\small, fill=white, inner sep=1pt"
                />
              </Field>
            </div>
          </Collapsible>
        </div>
      )}
    </Card>
  )
}
