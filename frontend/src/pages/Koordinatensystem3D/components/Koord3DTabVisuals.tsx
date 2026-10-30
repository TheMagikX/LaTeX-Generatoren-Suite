// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label, Input, NumberInput } from '../../../components/ui'
import type { Config3D, Config3DSetter } from '../typesKoord3D'
import { SecHead, Chk } from '../utilsKoord3D'

interface Koord3DTabVisualsProps {
  config: Config3D
  updateConfig: Config3DSetter
}

export const Koord3DTabVisuals = ({ config, updateConfig }: Koord3DTabVisualsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <SecHead>Achsen</SecHead>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><Label>Achsendicke (pt)</Label><NumberInput step="0.25" min="0.25" value={config.axis_width} onChange={e => updateConfig('axis_width', parseFloat(e.target.value))} /></div>
          <div><Label>Achsenfarbe</Label><Input value={config.axis_color} onChange={e => updateConfig('axis_color', e.target.value)} /></div>
          <div><Label>Pfeilspitze (TikZ)</Label><Input value={config.axis_arrow} onChange={e => updateConfig('axis_arrow', e.target.value)} placeholder="Stealth" /></div>
        </div>
        <Chk checked={config.axis_on_top} onChange={v => updateConfig('axis_on_top', v)} label="Achsen im Vordergrund (Axis on Top)" />
      </div>
      <hr className="border-line" />
      <div>
        <SecHead>Tick-Striche</SecHead>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><Label>Tickdicke (pt)</Label><NumberInput step="0.2" min="0.2" value={config.tick_width} onChange={e => updateConfig('tick_width', parseFloat(e.target.value))} /></div>
          <div><Label>Tickfarbe</Label><Input value={config.tick_color} onChange={e => updateConfig('tick_color', e.target.value)} /></div>
          <div><Label>Ticklänge (pt)</Label><NumberInput step="0.5" value={config.tick_length} onChange={e => updateConfig('tick_length', parseFloat(e.target.value))} /></div>
        </div>
        <div className="bg-raised/50 rounded-lg p-3 space-y-3">
          <Chk checked={config.minor_ticks} onChange={v => updateConfig('minor_ticks', v)} label="Zwischenticks (Minor Ticks) anzeigen" />
          {config.minor_ticks && (
            <div className="w-32">
              <Label>Anzahl</Label>
              <NumberInput step="1" min="1" max="10" value={config.minor_tick_num} onChange={e => updateConfig('minor_tick_num', parseInt(e.target.value))} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
