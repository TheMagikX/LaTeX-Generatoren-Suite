// SPDX-License-Identifier: AGPL-3.0-or-later

import { Type, RotateCcw, Kanban, Grid3X3, MousePointer2, Sliders, Info } from 'lucide-react'
import { Accordion, Switch, SecHead, Field, Input, NumberInput, Label } from '../../../components/ui'
import { calcXLabelPos, calcYLabelPos, calcDefaultTickRange } from '../utilsKoord'
import { Chk } from './KoordControls'
import type { Config } from '../typesKoord'

interface KoordTabAchsenProps {
  config: Config
  updateConfig: (key: keyof Config, value: unknown) => void
}

export const KoordTabAchsen = ({ config, updateConfig }: KoordTabAchsenProps) => {
  const handleTickModeChange = (m: string) => {
    updateConfig('tick_mode', m)
    if (m === 'Bereich') {
      if (!config.xticklist || config.xticklist.trim() === '') {
        updateConfig('xticklist', calcDefaultTickRange(config.xmin, config.xmax))
      }
      if (!config.yticklist || config.yticklist.trim() === '') {
        updateConfig('yticklist', calcDefaultTickRange(config.ymin, config.ymax))
      }
    }
  }

  return (
    <div className="space-y-6">
      <Accordion title="Achsenbeschriftung" icon={<Type size={18} />} defaultOpen={false}>
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-raised/20 p-3 rounded-xl border border-line/50">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary" />
              <span className="text-sm font-medium text-ink">Beschriftungen anzeigen</span>
            </div>
            <Switch checked={config.label_show} onChange={(v: boolean) => updateConfig('label_show', v)} />
          </div>

          <div className="grid grid-cols-2 divide-x divide-line/50">
            {/* X-Axis */}
            <div className="space-y-4 pr-6">
              <div className="text-center py-2 bg-panel border border-line rounded-xl shadow-xs">
                <h3 className="font-display font-bold text-sm text-ink tracking-wider">x-Achse</h3>
              </div>
              <Field label="Beschriftung (LaTeX)">
                <Input value={config.xlabel} onChange={e => updateConfig('xlabel', e.target.value)} />
              </Field>
              <div className="space-y-4 mt-1">
                {[
                  {
                    title: "Bereiche",
                    items: [
                      { label: 'x', xmin: 0, xlabel: '\\large $x$'},
                      { label: 't', xmin: 0, xlabel: '\\large $t$'},
                      { label: 't in s', xlabel: '\\large $t$ in $\\si{\\second}$'},
                    ]
                  },
                ].map(group => (
                  <div key={group.title} className="flex flex-wrap gap-2">
                    {group.items.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          Object.entries(p).forEach(([key, value]) => {
                            if (key !== 'label' && value !== undefined) updateConfig(key as keyof Config, value);
                          });
                        }}
                        className="px-3 py-1.5 bg-raised hover:bg-overlay text-ink rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-border"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <Field label="Position ((x,y), Prozentual zum Koordinatensystem)">
                <div className="flex gap-2">
                  <Input value={config.xlabel_pos} onChange={e => updateConfig('xlabel_pos', e.target.value)} placeholder="0.99,0.05" />
                  <button
                    onClick={() => updateConfig('xlabel_pos', calcXLabelPos(config.ymin, config.ymax))}
                    className="p-2.5 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-rim"
                    title="Optimale Position berechnen"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Switch checked={config.xlabel_background} onChange={(v: boolean) => updateConfig('xlabel_background', v)} label="Hintergrund füllen" />
                <div className="flex items-center gap-2">
                  <Label className="mb-0 text-caption whitespace-nowrap">Abstand</Label>
                  <NumberInput step="0.25" value={config.xlabel_background_sep} onChange={e => updateConfig('xlabel_background_sep', parseFloat(e.target.value))} className="h-8" />
                </div>
              </div>
            </div>

            {/* Y-Axis */}
            <div className="space-y-4 pl-6">
              <div className="text-center py-2 bg-panel border border-line rounded-xl shadow-xs">
                <h3 className="font-display font-bold text-sm text-ink tracking-wider">y-Achse</h3>
              </div>
              <Field label="Beschriftung (LaTeX)">
                <Input value={config.ylabel} onChange={e => updateConfig('ylabel', e.target.value)} />
              </Field>
              <div className="space-y-4 mt-1">
                {[
                  {
                    title: "Bereiche",
                    items: [
                      { label: 'y', xmin: 0, ylabel: '\\large $y$'},
                      { label: 'f(x)', xmin: 0, ylabel: '\\large $f(x)$'},
                      { label: 'f(t)', xmin: 0, ylabel: '\\large $f(t)$'},
                      { label: 's in m', ylabel: '\\large $s$ in $\\si{\\metre}$'},
                      { label: 'v in m/s', ylabel: '\\large $v$ in $\\si{\\metre\\per\\second}$'},
                      { label: <>a in m/s<sup>2</sup></>, ylabel: '\\large $a$ in $\\si{\\metre\\per\\second\\squared}$'},
                    ]
                  },
                ].map(group => (
                  <div key={group.title} className="flex flex-wrap gap-2">
                    {group.items.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          Object.entries(p).forEach(([key, value]) => {
                            if (key !== 'label' && value !== undefined) updateConfig(key as keyof Config, value);
                          });
                        }}
                        className="px-3 py-1.5 bg-raised hover:bg-overlay text-ink rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-border"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <Field label="Position ((x,y), Prozentual zum Koordinatensystem)">
                <div className="flex gap-2">
                  <Input value={config.ylabel_pos} onChange={e => updateConfig('ylabel_pos', e.target.value)} placeholder="0.02,0.97" />
                  <button
                    onClick={() => updateConfig('ylabel_pos', calcYLabelPos(config.xmin, config.xmax))}
                    className="p-2.5 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-rim"
                    title="Optimale Position berechnen"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Switch checked={config.ylabel_background} onChange={(v: boolean) => updateConfig('ylabel_background', v)} label="Hintergrund füllen" />
                <Switch checked={config.ylabel_rot} onChange={(v: boolean) => updateConfig('ylabel_rot', v)} label="Vertikal" />
              </div>
            </div>
          </div>
        </div>
      </Accordion>

      <Accordion title="Skalenstriche" icon={<Kanban size={18} />} defaultOpen={false}>
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-8 bg-raised/20 p-4 rounded-xl border border-line/50">
              <Field label="Skalenstrich-Modus" className="flex-1">
                <div className="flex gap-1 p-1 bg-panel rounded-lg border border-line">
                  {['Automatisch', 'Bereich', 'Manuell'].map(m => (
                    <button key={m} onClick={() => handleTickModeChange(m)}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${config.tick_mode === m ? 'bg-primary text-white shadow-lg' : 'text-ghost hover:text-ink hover:bg-raised'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="flex gap-6 pt-4">
                <Chk checked={config.majorticklabels} onChange={(v: boolean) => updateConfig('majorticklabels', v)} label="Werte" />
                <Chk checked={config.ticks_show} onChange={(v: boolean) => updateConfig('ticks_show', v)} label="Striche" />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => updateConfig('xlog', !config.xlog)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${config.xlog ? 'bg-primary text-white shadow-lg' : 'text-ghost hover:text-ink hover:bg-raised border border-line bg-panel'}`}
                  title="Logarithmische x-Achse"
                >
                  log x
                </button>
                <button
                  onClick={() => updateConfig('ylog', !config.ylog)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${config.ylog ? 'bg-primary text-white shadow-lg' : 'text-ghost hover:text-ink hover:bg-raised border border-line bg-panel'}`}
                  title="Logarithmische y-Achse"
                >
                  log y
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-line/50">
              {/* X Ticks */}
              <div className="space-y-4 pr-6">
                <div className="text-center py-2 bg-panel border border-line rounded-xl shadow-xs">
                  <h3 className="font-display font-bold text-sm text-ink tracking-wider">x-Achse</h3>
                </div>
                <Field label="Skalierung">
                  <NumberInput step="1" min="0.1" value={config.scale_x} onChange={e => updateConfig('scale_x', parseFloat(e.target.value))} />
                </Field>
                {config.tick_mode === 'Bereich' && (
                  <Field label="Ticks (z.B. -2,0,2)">
                    <div className="flex gap-2">
                      <Input
                        value={config.xticklist || ''}
                        onChange={e => updateConfig('xticklist', e.target.value)}
                        placeholder={calcDefaultTickRange(config.xmin, config.xmax)}
                      />
                      <button
                        onClick={() => updateConfig('xticklist', calcDefaultTickRange(config.xmin, config.xmax))}
                        className="p-2.5 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-rim cursor-pointer"
                        title="Standard-Bereich berechnen"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </Field>
                )}
                {config.tick_mode === 'Manuell' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Positionen"><Input value={config.x_tick_pos_manuell} onChange={e => updateConfig('x_tick_pos_manuell', e.target.value)} /></Field>
                    <Field label="Labels"><Input value={config.x_tick_label_manuell} onChange={e => updateConfig('x_tick_label_manuell', e.target.value)} /></Field>
                  </div>
                )}
                <div className="bg-raised/30 p-4 rounded-xl border border-line/50 space-y-3">
                  {/* Row 1: Beschriftungsfaktor, Nachkommastellen, Zwischenschritte */}
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Beschriftungsfaktor"><NumberInput step="1" min="0.001" value={config.mult_x} onChange={e => updateConfig('mult_x', parseFloat(e.target.value))} className="h-8 text-xs" /></Field>
                    <Field label="Nachkommastellen"><NumberInput min="0" value={config.prec_x} onChange={e => updateConfig('prec_x', parseInt(e.target.value))} className="h-8 text-xs" /></Field>
                    <Field label="Zwischenschritte"><NumberInput min="0" value={config.minor_x} onChange={e => updateConfig('minor_x', parseInt(e.target.value))} className="h-8 text-xs" /></Field>
                  </div>

                  {/* Row 2: Format (TikZ), Suffix */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Format (TikZ)"><Input value={config.xtickformat} onChange={e => updateConfig('xtickformat', e.target.value)} className="h-8 text-xs font-mono" /></Field>
                    <Field label="Suffix"><Input value={config.label_suffix_x} onChange={e => updateConfig('label_suffix_x', e.target.value)} className="h-8 text-xs font-mono" /></Field>
                  </div>

                  {/* Row 3: Checkboxes aligned with the two columns above */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Switch checked={config.xtickfrac} onChange={(v: boolean) => updateConfig('xtickfrac', v)} label="Anzeige als Bruch" description="Skalenbeschriftung als Bruch darstellen" />
                    <Switch checked={config.sep_x} onChange={(v: boolean) => updateConfig('sep_x', v)} label="Tausendertrenner" description="Tausendertrenner anzeigen" />
                  </div>
                </div>
              </div>

              {/* Y Ticks */}
              <div className="space-y-4 pl-6">
                <div className="text-center py-2 bg-panel border border-line rounded-xl shadow-xs">
                  <h3 className="font-display font-bold text-sm text-ink tracking-wider">y-Achse</h3>
                </div>
                <Field label="Skalierung">
                  <NumberInput step="1" min="0.1" value={config.scale_y} onChange={e => updateConfig('scale_y', parseFloat(e.target.value))} />
                </Field>
                {config.tick_mode === 'Bereich' && (
                  <Field label="Ticks (z.B. -2,0,2)">
                    <div className="flex gap-2">
                      <Input
                        value={config.yticklist || ''}
                        onChange={e => updateConfig('yticklist', e.target.value)}
                        placeholder={calcDefaultTickRange(config.ymin, config.ymax)}
                      />
                      <button
                        onClick={() => updateConfig('yticklist', calcDefaultTickRange(config.ymin, config.ymax))}
                        className="p-2.5 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-rim cursor-pointer"
                        title="Standard-Bereich berechnen"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </Field>
                )}
                {config.tick_mode === 'Manuell' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Positionen"><Input value={config.y_tick_pos_manuell} onChange={e => updateConfig('y_tick_pos_manuell', e.target.value)} /></Field>
                    <Field label="Labels"><Input value={config.y_tick_label_manuell} onChange={e => updateConfig('y_tick_label_manuell', e.target.value)} /></Field>
                  </div>
                )}
                <div className="bg-raised/30 p-4 rounded-xl border border-line/50 space-y-3">
                  {/* Row 1: Beschriftungsfaktor, Nachkommastellen, Zwischenschritte */}
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Beschriftungsfaktor"><NumberInput step="1" min="0.001" value={config.mult_y} onChange={e => updateConfig('mult_y', parseFloat(e.target.value))} className="h-8 text-xs" /></Field>
                    <Field label="Nachkommastellen"><NumberInput min="0" value={config.prec_y} onChange={e => updateConfig('prec_y', parseInt(e.target.value))} className="h-8 text-xs" /></Field>
                    <Field label="Zwischenschritte"><NumberInput min="0" value={config.minor_y} onChange={e => updateConfig('minor_y', parseInt(e.target.value))} className="h-8 text-xs" /></Field>
                  </div>

                  {/* Row 2: Format (TikZ), Suffix */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Format (TikZ)"><Input value={config.ytickformat} onChange={e => updateConfig('ytickformat', e.target.value)} className="h-8 text-xs font-mono" /></Field>
                    <Field label="Suffix"><Input value={config.label_suffix_y} onChange={e => updateConfig('label_suffix_y', e.target.value)} className="h-8 text-xs font-mono" /></Field>
                  </div>

                  {/* Row 3: Checkboxes aligned with the two columns above */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Switch checked={config.ytickfrac} onChange={(v: boolean) => updateConfig('ytickfrac', v)} label="Anzeige als Bruch" description="Skalenbeschriftung als Bruch darstellen" />
                    <Switch checked={config.sep_y} onChange={(v: boolean) => updateConfig('sep_y', v)} label="Tausendertrenner" description="Tausendertrenner anzeigen" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Accordion>

      <Accordion title="Visueller Stil (Gitter & Linien)" icon={<Grid3X3 size={18} />}>
        <div className="space-y-8">
          {/* Gitter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SecHead icon={<Grid3X3 size={14} />}>Hintergrund-Gitter</SecHead>
              <Switch checked={config.grid_show} onChange={(v: boolean) => updateConfig('grid_show', v)} />
            </div>
            {config.grid_show && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ghost">Hauptgitter (Major Grid)</span>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Farbe"><Input value={config.grid_major_color} onChange={e => updateConfig('grid_major_color', e.target.value)} /></Field>
                    <Field label="Dicke (pt)"><NumberInput step="0.1" min="0.1" value={config.grid_major_width} onChange={e => updateConfig('grid_major_width', parseFloat(e.target.value))} /></Field>
                    <Field label="Optionen"><Input value={config.grid_major_extras} onChange={e => updateConfig('grid_major_extras', e.target.value)} /></Field>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-line/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-ghost">Nebengitter (Minor Grid)</span>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Farbe"><Input value={config.grid_minor_color} onChange={e => updateConfig('grid_minor_color', e.target.value)} /></Field>
                    <Field label="Dicke (pt)"><NumberInput step="0.1" min="0.1" value={config.grid_minor_width} onChange={e => updateConfig('grid_minor_width', parseFloat(e.target.value))} /></Field>
                    <Field label="Optionen"><Input value={config.grid_minor_extras} onChange={e => updateConfig('grid_minor_extras', e.target.value)} /></Field>
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-t border-line/50 my-2" />

          {/* Achsen */}
          <div className="space-y-4">
            <SecHead icon={<MousePointer2 size={14} />}>Achsen-Linien</SecHead>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Farbe"><Input value={config.axis_color} onChange={e => updateConfig('axis_color', e.target.value)} /></Field>
              <Field label="Dicke (pt)"><NumberInput step="0.25" min="0.25" value={config.axis_width} onChange={e => updateConfig('axis_width', parseFloat(e.target.value))} /></Field>
              <Field label="Optionen"><Input value={config.axis_extras} onChange={e => updateConfig('axis_extras', e.target.value)} /></Field>
            </div>
          </div>

          <hr className="border-t border-line/50 my-2" />

          {/* Ticks */}
          <div className="space-y-4">
            <SecHead icon={<Sliders size={14} />}>Skalenstriche</SecHead>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Farbe"><Input value={config.tick_color} onChange={e => updateConfig('tick_color', e.target.value)} /></Field>
              <Field label="Dicke (pt)"><NumberInput step="0.2" min="0.2" value={config.tick_width} onChange={e => updateConfig('tick_width', parseFloat(e.target.value))} /></Field>
              <Field label="Optionen"><Input value={config.tick_extras} onChange={e => updateConfig('tick_extras', e.target.value)} /></Field>
            </div>
          </div>
        </div>
      </Accordion>
    </div>
  )
}
