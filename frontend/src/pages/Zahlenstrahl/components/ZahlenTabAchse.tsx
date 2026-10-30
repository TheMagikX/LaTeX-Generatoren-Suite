// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label, NumberInput, Slider } from '../../../components/ui'
import type { ZahlenSetter, ZahlenstrahlConfig } from '../typesZahlen'

interface ZahlenTabAchseProps {
  config: ZahlenstrahlConfig
  set: ZahlenSetter
}

export const ZahlenTabAchse = ({ config, set }: ZahlenTabAchseProps) => {
  const span = Math.max(0.0001, Math.abs(config.max_val - config.min_val))
  const widthCm = config.width_cm ?? 12.0
  const calculatedScale = (widthCm / span).toFixed(2)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label>Minimum</Label>
          <NumberInput value={config.min_val} onChange={e => set('min_val', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>Maximum</Label>
          <NumberInput value={config.max_val} onChange={e => set('max_val', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="space-y-1">
        <Slider
          label="Gesamtbreite (cm)"
          min={2} max={30} step={0.5}
          value={widthCm}
          onChange={v => set('width_cm', v)}
        />
        <p className="text-xs text-muted">
          Berechnete Skalierung: {calculatedScale} cm / Einheit
        </p>
      </div>

      <Slider
        label="Padding (Überstand)"
        min={0} max={20} step={0.1}
        value={config.padding}
        onChange={v => set('padding', v)}
      />

      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-line">
        <div className="space-y-3">
          <Label>Pfeiltyp</Label>
          <select
            value={config.arrow_type}
            onChange={e => set('arrow_type', e.target.value)}
            className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="->">Klassisch (→)</option>
            <option value="<->">Klassisch (↔)</option>
            <option value="-{Stealth}">Stealth (→)</option>
            <option value="{Stealth}-{Stealth}">Stealth (↔)</option>
            <option value="-">Kein Pfeil</option>
          </select>
        </div>
        <div className="space-y-3">
          <Label>Linienbreite</Label>
          <select
            value={config.line_width}
            onChange={e => set('line_width', e.target.value)}
            className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ultra thin">Ultra dünn</option>
            <option value="thin">Dünn</option>
            <option value="semithick">Normal</option>
            <option value="thick">Dick</option>
            <option value="very thick">Sehr dick</option>
            <option value="ultra thick">Ultra dick</option>
          </select>
        </div>
      </div>
    </div>
  )
}
