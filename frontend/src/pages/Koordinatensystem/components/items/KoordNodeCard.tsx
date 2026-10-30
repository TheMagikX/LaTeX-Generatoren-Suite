// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2, Check, Pipette } from 'lucide-react'
import { Card, Switch, Button, Field, Input, NumberInput, Collapsible } from '../../../../components/ui'
import { StyleCopyMenu } from '../StyleCopyMenu'
import { COLOR_PRESETS } from '../../constantsStylePresets'
import type { NodeItem } from '../../typesKoord'

interface KoordNodeCardProps {
  node: NodeItem
  index: number
  expanded: boolean
  onToggleExpand: () => void
  onUpdate: (key: keyof NodeItem, value: unknown) => void
  onDuplicate: () => void
  onRemove: () => void
  onCopyStyle?: () => void
  onPasteStyle?: () => void
  onApplyStyleToAll?: () => void
  hasCopiedStyle?: boolean
}

export const NODE_FONT_SIZES = [
  { value: '\\tiny', label: 'Sehr klein (\\tiny)' },
  { value: '\\scriptsize', label: 'Skript (\\scriptsize)' },
  { value: '\\footnotesize', label: 'Fußnote (\\footnotesize)' },
  { value: '\\small', label: 'Klein (\\small)' },
  { value: '\\normalsize', label: 'Normal (\\normalsize)' },
  { value: '\\large', label: 'Groß (\\large)' },
  { value: '\\Large', label: 'Sehr groß (\\Large)' },
  { value: '\\LARGE', label: 'Riesig (\\LARGE)' },
  { value: '\\huge', label: 'Gigantisch (\\huge)' },
]

export const NODE_ANCHOR_OPTIONS = [
  { value: 'center', label: 'Zentriert (center)' },
  { value: 'west', label: 'Rechts (west)' },
  { value: 'east', label: 'Links (east)' },
  { value: 'north', label: 'Unten (north)' },
  { value: 'south', label: 'Oben (south)' },
  { value: 'north west', label: 'Unten rechts (north west)' },
  { value: 'north east', label: 'Unten links (north east)' },
  { value: 'south west', label: 'Oben rechts (south west)' },
  { value: 'south east', label: 'Oben links (south east)' },
]

