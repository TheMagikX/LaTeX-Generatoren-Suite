// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Copy, FlipHorizontal, FlipVertical, Settings, Plus } from 'lucide-react'
import { Accordion, Collapsible, Field, Input, NumberInput } from '../../../components/ui'
import type { FlaschenzugConfig, PulleyConfig, PulleyLabelPos } from '../typesFlasche'
import { PULLEY_LABEL_POSITIONS } from '../constantsFlasche'
import { genId, getNextName, updateListItem } from '../utilsFlasche'

interface Props {
  cfg: FlaschenzugConfig
  setCfg: React.Dispatch<React.SetStateAction<FlaschenzugConfig>>
}

export const FlascheTabRollen: React.FC<Props> = ({ cfg, setCfg }) => {
  const updatePulley = (idx: number, patch: Partial<PulleyConfig>) => {
    setCfg(c => ({
      ...c,
      pulleys: updateListItem(c.pulleys, idx, patch),
    }))
  }

  const renamePulley = (idx: number, nextName: string) => {
    setCfg(c => {
      const target = c.pulleys[idx]
      if (!target) return c
      const oldName = target.name
      if (oldName === nextName) return c
      const shouldCascade = Boolean(oldName.trim()) && !c.pulleys.some((p, i) => i !== idx && p.name === oldName)
      return {
        ...c,
        pulleys: updateListItem(c.pulleys, idx, { name: nextName }),
        ropes: shouldCascade
          ? c.ropes.map(rope => ({
              ...rope,
              path: rope.path.map(seg => (seg.name === oldName ? { ...seg, name: nextName } : seg)),
            }))
          : c.ropes,
        masses: shouldCascade
          ? c.masses.map(m => (m.ref === oldName ? { ...m, ref: nextName } : m))
          : c.masses,
        forces: shouldCascade
          ? c.forces.map(f => (f.ref_name === oldName ? { ...f, ref_name: nextName } : f))
          : c.forces,
      }
    })
  }

  const removePulley = (pulley: PulleyConfig) => {
    setCfg(c => {
      const oldName = pulley.name
      const hasRemainingSameName = c.pulleys.some(p => p.id !== pulley.id && p.name === oldName)
      const shouldCleanRefs = Boolean(oldName.trim()) && !hasRemainingSameName
      return {
        ...c,
        pulleys: c.pulleys.filter(x => x.id !== pulley.id),
        ropes: shouldCleanRefs
          ? c.ropes.map(rope => ({
              ...rope,
              path: rope.path.filter(seg => seg.name !== oldName),
            }))
          : c.ropes,
        masses: shouldCleanRefs ? c.masses.filter(m => m.ref !== oldName) : c.masses,
        forces: shouldCleanRefs ? c.forces.filter(f => f.ref_name !== oldName) : c.forces,
      }
    })
  }

  const duplicatePulley = (idx: number) => {
    setCfg(c => {
      const source = c.pulleys[idx]
      if (!source) return c
      const copy = {
        ...source,
        id: genId(),
        name: getNextName('R', c.pulleys),
        x: source.x + 0.5,
        y: source.y - 0.5,
      }
      return { ...c, pulleys: [...c.pulleys, copy] }
    })
  }

  const mirrorPulley = (idx: number, axis: 'x' | 'y') => {
    setCfg(c => ({
      ...c,
      pulleys: c.pulleys.map((item, itemIdx) => itemIdx === idx
        ? { ...item, [axis]: -item[axis] }
        : item),
    }))
  }

  return (
    <Accordion title="Rollen" icon={<Settings size={18} />} defaultOpen>
      <div className="space-y-3">
        {cfg.pulleys.map((p, idx) => (
          <Collapsible
            key={p.id}
            title={p.label ? `${p.name} (${p.label})` : p.name}
            onRemove={() => removePulley(p)}
          >
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => duplicatePulley(idx)}
                title="Rolle duplizieren"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={() => mirrorPulley(idx, 'x')}
                title="Horizontal spiegeln"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink"
              >
                <FlipHorizontal size={14} />
              </button>
              <button
                type="button"
                onClick={() => mirrorPulley(idx, 'y')}
                title="Vertikal spiegeln"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink"
              >
                <FlipVertical size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Field label="Name">
                  <Input value={p.name} onChange={e => renamePulley(idx, e.target.value)} />
                </Field>
                <Field label="Label">
                  <Input value={p.label} onChange={e => updatePulley(idx, { label: e.target.value })} />
                </Field>
                <Field label="Label-Position">
                  <select
                    value={p.label_pos}
                    onChange={e => updatePulley(idx, { label_pos: e.target.value as PulleyLabelPos })}
                    className="w-full bg-panel/50 border border-rim text-ink text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PULLEY_LABEL_POSITIONS.map(pos => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Field label="X">
                  <NumberInput step="0.5" value={p.x} onChange={e => updatePulley(idx, { x: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field label="Y">
                  <NumberInput step="0.5" value={p.y} onChange={e => updatePulley(idx, { y: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field label="Radius">
                  <NumberInput step="0.1" value={p.radius} onChange={e => updatePulley(idx, { radius: parseFloat(e.target.value) || 0 })} />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2 items-end">
                <Field label="Halterung">
                  <select
                    value={p.mount}
                    onChange={e => updatePulley(idx, { mount: e.target.value as 'Keine' | 'Einseitig' | 'Zweiseitig' })}
                    className="w-full bg-panel/50 border border-rim text-ink text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option>Keine</option>
                    <option>Einseitig</option>
                    <option>Zweiseitig</option>
                  </select>
                </Field>
                {(p.mount !== "Keine") && (
                  <>
                    <Field label="H-Winkel">
                      <NumberInput value={p.mount_angle} onChange={e => updatePulley(idx, { mount_angle: parseFloat(e.target.value) || 0 })} />
                    </Field>
                    <Field label="H-Länge">
                      <NumberInput step="0.1" value={p.mount_length} onChange={e => updatePulley(idx, { mount_length: parseFloat(e.target.value) || 0 })} />
                    </Field>
                  </>
                )}
              </div>
            </div>
          </Collapsible>
        ))}
        <button
          onClick={() => setCfg(c => ({
            ...c, pulleys: [...c.pulleys, {
              id: genId(), name: getNextName("R", c.pulleys), x: 0, y: 0, radius: 0.3, label: "", label_pos: 'above right', mount: 'Keine', mount_angle: 90, mount_length: 0.5
            }]
          }))}
          className="w-full py-2 flex items-center justify-center gap-2 border border-rim border-dashed rounded-lg text-ink hover:bg-overlay/50 transition-colors"
        >
          <Plus size={16} /> Rolle hinzufügen
        </button>
      </div>
    </Accordion>
  )
}
