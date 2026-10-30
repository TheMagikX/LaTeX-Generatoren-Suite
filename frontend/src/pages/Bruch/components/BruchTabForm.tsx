// SPDX-License-Identifier: AGPL-3.0-or-later

import { Field, NumberInput, Slider } from '../../../components/ui'
import type { BruchConfig } from '../typesBruch'

interface BruchTabFormProps {
  config: BruchConfig
  updateConfig: (patch: Partial<BruchConfig>) => void
}

export function BruchTabForm({ config, updateConfig }: BruchTabFormProps) {
  return (
    <div className="space-y-6">
      <Field label="Darstellungsform">
        <select
          value={config.form}
          onChange={(e) => updateConfig({ form: e.target.value })}
          className="w-full bg-panel border border-line rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="Rechteck">Rechteck</option>
          <option value="Kreis">Kreis</option>
        </select>
      </Field>

      <Slider
        label="Rahmenbreite (pt)"
        value={config.border_width}
        min={0.1}
        max={5.0}
        step={0.1}
        onChange={(v) => updateConfig({ border_width: v })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Füllfarbe">
          <input
            type="color"
            value={config.fill_color}
            onChange={(e) => updateConfig({ fill_color: e.target.value })}
            className="w-full h-10 bg-panel border border-line rounded-md p-1 cursor-pointer"
          />
        </Field>
        <Field label="Rahmenfarbe">
          <input
            type="color"
            value={config.border_color}
            onChange={(e) => updateConfig({ border_color: e.target.value })}
            className="w-full h-10 bg-panel border border-line rounded-md p-1 cursor-pointer"
          />
        </Field>
      </div>

      <Field label="Füllmuster">
        <select
          value={config.fill_pattern}
          onChange={(e) => updateConfig({ fill_pattern: e.target.value })}
          className="w-full bg-panel border border-line rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="solid">Vollton (Standard)</option>
          <option value="north east lines">Schraffur ↗</option>
          <option value="north west lines">Schraffur ↖</option>
          <option value="crosshatch">Kreuzschraffur</option>
          <option value="dots">Punkte</option>
          <option value="horizontal lines">Horizontale Linien</option>
          <option value="vertical lines">Vertikale Linien</option>
        </select>
      </Field>

      {config.form === 'Rechteck' && (
        <>
          <Field label="Aufteilung">
            <select
              value={config.rect_mode}
              onChange={(e) => updateConfig({ rect_mode: e.target.value })}
              className="w-full bg-panel border border-line rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="Automatisch">Automatisch</option>
              <option value="Manuell">Manuell</option>
            </select>
          </Field>
          {config.rect_mode === 'Manuell' && (
            <Field label="Höhe (Zeilen)">
              <NumberInput
                value={config.rect_rows}
                min={1}
                max={200}
                onChange={(e) => updateConfig({ rect_rows: parseInt(e.target.value) })}
              />
            </Field>
          )}
        </>
      )}
    </div>
  )
}
