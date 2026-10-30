// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, Trash2 } from 'lucide-react'
import { Button, Label, NumberInput } from '../../../components/ui'
import { SecHead } from '../utilsOptik'
import type { OptikConfig, LensConfig, OptikSetter } from '../typesOptik'

interface OptikTabLinsenProps {
  config: OptikConfig
  set: OptikSetter
}

export const OptikTabLinsen = ({ config, set }: OptikTabLinsenProps) => {

  const updateLens = (idx: number, key: keyof LensConfig, value: number) => {
    const next = [...config.lenses]
    next[idx] = { ...next[idx], [key]: value }
    set('lenses', next)
  }

  const addLens = () =>
    set('lenses', [...config.lenses, { x: 0.0, f: 3.0, h: 4.0 }])

  const removeLens = (idx: number) => {
    if (config.lenses.length <= 1) return
    set('lenses', config.lenses.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SecHead>Linsensystem</SecHead>
        <Button
          onClick={addLens}
          size="sm"
          className="h-8 flex items-center gap-1"
        >
          <Plus size={14} /> Linse
        </Button>
      </div>

      <p className="text-xs text-ghost">
        Negative Brennweite f → Zerstreuungslinse. Linsen werden nach
        Position x sortiert.
      </p>

      <div className="space-y-3">
        {config.lenses.map((L, idx) => (
          <div
            key={idx}
            className="bg-raised/30 border border-line rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-caption">
                Linse {idx + 1}
                {L.f > 0 ? ' · Sammellinse' : ' · Zerstreuungslinse'}
              </span>
              <button
                onClick={() => removeLens(idx)}
                className="p-1 text-ghost hover:text-red-400 transition-colors"
                disabled={config.lenses.length <= 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Position x (cm)</Label>
                <NumberInput step={0.5}
                  value={L.x}
                  onChange={e => updateLens(idx, 'x', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Brennweite f (cm)</Label>
                <NumberInput step={0.5}
                  value={L.f}
                  onChange={e => updateLens(idx, 'f', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Höhe h (cm)</Label>
                <NumberInput step={0.5}
                  min={0.5}
                  value={L.h}
                  onChange={e => updateLens(idx, 'h', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
