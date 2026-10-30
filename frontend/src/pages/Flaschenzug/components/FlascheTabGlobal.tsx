// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Palette } from 'lucide-react'
import { Accordion, Switch, Slider, Field, Input, SecHead, NumberInput } from '../../../components/ui'
import type { FlaschenzugConfig, FlaschenzugGlobalConfig, FlaschenzugEnvironmentConfig } from '../typesFlasche'

interface Props {
  cfg: FlaschenzugConfig
  updGlobal: (patch: Partial<FlaschenzugGlobalConfig>) => void
  updEnv: (patch: Partial<FlaschenzugEnvironmentConfig>) => void
}

export const FlascheTabGlobal: React.FC<Props> = ({ cfg, updGlobal, updEnv }) => {
  return (
    <Accordion title="Globale Darstellung" icon={<Palette size={18} />}>
      <div className="space-y-4">
        <Switch label="Hilfsgitter (Grid)" checked={cfg.global_opts.preview_grid} onChange={v => updGlobal({ preview_grid: v })} />
        {cfg.global_opts.preview_grid && (
          <Switch
            label="Hilfsgitter nur in Vorschau"
            checked={cfg.global_opts.coordinate_helpers_preview_only ?? false}
            onChange={v => updGlobal({ coordinate_helpers_preview_only: v })}
          />
        )}
        <Switch label="Beschriftungen anzeigen" checked={cfg.global_opts.show_labels} onChange={v => updGlobal({ show_labels: v })} />
        <Slider label="Skalierung" min={0.5} max={2.0} step={0.1} value={cfg.global_opts.style_scale} onChange={v => updGlobal({ style_scale: v })} />
        <Field label="Zusätzliche TikZ-Optionen">
          <Input value={cfg.global_opts.tikz_opts} onChange={e => updGlobal({ tikz_opts: e.target.value })} />
        </Field>

        <div className="pt-4 border-t border-rim/50">
          <SecHead>Boden & Decke</SecHead>
          <Switch label="Boden anzeigen" checked={cfg.environment.show_boden} onChange={v => updEnv({ show_boden: v })} />
          {cfg.environment.show_boden && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Field label="Y-Position"><NumberInput step="0.5" value={cfg.environment.boden_y} onChange={e => updEnv({ boden_y: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Breite"><NumberInput step="1" value={cfg.environment.boden_width} onChange={e => updEnv({ boden_width: parseFloat(e.target.value) || 0 })} /></Field>
            </div>
          )}

          <div className="my-3" />
          <Switch label="Decke anzeigen" checked={cfg.environment.show_decke} onChange={v => updEnv({ show_decke: v })} />
          {cfg.environment.show_decke && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Field label="Y-Position"><NumberInput step="0.5" value={cfg.environment.decke_y} onChange={e => updEnv({ decke_y: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Breite"><NumberInput step="1" value={cfg.environment.decke_width} onChange={e => updEnv({ decke_width: parseFloat(e.target.value) || 0 })} /></Field>
            </div>
          )}
        </div>
      </div>
    </Accordion>
  )
}
