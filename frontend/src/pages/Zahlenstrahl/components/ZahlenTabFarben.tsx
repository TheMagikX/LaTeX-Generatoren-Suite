// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label } from '../../../components/ui'
import type { ZahlenSetter, ZahlenstrahlConfig } from '../typesZahlen'

interface ZahlenTabFarbenProps {
  config: ZahlenstrahlConfig
  set: ZahlenSetter
}

export const ZahlenTabFarben = ({ config, set }: ZahlenTabFarbenProps) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <Label>Achse</Label>
        <input
          type="color"
          value={config.color_axis}
          onChange={e => set('color_axis', e.target.value)}
          className="w-full h-10 rounded bg-raised border-none cursor-pointer"
        />
      </div>
      <div>
        <Label>Hauptticks</Label>
        <input
          type="color"
          value={config.color_main_tick}
          onChange={e => set('color_main_tick', e.target.value)}
          className="w-full h-10 rounded bg-raised border-none cursor-pointer"
        />
      </div>
      <div>
        <Label>Mittelticks</Label>
        <input
          type="color"
          value={config.color_mid_tick || config.color_main_tick}
          onChange={e => set('color_mid_tick', e.target.value)}
          className="w-full h-10 rounded bg-raised border-none cursor-pointer"
        />
      </div>
      <div>
        <Label>Nebenticks</Label>
        <input
          type="color"
          value={config.color_sub_tick}
          onChange={e => set('color_sub_tick', e.target.value)}
          className="w-full h-10 rounded bg-raised border-none cursor-pointer"
        />
      </div>
      <div>
        <Label>Beschriftung</Label>
        <input
          type="color"
          value={config.color_label}
          onChange={e => set('color_label', e.target.value)}
          className="w-full h-10 rounded bg-raised border-none cursor-pointer"
        />
      </div>
      <div>
        <Label>Punkte</Label>
        <input
          type="color"
          value={config.color_point}
          onChange={e => set('color_point', e.target.value)}
          className="w-full h-10 rounded bg-raised border-none cursor-pointer"
        />
      </div>
      <div>
        <Label>Sprünge</Label>
        <input
          type="color"
          value={config.color_jump}
          onChange={e => set('color_jump', e.target.value)}
          className="w-full h-10 rounded bg-raised border-none cursor-pointer"
        />
      </div>
    </div>
  )
}
