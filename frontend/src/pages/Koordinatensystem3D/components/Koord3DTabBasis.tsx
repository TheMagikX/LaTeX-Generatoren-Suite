// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label, NumberInput, Slider } from '../../../components/ui'
import type { Config3D, Config3DSetter } from '../typesKoord3D'

interface Koord3DTabBasisProps {
  config: Config3D
  updateConfig: Config3DSetter
}

export const Koord3DTabBasis = ({ config, updateConfig }: Koord3DTabBasisProps) => {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div>
        <Label>x1-Bereich</Label>
        <div className="flex items-center gap-3">
          <NumberInput step="0.25" value={config.xmin} onChange={e => updateConfig('xmin', parseFloat(e.target.value))} />
          <span className="text-metadata">bis</span>
          <NumberInput step="0.25" value={config.xmax} onChange={e => updateConfig('xmax', parseFloat(e.target.value))} />
        </div>
      </div>
      <div>
        <Label>x2-Bereich</Label>
        <div className="flex items-center gap-3">
          <NumberInput step="0.25" value={config.ymin} onChange={e => updateConfig('ymin', parseFloat(e.target.value))} />
          <span className="text-metadata">bis</span>
          <NumberInput step="0.25" value={config.ymax} onChange={e => updateConfig('ymax', parseFloat(e.target.value))} />
        </div>
      </div>
      <div>
        <Label>x3-Bereich</Label>
        <div className="flex items-center gap-3">
          <NumberInput step="0.25" value={config.zmin} onChange={e => updateConfig('zmin', parseFloat(e.target.value))} />
          <span className="text-metadata">bis</span>
          <NumberInput step="0.25" value={config.zmax} onChange={e => updateConfig('zmax', parseFloat(e.target.value))} />
        </div>
      </div>
      <div className="col-span-3 grid grid-cols-2 gap-6 pt-4">
        <Slider label="Azimuth (Drehung)" min={-180} max={180} value={config.azimuth} onChange={v => updateConfig('azimuth', v)} />
        <Slider label="Elevation (Höhe)" min={0} max={90} value={config.elevation} onChange={v => updateConfig('elevation', v)} />
      </div>
      <div className="col-span-3 pt-2">
        <Label>Perspektive Presets</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {[
            { label: 'Standard', az: 0, el: 30 },
            { label: 'Draufsicht (xy)', az: 0, el: 90 },
            { label: 'Vorderansicht (xz)', az: 0, el: 0 },
            { label: 'Seitenansicht (yz)', az: 90, el: 0 },
            { label: 'Kavalier', az: 45, el: 35 },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => {
                updateConfig('azimuth', p.az)
                updateConfig('elevation', p.el)
              }}
              className="px-3 py-1.5 bg-raised hover:bg-overlay text-ink rounded-lg text-xs font-medium transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
