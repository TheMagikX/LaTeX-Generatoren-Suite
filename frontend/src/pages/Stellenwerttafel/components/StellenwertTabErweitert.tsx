// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label, NumberInput, FontSelector } from '../../../components/ui'
import type { StellenwertConfig } from '../typesStellenwert'

interface StellenwertTabErweitertProps {
  config: StellenwertConfig
  updateConfig: (key: keyof StellenwertConfig, value: unknown) => void
}

export const StellenwertTabErweitert = ({ config, updateConfig }: StellenwertTabErweitertProps) => {

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label>Dezimaltrenner Position (Index)</Label>
        <div className="flex items-center gap-4">
          <NumberInput
            value={config.decimal_separator_pos ?? ''}
            placeholder="Keiner"
            onChange={e => updateConfig('decimal_separator_pos', e.target.value === '' ? null : parseInt(e.target.value))}
          />
          <p className="text-xs text-ghost italic">
            Dicke Linie nach Spalte X (0 = links)
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-line">
        <Label>Schriftgröße (LaTeX)</Label>
        <select
          value={config.font_size}
          onChange={e => updateConfig('font_size', e.target.value)}
          className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink"
        >
          <option value="small">Klein</option>
          <option value="normalsize">Normal</option>
          <option value="large">Groß</option>
          <option value="Large">Sehr groß</option>
          <option value="huge">Riesig</option>
        </select>
      </div>

      <div className="space-y-4 pt-4 border-t border-line">
        <FontSelector value={config.font_family} onChange={v => updateConfig('font_family', v)} />
      </div>
    </div>
  )
}
