// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2, Check, Pipette } from 'lucide-react'
import { Card, Button, Switch, Label, Input, NumberInput } from '../../../../components/ui'
import { COLOR_PRESETS, LINE_STYLE_PRESETS } from '../../../Koordinatensystem/constantsStylePresets'
import type { Vector3D, Point3D } from '../../typesKoord3D'
import { SectionExpander } from '../../utilsKoord3D'

export const ARROW_TIP_OPTIONS = [
  { value: 'Stealth', label: 'Stealth (Gefüllt)' },
  { value: 'Latex', label: 'LaTeX (Klassisch)' },
  { value: 'Triangle', label: 'Dreieck (Triangle)' },
  { value: 'Circle', label: 'Kreis (Circle)' },
  { value: 'Straight Barb', label: 'Offener Pfeil (Barb)' },
  { value: 'to', label: 'Einfach (to)' },
  { value: 'none', label: 'Keine Pfeilspitze' },
]

export const parseArrow = (arrowStr: string): { tip: string; length: number } => {
  if (!arrowStr || arrowStr.trim() === '' || arrowStr.trim().toLowerCase() === 'none') {
    return { tip: 'none', length: 3 }
  }
  const str = arrowStr.trim().replace(/^[-<>|]+/, '')
  const match = str.match(/^([A-Za-z\s]+)(?:\[.*length=([0-9.]+)(?:mm|pt)?.*\])?$/)
  if (match) {
    const tip = match[1].trim()
    const len = match[2] ? parseFloat(match[2]) : 3
    const foundTip = ARROW_TIP_OPTIONS.find(o => o.value.toLowerCase() === tip.toLowerCase())
    return {
      tip: foundTip ? foundTip.value : tip,
      length: len,
    }
  }
  return { tip: 'Stealth', length: 3 }
}

export const composeArrow = (tip: string, length: number): string => {
  if (!tip || tip === 'none') return ''
  if (length <= 0) return tip
  return `${tip}[length=${length}mm]`
}

const isColorActive = (currentColor: string, presetColor: string) => {
  const c = (currentColor || '').toLowerCase()
  const pc = presetColor.toLowerCase()
  if (c === pc) return true
  if (c === 'black' && pc === '#1e293b') return true
  if ((c === 'gray!70' || c === 'gray!50' || c === 'gray' || c === 'darkgray') && pc === '#64748b') return true
  if (c === 'blue' && pc === '#2563eb') return true
  if (c === 'red' && pc === '#ef4444') return true
  if (c === 'green' && pc === '#10b981') return true
  if ((c === 'violet' || c === 'purple') && pc === '#8b5cf6') return true
  if (c === 'orange' && pc === '#f97316') return true
  if (c === 'teal' && pc === '#06b6d4') return true
  return false
}

