// SPDX-License-Identifier: AGPL-3.0-or-later

import { Input, Label, Slider, NumberInput } from '../../../components/ui'
import { SecHead, Chk } from '../utilsStrahlen'
import type { StrahlenSetter, StrahlenoptikConfig } from '../typesStrahlen'

interface StrahlenTabSchattenProps {
  config: StrahlenoptikConfig
  updateConfig: StrahlenSetter
}

export const StrahlenTabSchatten = ({
  config,
  updateConfig
}: StrahlenTabSchattenProps) => {

  return (
    <div className="space-y-6">
      <Chk
        checked={config.show_shadow_zones}
        onChange={v => updateConfig('show_shadow_zones', v)}
        label="Schattenbereiche anzeigen"
      />

      {config.show_shadow_zones && (
        <>
          <div className="space-y-4 pt-2">
            <SecHead>Vollschatten</SecHead>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Farbe</Label>
                <Input value={config.shadow_color}
                  onChange={e => updateConfig('shadow_color', e.target.value)}
                  placeholder="black" />
              </div>
              <div>
                <Label>Deckkraft</Label>
                <NumberInput step={0.05} min={0} max={1} value={config.shadow_opacity}
                  onChange={e => updateConfig('shadow_opacity', parseFloat(e.target.value))} />
              </div>
            </div>
            <Slider label={`Deckkraft: ${config.shadow_opacity}`}
              min={0} max={1} step={0.05}
              value={config.shadow_opacity}
              onChange={v => updateConfig('shadow_opacity', v)} />
          </div>

          <div className="space-y-4 pt-4 border-t border-line">
            <SecHead>Halbschatten (nur bei Quellenbreite &gt; 0)</SecHead>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Farbe</Label>
                <Input value={config.partial_shadow_color}
                  onChange={e => updateConfig('partial_shadow_color', e.target.value)}
                  placeholder="black" />
              </div>
              <div>
                <Label>Deckkraft</Label>
                <NumberInput step={0.05} min={0} max={1} value={config.partial_shadow_opacity}
                  onChange={e => updateConfig('partial_shadow_opacity', parseFloat(e.target.value))} />
              </div>
            </div>
            <Slider label={`Deckkraft: ${config.partial_shadow_opacity}`}
              min={0} max={1} step={0.05}
              value={config.partial_shadow_opacity}
              onChange={v => updateConfig('partial_shadow_opacity', v)} />
          </div>
        </>
      )}
    </div>
  )
}
