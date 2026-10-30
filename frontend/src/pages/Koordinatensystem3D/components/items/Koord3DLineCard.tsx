// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2 } from 'lucide-react'
import { Card, Button, Switch, Label, Input, NumberInput } from '../../../../components/ui'
import type { Line3D, Point3D } from '../../typesKoord3D'
import { SectionExpander } from '../../utilsKoord3D'
import {
  ColorSelector,
  LineStyleSelector,
  ARROW_TIP_OPTIONS,
  parseArrow,
  composeArrow,
} from './Koord3DVectorCard'

interface Koord3DLineCardProps {
  index: number
  line: Line3D
  points: Point3D[]
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: <K extends keyof Line3D>(field: K, value: Line3D[K]) => void
  onRemove: () => void
  onDuplicate: () => void
  onSetMode: (mode: 'stuetz_richtung' | '2_punkte') => void
  onSetPoint1: (ptIdx: number | null) => void
  onSetPoint2: (ptIdx: number | null) => void
  onSetSvecPoint: (ptIdx: number | null) => void
  isDesignExpanded: boolean
  onToggleDesignExpand: () => void
}

export const Koord3DLineCard = ({
  index,
  line,
  points,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onDuplicate,
  onSetMode,
  onSetPoint1,
  onSetPoint2,
  onSetSvecPoint,
  isDesignExpanded,
  onToggleDesignExpand,
}: Koord3DLineCardProps) => {
  const { tip: rvecTip, length: rvecLength } = parseArrow(line.rvec_arrow || 'Stealth[length=3mm]')
  const isCustomRvecTip = !ARROW_TIP_OPTIONS.some(o => o.value === rvecTip)

  const handleRvecTipChange = (newTip: string) => {
    onUpdate('rvec_arrow', composeArrow(newTip, rvecLength))
  }

  const handleRvecLengthChange = (newLength: number) => {
    onUpdate('rvec_arrow', composeArrow(rvecTip, newLength))
  }

  const { tip: svecTip, length: svecLength } = parseArrow(line.svec_arrow || 'Stealth[length=3mm]')
  const isCustomSvecTip = !ARROW_TIP_OPTIONS.some(o => o.value === svecTip)

  const handleSvecTipChange = (newTip: string) => {
    onUpdate('svec_arrow', composeArrow(newTip, svecLength))
  }

  const handleSvecLengthChange = (newLength: number) => {
    onUpdate('svec_arrow', composeArrow(svecTip, newLength))
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
            style={{ backgroundColor: line.color?.startsWith('#') ? line.color : '#64748b' }}
          />
          <span className="text-sm font-medium text-ink truncate">{line.name || `Gerade ${index + 1}`}</span>
        </div>
        {!isExpanded && (
          (line.line_mode ?? 'stuetz_richtung') === '2_punkte' ? (
            <span className="text-metadata truncate max-w-[320px]">
              P1=({line.pt1_x ?? line.x0},{line.pt1_y ?? line.y0},{line.pt1_z ?? line.z0}) → P2=(
              {line.pt2_x ?? line.x0 + line.rx},{line.pt2_y ?? line.y0 + line.ry},{line.pt2_z ?? line.z0 + line.rz})
            </span>
          ) : (
            <span className="text-metadata truncate max-w-[320px]">
              x₀=({line.x0},{line.y0},{line.z0}) r=({line.rx},{line.ry},{line.rz})
            </span>
          )
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Switch checked={line.show} onChange={val => onUpdate('show', val)} />
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
              value={line.name}
              onChange={e => onUpdate('name', e.target.value)}
              placeholder={`Gerade ${index + 1}`}
              className="h-9"
            />
          </div>

          {/* Modus Umschalter */}
          <div>
            <Label>Eingabemodus</Label>
            <div className="flex gap-2 mt-1">
              {(['stuetz_richtung', '2_punkte'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSetMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    (line.line_mode ?? 'stuetz_richtung') === m
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-panel border border-line text-muted hover:text-ink hover:border-rim'
                  }`}
                >
                  {m === 'stuetz_richtung' ? 'Stütz- & Richtungsvektor' : '2 Punkte'}
                </button>
              ))}
            </div>
          </div>

          {/* Koordinateneingabe */}
          {(line.line_mode ?? 'stuetz_richtung') === '2_punkte' ? (
            <div className="space-y-3">
              <div>
                <Label>Punkt P1</Label>
                <div className="flex items-center gap-2 mt-1">
                  {points.length > 0 && (
                    <select
                      value={line.pt1_idx ?? ''}
                      onChange={e => {
                        const val = e.target.value
                        onSetPoint1(val === '' ? null : parseInt(val))
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
                      (line.pt1_idx ?? null) !== null ? ' opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <NumberInput
                      step="0.5"
                      value={line.pt1_x ?? line.x0}
                      onChange={e => onUpdate('pt1_x', parseFloat(e.target.value))}
                      className="h-9 w-20 text-xs"
                    />
                    <NumberInput
                      step="0.5"
                      value={line.pt1_y ?? line.y0}
                      onChange={e => onUpdate('pt1_y', parseFloat(e.target.value))}
                      className="h-9 w-20 text-xs"
                    />
                    <NumberInput
                      step="0.5"
                      value={line.pt1_z ?? line.z0}
                      onChange={e => onUpdate('pt1_z', parseFloat(e.target.value))}
                      className="h-9 w-20 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Punkt P2</Label>
                <div className="flex items-center gap-2 mt-1">
                  {points.length > 0 && (
                    <select
                      value={line.pt2_idx ?? ''}
                      onChange={e => {
                        const val = e.target.value
                        onSetPoint2(val === '' ? null : parseInt(val))
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
                      (line.pt2_idx ?? null) !== null ? ' opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <NumberInput
                      step="0.5"
                      value={line.pt2_x ?? line.x0 + line.rx}
                      onChange={e => onUpdate('pt2_x', parseFloat(e.target.value))}
                      className="h-9 w-20 text-xs"
                    />
                    <NumberInput
                      step="0.5"
                      value={line.pt2_y ?? line.y0 + line.ry}
                      onChange={e => onUpdate('pt2_y', parseFloat(e.target.value))}
                      className="h-9 w-20 text-xs"
                    />
                    <NumberInput
                      step="0.5"
                      value={line.pt2_z ?? line.z0 + line.rz}
                      onChange={e => onUpdate('pt2_z', parseFloat(e.target.value))}
                      className="h-9 w-20 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Stützvektor x₀</Label>
                <div className="flex items-center gap-2 mt-1">
                  {points.length > 0 && (
                    <select
                      value={line.svec_point_idx ?? ''}
                      onChange={e => {
                        const val = e.target.value
                        onSetSvecPoint(val === '' ? null : parseInt(val))
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
                      (line.svec_point_idx ?? null) !== null ? ' opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <NumberInput
                      step="0.5"
                      value={line.x0}
                      onChange={e => onUpdate('x0', parseFloat(e.target.value))}
                      className="h-9 w-20 text-xs"
                    />
                    <NumberInput
                      step="0.5"
                      value={line.y0}
                      onChange={e => onUpdate('y0', parseFloat(e.target.value))}
                      className="h-9 w-20 text-xs"
                    />
                    <NumberInput
                      step="0.5"
                      value={line.z0}
                      onChange={e => onUpdate('z0', parseFloat(e.target.value))}
                      className="h-9 w-20 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Richtungsvektor r</Label>
                <div className="flex gap-2 mt-1">
                  <NumberInput
                    step="0.5"
                    value={line.rx}
                    onChange={e => onUpdate('rx', parseFloat(e.target.value))}
                    className="h-9 w-20 text-xs"
                  />
                  <NumberInput
                    step="0.5"
                    value={line.ry}
                    onChange={e => onUpdate('ry', parseFloat(e.target.value))}
                    className="h-9 w-20 text-xs"
                  />
                  <NumberInput
                    step="0.5"
                    value={line.rz}
                    onChange={e => onUpdate('rz', parseFloat(e.target.value))}
                    className="h-9 w-20 text-xs"
                  />
                </div>
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
              {/* Gerade-Hauptstil: Farbe, Linienstil & Dicke */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
                <div className="flex items-center shrink-0">
                  <ColorSelector
                    color={line.color}
                    onChange={c => onUpdate('color', c)}
                    label="Farbe"
                    fallbackColor="#64748b"
                  />
                </div>

                <div className="flex items-center justify-center flex-1 min-w-fit">
                  <LineStyleSelector
                    style={line.style}
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
                    value={line.width}
                    onChange={e => onUpdate('width', parseFloat(e.target.value))}
                    className="h-7 w-22 text-xs text-center shrink-0"
                  />
                  <span className="text-caption text-ghost">pt</span>
                </div>
              </div>

              {/* Parametergrenzen tmin & tmax */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>t-min</Label>
                  <NumberInput
                    step="1"
                    value={line.tmin}
                    onChange={e => onUpdate('tmin', parseFloat(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label>t-max</Label>
                  <NumberInput
                    step="1"
                    value={line.tmax}
                    onChange={e => onUpdate('tmax', parseFloat(e.target.value))}
                    className="h-9"
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
                        line.draw_mode === m
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-panel border border-line text-muted hover:text-ink hover:border-rim'
                      }`}
                    >
                      {m === 'vorne' ? 'Immer vorne' : m === 'hinten' ? 'Immer hinten' : 'Automatisch'}
                    </button>
                  ))}
                </div>
                {line.draw_mode !== 'vorne' && (
                  <div className="pt-2">
                    <Label>Stil für verdeckte Abschnitte</Label>
                    <Input
                      value={line.behind_style}
                      onChange={e => onUpdate('behind_style', e.target.value)}
                      className="h-8 text-xs font-mono"
                      placeholder="z. B. dashed, opacity=0.5"
                    />
                  </div>
                )}
              </div>

              {/* Richtungsvektor Anzeige */}
              <div className="bg-raised/30 rounded-xl p-3.5 border border-line/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Richtungsvektor</span>
                  <Switch
                    checked={line.rvec_show}
                    onChange={val => onUpdate('rvec_show', val)}
                    label="Anzeigen"
                  />
                </div>

                {line.rvec_show && (
                  <div className="space-y-3 pt-1 border-t border-line/40">
                    {/* Farbe, Linienstil & Dicke */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-panel/60 p-2.5 rounded-xl border border-line/40">
                      <div className="flex items-center shrink-0">
                        <ColorSelector
                          color={line.rvec_color}
                          onChange={c => onUpdate('rvec_color', c)}
                          label="Farbe"
                          fallbackColor="#1e293b"
                        />
                      </div>

                      <div className="flex items-center justify-center flex-1 min-w-fit">
                        <LineStyleSelector
                          style={line.rvec_style}
                          onChange={s => onUpdate('rvec_style', s)}
                          label="Stil"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5 shrink-0" title="Linienstärke (pt)">
                        <span className="text-caption text-muted whitespace-nowrap">Dicke:</span>
                        <NumberInput
                          step="0.2"
                          min="0.2"
                          value={line.rvec_width ?? 1.2}
                          onChange={e => onUpdate('rvec_width', parseFloat(e.target.value))}
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
                          value={rvecTip}
                          onChange={e => handleRvecTipChange(e.target.value)}
                          className="w-full h-7 px-2 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                          title="Pfeilspitze"
                        >
                          {ARROW_TIP_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                          {isCustomRvecTip && rvecTip && (
                            <option value={rvecTip}>
                              {rvecTip} (Benutzerdefiniert)
                            </option>
                          )}
                        </select>
                      </div>

                      {rvecTip !== 'none' && (
                        <>
                          <div className="h-4 w-px bg-line/60 hidden sm:block" />
                          <div className="flex items-center gap-1.5 shrink-0" title="Spitzenlänge in mm">
                            <span className="text-caption text-muted whitespace-nowrap">Spitzenlänge:</span>
                            <NumberInput
                              step="0.5"
                              min="0.5"
                              value={rvecLength}
                              onChange={e => handleRvecLengthChange(parseFloat(e.target.value) || 3)}
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
                          value={line.rvec_label}
                          onChange={e => onUpdate('rvec_label', e.target.value)}
                          className="h-9 font-mono text-xs"
                          placeholder="z. B. \vec{r}"
                        />
                      </div>
                      <div>
                        <Label>Position der Beschriftung</Label>
                        <Input
                          value={line.rvec_label_style}
                          onChange={e => onUpdate('rvec_label_style', e.target.value)}
                          className="h-9 text-xs font-mono"
                          placeholder="z. B. midway, below"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stützvektor Anzeige */}
              <div className="bg-raised/30 rounded-xl p-3.5 border border-line/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Stützvektor</span>
                  <Switch
                    checked={line.svec_show}
                    onChange={val => onUpdate('svec_show', val)}
                    label="Anzeigen"
                  />
                </div>

                {line.svec_show && (
                  <div className="space-y-3 pt-1 border-t border-line/40">
                    {/* Farbe, Linienstil & Dicke */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-panel/60 p-2.5 rounded-xl border border-line/40">
                      <div className="flex items-center shrink-0">
                        <ColorSelector
                          color={line.svec_color}
                          onChange={c => onUpdate('svec_color', c)}
                          label="Farbe"
                          fallbackColor="#1e293b"
                        />
                      </div>

                      <div className="flex items-center justify-center flex-1 min-w-fit">
                        <LineStyleSelector
                          style={line.svec_style}
                          onChange={s => onUpdate('svec_style', s)}
                          label="Stil"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5 shrink-0" title="Linienstärke (pt)">
                        <span className="text-caption text-muted whitespace-nowrap">Dicke:</span>
                        <NumberInput
                          step="0.2"
                          min="0.2"
                          value={line.svec_width ?? 1.2}
                          onChange={e => onUpdate('svec_width', parseFloat(e.target.value))}
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
                          value={svecTip}
                          onChange={e => handleSvecTipChange(e.target.value)}
                          className="w-full h-7 px-2 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                          title="Pfeilspitze"
                        >
                          {ARROW_TIP_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                          {isCustomSvecTip && svecTip && (
                            <option value={svecTip}>
                              {svecTip} (Benutzerdefiniert)
                            </option>
                          )}
                        </select>
                      </div>

                      {svecTip !== 'none' && (
                        <>
                          <div className="h-4 w-px bg-line/60 hidden sm:block" />
                          <div className="flex items-center gap-1.5 shrink-0" title="Spitzenlänge in mm">
                            <span className="text-caption text-muted whitespace-nowrap">Spitzenlänge:</span>
                            <NumberInput
                              step="0.5"
                              min="0.5"
                              value={svecLength}
                              onChange={e => handleSvecLengthChange(parseFloat(e.target.value) || 3)}
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
                          value={line.svec_label}
                          onChange={e => onUpdate('svec_label', e.target.value)}
                          className="h-9 font-mono text-xs"
                          placeholder="z. B. \vec{s}"
                        />
                      </div>
                      <div>
                        <Label>Position der Beschriftung</Label>
                        <Input
                          value={line.svec_label_style}
                          onChange={e => onUpdate('svec_label_style', e.target.value)}
                          className="h-9 text-xs font-mono"
                          placeholder="z. B. midway, below"
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
