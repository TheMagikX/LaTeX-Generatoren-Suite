// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2 } from 'lucide-react'
import { Card, Button, Switch, Label, Input, NumberInput, SliderNumberInput } from '../../../../components/ui'
import type { Plane3D, Point3D } from '../../typesKoord3D'
import { SectionExpander, PatternSel } from '../../utilsKoord3D'
import {
  ColorSelector,
  LineStyleSelector,
  ARROW_TIP_OPTIONS,
  parseArrow,
  composeArrow,
} from './Koord3DVectorCard'

interface Koord3DPlaneCardProps {
  index: number
  plane: Plane3D
  points: Point3D[]
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: <K extends keyof Plane3D>(field: K, value: Plane3D[K]) => void
  onRemove: () => void
  onDuplicate: () => void
  onSetPoint: (n: 1 | 2 | 3, ptIdx: number | null) => void
  isDesignExpanded: boolean
  onToggleDesignExpand: () => void
}

export const Koord3DPlaneCard = ({
  index,
  plane,
  points,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onDuplicate,
  onSetPoint,
  isDesignExpanded,
  onToggleDesignExpand,
}: Koord3DPlaneCardProps) => {
  const { tip: normalTip, length: normalLength } = parseArrow(
    plane.normal_arrow || 'Stealth[length=3mm]'
  )
  const isCustomNormalTip = !ARROW_TIP_OPTIONS.some(o => o.value === normalTip)

  const handleNormalTipChange = (newTip: string) => {
    onUpdate('normal_arrow', composeArrow(newTip, normalLength))
  }

  const handleNormalLengthChange = (newLength: number) => {
    onUpdate('normal_arrow', composeArrow(normalTip, newLength))
  }

  return (
    <Card className="border-line bg-canvas/50 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggleExpand()}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-raised/40 transition-colors cursor-pointer"
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-primary shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-muted shrink-0" />
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-xs"
            style={{ backgroundColor: plane.color?.startsWith('#') ? plane.color : '#2563eb' }}
          />
          <span className="text-sm font-medium text-ink truncate">{plane.name || `Ebene ${index + 1}`}</span>
        </div>
        {!isExpanded && (
          <span className="text-metadata truncate max-w-[280px]">
            {plane.mode} — α={plane.alpha}%
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={ev => ev.stopPropagation()}>
          <Switch checked={plane.show} onChange={val => onUpdate('show', val)} />
          <Button
            onClick={onDuplicate}
            className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2"
            title="Duplizieren"
          >
            <Copy size={15} />
          </Button>
          <Button
            onClick={onRemove}
            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2"
            title="Löschen"
          >
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
              value={plane.name}
              onChange={val => onUpdate('name', val.target.value)}
              placeholder={`Ebene ${index + 1}`}
              className="h-9"
            />
          </div>

          {/* Modus Umschalter */}
          <div>
            <Label>Modus</Label>
            <div className="flex gap-2 mt-1">
              {['3 Punkte', 'Koordinatenform'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onUpdate('mode', m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    plane.mode === m
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-panel border border-line text-muted hover:text-ink hover:border-rim'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Koordinateneingabe */}
          {plane.mode === '3 Punkte' ? (
            <div className="space-y-3">
              {([1, 2, 3] as const).map(n => {
                const pIdxKey = `p${n}_idx` as 'p1_idx' | 'p2_idx' | 'p3_idx'
                const xKey = `x${n}` as 'x1' | 'x2' | 'x3'
                const yKey = `y${n}` as 'y1' | 'y2' | 'y3'
                const zKey = `z${n}` as 'z1' | 'z2' | 'z3'
                const pIdx = plane[pIdxKey] ?? null
                return (
                  <div key={n}>
                    <Label>Punkt P{n}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {points.length > 0 && (
                        <select
                          value={pIdx ?? ''}
                          onChange={ev => {
                            const val = ev.target.value
                            onSetPoint(n, val === '' ? null : parseInt(val))
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
                      <div
                        className={`flex gap-2 shrink-0${
                          pIdx !== null ? ' opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <NumberInput
                          step="0.5"
                          value={plane[xKey]}
                          onChange={val => onUpdate(xKey, parseFloat(val.target.value))}
                          className="h-9 w-20 text-xs"
                        />
                        <NumberInput
                          step="0.5"
                          value={plane[yKey]}
                          onChange={val => onUpdate(yKey, parseFloat(val.target.value))}
                          className="h-9 w-20 text-xs"
                        />
                        <NumberInput
                          step="0.5"
                          value={plane[zKey]}
                          onChange={val => onUpdate(zKey, parseFloat(val.target.value))}
                          className="h-9 w-20 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label>n₁ (x)</Label>
                <NumberInput
                  step="0.5"
                  value={plane.n1}
                  onChange={val => onUpdate('n1', parseFloat(val.target.value))}
                  className="h-9"
                />
              </div>
              <div>
                <Label>n₂ (y)</Label>
                <NumberInput
                  step="0.5"
                  value={plane.n2}
                  onChange={val => onUpdate('n2', parseFloat(val.target.value))}
                  className="h-9"
                />
              </div>
              <div>
                <Label>n₃ (z)</Label>
                <NumberInput
                  step="0.5"
                  value={plane.n3}
                  onChange={val => onUpdate('n3', parseFloat(val.target.value))}
                  className="h-9"
                />
              </div>
              <div>
                <Label>d</Label>
                <NumberInput
                  step="0.5"
                  value={plane.d}
                  onChange={val => onUpdate('d', parseFloat(val.target.value))}
                  className="h-9"
                />
              </div>
            </div>
          )}

          {/* Darstellung Section */}
          <SectionExpander
            title="Darstellung"
            expanded={isDesignExpanded}
            onToggle={onToggleDesignExpand}
          >
            <div className="space-y-4 pt-1">
              {/* Ebenen-Hauptstil: Farbe, Alpha (Slider+Number) & Muster */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
                <div className="flex items-center shrink-0">
                  <ColorSelector
                    color={plane.color}
                    onChange={val => onUpdate('color', val)}
                    label="Farbe"
                    fallbackColor="#2563eb"
                  />
                </div>

                {/* Alpha / Deckkraft Slider + NumberInput */}
                <SliderNumberInput
                  value={plane.alpha}
                  onChange={val => onUpdate('alpha', val)}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  label="Alpha"
                  className="max-w-[240px]"
                />

                {/* Muster */}
                <div className="flex items-center justify-end shrink-0">
                  <PatternSel value={plane.pattern} onChange={val => onUpdate('pattern', val)} compact />
                </div>
              </div>

              {/* Normalenvektor Anzeige */}
              <div className="bg-raised/30 rounded-xl p-3.5 border border-line/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Normalenvektor</span>
                  <Switch
                    checked={plane.normal_show}
                    onChange={val => onUpdate('normal_show', val)}
                    label="Anzeigen"
                  />
                </div>

                {plane.normal_show && (
                  <div className="space-y-3 pt-1 border-t border-line/40">
                    {/* Farbe, Linienstil & Dicke (links, zentriert, rechts) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-panel/60 p-2.5 rounded-xl border border-line/40">
                      <div className="flex items-center shrink-0">
                        <ColorSelector
                          color={plane.normal_color}
                          onChange={c => onUpdate('normal_color', c)}
                          label="Farbe"
                          fallbackColor="#1e293b"
                        />
                      </div>

                      <div className="flex items-center justify-center flex-1 min-w-fit">
                        <LineStyleSelector
                          style={plane.normal_style}
                          onChange={s => onUpdate('normal_style', s)}
                          label="Stil"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5 shrink-0" title="Linienstärke (pt)">
                        <span className="text-caption text-muted whitespace-nowrap">Dicke:</span>
                        <NumberInput
                          step="0.2"
                          min="0.2"
                          value={plane.normal_width ?? 1.2}
                          onChange={e => onUpdate('normal_width', parseFloat(e.target.value))}
                          className="h-7 w-22 text-xs text-center shrink-0"
                        />
                        <span className="text-caption text-ghost">pt</span>
                      </div>
                    </div>

                    {/* Pfeilspitze & Spitzenlänge */}
                    <div className="flex flex-wrap items-center gap-3 bg-panel/60 p-2.5 rounded-xl border border-line/40">
                      <div className="flex items-center gap-1.5 flex-1 min-w-[170px] max-w-[250px]">
                        <span className="text-caption text-muted whitespace-nowrap">Spitze:</span>
                        <select
                          value={normalTip}
                          onChange={e => handleNormalTipChange(e.target.value)}
                          className="w-full h-7 px-2 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                          title="Pfeilspitze"
                        >
                          {ARROW_TIP_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                          {isCustomNormalTip && normalTip && (
                            <option value={normalTip}>
                              {normalTip} (Benutzerdefiniert)
                            </option>
                          )}
                        </select>
                      </div>

                      {normalTip !== 'none' && (
                        <>
                          <div className="h-4 w-px bg-line/60 hidden sm:block" />
                          <div className="flex items-center gap-1.5 shrink-0" title="Spitzenlänge in mm">
                            <span className="text-caption text-muted whitespace-nowrap">Spitzenlänge:</span>
                            <NumberInput
                              step="0.5"
                              min="0.5"
                              value={normalLength}
                              onChange={e => handleNormalLengthChange(parseFloat(e.target.value) || 3)}
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
                          value={plane.normal_label ?? '$\\vec{n}$'}
                          onChange={e => onUpdate('normal_label', e.target.value)}
                          className="h-9 font-mono text-xs"
                          placeholder="z. B. \vec{n}"
                        />
                      </div>
                      <div>
                        <Label>Position der Beschriftung</Label>
                        <Input
                          value={plane.normal_label_pos ?? 'midway, above right'}
                          onChange={e => onUpdate('normal_label_pos', e.target.value)}
                          className="h-9 text-xs font-mono"
                          placeholder="z. B. midway, above right"
                        />
                      </div>
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

