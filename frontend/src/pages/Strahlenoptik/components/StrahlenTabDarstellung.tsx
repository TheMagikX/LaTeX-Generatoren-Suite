// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label, Slider, NumberInput, FontSelector } from '../../../components/ui'
import { SecHead, Chk } from '../utilsStrahlen'
import type { StrahlenSetter, StrahlenoptikConfig } from '../typesStrahlen'

interface StrahlenTabDarstellungProps {
  config: StrahlenoptikConfig
  updateConfig: StrahlenSetter
}

export const StrahlenTabDarstellung = ({
  config,
  updateConfig
}: StrahlenTabDarstellungProps) => {

  return (
    <div className="space-y-6">
      <div>
        <SecHead>Leinwand</SecHead>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ['canvas_x_min', 'x min'], ['canvas_x_max', 'x max'],
              ['canvas_y_min', 'y min'], ['canvas_y_max', 'y max'],
            ] as [keyof StrahlenoptikConfig, string][]
          ).map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <NumberInput step={1} value={config[key] as number}
                onChange={e => updateConfig(key, parseFloat(e.target.value))} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-line">
        <SecHead>Raster & Achsen</SecHead>
        <Chk checked={config.show_axes} onChange={v => updateConfig('show_axes', v)} label="Koordinatenachsen anzeigen" />
        <Chk checked={config.show_grid} onChange={v => updateConfig('show_grid', v)} label="Raster anzeigen" />
        {config.show_grid && (
          <div>
            <Label>Rasterabstand</Label>
            <NumberInput step={0.5} min={0.1} value={config.grid_step}
              onChange={e => updateConfig('grid_step', parseFloat(e.target.value))} />
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-line">
        <SecHead>Strahlen</SecHead>
        <Slider label={`Strichbreite: ${config.ray_line_width} pt`}
          min={0.2} max={3} step={0.1}
          value={config.ray_line_width}
          onChange={v => updateConfig('ray_line_width', v)} />
        <Chk checked={config.ray_arrow} onChange={v => updateConfig('ray_arrow', v)} label="Pfeile auf Strahlen" />
        <Slider label={`Max. Reflexionen / Brechungen: ${config.max_reflections}`}
          min={0} max={20} step={1}
          value={config.max_reflections}
          onChange={v => updateConfig('max_reflections', v)} />
      </div>

      <div className="pt-4 border-t border-line">
        <FontSelector value={config.font_family} onChange={v => updateConfig('font_family', v)} />
      </div>
    </div>
  )
}
