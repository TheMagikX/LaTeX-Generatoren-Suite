// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2, Check, Pipette } from 'lucide-react'
import { Card, Button, Switch, Label, Input, NumberInput, SliderNumberInput } from '../../../../components/ui'
import { COLOR_PRESETS, LINE_STYLE_PRESETS } from '../../../Koordinatensystem/constantsStylePresets'
import type { Point3D } from '../../typesKoord3D'
import { SectionExpander, Chk, SecHead } from '../../utilsKoord3D'

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

export const POINT_3D_ANCHOR_OPTIONS = [
  { value: 'west', label: 'Rechts (west)' },
  { value: 'east', label: 'Links (east)' },
  { value: 'north', label: 'Unten (north)' },
  { value: 'south', label: 'Oben (south)' },
  { value: 'north west', label: 'Unten rechts (north west)' },
  { value: 'north east', label: 'Unten links (north east)' },
  { value: 'south west', label: 'Oben rechts (south west)' },
  { value: 'south east', label: 'Oben links (south east)' },
  { value: 'center', label: 'Zentriert (center)' },
  { value: 'base', label: 'Basis (base)' },
  { value: 'mid', label: 'Mitte (mid)' },
]

const ANCHOR_VALUES = POINT_3D_ANCHOR_OPTIONS.map(o => o.value)

const splitAnchorOptions = (anchorValue: string) => {
  const [anchorPart = 'west', ...optionParts] = (anchorValue || 'west').split(',')
  const anchor = anchorPart.trim() || 'west'
  return {
    anchor: ANCHOR_VALUES.includes(anchor) ? anchor : 'west',
    extraOptions: optionParts.join(',').trim(),
  }
}

const composeAnchorOptions = (anchor: string, extraOptions: string) => {
  const trimmedOptions = extraOptions.trim()
  return trimmedOptions ? `${anchor}, ${trimmedOptions}` : anchor
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

const ColorSelector = ({
  color,
  onChange,
  label,
}: {
  color: string
  onChange: (color: string) => void
  label?: string
}) => {
  const currentColor = color || '#1e293b'
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
          style={{ backgroundColor: currentColor.startsWith('#') ? currentColor : '#1e293b' }}
        />
        <input
          type="color"
          value={currentColor.startsWith('#') ? currentColor : '#1e293b'}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
        />
      </label>
    </div>
  )
}

