// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import { Button, Label, NumberInput, Input, Switch } from '../../../components/ui'
import { SecHead, RayEditor } from '../utilsOptik'
import type { LightSourceUpdater, OptikConfig, OptikSetter } from '../typesOptik'
import { DEFAULT_SOURCE } from '../constantsOptik'
import { useState } from 'react'

interface OptikTabLichtquellenProps {
  config: OptikConfig
  set: OptikSetter
}

export const OptikTabLichtquellen = ({ config, set }: OptikTabLichtquellenProps) => {
  const [collapsedSources, setCollapsedSources] = useState<Set<number>>(new Set())

  const updateSource: LightSourceUpdater = (idx, key, value) => {
    const next = [...config.light_sources]
    next[idx] = { ...next[idx], [key]: value }
    set('light_sources', next)
  }

  const addSource = () =>
    set('light_sources', [...config.light_sources, { ...DEFAULT_SOURCE }])

  const removeSource = (idx: number) => {
    set('light_sources', config.light_sources.filter((_, i) => i !== idx))
  }

  const toggleSource = (idx: number) =>
    setCollapsedSources(prev => {
      const s = new Set(prev)
      if (s.has(idx)) s.delete(idx)
      else s.add(idx)
      return s
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SecHead>Lichtquellen (Punkte)</SecHead>
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
                <span className="text-caption">
                  Lichtquelle {idx + 1}{src.label ? ` · ${src.label}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={src.show} 
                  onChange={v => updateSource(idx, 'show', v)}
                  title="Anzeigen/Ausblenden"
                />
                <button
                  onClick={e => { e.stopPropagation(); removeSource(idx) }}
                  className="p-1 text-ghost hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {!collapsed && (
              <div className={`px-4 pb-4 space-y-4 border-t border-line/60 ${!src.show ? 'opacity-40' : ''}`}>
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quellpunkt-Größe (pt)</Label>
                    <NumberInput step={0.5} min={0} value={src.source_size}
                      onChange={e => updateSource(idx, 'source_size', parseFloat(e.target.value))} />
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

                <div className="space-y-2 pt-2 border-t border-line/60">
                  <SecHead>Konstruktionsstrahlen</SecHead>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <RayEditor 
                        label="Parallel" config={src.parallel_ray} 
                        disabled={!src.show}
                        onChange={u => updateSource(idx, 'parallel_ray', { ...src.parallel_ray, ...u })} 
                      />
                      <RayEditor 
                        label="Zentral" config={src.central_ray} 
                        disabled={!src.show}
                        onChange={u => updateSource(idx, 'central_ray', { ...src.central_ray, ...u })} 
                      />
                      <RayEditor 
                        label="Brennpunkt" config={src.focal_ray} 
                        disabled={!src.show}
                        onChange={u => updateSource(idx, 'focal_ray', { ...src.focal_ray, ...u })} 
                      />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {config.light_sources.length === 0 && (
        <p className="text-sm text-ghost text-center py-4">
          Noch keine zusätzlichen Lichtquellen.
        </p>
      )}
    </div>
  )
}
