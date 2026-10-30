// SPDX-License-Identifier: AGPL-3.0-or-later

import { Input, Label, NumberInput, Slider } from '../../../components/ui'
import type { BaumStyleUpdater, Config } from '../typesBaum'
import type { Dispatch, SetStateAction } from 'react'
import { SecHead, Chk, SelectField } from './BaumControls'

interface BaumTabStilProps {
  config: Config;
  updateStyle: BaumStyleUpdater;
  setConfig: Dispatch<SetStateAction<Config>>;
}

export const BaumTabStil = ({
  config,
  updateStyle,
  setConfig
}: BaumTabStilProps) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Slider label="Abstand Ebenen (cm)" min={1} max={10} step={0.5} value={config.style.level_distance} onChange={v => updateStyle('level_distance', v)} />
        <Slider label="Basis-Abstand Geschwister (cm)" min={0.5} max={10} step={0.5} value={config.style.sibling_distance_base} onChange={v => updateStyle('sibling_distance_base', v)} />
      </div>

      <div className="pt-6 border-t border-line">
        <div className="flex items-center justify-between mb-4">
          <SecHead>Manuelle Geschwister-Abstände</SecHead>
          <Chk
            checked={config.style.manual_sibling_dist_active}
            onChange={v => {
              if (v) {
                const branchesCalc = config.mode === 'Symmetrisch (Standard)' ? config.branches_global : 2
                const initDists: Record<number, number> = {}
                for (let i = 0; i < config.max_depth; i++) {
                  const level = i + 1
                  initDists[level] = config.style.sibling_distance_base * Math.pow(branchesCalc, config.max_depth - level)
                }
                setConfig((prev: Config) => ({ ...prev, style: { ...prev.style, manual_sibling_dist_active: true, manual_sibling_distances: initDists } }))
              } else {
                updateStyle('manual_sibling_dist_active', false)
              }
            }}
            label="Aktivieren"
          />
        </div>
        {config.style.manual_sibling_dist_active && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: config.max_depth }).map((_, i) => {
              const level = i + 1
              const branchesCalc = config.mode === 'Symmetrisch (Standard)' ? config.branches_global : 2
              const fallback = config.style.sibling_distance_base * Math.pow(branchesCalc, config.max_depth - level)
              return (
                <div key={level}>
                  <Label>Stufe {level} (cm)</Label>
                  <NumberInput step="0.5"
                    value={config.style.manual_sibling_distances[level] ?? fallback}
                    onChange={e => {
                      const dists = { ...config.style.manual_sibling_distances, [level]: parseFloat(e.target.value) }
                      updateStyle('manual_sibling_distances', dists)
                    }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-line">
        <SelectField
          label="Knotenform"
          value={config.style.node_shape}
          onChange={v => updateStyle('node_shape', v)}
          options={['circle', 'rectangle', 'coordinate'] as const}
        />
        <SelectField
          label="Wuchsrichtung"
          value={config.style.grow_direction}
          onChange={v => updateStyle('grow_direction', v)}
          options={['right', 'down', 'up', 'left'] as const}
        />
      </div>

      <div className="space-y-4 pt-6 border-t border-line">
        <SecHead>TikZ Styles (Global)</SecHead>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Nodes Style</Label><Input value={config.style.global_node_style} onChange={e => updateStyle('global_node_style', e.target.value)} /></div>
          <div><Label>Edges Style</Label><Input value={config.style.global_edge_style} onChange={e => updateStyle('global_edge_style', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <SelectField
            label="Label-Positionierung"
            value={config.style.edge_positioning}
            onChange={v => updateStyle('edge_positioning', v)}
            options={[' Neben Pfad (Auto)', 'Außen (Smart)', 'Innen (Smart)', 'Auf Pfad (Deckend)']}
          />
          <div className="pb-2">
            <Chk checked={config.style.hide_edge_labels} onChange={v => updateStyle('hide_edge_labels', v)} label="Pfadbeschriftungen global ausblenden" />
          </div>
        </div>
        <div><Label>Hervorhebungsstil (Standard)</Label><Input value={config.style.highlight_style_default} onChange={e => updateStyle('highlight_style_default', e.target.value)} /></div>
      </div>
    </div>
  )
}
