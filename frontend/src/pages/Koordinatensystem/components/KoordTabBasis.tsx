// SPDX-License-Identifier: AGPL-3.0-or-later

import { LineChart, Cpu, Terminal } from 'lucide-react'
import { Accordion, Field, NumberInput, Slider, Label, SecHead, Switch, FontSelector } from '../../../components/ui'
import type { Config } from '../typesKoord'

interface KoordTabBasisProps {
  config: Config
  updateConfig: (key: keyof Config, value: unknown) => void
}

export const KoordTabBasis = ({ config, updateConfig }: KoordTabBasisProps) => {
  return (
    <div className="space-y-6">
      <Accordion title="Koordinatensystem Bereich" icon={<LineChart size={18} />} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-6">
          <Field label="X-Achse Bereich">
            <div className="flex items-center gap-3">
              <NumberInput step="0.25" value={config.xmin} onChange={e => updateConfig('xmin', parseFloat(e.target.value))} />
              <span className="text-metadata">bis</span>
              <NumberInput step="0.25" value={config.xmax} onChange={e => updateConfig('xmax', parseFloat(e.target.value))} />
            </div>
          </Field>
          <Field label="Y-Achse Bereich">
            <div className="flex items-center gap-3">
              <NumberInput step="0.25" value={config.ymin} onChange={e => updateConfig('ymin', parseFloat(e.target.value))} />
              <span className="text-metadata">bis</span>
              <NumberInput step="0.25" value={config.ymax} onChange={e => updateConfig('ymax', parseFloat(e.target.value))} />
            </div>
          </Field>
        </div>
        <div className="col-span-2 pt-2 border-t border-line/50 mt-2">Schnelleinstellungen</div>
        <div className="space-y-4 mt-1">
          {[
            {
              title: "Bereiche",
              items: [
                { label: '[0,10] x [0,10]', xmin: 0, xmax: 10.25, ymin: 0, ymax: 10.25 },
                { label: '[0,10] x [0,5]', xmin: 0, xmax: 10.25, ymin: 0, ymax: 5.25 },
                { label: '[0,5] x [0,10]', xmin: 0, xmax: 5.25, ymin: 0, ymax: 10.25 },
                { label: '[-10,10] x [0,10]', xmin: -10.25, xmax: 10.25, ymin: 0, ymax: 10.25 },
                { label: '[0,10] x [-10,10]', xmin: 0, xmax: 10.25, ymin: -10.25, ymax: 10.25 },
                { label: '[-10,10] x [-10,10]', xmin: -10.25, xmax: 10.25, ymin: -10.25, ymax: 10.25 },
                { label: '[-10,10] x [-5,5]', xmin: -10.25, xmax: 10.25, ymin: -5.25, ymax: 5.25 },
              ]
            },
            {
              title: "Anzeige",
              items: [
                { label: 'Gitter/Ticks aus', ticks_show: false, majorticklabels: false, grid_show: false },
                { label: 'Gitter/Ticks ein', ticks_show: true, majorticklabels: true, grid_show: true },
              ]
            },
            {
              title: "Skalierung",
              items: [
                { label: '2 zu 1', scale_x: 2, scale_y: 1 },
                { label: '1 zu 2', scale_x: 1, scale_y: 2 },
                { label: '1 zu 1', scale_x: 1, scale_y: 1 },
                { label: '1 zu 3', scale_x: 1, scale_y: 3 },
                { label: '3 zu 1', scale_x: 3, scale_y: 1 },
              ]
            },
          ].map(group => (
            <div key={group.title} className="flex flex-wrap gap-2">
              {group.items.map(p => (
                <button
                  key={p.label}
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
      </Accordion >

      <Accordion title="System & LaTeX Optionen" icon={<Cpu size={18} />}>
        <div className="space-y-6">
          <Slider
            label="Breite (cm)"
            min={5}
            max={25}
            step={0.5}
            value={config.width_cm ?? 12}
            onChange={(v: number) => updateConfig('width_cm', v)}
          />

          <Field label="Rechengenauigkeit">
            <div className="flex items-center gap-4 bg-raised/30 p-4 rounded-xl border border-line/50">
              <div className="flex-1">
                <Label className="mb-0 text-ink">Samples (Abtastpunkte)</Label>
                <p className="text-metadata">Höhere Werte glätten Kurven, erhöhen aber die Kompilierzeit.</p>
              </div>
              <div className="w-24">
                <NumberInput step="100" min="50" max="2500" value={config.samples} onChange={e => updateConfig('samples', parseInt(e.target.value))} />
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-3 px-1">
            <SecHead icon={<Terminal size={14} />}>Kompilier-Einstellungen</SecHead>
            <Switch
              checked={config.pakete_laden}
              onChange={(v: boolean) => updateConfig('pakete_laden', v)}
              label="Standard-Pakete laden"
              description="Lädt notwendige LaTeX-Pacete für PGFPlots."
            />
            <Switch
              checked={config.command_laden}
              onChange={(v: boolean) => updateConfig('command_laden', v)}
              label="Eigene Commands laden"
              description="Stellt vordefinierte Makros zur Verfügung."
            />
            <FontSelector
              value={config.font_family}
              onChange={(v: string) => updateConfig('font_family', v)}
            />
          </div>
        </div>
      </Accordion>
    </div >
  )
}