export const ColorSelector = ({
  color,
  onChange,
  label,
  fallbackColor = '#64748b',
}: {
  color?: string
  onChange: (color: string) => void
  label?: string
  fallbackColor?: string
}) => {
  const currentColor = color || fallbackColor
  const isCustom = !COLOR_PRESETS.some(cp => isColorActive(currentColor, cp.color))

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {label && <span className="text-caption text-muted whitespace-nowrap">{label}:</span>}
      {COLOR_PRESETS.map(cp => {
        const active = isColorActive(currentColor, cp.color)
        return (
          <button
            key={cp.id}
            type="button"
            onClick={() => onChange(cp.color)}
            className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
              active
                ? 'ring-2 ring-primary ring-offset-1 ring-offset-panel scale-110 border-white/40 shadow-xs'
                : 'border-black/20 hover:scale-105 opacity-85 hover:opacity-100'
            }`}
            style={{ backgroundColor: cp.color }}
            title={cp.label}
          >
            {active && <Check size={11} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" strokeWidth={3} />}
          </button>
        )
      })}
      <label
        className={`h-6 px-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ml-0.5 ${
          isCustom
            ? 'border-primary bg-primary/20 ring-2 ring-primary/40 text-primary shadow-xs'
            : 'border-line hover:border-rim bg-panel/90 text-ghost hover:text-ink'
        }`}
        title={`Eigene Farbe wählen (Farbpipette, aktuell: ${currentColor})`}
      >
        <Pipette size={12} className={isCustom ? 'text-primary' : 'text-muted'} />
        <span
          className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs"
          style={{ backgroundColor: currentColor.startsWith('#') ? currentColor : fallbackColor }}
        />
        <input
          type="color"
          value={currentColor.startsWith('#') ? currentColor : fallbackColor}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
        />
      </label>
    </div>
  )
}

export const LineStyleSelector = ({
  style,
  onChange,
  label,
}: {
  style?: string
  onChange: (style: string) => void
  label?: string
}) => {
  const currentStyle = style || 'solid'

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {label && <span className="text-caption text-muted whitespace-nowrap">{label}:</span>}
      {LINE_STYLE_PRESETS.map(lsp => {
        const isActive = currentStyle === lsp.value
        return (
          <button
            key={lsp.id}
            type="button"
            onClick={() => onChange(lsp.value)}
            className={`h-7 px-2.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
              isActive
                ? 'border-primary ring-2 ring-primary/40 bg-primary/20 text-primary shadow-xs'
                : 'border-line/70 hover:border-rim bg-panel/70 text-muted hover:text-ink'
            }`}
            title={lsp.label}
          >
            <svg width="24" height="6" viewBox="0 0 24 6" className="overflow-visible">
              <line
                x1="1"
                y1="3"
                x2="23"
                y2="3"
                stroke="currentColor"
                strokeWidth={isActive ? '2.5' : '1.8'}
                strokeDasharray={lsp.dashArray}
                strokeLinecap="round"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

interface Koord3DVectorCardProps {
  index: number
  vector: Vector3D
  points: Point3D[]
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: <K extends keyof Vector3D>(field: K, value: Vector3D[K]) => void
  onRemove: () => void
  onDuplicate: () => void
  onSetPoints: (startIdx: number | null, endIdx: number | null) => void
  isDesignExpanded: boolean
  onToggleDesignExpand: () => void
}

export const Koord3DVectorCard = ({
  index,
  vector,
  points,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onDuplicate,
  onSetPoints,
  isDesignExpanded,
  onToggleDesignExpand
}: Koord3DVectorCardProps) => {
  const { tip: currentTip, length: currentLength } = parseArrow(vector.arrow)
  const isCustomTip = !ARROW_TIP_OPTIONS.some(o => o.value === currentTip)

  const handleTipChange = (newTip: string) => {
    onUpdate('arrow', composeArrow(newTip, currentLength))
  }

  const handleLengthChange = (newLength: number) => {
    onUpdate('arrow', composeArrow(currentTip, newLength))
  }

  return (
    <Card className="border-line bg-canvas/50 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggleExpand()}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-raised/40 transition-colors cursor-pointer"
      >
        {isExpanded ? <ChevronDown size={16} className="text-primary shrink-0" /> : <ChevronRight size={16} className="text-muted shrink-0" />}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-xs"
            style={{ backgroundColor: vector.color?.startsWith('#') ? vector.color : '#ef4444' }}
          />
          <span className="text-sm font-medium text-ink truncate">{vector.name || `Vektor ${index + 1}`}</span>
        </div>
        {!isExpanded && (
          <span className="text-metadata truncate max-w-[280px]">
            ({vector.x1},{vector.y1},{vector.z1}) → ({vector.x2},{vector.y2},{vector.z2}) {vector.label && `— ${vector.label}`}
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Switch checked={vector.show} onChange={val => onUpdate('show', val)} />
          <Button onClick={onDuplicate} className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2" title="Duplizieren">
            <Copy size={15} />
          </Button>
          <Button onClick={onRemove} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2" title="Löschen">
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-line/60 space-y-4 pt-3">
          {/* Name */}
          <div>
            <Label>Name (nur zur Übersicht)</Label>
            <Input
              value={vector.name}
              onChange={e => onUpdate('name', e.target.value)}
              placeholder={`Vektor ${index + 1}`}
              className="h-9"
            />
          </div>

          {/* Start- & Endpunkt */}
          <div className="space-y-3">
            <div>
              <Label>Startpunkt A</Label>
              <div className="flex items-center gap-2 mt-1">
                {points.length > 0 && (
                  <select
                    value={vector.start_point_idx ?? ''}
                    onChange={e => {
                      const val = e.target.value
                      if (val === '') {
                        onSetPoints(null, vector.end_point_idx)
                      } else {
                        onSetPoints(parseInt(val), vector.end_point_idx)
                      }
                    }}
                    className="flex-1 min-w-0 h-9 px-3 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="">Manuell eingeben</option>
                    {points.map((pt, ptIdx) => (
                      <option key={ptIdx} value={ptIdx}>
                        {pt.name || pt.label || `Punkt ${ptIdx + 1}`} ({pt.x}, {pt.y}, {pt.z})
                      </option>
                    ))}
                  </select>
                )}
                <div className={`flex gap-2 shrink-0${(vector.start_point_idx ?? null) !== null ? ' opacity-50 pointer-events-none' : ''}`}>
                  <NumberInput step="0.5" value={vector.x1} onChange={e => onUpdate('x1', parseFloat(e.target.value))} className="h-9 w-20 text-xs" />
                  <NumberInput step="0.5" value={vector.y1} onChange={e => onUpdate('y1', parseFloat(e.target.value))} className="h-9 w-20 text-xs" />
                  <NumberInput step="0.5" value={vector.z1} onChange={e => onUpdate('z1', parseFloat(e.target.value))} className="h-9 w-20 text-xs" />
                </div>
              </div>
            </div>

            <div>
              <Label>Endpunkt B</Label>
              <div className="flex items-center gap-2 mt-1">
                {points.length > 0 && (
                  <select
                    value={vector.end_point_idx ?? ''}
                    onChange={e => {
                      const val = e.target.value
                      if (val === '') {
                        onSetPoints(vector.start_point_idx, null)
                      } else {
                        onSetPoints(vector.start_point_idx, parseInt(val))
                      }
                    }}
                    className="flex-1 min-w-0 h-9 px-3 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="">Manuell eingeben</option>
                    {points.map((pt, ptIdx) => (
                      <option key={ptIdx} value={ptIdx}>
                        {pt.name || pt.label || `Punkt ${ptIdx + 1}`} ({pt.x}, {pt.y}, {pt.z})
                      </option>
                    ))}
                  </select>
                )}
                <div className={`flex gap-2 shrink-0${(vector.end_point_idx ?? null) !== null ? ' opacity-50 pointer-events-none' : ''}`}>
                  <NumberInput step="0.5" value={vector.x2} onChange={e => onUpdate('x2', parseFloat(e.target.value))} className="h-9 w-20 text-xs" />
                  <NumberInput step="0.5" value={vector.y2} onChange={e => onUpdate('y2', parseFloat(e.target.value))} className="h-9 w-20 text-xs" />
                  <NumberInput step="0.5" value={vector.z2} onChange={e => onUpdate('z2', parseFloat(e.target.value))} className="h-9 w-20 text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Darstellung Section */}
          <SectionExpander
            title="Darstellung"
            expanded={isDesignExpanded}
            onToggle={onToggleDesignExpand}
          >
            <div className="space-y-4 pt-1">
              {/* Vektor-Hauptstil: Farbe, Linienstil & Dicke */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
                <div className="flex items-center shrink-0">
                  <ColorSelector
                    color={vector.color}
                    onChange={c => onUpdate('color', c)}
                    label="Farbe"
                  />
                </div>

                <div className="flex items-center justify-center flex-1 min-w-fit">
                  <LineStyleSelector
                    style={vector.style}
                    onChange={s => onUpdate('style', s)}
                    label="Stil"
                  />
                </div>

                {/* Linienstärke */}
                <div className="flex items-center justify-end gap-1.5 shrink-0" title="Linienstärke (pt)">
                  <span className="text-caption text-muted whitespace-nowrap">Dicke:</span>
                  <NumberInput
                    step="0.2"
                    min="0.2"
                    value={vector.width}
                    onChange={e => onUpdate('width', parseFloat(e.target.value))}
                    className="h-7 w-22 text-xs text-center shrink-0"
                  />
                  <span className="text-caption text-ghost">pt</span>
                </div>
              </div>

              {/* Pfeilspitze & Spitzenlänge */}
              <div className="flex flex-wrap items-center gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
                {/* Spitze Dropdown */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[170px] max-w-[250px]">
                  <span className="text-caption text-muted whitespace-nowrap">Spitze:</span>
                  <select
                    value={currentTip}
                    onChange={e => handleTipChange(e.target.value)}
                    className="w-full h-7 px-2 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                    title="Pfeilspitze"
                  >
                    {ARROW_TIP_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    {isCustomTip && currentTip && (
                      <option value={currentTip}>
                        {currentTip} (Benutzerdefiniert)
                      </option>
                    )}
                  </select>
                </div>

                {currentTip !== 'none' && (
                  <>
                    <div className="h-4 w-px bg-line/60 hidden sm:block" />
                    {/* Spitzenlänge */}
                    <div className="flex items-center gap-1.5 shrink-0" title="Spitzenlänge in mm">
                      <span className="text-caption text-muted whitespace-nowrap">Spitzenlänge:</span>
                      <NumberInput
                        step="0.5"
                        min="0.5"
                        value={currentLength}
                        onChange={e => handleLengthChange(parseFloat(e.target.value) || 3)}
                        className="h-7 w-22 text-xs text-center shrink-0"
                      />
                      <span className="text-caption text-ghost">mm</span>
                    </div>
                  </>
                )}
              </div>

              {/* Beschriftung & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Beschriftung (LaTeX)</Label>
                  <Input
                    value={vector.label}
                    onChange={e => onUpdate('label', e.target.value)}
                    className="h-9 font-mono text-xs"
                    placeholder="z. B. \vec{v}"
                  />
                </div>
                <div>
                  <Label>Position der Beschriftung</Label>
                  <Input
                    value={vector.label_pos}
                    onChange={e => onUpdate('label_pos', e.target.value)}
                    className="h-9 text-xs font-mono"
                    placeholder="z. B. midway, above"
                  />
                </div>
              </div>

              {/* Verdeckung */}
              <div className="bg-raised/30 rounded-xl p-3 border border-line/40 space-y-2">
                <Label>Verdeckungsmodus</Label>
                <div className="flex gap-2 mt-1">
                  {(['vorne', 'hinten', 'automatisch'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onUpdate('draw_mode', m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        vector.draw_mode === m
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-panel border border-line text-muted hover:text-ink hover:border-rim'
                      }`}
                    >
                      {m === 'vorne' ? 'Immer vorne' : m === 'hinten' ? 'Immer hinten' : 'Automatisch'}
                    </button>
                  ))}
                </div>
                {vector.draw_mode !== 'vorne' && (
                  <div className="pt-2">
                    <Label>Stil für verdeckte Abschnitte</Label>
                    <Input
                      value={vector.behind_style}
                      onChange={e => onUpdate('behind_style', e.target.value)}
                      className="h-8 text-xs font-mono"
                      placeholder="z. B. dashed, opacity=0.5"
                    />
                  </div>
                )}
              </div>
            </div>
          </SectionExpander>
        </div>
      )}
    </Card>
  )
}
