// SPDX-License-Identifier: AGPL-3.0-or-later

import { FontSelector, Label, Slider } from '../../../components/ui'
import type { BaumConfigUpdater, Config } from '../typesBaum'
import { SecHead, Chk } from './BaumControls'

interface BaumTabErweitertProps {
  config: Config;
  updateConfig: BaumConfigUpdater;
}

export const BaumTabErweitert = ({
  config,
  updateConfig
}: BaumTabErweitertProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SecHead>System & LaTeX Optionen</SecHead>
        <Slider
          label="Breite (cm)"
          min={5}
          max={25}
          step={0.5}
          value={config.width_cm ?? 12}
          onChange={v => updateConfig('width_cm', v)}
        />
        <div className="space-y-3 pt-2">
          <Chk checked={config.pakete_laden} onChange={v => updateConfig('pakete_laden', v)} label="Alle Pakete laden" />
          <Chk checked={config.command_laden} onChange={v => updateConfig('command_laden', v)} label="Alle Commands laden" />
          <FontSelector value={config.font_family} onChange={v => updateConfig('font_family', v)} />
        </div>
      </div>
      <hr className="border-line" />
      <div className="space-y-3">
        <Label>Präambel-Zusatz</Label>
        <textarea
          value={config.preamble_add}
          onChange={e => updateConfig('preamble_add', e.target.value)}
          rows={10}
          className="w-full px-3 py-2 bg-canvas border border-line rounded-md font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          placeholder="% Eigene LaTeX-Befehle..."
        />
      </div>
    </div>
  )
}
