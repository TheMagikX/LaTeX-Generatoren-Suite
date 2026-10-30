// SPDX-License-Identifier: AGPL-3.0-or-later

import { LineChart, Type, Sliders, RotateCcw, Sparkles } from 'lucide-react'
import { Accordion, Field, Input, NumberInput } from '../../../components/ui'
import { calcXLabelPos, calcYLabelPos, calcDefaultTickRange } from '../utilsKoord'
import type { Config } from '../typesKoord'

interface KoordTabQuickProps {
  config: Config
  updateConfig: (key: keyof Config, value: unknown) => void
}

export const KoordTabQuick = ({ config, updateConfig }: KoordTabQuickProps) => {
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

  const quickRanges = [
    { label: '[0, 10] × [0, 10]', xmin: 0, xmax: 10.25, ymin: 0, ymax: 10.25 },
    { label: '[-5, 5] × [-5, 5]', xmin: -5.25, xmax: 5.25, ymin: -5.25, ymax: 5.25 },
    { label: '[-10, 10] × [-10, 10]', xmin: -10.25, xmax: 10.25, ymin: -10.25, ymax: 10.25 },
    { label: '[0, 10] × [0, 5]', xmin: 0, xmax: 10.25, ymin: 0, ymax: 5.25 },
    { label: '[-10, 10] × [0, 10]', xmin: -10.25, xmax: 10.25, ymin: 0, ymax: 10.25 },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Bereich (X / Y Min & Max) */}
      <Accordion title="Koordinatenbereich (Min / Max)" icon={<LineChart size={18} />} defaultOpen={true}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 divide-x divide-line/50">
            {/* X Axis Range */}
            <div className="space-y-3 pr-6">
              <div className="text-center py-1.5 bg-panel border border-line rounded-lg shadow-xs">
                <h4 className="font-display font-bold text-xs text-ink tracking-wider uppercase">x-Achse</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="x min">
                  <NumberInput
                    step="0.25"
                    value={config.xmin}
                    onChange={e => updateConfig('xmin', parseFloat(e.target.value) || 0)}
                  />
                </Field>
                <Field label="x max">
                  <NumberInput
                    step="0.25"
                    value={config.xmax}
                    onChange={e => updateConfig('xmax', parseFloat(e.target.value) || 0)}
                  />
                </Field>
              </div>
            </div>

            {/* Y Axis Range */}
            <div className="space-y-3 pl-6">
              <div className="text-center py-1.5 bg-panel border border-line rounded-lg shadow-xs">
                <h4 className="font-display font-bold text-xs text-ink tracking-wider uppercase">y-Achse</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="y min">
                  <NumberInput
                    step="0.25"
                    value={config.ymin}
                    onChange={e => updateConfig('ymin', parseFloat(e.target.value) || 0)}
                  />
                </Field>
                <Field label="y max">
                  <NumberInput
                    step="0.25"
                    value={config.ymax}
                    onChange={e => updateConfig('ymax', parseFloat(e.target.value) || 0)}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="pt-3 border-t border-line/40 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted font-medium flex items-center gap-1 mr-1">
              <Sparkles size={13} className="text-primary" /> Schnellwahl:
            </span>
            {quickRanges.map(qr => (
              <button
                key={qr.label}
                type="button"
                onClick={() => {
                  updateConfig('xmin', qr.xmin)
                  updateConfig('xmax', qr.xmax)
                  updateConfig('ymin', qr.ymin)
                  updateConfig('ymax', qr.ymax)
                }}
                className="px-2.5 py-1 bg-raised hover:bg-overlay text-ink rounded-lg text-xs font-mono font-medium transition-colors border border-rim cursor-pointer"
              >
                {qr.label}
              </button>
            ))}
          </div>
        </div>
      </Accordion>

      {/* 2. Achsenbeschriftung & Position */}
      <Accordion title="Achsenbeschriftung & Position" icon={<Type size={18} />} defaultOpen={true}>
        <div className="grid grid-cols-2 divide-x divide-line/50">
          {/* X Label */}
          <div className="space-y-4 pr-6">
            <div className="text-center py-1.5 bg-panel border border-line rounded-lg shadow-xs">
              <h4 className="font-display font-bold text-xs text-ink tracking-wider uppercase">x-Achsen-Label</h4>
            </div>
            <Field label="Beschriftung (LaTeX)">
              <Input
                value={config.xlabel}
                onChange={e => updateConfig('xlabel', e.target.value)}
                placeholder="$x$"
              />
            </Field>
            <Field label="Position (x,y relativ)">
              <div className="flex gap-2">
                <Input
                  value={config.xlabel_pos}
                  onChange={e => updateConfig('xlabel_pos', e.target.value)}
                  placeholder="0.99,0.05"
                />
                <button
                  type="button"
                  onClick={() => updateConfig('xlabel_pos', calcXLabelPos(config.ymin, config.ymax))}
                  className="p-2.5 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-rim cursor-pointer flex items-center justify-center shrink-0"
                  title="Optimale Position berechnen"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </Field>
          </div>

          {/* Y Label */}
          <div className="space-y-4 pl-6">
            <div className="text-center py-1.5 bg-panel border border-line rounded-lg shadow-xs">
              <h4 className="font-display font-bold text-xs text-ink tracking-wider uppercase">y-Achsen-Label</h4>
            </div>
            <Field label="Beschriftung (LaTeX)">
              <Input
                value={config.ylabel}
                onChange={e => updateConfig('ylabel', e.target.value)}
                placeholder="$y$"
              />
            </Field>
            <Field label="Position (x,y relativ)">
              <div className="flex gap-2">
                <Input
                  value={config.ylabel_pos}
                  onChange={e => updateConfig('ylabel_pos', e.target.value)}
                  placeholder="0.02,0.97"
                />
                <button
                  type="button"
                  onClick={() => updateConfig('ylabel_pos', calcYLabelPos(config.xmin, config.xmax))}
                  className="p-2.5 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-rim cursor-pointer flex items-center justify-center shrink-0"
                  title="Optimale Position berechnen"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </Field>
          </div>
        </div>
      </Accordion>

      {/* 3. Skalenstriche, Skalierung & Zwischenschritte */}
      <Accordion title="Skalenstriche & Skalierung" icon={<Sliders size={18} />} defaultOpen={true}>
        <div className="space-y-6">
          {/* Tick Mode Switcher */}
          <div className="bg-raised/20 p-3.5 rounded-xl border border-line/50">
            <Field label="Skalenstrich-Modus">
              <div className="flex gap-1 p-1 bg-panel rounded-lg border border-line">
                {['Automatisch', 'Bereich', 'Manuell'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTickModeChange(m)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      config.tick_mode === m
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-ghost hover:text-ink hover:bg-raised'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>

            {/* If 'Bereich' is active, show the quick ticklist inputs */}
            {config.tick_mode === 'Bereich' && (
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-line/40">
                <Field label="x-Ticks Bereich">
                  <div className="flex gap-2">
                    <Input
                      value={config.xticklist || ''}
                      onChange={e => updateConfig('xticklist', e.target.value)}
                      placeholder={calcDefaultTickRange(config.xmin, config.xmax)}
                    />
                    <button
                      type="button"
                      onClick={() => updateConfig('xticklist', calcDefaultTickRange(config.xmin, config.xmax))}
                      className="p-2.5 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-rim cursor-pointer shrink-0"
                      title="Standard-Bereich berechnen"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </Field>
                <Field label="y-Ticks Bereich">
                  <div className="flex gap-2">
                    <Input
                      value={config.yticklist || ''}
                      onChange={e => updateConfig('yticklist', e.target.value)}
                      placeholder={calcDefaultTickRange(config.ymin, config.ymax)}
                    />
                    <button
                      type="button"
                      onClick={() => updateConfig('yticklist', calcDefaultTickRange(config.ymin, config.ymax))}
                      className="p-2.5 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-rim cursor-pointer shrink-0"
                      title="Standard-Bereich berechnen"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </Field>
              </div>
            )}
          </div>

          {/* Scaling and Minor Steps (Zwischenschritte) */}
          <div className="grid grid-cols-2 divide-x divide-line/50">
            {/* X-Achse Settings */}
            <div className="space-y-4 pr-6">
              <div className="text-center py-1.5 bg-panel border border-line rounded-lg shadow-xs">
                <h4 className="font-display font-bold text-xs text-ink tracking-wider uppercase">x-Achse</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Skalierung">
                  <NumberInput
                    step="0.5"
                    min="0.1"
                    value={config.scale_x}
                    onChange={e => updateConfig('scale_x', parseFloat(e.target.value) || 1)}
                  />
                </Field>
                <Field label="Zwischenschritte">
                  <NumberInput
                    min="0"
                    max="10"
                    value={config.minor_x}
                    onChange={e => updateConfig('minor_x', parseInt(e.target.value) || 0)}
                  />
                </Field>
              </div>
            </div>

            {/* Y-Achse Settings */}
            <div className="space-y-4 pl-6">
              <div className="text-center py-1.5 bg-panel border border-line rounded-lg shadow-xs">
                <h4 className="font-display font-bold text-xs text-ink tracking-wider uppercase">y-Achse</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Skalierung">
                  <NumberInput
                    step="0.5"
                    min="0.1"
                    value={config.scale_y}
                    onChange={e => updateConfig('scale_y', parseFloat(e.target.value) || 1)}
                  />
                </Field>
                <Field label="Zwischenschritte">
                  <NumberInput
                    min="0"
                    max="10"
                    value={config.minor_y}
                    onChange={e => updateConfig('minor_y', parseInt(e.target.value) || 0)}
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>
      </Accordion>
    </div>
  )
}
