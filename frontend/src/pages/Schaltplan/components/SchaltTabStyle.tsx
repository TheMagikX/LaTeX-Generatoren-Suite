// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Settings } from 'lucide-react'
import { Field, Slider, Switch, Input, Accordion, FontSelector } from '../../../components/ui'
import type { SchaltplanConfig } from '../typesSchalt'

interface SchaltTabStyleProps {
  config: SchaltplanConfig
  setConfig: React.Dispatch<React.SetStateAction<SchaltplanConfig>>
}

export const SchaltTabStyle: React.FC<SchaltTabStyleProps> = ({ config, setConfig }) => {
  return (
    <div className="space-y-6">
      <Field label="Schaltzeichen-Standard">
        <select
          value={config.style_standard}
          onChange={e => setConfig(p => ({ ...p, style_standard: e.target.value }))}
          className="w-full bg-panel border border-line rounded-md px-3 py-2 text-sm text-ink"
        >
          <option value="europe (DIN)">Europa (DIN / european)</option>
          <option value="american">USA (american)</option>
        </select>
      </Field>

      <Slider
        label="Skalierung"
        value={config.style_scale}
        onChange={v => setConfig(p => ({ ...p, style_scale: v }))}
        min={0.5} max={3.0} step={0.1}
      />

      <div className="space-y-2 border-t border-line pt-4">
        <Switch
          label="Hilfsgitter anzeigen"
          checked={config.show_grid}
          onChange={(v: boolean) => setConfig(p => ({ ...p, show_grid: v }))}
        />
        <Switch
          label="Knotenpunkte markieren"
          checked={config.show_nodes}
          onChange={(v: boolean) => setConfig(p => ({ ...p, show_nodes: v }))}
        />
        <Switch
          label="Knotennamen einblenden"
          checked={config.show_node_labels}
          onChange={(v: boolean) => setConfig(p => ({ ...p, show_node_labels: v }))}
        />
      </div>

      <Field label="Global TikZ Options">
        <Input
          value={config.style_tikz_opts}
          onChange={e => setConfig(p => ({ ...p, style_tikz_opts: e.target.value }))}
          placeholder="z.B. line width=1pt"
        />
      </Field>

      <Accordion title="LaTeX Ressourcen" icon={<Settings size={16} />}>
        <div className="space-y-2">
          <Switch label="Pakete laden" checked={config.load_packages} onChange={(v: boolean) => setConfig(p => ({ ...p, load_packages: v }))} />
          <Switch label="Befehle laden" checked={config.load_commands} onChange={(v: boolean) => setConfig(p => ({ ...p, load_commands: v }))} />
          <FontSelector value={config.font_family} onChange={(v: string) => setConfig(p => ({ ...p, font_family: v }))} />
        </div>
        <Field label="Präambel-Zusatz" className="mt-4">
          <textarea
            value={config.preamble_add}
            onChange={e => setConfig(p => ({ ...p, preamble_add: e.target.value }))}
            className="w-full h-24 bg-panel border border-line rounded-md px-3 py-2 text-xs font-mono"
          />
        </Field>
      </Accordion>
    </div>
  )
}