const LineStyleSelector = ({
  style,
  onChange,
  label,
}: {
  style: string
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
            className={`h-7 px-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
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

interface Koord3DPointCardProps {
  index: number
  point: Point3D
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: <K extends keyof Point3D>(field: K, value: Point3D[K]) => void
  onRemove: () => void
  onDuplicate: () => void
  isDesignExpanded: boolean
  onToggleDesignExpand: () => void
}

export const Koord3DPointCard = ({
  index,
  point,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onDuplicate,
  isDesignExpanded,
  onToggleDesignExpand
}: Koord3DPointCardProps) => {
  const { anchor, extraOptions } = splitAnchorOptions(point.anchor)
  const isCustomMarker = !POINT_MARKER_OPTIONS.some(opt => opt.value === point.mark)

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
            style={{ backgroundColor: point.color?.startsWith('#') ? point.color : '#1e293b' }}
          />
          <span className="text-sm font-medium text-ink truncate">{point.name || `Punkt ${index + 1}`}</span>
        </div>
        {!isExpanded && (
          <span className="text-metadata truncate max-w-[260px]">
            ({point.x}, {point.y}, {point.z}) {point.label && `— ${point.label}`}
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Switch checked={point.show} onChange={v => onUpdate('show', v)} />
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
          {/* 1. Name & Koordinaten */}
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] gap-3">
            <div>
              <Label>Name (nur zur Übersicht)</Label>
              <Input
                value={point.name}
                onChange={e => onUpdate('name', e.target.value)}
                placeholder={`Punkt ${index + 1}`}
                className="h-9"
              />
            </div>
            <div>
              <Label>x</Label>
              <NumberInput
                step="0.5"
                value={point.x}
                onChange={e => onUpdate('x', parseFloat(e.target.value))}
                className="h-9"
              />
            </div>
            <div>
              <Label>y</Label>
              <NumberInput
                step="0.5"
                value={point.y}
                onChange={e => onUpdate('y', parseFloat(e.target.value))}
                className="h-9"
              />
            </div>
            <div>
              <Label>z</Label>
              <NumberInput
                step="0.5"
                value={point.z}
                onChange={e => onUpdate('z', parseFloat(e.target.value))}
                className="h-9"
              />
            </div>
          </div>

          {/* 2. Label, Anker & Weitere Optionen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Label (LaTeX)</Label>
              <Input
                value={point.label}
                onChange={e => onUpdate('label', e.target.value)}
                className="h-9 font-mono text-xs"
                placeholder="z. B. P_1"
              />
            </div>
            <div>
              <Label>Anker</Label>
              <select
                value={anchor}
                onChange={e => onUpdate('anchor', composeAnchorOptions(e.target.value, extraOptions))}
                className="w-full h-9 px-3 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {POINT_3D_ANCHOR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Weitere Optionen</Label>
              <Input
                value={extraOptions}
                onChange={e => onUpdate('anchor', composeAnchorOptions(anchor, e.target.value))}
                className="h-9 text-xs font-mono"
                placeholder="z. B. font=\small"
              />
            </div>
          </div>

          {/* 3. Darstellung Section */}
          <SectionExpander
            title="Darstellung"
            expanded={isDesignExpanded}
            onToggle={onToggleDesignExpand}
          >
            <div className="space-y-4 pt-1">
              {/* Punkt-Hauptstil: Farbe, Marker-Symbol & Marker-Größe */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
                <div className="flex items-center shrink-0">
                  <ColorSelector
                    color={point.color}
                    onChange={c => onUpdate('color', c)}
                    label="Farbe"
                  />
                </div>

                {/* Marker-Symbol (zentriert) */}
                <div className="flex items-center justify-center gap-1.5 flex-1 min-w-[150px] max-w-[220px]">
                  <span className="text-caption text-muted whitespace-nowrap">Marker:</span>
                  <select
                    value={point.mark}
                    onChange={e => onUpdate('mark', e.target.value)}
                    className="w-full h-7 px-2 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
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

                {/* Marker-Größe (rechtsbündig) */}
                <div className="flex items-center justify-end gap-1.5 shrink-0" title="Marker-Größe (pt)">
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

              {/* Spur (Traces) */}
              <div className="bg-raised/30 rounded-xl p-3 border border-line/40 space-y-3">
                <div className="flex flex-wrap items-center gap-6">
                  <Chk checked={point.trail} onChange={v => onUpdate('trail', v)} label="Spur anzeigen" />
                  <Chk checked={point.trail_marks} onChange={v => onUpdate('trail_marks', v)} label="Projektionsmarker" />
                </div>

                {point.trail && (
                  <div className="space-y-3 pt-2 border-t border-line/30">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-panel/60 p-2.5 rounded-xl border border-line/40">
                      <div className="flex items-center shrink-0">
                        <ColorSelector
                          color={point.trail_color}
                          onChange={c => onUpdate('trail_color', c)}
                          label="Spurfarbe"
                        />
                      </div>
                      <div className="flex items-center justify-center flex-1 min-w-fit">
                        <LineStyleSelector
                          style={point.trail_style}
                          onChange={s => onUpdate('trail_style', s)}
                          label="Spurstil"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-1.5 shrink-0" title="Spurbreite (pt)">
                        <span className="text-caption text-muted whitespace-nowrap">Dicke:</span>
                        <NumberInput
                          step="0.1"
                          min="0.1"
                          value={point.trail_width}
                          onChange={e => onUpdate('trail_width', parseFloat(e.target.value))}
                          className="h-7 w-22 text-xs text-center shrink-0"
                        />
                        <span className="text-caption text-ghost">pt</span>
                      </div>
                    </div>
                    <div className="bg-panel/60 p-2.5 rounded-xl border border-line/40">
                      <SliderNumberInput
                        value={point.trail_alpha}
                        onChange={val => onUpdate('trail_alpha', val)}
                        min={0}
                        max={100}
                        step={5}
                        unit="%"
                        label="Deckkraft / Alpha"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Projektionen auf Grundebenen */}
              <div className="bg-raised/30 rounded-xl p-3 border border-line/40 space-y-3">
                <SecHead>Projektionen auf Grundebenen</SecHead>
                <div className="flex flex-wrap items-center gap-6">
                  <Chk checked={point.proj_xy} onChange={v => onUpdate('proj_xy', v)} label="xy-Ebene" />
                  <Chk checked={point.proj_xz} onChange={v => onUpdate('proj_xz', v)} label="xz-Ebene" />
                  <Chk checked={point.proj_yz} onChange={v => onUpdate('proj_yz', v)} label="yz-Ebene" />
                </div>

                {(point.proj_xy || point.proj_xz || point.proj_yz) && (
                  <div className="space-y-3 pt-2 border-t border-line/30">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <ColorSelector
                        color={point.proj_color}
                        onChange={c => onUpdate('proj_color', c)}
                        label="Projektionsfarbe"
                      />
                      <LineStyleSelector
                        style={point.proj_style}
                        onChange={s => onUpdate('proj_style', s)}
                        label="Projektionsstil"
                      />
                    </div>
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
