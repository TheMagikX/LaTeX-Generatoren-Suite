// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { Button, Input, Label, Slider, NumberInput } from '../../../components/ui'
import { SecHead, Chk } from '../utilsStrahlen'
import { DEFAULT_SOURCE } from '../constantsStrahlen'
import type { StrahlenLightSourceUpdater, StrahlenSetter, StrahlenoptikConfig } from '../typesStrahlen'

interface StrahlenTabLichtProps {
  config: StrahlenoptikConfig
  updateConfig: StrahlenSetter
  collapsedSources: Set<number>
  toggleSource: (idx: number) => void
}

export const StrahlenTabLicht = ({
  config,
  updateConfig,
  collapsedSources,
  toggleSource
}: StrahlenTabLichtProps) => {

  const updateSource: StrahlenLightSourceUpdater = (idx, key, value) => {
    const next = [...config.light_sources]
    next[idx] = { ...next[idx], [key]: value }
    updateConfig('light_sources', next)
  }

  const addSource = () =>
    updateConfig('light_sources', [...config.light_sources, { ...DEFAULT_SOURCE }])

  const removeSource = (idx: number) => {
    if (config.light_sources.length <= 1) return
    updateConfig('light_sources', config.light_sources.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SecHead>Lichtquellen</SecHead>
        <Button onClick={addSource} size="sm" className="h-8 flex items-center gap-1">
          <Plus size={14} /> Quelle
        </Button>
      </div>

      {config.light_sources.map((src, idx) => {
        const collapsed = collapsedSources.has(idx)
        return (
          <div key={idx} className="bg-raised/30 border border-line rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-raised/40 transition-colors"
              onClick={() => toggleSource(idx)}
            >
              <div className="flex items-center gap-2">
                {collapsed ? <ChevronRight size={14} className="text-ghost" /> : <ChevronDown size={14} className="text-ghost" />}
                <span className="text-section-label">
                  Lichtquelle {idx + 1}{src.label ? ` · ${src.label}` : ''}
                </span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeSource(idx) }}
                disabled={config.light_sources.length <= 1}
                className="p-1 text-ghost hover:text-red-400 transition-colors disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {!collapsed && (
              <div className="px-4 pb-4 space-y-4 border-t border-line/60">
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <Label>Position X</Label>
                    <NumberInput step={0.5} value={src.x}
                      onChange={e => updateSource(idx, 'x', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <Label>Position Y</Label>
                    <NumberInput step={0.5} value={src.y}
                      onChange={e => updateSource(idx, 'y', parseFloat(e.target.value))} />
                  </div>
                </div>

                <Slider label={`Richtung / Winkel: ${src.angle}°`}
                  min={-180} max={180} step={1}
                  value={src.angle}
                  onChange={v => updateSource(idx, 'angle', v)} />

                <Slider label={`Strahlenfächer: ${src.spread}°`}
                  min={0} max={360} step={1}
                  value={src.spread}
                  onChange={v => {
                    updateSource(idx, 'spread', v)
                    if (v > 0 && src.num_rays <= 1) updateSource(idx, 'num_rays', 2)
                  }} />

                {src.spread > 0 && (
                  <Slider label={`Anzahl Strahlen: ${src.num_rays}`}
                    min={1} max={50} step={1}
                    value={src.num_rays}
                    onChange={v => updateSource(idx, 'num_rays', v)} />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Strahlfarbe</Label>
                    <Input
                      value={src.ray_color}
                      onChange={e => updateSource(idx, 'ray_color', e.target.value)}
                      placeholder="yellow"
                    />
                  </div>
                  <div>
                    <Label>Beschriftung</Label>
                    <Input
                      value={src.label}
                      onChange={e => updateSource(idx, 'label', e.target.value)}
                      placeholder="L₁"
                    />
                  </div>
                </div>

                <Slider label={`Quellpunkt-Größe: ${src.source_size} pt`}
                  min={0} max={15} step={0.5}
                  value={src.source_size}
                  onChange={v => updateSource(idx, 'source_size', v)} />

                <Slider
                  label={`Strichbreite Strahlen: ${src.ray_line_width === 0 ? 'global' : `${src.ray_line_width} pt`}`}
                  min={0} max={5} step={0.1}
                  value={src.ray_line_width}
                  onChange={v => updateSource(idx, 'ray_line_width', v)} />

                <div className="space-y-3 pt-2 border-t border-line/60">
                  <Chk
                    checked={src.show_light_zone}
                    onChange={v => updateSource(idx, 'show_light_zone', v)}
                    label="Lichtkegel ausfüllen (mind. 2 Strahlen)"
                  />
                  {src.show_light_zone && (
                    <Slider
                      label={`Lichtkegel-Deckkraft: ${src.light_zone_opacity}`}
                      min={0} max={1} step={0.05}
                      value={src.light_zone_opacity}
                      onChange={v => updateSource(idx, 'light_zone_opacity', v)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