export const KoordNodeCard = ({
  node,
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
}: KoordNodeCardProps) => {
  const currentColor = node.color || '#1e293b'
  const currentFontSize = node.font_size || '\\small'
  const currentAnchor = node.anchor || 'center'

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
  const isCustomFontSize = !NODE_FONT_SIZES.some(opt => opt.value === currentFontSize)
  const isCustomAnchor = !NODE_ANCHOR_OPTIONS.some(opt => opt.value === currentAnchor)

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
            <span className="text-xs font-bold text-ink">Anmerkung {index + 1}</span>
            {!expanded && (
              <span className="text-metadata truncate max-w-[220px]">
                ann{index + 1}: {node.text || '(leer)'} ({node.x}, {node.y})
              </span>
            )}
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Switch checked={node.show} onChange={(v: boolean) => onUpdate('show', v)} />
          {onCopyStyle && (
            <StyleCopyMenu
              onCopyStyle={onCopyStyle}
              onPasteStyle={onPasteStyle}
              onApplyToAll={onApplyStyleToAll}
              hasCopiedStyle={hasCopiedStyle}
              itemTypeName="Anmerkung"
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
          {/* 1. Koordinaten & Text in 3 Spalten */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Field label="x-Koordinate">
              <NumberInput
                step="0.5"
                value={node.x}
                onChange={e => onUpdate('x', parseFloat(e.target.value))}
                className="h-9"
              />
            </Field>
            <Field label="y-Koordinate">
              <NumberInput
                step="0.5"
                value={node.y}
                onChange={e => onUpdate('y', parseFloat(e.target.value))}
                className="h-9"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Text (LaTeX)">
                <Input
                  value={node.text}
                  onChange={e => onUpdate('text', e.target.value)}
                  className="h-9 font-mono text-xs"
                  placeholder="z. B. Hinweis oder \textbf{T}"
                />
              </Field>
            </div>
          </div>

          {/* 2. Stil-Leiste: Farbe, Schriftgröße & Ausrichtung (Anchor) in einer Zeile */}
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

            {/* Schriftgröße */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[170px] max-w-[250px]">
              <span className="text-caption text-muted whitespace-nowrap">Schriftgröße:</span>
              <select
                value={currentFontSize}
                onChange={e => onUpdate('font_size', e.target.value)}
                className="w-full h-7 px-2 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                title="Schriftgröße"
              >
                {NODE_FONT_SIZES.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                {isCustomFontSize && currentFontSize && (
                  <option value={currentFontSize}>
                    {currentFontSize} (Benutzerdefiniert)
                  </option>
                )}
              </select>
            </div>

            <div className="h-4 w-px bg-line/60 hidden sm:block" />

            {/* Anchor / Ankerpunkt */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[170px] max-w-[250px]">
              <span className="text-caption text-muted whitespace-nowrap">Ankerpunkt:</span>
              <select
                value={currentAnchor}
                onChange={e => onUpdate('anchor', e.target.value)}
                className="w-full h-7 px-2 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                title="Ankerpunkt (Ausrichtung)"
              >
                {NODE_ANCHOR_OPTIONS.map(opt => (
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
            </div>
          </div>

          {/* 3. Marker & Pfeil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Switch
              checked={node.marker}
              onChange={(v: boolean) => onUpdate('marker', v)}
              label="Marker"
              description="Punkt an Koordinate anzeigen"
            />
            <Switch
              checked={node.arrow}
              onChange={(v: boolean) => onUpdate('arrow', v)}
              label="Pfeil"
              description="Hinweispfeil anzeigen"
            />
          </div>

          {node.marker && (
            <div className="bg-panel/50 p-3 rounded-xl border border-line/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Marker-Stil">
                <Input
                  value={node.mark_style}
                  onChange={e => onUpdate('mark_style', e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </Field>
              <Field label="Größe (pt)">
                <NumberInput
                  step="0.1"
                  value={node.mark_size}
                  onChange={e => onUpdate('mark_size', parseFloat(e.target.value))}
                  className="h-8"
                />
              </Field>
            </div>
          )}

          {node.arrow && (
            <div className="bg-panel/50 p-3 rounded-xl border border-line/50 space-y-3">
              <Field label="Pfeil-Stil">
                <Input
                  value={node.arrow_style}
                  onChange={e => onUpdate('arrow_style', e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Delta x">
                  <NumberInput
                    step="0.1"
                    value={node.dx}
                    onChange={e => onUpdate('dx', parseFloat(e.target.value))}
                    className="h-8"
                  />
                </Field>
                <Field label="Delta y">
                  <NumberInput
                    step="0.1"
                    value={node.dy}
                    onChange={e => onUpdate('dy', parseFloat(e.target.value))}
                    className="h-8"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* 4. Weitere Optionen (Weißer Hintergrund & freie LaTeX-Optionen) */}
          <Collapsible title="Weitere Optionen (LaTeX)">
            <div className="space-y-3 pt-2">
              <Switch
                checked={node.bg_white}
                onChange={(v: boolean) => onUpdate('bg_white', v)}
                label="Weißer Hintergrund"
                description="Node-Text mit weißem Hintergrund (fill=white) hinterlegen"
              />
              <Field label="Zusätzliche LaTeX-Optionen (optional)">
                <Input
                  value={node.custom_opts || ''}
                  onChange={e => onUpdate('custom_opts', e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="z. B. rotate=45, sloped, inner sep=2pt"
                />
              </Field>
            </div>
          </Collapsible>
        </div>
      )}
    </Card>
  )
}
