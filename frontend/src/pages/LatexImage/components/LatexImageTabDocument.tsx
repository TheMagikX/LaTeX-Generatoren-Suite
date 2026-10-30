// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Label, Slider, Input, Switch, FontSelector } from '../../../components/ui'
import type { LatexImageConfig } from '../typesLatexImage'

interface Props {
  config: LatexImageConfig
  updateConfig: (key: keyof LatexImageConfig, value: unknown) => void
}

const LatexImageTabDocument: React.FC<Props> = ({
  config,
  updateConfig
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Slider
          label="Dokumentbreite (cm)"
          min={1} max={30} step={0.5}
          value={config.latex_width}
          onChange={v => updateConfig('latex_width', v)}
        />
      </div>
      <div>
        <Label>Zeilenabstand (Spacing)</Label>
        <Input
          value={config.spacing}
          onChange={e => updateConfig('spacing', e.target.value)}
          placeholder="onehalfspacing"
        />
      </div>
      <hr className="border-line" />
      <div className="space-y-4">
        <Switch
          label="Alle Pakete laden"
          description="Lädt Standardpakete wie TikZ, PGFPlots, SIUnitx."
          checked={config.pakete_laden}
          onChange={(v: boolean) => updateConfig('pakete_laden', v)}
        />
        <Switch
          label="Alle Commands laden"
          description="Lädt benutzerdefinierte Makros aus commands.tex."
          checked={config.command_laden}
          onChange={(v: boolean) => updateConfig('command_laden', v)}
        />
        <FontSelector value={config.font_family} onChange={v => updateConfig('font_family', v)} />
      </div>
    </div>
  )
}

export default LatexImageTabDocument
