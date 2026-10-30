// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, Trash2, ChevronRight, ChevronDown, Info } from 'lucide-react'
import { Button, Label, Slider, NumberInput, Input, Switch } from '../../../components/ui'
import { SecHead, RayEditor } from '../utilsOptik'
import type { OptikConfig, OptikObjectUpdater, OptikSetter } from '../typesOptik'
import { DEFAULT_OBJECT } from '../constantsOptik'
import { useState } from 'react'

interface OptikTabObjekteProps {
  config: OptikConfig
  set: OptikSetter
}

export const OptikTabObjekte = ({ config, set }: OptikTabObjekteProps) => {
  const [collapsedObjects, setCollapsedObjects] = useState<Set<number>>(new Set())

  const updateObject: OptikObjectUpdater = (idx, key, value) => {
    const next = [...config.objects]
    next[idx] = { ...next[idx], [key]: value }
    set('objects', next)
  }

  const addObject = () =>
    set('objects', [...config.objects, { ...DEFAULT_OBJECT, label: `G${config.objects.length + 1}` }])

  const removeObject = (idx: number) => {
    set('objects', config.objects.filter((_, i) => i !== idx))
  }

  const toggleObject = (idx: number) =>
    setCollapsedObjects(prev => {
      const s = new Set(prev)
      if (s.has(idx)) s.delete(idx)
      else s.add(idx)
      return s
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-raised/40 p-4 rounded-xl border border-rim mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink">🔭 Fernrohr-Modus</span>
          <Switch
            checked={config.telescope_mode}
            onChange={v => set('telescope_mode', v)}
          />
        </div>
        {config.telescope_mode && (
          <div className="flex-1 ml-6 max-w-xs">
              <Slider
                label="Sehwinkel α (Grad)"
                min={0.1} max={45} step={0.5}
                value={config.alpha}
                onChange={v => set('alpha', v)}
              />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <SecHead>Gegenstände (Pfeile)</SecHead>
        <Button 
          onClick={addObject} 
          size="sm" 
          className="h-8 flex items-center gap-1"
          disabled={config.telescope_mode}
        >
          <Plus size={14} /> Gegenstand
        </Button>
      </div>

      <div className={`space-y-3 ${config.telescope_mode ? 'opacity-50' : ''}`}>
        {config.objects.map((obj, idx) => {
          const collapsed = collapsedObjects.has(idx)
          return (
            <div 
              key={idx} 
              className={`bg-raised/30 border border-line rounded-xl overflow-hidden ${config.telescope_mode ? 'pointer-events-none' : ''}`}
              title={config.telescope_mode ? "Deaktiviert im Fernrohr-Modus" : ""}
            >
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-raised/40 transition-colors"
                onClick={() => !config.telescope_mode && toggleObject(idx)}
              >
                <div className="flex items-center gap-2">
                  {collapsed ? <ChevronRight size={14} className="text-ghost" /> : <ChevronDown size={14} className="text-ghost" />}
                  <span className="text-caption">
                    Gegenstand {idx + 1}{obj.label ? ` · ${obj.label}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={obj.show} 
                    onChange={v => updateObject(idx, 'show', v)}
                    title="Anzeigen/Ausblenden"
                  />
                  <button
                    onClick={e => { e.stopPropagation(); removeObject(idx) }}
                    className="p-1 text-ghost hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {!collapsed && (
                <div className={`px-4 pb-4 space-y-4 border-t border-line/60 ${!obj.show ? 'opacity-40' : ''}`}>
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div>
                      <Label>Position x (cm)</Label>
                      <NumberInput step={0.5} value={obj.x}
                        onChange={e => updateObject(idx, 'x', parseFloat(e.target.value))} />
                    </div>
                    <div>
                      <Label>Höhe G (cm)</Label>
                      <NumberInput step={0.25} value={obj.G}
                        onChange={e => updateObject(idx, 'G', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Farbe Pfeil</Label>
                      <Input value={obj.color} onChange={e => updateObject(idx, 'color', e.target.value)} placeholder="blue" />
                    </div>
                    <div>
                      <Label>Label</Label>
                      <Input value={obj.label} onChange={e => updateObject(idx, 'label', e.target.value)} placeholder="G" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-line/60">
                    <SecHead>Konstruktionsstrahlen</SecHead>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <RayEditor 
                        label="Parallel" config={obj.parallel_ray} 
                        disabled={!obj.show}
                        onChange={u => updateObject(idx, 'parallel_ray', { ...obj.parallel_ray, ...u })} 
                      />
                      <RayEditor 
                        label="Zentral" config={obj.central_ray} 
                        disabled={!obj.show}
                        onChange={u => updateObject(idx, 'central_ray', { ...obj.central_ray, ...u })} 
                      />
                      <RayEditor 
                        label="Brennpunkt" config={obj.focal_ray} 
                        disabled={!obj.show}
                        onChange={u => updateObject(idx, 'focal_ray', { ...obj.focal_ray, ...u })} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {config.objects.length === 0 && !config.telescope_mode && (
          <p className="text-sm text-ghost text-center py-4">Keine Objekte vorhanden.</p>
        )}
        {config.telescope_mode && (
          <div className="flex items-center gap-2 justify-center py-6 text-ghost italic">
            <Info size={16} />
            <span className="text-sm">Objekte sind im Fernrohr-Modus deaktiviert</span>
          </div>
        )}
      </div>
    </div>
  )
}
