// SPDX-License-Identifier: AGPL-3.0-or-later

import { FontSelector, Slider } from '../../../components/ui'
import type { Config3D, Config3DSetter } from '../typesKoord3D'
import { SecHead, Chk } from '../utilsKoord3D'

interface Koord3DTabErweitertProps {
  config: Config3D
  updateConfig: Config3DSetter
}

export const Koord3DTabErweitert = ({ config, updateConfig }: Koord3DTabErweitertProps) => {
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
    </div>
  )
}
