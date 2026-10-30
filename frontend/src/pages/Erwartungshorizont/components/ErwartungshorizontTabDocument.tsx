// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Label, Slider, Input, Switch, FontSelector } from '../../../components/ui'
import type { ErwartungshorizontConfig } from '../typesErwartungshorizont'

interface Props {
  config: ErwartungshorizontConfig
  updateConfig: (key: keyof ErwartungshorizontConfig, value: unknown) => void
}

const ErwartungshorizontTabDocument: React.FC<Props> = ({
  config,
  updateConfig
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Slider
          label="Dokumentbreite / Fließtextbreite (cm)"
          min={4} max={30} step={0.5}
          value={config.latex_width}
          onChange={v => updateConfig('latex_width', v)}
        />
        <p className="text-xs text-ghost mt-1">
          {config.feste_breite
            ? 'Feste Ausgabebreite für alle Teilaufgaben-Bilder (exakte Gleichheit für Word).'
            : 'Maximale Fließtextbreite (wird bei kürzeren Formeln automatisch enger zugeschnitten).'}
        </p>
      </div>

      <div className="p-3 bg-raised/60 rounded-xl border border-line">
        <Switch
          label="Feste Breite erzwingen"
          description="Alle Teilaufgaben-Bilder erhalten exakt dieselbe Breite (perfekt für Word-Tabellen & bündige \hfill Punkte)."
          checked={config.feste_breite ?? true}
          onChange={(v: boolean) => updateConfig('feste_breite', v)}
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
          description="Lädt Standardpakete wie TikZ, PGFPlots, SIUnitx, amsmath."
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

export default ErwartungshorizontTabDocument
