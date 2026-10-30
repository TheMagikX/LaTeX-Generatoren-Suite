// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2, RotateCcw, Check, Pipette } from 'lucide-react'
import { Card, Switch, Button, Field, Input, NumberInput, Collapsible } from '../../../../components/ui'
import { PatternSel, IntegralHelper } from '../KoordControls'
import { StyleCopyMenu } from '../StyleCopyMenu'
import { COLOR_PRESETS, LINE_STYLE_PRESETS, LINE_WIDTH_OPTIONS } from '../../constantsStylePresets'
import type { Config, Plot, ShadeConfig, BetweenConfig, SlopeConfig, TangentConfig } from '../../typesKoord'

interface KoordPlotCardProps {
  plot: Plot
  index: number
  config: Config
  expanded: boolean
  onToggleExpand: () => void
  onUpdate: (key: keyof Plot, value: unknown) => void
  onDuplicate: () => void
  onRemove: () => void
  onAddPlot: (plot: Plot) => void
  subTab: string
  onSetSubTab: (tab: string) => void
  onCopyStyle?: () => void
  onPasteStyle?: () => void
  onApplyStyleToAll?: () => void
  hasCopiedStyle?: boolean
}

export const KoordPlotCard = ({
  plot, index, config, expanded, onToggleExpand, onUpdate, onDuplicate, onRemove, onAddPlot, subTab, onSetSubTab,
  onCopyStyle, onPasteStyle, onApplyStyleToAll, hasCopiedStyle
}: KoordPlotCardProps) => {

  const updateShade = (si: number, key: keyof ShadeConfig, value: unknown) => {
    const sh = [...plot.shades]; sh[si] = { ...sh[si], [key]: value }; onUpdate('shades', sh)
  }
  const addShade = () => onUpdate('shades', [...plot.shades, { show: true, a: config.xmin, b: config.xmax, fill: 'blue!40', pattern: 'none', alpha: 0.5, draw: 'none' }])
  const removeShade = (si: number) => onUpdate('shades', plot.shades.filter((_, i) => i !== si))

  const updateBetween = (bi: number, key: keyof BetweenConfig, value: unknown) => {
    const bt = [...plot.betweens]; bt[bi] = { ...bt[bi], [key]: value }; onUpdate('betweens', bt)
  }
  const addBetween = () => {
    const other = config.plots.findIndex((_, i) => i !== index); if (other === -1) return
    onUpdate('betweens', [...plot.betweens, { show: true, other_index: other, a: config.xmin, b: config.xmax, fill: 'blue!35', pattern: 'none', alpha: 0.5, draw: 'none' }])
  }
  const removeBetween = (bi: number) => onUpdate('betweens', plot.betweens.filter((_, i) => i !== bi))

  const updateSlope = (si: number, key: keyof SlopeConfig, value: unknown) => {
    const sl = [...plot.slopes]; sl[si] = { ...sl[si], [key]: value }; onUpdate('slopes', sl)
  }
  const addSlope = () => onUpdate('slopes', [...plot.slopes, { show: true, x0: 1.0, dx: 1.0, style: 'black, thin', label_show: true, label_x: '$\\Delta x$', label_y: '$\\Delta y$', label_style: 'font=\\scriptsize' }])
  const removeSlope = (si: number) => onUpdate('slopes', plot.slopes.filter((_, i) => i !== si))

  const updateTangent = (ti: number, key: keyof TangentConfig, value: unknown) => {
    const ta = [...(plot.tangents ?? [])]; ta[ti] = { ...ta[ti], [key]: value }; onUpdate('tangents', ta)
  }
  const addTangent = () => onUpdate('tangents', [...(plot.tangents ?? []), { show: true, x0: 1.0, xmin: null, xmax: null, style: 'red, thick', is_normal: false, label_show: false, label_text: '', label_pos: 0.5 }])
  const removeTangent = (ti: number) => onUpdate('tangents', (plot.tangents ?? []).filter((_, i) => i !== ti))

  const copyTangentToPlot = (ti: number) => {
    const t = plot.tangents[ti]
    const func = plot.func
    const x0 = t.x0
    const eps = 0.001
    const m_expr = `(((${func.replace(/x/g, `(${x0}+${eps})`)}) - (${func.replace(/x/g, `(${x0}-${eps})`)}))/(2*${eps}))`
    const y0_expr = `(${func.replace(/x/g, `(${x0})`)})`
    let finalFunc = ""
    if (t.is_normal) {
      finalFunc = `(-1/((${m_expr}) + 0.0000001)) * (x - ${x0}) + ${y0_expr}`
    } else {
      finalFunc = `${m_expr} * (x - ${x0}) + ${y0_expr}`
    }
    onAddPlot({
      show: true,
      func: finalFunc,
      color: '#ef4444',
      line_width: 'thick',
      line_style: 'solid',
      custom_style: '',
      xmin: t.xmin,
      xmax: t.xmax,
      label_text: t.label_text,
      label_pos: t.label_pos,
      label_style: 'above, sloped, font=\\small, fill=white, inner sep=1pt',
      shades: [],
      betweens: [],
      slopes: [],
      tangents: [],
    })
  }

  const others = config.plots.map((p, idx) => ({ idx, func: p.func })).filter(p => p.idx !== index)
  const currentColor = plot.color || '#1e293b'
  const currentLineWidth = plot.line_width || 'thick'
  const currentLineStyle = plot.line_style || 'solid'
  const isCustomColor = !COLOR_PRESETS.some(cp => cp.color.toLowerCase() === currentColor.toLowerCase())

  return (
    <Card className="border-line bg-canvas/40 overflow-hidden transition-all hover:border-rim">
      <div role="button" tabIndex={0} onClick={onToggleExpand} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggleExpand()} className="w-full flex items-center gap-3 p-3 text-left hover:bg-raised/20 transition-colors cursor-pointer">
        {expanded ? <ChevronDown size={14} className="text-primary shrink-0" /> : <ChevronRight size={14} className="text-ghost shrink-0" />}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-xs"
            style={{ backgroundColor: currentColor }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-ink">Plot {index + 1}</span>
            {!expanded && <span className="text-metadata truncate max-w-[200px]">{plot.func || '(leer)'}</span>}
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Switch checked={plot.show} onChange={(v: boolean) => onUpdate('show', v)} />
          {onCopyStyle && (
            <StyleCopyMenu
              onCopyStyle={onCopyStyle}
              onPasteStyle={onPasteStyle}
              onApplyToAll={onApplyStyleToAll}
              hasCopiedStyle={hasCopiedStyle}
              itemTypeName="Funktion"
            />
          )}
          <Button onClick={onDuplicate} className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2" title="Duplizieren">
            <Copy size={15} />
          </Button>
          <Button onClick={onRemove} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2">
            <Trash2 size={15} />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-line/50 space-y-4 pt-4">
          {/* 1. Funktion f(x) */}
          <Field label="Funktion f(x)">
            <Input
              value={plot.func}
              onChange={e => onUpdate('func', e.target.value)}
              placeholder="z. B. 0.5*x^2 - 2 oder sin(deg(x))"
              className="h-9 font-mono text-xs"
            />
          </Field>

          {/* 2. Stil-Leiste: Farbe, Linienstärke & Linienstil in einer Zeile */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
            {/* Farbe */}
            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.map(cp => {
                const isActive = currentColor.toLowerCase() === cp.color.toLowerCase()
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
                  style={{ backgroundColor: currentColor }}
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

            {/* Linienstärke */}
            <div>
              <select
                value={currentLineWidth}
                onChange={e => onUpdate('line_width', e.target.value)}
                className="px-2.5 py-1 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer h-7"
                title="Linienstärke"
              >
                {LINE_WIDTH_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-line/60 hidden sm:block" />

            {/* Linienstil */}
            <div className="flex items-center gap-1">
              {LINE_STYLE_PRESETS.map(lsp => {
                const isActive = currentLineStyle === lsp.value
                return (
                  <button
                    key={lsp.id}
                    type="button"
                    onClick={() => onUpdate('line_style', lsp.value)}
                    className={`h-7 px-2.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary ring-2 ring-primary/40 bg-primary/20 text-primary shadow-xs'
                        : 'border-line/70 hover:border-rim bg-panel/70 text-muted hover:text-ink'
                    }`}
                    title={lsp.label}
                  >
                    <svg width="26" height="6" viewBox="0 0 26 6" className="overflow-visible">
                      <line
                        x1="1"
                        y1="3"
                        x2="25"
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
          </div>

          <Collapsible title="Weitere Optionen (Definitionsbereich, TikZ-Code, Labels, Flächen...)" defaultOpen={false}>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Definitionsbereich (von x)">
                  <div className="flex items-center gap-1.5">
                    <NumberInput
                      step="0.1"
                      value={plot.xmin ?? ''}
                      placeholder={String(config.xmin).replace('.', ',')}
                      onChange={e => onUpdate('xmin', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                      className="h-9 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdate('xmin', null)}
                      disabled={plot.xmin === null || plot.xmin === undefined}
                      title="Auf Basis-Einstellung zurücksetzen"
                      className="h-9 px-2.5 rounded-lg bg-raised border border-line text-ghost hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </Field>
                <Field label="Definitionsbereich (Bis x)">
                  <div className="flex items-center gap-1.5">
                    <NumberInput
                      step="0.1"
                      value={plot.xmax ?? ''}
                      placeholder={String(config.xmax).replace('.', ',')}
                      onChange={e => onUpdate('xmax', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                      className="h-9 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdate('xmax', null)}
                      disabled={plot.xmax === null || plot.xmax === undefined}
                      title="Auf Basis-Einstellung zurücksetzen"
                      className="h-9 px-2.5 rounded-lg bg-raised border border-line text-ghost hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </Field>
              </div>

              <Field label="Zusätzliche TikZ-Optionen (z. B. smooth, samples=200)">
                <Input
                  value={plot.custom_style ?? ''}
                  onChange={e => onUpdate('custom_style', e.target.value)}
                  placeholder="z. B. smooth, opacity=0.8"
                  className="h-9 text-xs font-mono"
                />
              </Field>

              <div className="border border-line rounded-xl overflow-hidden bg-panel/30 shadow-sm">
                <div className="flex bg-panel/80 border-b border-line/60 p-1 gap-1">
                  {(['label', 'shades', 'betweens', 'slopes', 'tangents'] as const).map(t => (
                    <button key={t} onClick={() => onSetSubTab(t)}
                      className={`flex-1 py-1.5 rounded-lg text-caption tracking-tighter transition-all cursor-pointer ${
                        subTab === t
                          ? 'bg-raised text-primary font-bold shadow-sm border border-line/60'
                          : 'text-ghost hover:text-ink hover:bg-raised/40'
                      }`}>
                      {t === 'label'
                        ? (plot.label_text ? 'Label •' : 'Label')
                        : t === 'shades'
                        ? `Flächen (${plot.shades.length})`
                        : t === 'betweens'
                        ? `Zw.-Fl. (${plot.betweens.length})`
                        : t === 'slopes'
                        ? `Steig. (${plot.slopes.length})`
                        : `Tan/Norm (${(plot.tangents ?? []).length})`}
                    </button>
                  ))}
                </div>

                <div className="p-3 space-y-3">
                  {subTab === 'label' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Text (LaTeX)"><Input value={plot.label_text} onChange={e => onUpdate('label_text', e.target.value)} className="h-8 text-xs font-mono" /></Field>
                        <Field label="Rel. Pos. (0–1)"><NumberInput step="0.05" min="0" max="1" value={plot.label_pos} onChange={e => onUpdate('label_pos', parseFloat(e.target.value))} className="h-8" /></Field>
                      </div>
                      <Field label="Node-Style (LaTeX)"><Input value={plot.label_style} onChange={e => onUpdate('label_style', e.target.value)} className="h-8 text-xs font-mono" /></Field>
                    </div>
                  )}

                  {subTab === 'shades' && (
                    <div className="space-y-3">
                      <Button onClick={addShade} className="w-full py-1.5 bg-raised hover:bg-overlay text-caption tracking-wider text-ink border border-line/50">Fläche +</Button>
                      {plot.shades.map((sh, j) => (
                        <div key={j} className="bg-raised/30 p-3 rounded-xl border border-line/40 space-y-2">
                          <div className="flex-label-row">
                            <span className="text-caption tracking-widest">Fläche {j + 1}</span>
                            <button onClick={() => removeShade(j)} className="text-caption text-red-400/60 hover:text-red-400 p-1 cursor-pointer">Löschen</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Field label="a"><NumberInput step="0.1" value={sh.a ?? config.xmin} onChange={e => updateShade(j, 'a', parseFloat(e.target.value))} className="h-7 text-xs" /></Field>
                            <Field label="b"><NumberInput step="0.1" value={sh.b ?? config.xmax} onChange={e => updateShade(j, 'b', parseFloat(e.target.value))} className="h-7 text-xs" /></Field>
                            <Field label="Füllung"><Input value={sh.fill} onChange={e => updateShade(j, 'fill', e.target.value)} className="h-7 text-xs" /></Field>
                            <PatternSel value={sh.pattern} onChange={v => updateShade(j, 'pattern', v)} />
                            <Field label="Alpha"><NumberInput step="0.1" min="0" max="1" value={sh.alpha} onChange={e => updateShade(j, 'alpha', parseFloat(e.target.value))} className="h-7 text-xs" /></Field>
                            <Field label="Rand"><Input value={sh.draw} onChange={e => updateShade(j, 'draw', e.target.value)} className="h-7 text-xs" /></Field>
                          </div>
                          <IntegralHelper func={plot.func} a={sh.a ?? config.xmin} b={sh.b ?? config.xmax} />
                        </div>
                      ))}
                    </div>
                  )}

                  {subTab === 'betweens' && (
                    <div className="space-y-3">
                      <Button onClick={addBetween} disabled={others.length === 0} className="w-full py-1.5 bg-raised hover:bg-overlay text-caption tracking-wider disabled:opacity-30 text-ink border border-line/50">Zwischen-Fläche +</Button>
                      {plot.betweens.map((bt, j) => (
                        <div key={j} className="bg-raised/30 p-3 rounded-xl border border-line/40 space-y-2">
                          <div className="flex-label-row">
                            <span className="text-caption tracking-widest">Zw.-Fläche {j + 1}</span>
                            <button onClick={() => removeBetween(j)} className="text-caption text-red-400/60 hover:text-red-400 p-1 cursor-pointer">Löschen</button>
                          </div>
                          <Field label="Gegen Plot">
                            <select value={bt.other_index} onChange={e => updateBetween(j, 'other_index', parseInt(e.target.value))}
                              className="w-full px-2 py-1 bg-canvas border border-line rounded-md text-metadata text-ink focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer h-7">
                              {others.map(p => <option key={p.idx} value={p.idx}>Plot {p.idx + 1}: {p.func || '(leer)'}</option>)}
                            </select>
                          </Field>
                          <div className="grid grid-cols-2 gap-2">
                            <Field label="a"><NumberInput step="0.1" value={bt.a ?? config.xmin} onChange={e => updateBetween(j, 'a', parseFloat(e.target.value))} className="h-7 text-xs" /></Field>
                            <Field label="b"><NumberInput step="0.1" value={bt.b ?? config.xmax} onChange={e => updateBetween(j, 'b', parseFloat(e.target.value))} className="h-7 text-xs" /></Field>
                            <Field label="Füllung"><Input value={bt.fill} onChange={e => updateBetween(j, 'fill', e.target.value)} className="h-7 text-xs" /></Field>
                            <PatternSel value={bt.pattern} onChange={v => updateBetween(j, 'pattern', v)} />
                          </div>
                          <IntegralHelper
                            func={`abs((${plot.func}) - (${config.plots[bt.other_index]?.func || '0'}))`}
                            a={bt.a ?? config.xmin}
                            b={bt.b ?? config.xmax}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {subTab === 'slopes' && (
                    <div className="space-y-3">
                      <Button onClick={addSlope} className="w-full py-1.5 bg-raised hover:bg-overlay text-caption tracking-wider text-ink border border-line/50">Steigungsdreieck +</Button>
                      {plot.slopes.map((sl, j) => (
                        <div key={j} className="bg-raised/30 p-3 rounded-xl border border-line/40 space-y-2">
                          <div className="flex-label-row">
                            <span className="text-caption tracking-widest">Dreieck {j + 1}</span>
                            <button onClick={() => removeSlope(j)} className="text-caption text-red-400/60 hover:text-red-400 p-1 cursor-pointer">Löschen</button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Field label="x0"><NumberInput step="0.5" value={sl.x0} onChange={e => updateSlope(j, 'x0', parseFloat(e.target.value))} className="h-7 text-xs" /></Field>
                            <Field label="dx"><NumberInput step="0.5" value={sl.dx} onChange={e => updateSlope(j, 'dx', parseFloat(e.target.value))} className="h-7 text-xs" /></Field>
                            <Field label="Stil"><Input value={sl.style} onChange={e => updateSlope(j, 'style', e.target.value)} className="h-7 text-xs font-mono" /></Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {subTab === 'tangents' && (
                    <div className="space-y-3">
                      <Button onClick={addTangent} className="w-full py-1.5 bg-raised hover:bg-overlay text-caption tracking-wider text-ink border border-line/50">Tangente/Normale +</Button>
                      {(plot.tangents ?? []).map((ta, j) => (
                        <div key={j} className="bg-raised/30 p-3 rounded-xl border border-line/40 space-y-2">
                          <div className="flex-label-row">
                            <div className="flex items-center gap-2">
                              <span className="text-caption tracking-widest">{ta.is_normal ? 'Normale' : 'Tangente'} {j + 1}</span>
                              <Switch checked={ta.is_normal} onChange={(v: boolean) => updateTangent(j, 'is_normal', v)} label="Ist Normale" className="scale-75 origin-left" />
                            </div>
                            <button onClick={() => removeTangent(j)} className="text-caption text-red-400/60 hover:text-red-400 p-1 cursor-pointer">Löschen</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Field label="x0"><NumberInput step="0.5" value={ta.x0} onChange={e => updateTangent(j, 'x0', parseFloat(e.target.value))} className="h-7 text-xs" /></Field>
                            <Field label="Stil"><Input value={ta.style} onChange={e => updateTangent(j, 'style', e.target.value)} className="h-7 text-xs font-mono" /></Field>
                            <Field label="Von x (opt.)"><NumberInput step="0.5" value={ta.xmin ?? ''} onChange={e => updateTangent(j, 'xmin', e.target.value ? parseFloat(e.target.value) : null)} className="h-7 text-xs" placeholder="Auto" /></Field>
                            <Field label="Bis x (opt.)"><NumberInput step="0.5" value={ta.xmax ?? ''} onChange={e => updateTangent(j, 'xmax', e.target.value ? parseFloat(e.target.value) : null)} className="h-7 text-xs" placeholder="Auto" /></Field>
                          </div>
                          <div className="flex items-center gap-4 pt-1">
                            <Switch checked={ta.label_show} onChange={(v: boolean) => updateTangent(j, 'label_show', v)} label="Label" />
                            {ta.label_show && <Input value={ta.label_text} onChange={e => updateTangent(j, 'label_text', e.target.value)} className="h-7 text-xs flex-1" placeholder="Label Text" />}
                          </div>
                          <Button onClick={() => copyTangentToPlot(j)} className="w-full py-1 bg-primary/20 hover:bg-primary/40 text-[9px] font-bold uppercase text-primary border border-primary/20 flex items-center justify-center gap-1 mt-1">
                            <Copy size={10} /> Als Plot kopieren (Manuell editieren)
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Collapsible>
        </div>
      )}
    </Card>
  )
}
