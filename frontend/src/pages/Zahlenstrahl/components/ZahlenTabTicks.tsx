// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { Label, NumberInput, Switch, SecHead, FontSelector, Input } from '../../../components/ui'
import { Sparkles, Dices, Layers } from 'lucide-react'
import type { ZahlenBatchSetter, ZahlenSetter, ZahlenstrahlConfig } from '../typesZahlen'
import { SCALE_PRESETS } from '../constantsZahlen'

interface ZahlenTabTicksProps {
  config: ZahlenstrahlConfig
  set: ZahlenSetter
  batchSet?: ZahlenBatchSetter
}

export const ZahlenTabTicks = ({ config, set, batchSet }: ZahlenTabTicksProps) => {
  // Local state for comma-separated inputs to allow intermediate typing states
  const configHiddenTicksStr = config.hidden_ticks.join(', ')
  const [hiddenTicksDraft, setHiddenTicksDraft] = useState<{ source: string; text: string } | null>(null)
  const hiddenTicksStr = hiddenTicksDraft?.source === configHiddenTicksStr ? hiddenTicksDraft.text : configHiddenTicksStr

  const applyPreset = (presetValues: Partial<ZahlenstrahlConfig>) => {
    if (batchSet) {
      batchSet(presetValues)
    } else {
      (Object.keys(presetValues) as Array<keyof ZahlenstrahlConfig>).forEach(key => {
        const val = presetValues[key]
        if (val !== undefined) {
          set(key, val as any)
        }
      })
    }
  }

  const handleGenerateRandomBlanks = () => {
    // Generate tick candidates in current range
    const step = config.step_main || 1.0
    const candidates: number[] = []
    const start = config.min_val
    const stop = config.max_val
    for (let v = start; v <= stop + 1e-9; v += step) {
      candidates.push(Number(v.toFixed(4)))
    }
    if (candidates.length <= 1) return

    // Pick 2 random distinct indices
    const shuffled = [...candidates].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, Math.min(2, candidates.length)).sort((a, b) => a - b)
    set('hidden_ticks', selected)
    setHiddenTicksDraft(null)
  }

  return (
    <div className="space-y-8">
      {/* 1. Didactic Scale Presets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary" />
          <SecHead>Didaktische Skalen-Presets</SecHead>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {SCALE_PRESETS.map(preset => {
            const isActive = config.scale_preset === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.values)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all text-xs ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary'
                    : 'border-rim bg-panel hover:bg-raised text-ink'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-sm">{preset.label}</span>
                  <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-raised border border-rim">
                    {preset.badge}
                  </span>
                </div>
                <span className="text-ink-muted text-[11px] leading-tight line-clamp-2">
                  {preset.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Three-Level Tick Hierarchy */}
      <div className="space-y-4 pt-4 border-t border-line">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <SecHead>Teilstrich-Hierarchie (3 Stufen)</SecHead>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Ticks (Level 0) */}
          <div className="p-3.5 rounded-xl border border-rim bg-raised/30 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="font-semibold text-sm text-ink">Hauptschritte</span>
              <span className="text-[10px] font-mono text-primary font-bold">Stufe 0</span>
            </div>
            <div>
              <Label>Schrittweite</Label>
              <NumberInput
                value={config.step_main}
                min={0.001}
                step={0.1}
                onChange={e => {
                  set('step_main', parseFloat(e.target.value) || 1.0)
                  set('scale_preset', null)
                }}
              />
            </div>
            <div>
              <Label>Höhe (cm)</Label>
              <NumberInput
                value={config.tick_main_h}
                step={0.01}
                min={0.01}
                onChange={e => set('tick_main_h', parseFloat(e.target.value) || 0.12)}
              />
            </div>
            <div>
              <Label>Linienstärke</Label>
              <select
                value={config.tick_main_width}
                onChange={e => set('tick_main_width', e.target.value)}
                className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ultra thin">Ultra dünn</option>
                <option value="thin">Dünn</option>
                <option value="semithick">Normal</option>
                <option value="thick">Dick</option>
                <option value="very thick">Sehr dick</option>
              </select>
            </div>
          </div>

          {/* Mid Ticks (Level 1) */}
          <div className="p-3.5 rounded-xl border border-rim bg-raised/30 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="font-semibold text-sm text-ink">Mittelschritte (Hälften / 5er)</span>
              <span className="text-[10px] font-mono text-ink-muted">Stufe 1</span>
            </div>
            <div>
              <Label>Schrittweite (0 = aus)</Label>
              <NumberInput
                value={config.step_mid || 0}
                min={0}
                step={0.05}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  set('step_mid', val > 0 ? val : null)
                  set('scale_preset', null)
                }}
              />
            </div>
            <div>
              <Label>Höhe (cm)</Label>
              <NumberInput
                value={config.tick_mid_h}
                step={0.01}
                min={0.01}
                onChange={e => set('tick_mid_h', parseFloat(e.target.value) || 0.08)}
              />
            </div>
            <div>
              <Label>Linienstärke</Label>
              <select
                value={config.tick_mid_width}
                onChange={e => set('tick_mid_width', e.target.value)}
                className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ultra thin">Ultra dünn</option>
                <option value="thin">Dünn</option>
                <option value="semithick">Normal</option>
                <option value="thick">Dick</option>
              </select>
            </div>
          </div>

          {/* Sub Ticks (Level 2) */}
          <div className="p-3.5 rounded-xl border border-rim bg-raised/30 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="font-semibold text-sm text-ink">Nebenschritte (Fein)</span>
              <span className="text-[10px] font-mono text-ink-muted">Stufe 2</span>
            </div>
            <div>
              <Label>Schrittweite (0 = aus)</Label>
              <NumberInput
                value={config.step_sub || 0}
                min={0}
                step={0.01}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  set('step_sub', val > 0 ? val : null)
                  set('scale_preset', null)
                }}
              />
            </div>
            <div>
              <Label>Höhe (cm)</Label>
              <NumberInput
                value={config.tick_sub_h}
                step={0.01}
                min={0.01}
                onChange={e => set('tick_sub_h', parseFloat(e.target.value) || 0.05)}
              />
            </div>
            <div>
              <Label>Linienstärke</Label>
              <select
                value={config.tick_sub_width}
                onChange={e => set('tick_sub_width', e.target.value)}
                className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ultra thin">Ultra dünn</option>
                <option value="thin">Dünn</option>
                <option value="semithick">Normal</option>
                <option value="thick">Dick</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Beschriftungssteuerung & Formatierung */}
      <div className="space-y-5 pt-4 border-t border-line">
        <SecHead>Beschriftung & Skalenformat</SecHead>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Switch
            label="Zahlen anzeigen"
            description="Ticks mit Werten beschriften"
            checked={config.show_labels}
            onChange={(v: boolean) => set('show_labels', v)}
          />

          <div>
            <Label>Beschriftungsdichte</Label>
            <select
              value={config.label_density}
              onChange={e => set('label_density', e.target.value as any)}
              className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="major_only">Nur Hauptticks (Empfohlen)</option>
              <option value="major_and_mid">Haupt- und Mittelticks</option>
              <option value="all">Alle Teilstriche</option>
              <option value="every_nth">Jeder N-te Teilstrich</option>
            </select>
          </div>
        </div>

        {config.label_density === 'every_nth' && (
          <div className="p-3 rounded-lg border border-rim bg-raised/40">
            <Label>Schrittweite N (jeder N-te Tick)</Label>
            <NumberInput
              value={config.label_every_nth}
              min={1}
              step={1}
              onChange={e => set('label_every_nth', parseInt(e.target.value) || 1)}
            />
          </div>
        )}

        {/* Format Selector: Dezimal vs. Bruch */}
        <div className="p-4 rounded-xl border border-rim bg-panel space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="font-semibold text-sm text-ink">Zahlenformat</span>
            <div className="inline-flex rounded-lg border border-rim bg-raised p-0.5 text-xs">
              <button
                type="button"
                onClick={() => set('label_as_fraction', false)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  !config.label_as_fraction
                    ? 'bg-panel text-primary shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Dezimalzahlen
              </button>
              <button
                type="button"
                onClick={() => set('label_as_fraction', true)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  config.label_as_fraction
                    ? 'bg-panel text-primary shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Brüche
              </button>
            </div>
          </div>

          {!config.label_as_fraction ? (
            /* Dezimal Optionen */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dezimaltrenner</Label>
                  <select
                    value={config.decimal_separator}
                    onChange={e => set('decimal_separator', e.target.value)}
                    className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value=",">Komma (,)</option>
                    <option value=".">Punkt (.)</option>
                  </select>
                </div>
                <div>
                  <Label>Nachkommastellen</Label>
                  <select
                    value={config.decimal_precision === null ? 'auto' : String(config.decimal_precision)}
                    onChange={e => {
                      const v = e.target.value
                      set('decimal_precision', v === 'auto' ? null : parseInt(v, 10))
                    }}
                    className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="auto">Automatisch</option>
                    <option value="0">0 (Ganzzahlig)</option>
                    <option value="1">1 Stelle (z. B. 0,5)</option>
                    <option value="2">2 Stellen (z. B. 0,25)</option>
                    <option value="3">3 Stellen (z. B. 0,125)</option>
                  </select>
                </div>
              </div>

              <Switch
                label="Nullen auffüllen (Zerofill)"
                description="Hält Nachkommastellen fest (z. B. 0,10 statt 0,1)"
                checked={config.decimal_fixed_zerofill}
                onChange={(v: boolean) => set('decimal_fixed_zerofill', v)}
              />
            </div>
          ) : (
            /* Bruch Optionen */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Bruch-Stil</Label>
                  <select
                    value={config.fraction_style}
                    onChange={e => set('fraction_style', e.target.value as any)}
                    className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="auto">Gekürzt (Standard: 1/2, 3/4)</option>
                    <option value="fixed_denominator">Konstanter Nenner (didaktisch: 1/4, 2/4...)</option>
                    <option value="mixed">Gemischte Zahlen (1 1/4)</option>
                  </select>
                </div>

                {config.fraction_style === 'fixed_denominator' && (
                  <div>
                    <Label>Fester Nenner</Label>
                    <NumberInput
                      value={config.fraction_denominator || 4}
                      min={1}
                      step={1}
                      onChange={e => set('fraction_denominator', parseInt(e.target.value) || 4)}
                    />
                  </div>
                )}
              </div>

              <Switch
                label="Schrägstrich-Darstellung (Inline)"
                description="z. B. 1/4 statt voll gesetztem LaTeX \frac{1}{4}"
                checked={config.fraction_inline}
                onChange={(v: boolean) => set('fraction_inline', v)}
              />
            </div>
          )}

          <div>
            <Label>Schriftart</Label>
            <FontSelector
              value={config.font_family}
              onChange={(v: string) => set('font_family', v)}
            />
          </div>
        </div>
      </div>

      {/* 4. Lückentext (Fill in the Blanks) */}
      <div className="space-y-4 pt-4 border-t border-line">
        <div className="flex items-center justify-between">
          <SecHead>Lückentext (Fill in the Blanks)</SecHead>
          <button
            type="button"
            onClick={handleGenerateRandomBlanks}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-raised hover:bg-rim text-ink border border-rim transition-colors"
          >
            <Dices size={14} className="text-primary" />
            Zufällig 2 Lücken erzeugen
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Versteckte Ticks (Komma-separiert)</Label>
            <Input
              placeholder="z. B. 1, 2.5, 4"
              value={hiddenTicksStr}
              onChange={e => {
                const raw = e.target.value
                setHiddenTicksDraft({ source: configHiddenTicksStr, text: raw })
                const vals = raw
                  .split(/[ ,;]+/)
                  .filter(v => v !== '')
                  .map(v => v.replace(',', '.'))
                  .map(v => parseFloat(v))
                  .filter(v => !isNaN(v))
                set('hidden_ticks', vals)
              }}
            />
            <p className="text-[11px] text-ink-muted mt-1">
              Werte an diesen Positionen werden durch Lücken-Symbole ersetzt.
            </p>
          </div>
          <div>
            <Label>Stil der Lücke</Label>
            <select
              value={config.hide_style}
              onChange={e => set('hide_style', e.target.value)}
              className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="box">Kästchen (☐)</option>
              <option value="underline">Unterstrich (_)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
