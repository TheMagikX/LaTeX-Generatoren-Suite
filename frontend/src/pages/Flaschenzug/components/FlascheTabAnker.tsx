// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Copy, FlipHorizontal, FlipVertical, Settings, Plus } from 'lucide-react'
import { Accordion, Collapsible, Field, Input, NumberInput } from '../../../components/ui'
import type { FlaschenzugConfig } from '../typesFlasche'
import { genId, getNextName } from '../utilsFlasche'

interface Props {
  cfg: FlaschenzugConfig
  setCfg: React.Dispatch<React.SetStateAction<FlaschenzugConfig>>
}

export const FlascheTabAnker: React.FC<Props> = ({ cfg, setCfg }) => {
  const duplicateAnchor = (idx: number) => {
    setCfg(c => {
      const source = c.anchors[idx]
      if (!source) return c
      const copy = {
        ...source,
        id: genId(),
        name: getNextName('A', c.anchors),
        x: source.x + 0.5,
        y: source.y - 0.5,
      }
      return { ...c, anchors: [...c.anchors, copy] }
    })
  }

  const mirrorAnchor = (idx: number, axis: 'x' | 'y') => {
    setCfg(c => ({
      ...c,
      anchors: c.anchors.map((item, itemIdx) => itemIdx === idx
        ? { ...item, [axis]: -item[axis] }
        : item),
    }))
  }

  return (
    <Accordion title="Befestigungspunkte" icon={<Settings size={18} />}>
      <div className="space-y-3">
        {cfg.anchors.map((a, idx) => (
          <Collapsible
            key={a.id}
            title={a.label ? `${a.name} (${a.label})` : a.name}
            onRemove={() => setCfg(c => ({ ...c, anchors: c.anchors.filter(x => x.id !== a.id) }))}
          >
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => duplicateAnchor(idx)}
                title="Punkt duplizieren"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={() => mirrorAnchor(idx, 'x')}
                title="Horizontal spiegeln"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink"
              >
                <FlipHorizontal size={14} />
              </button>
              <button
                type="button"
                onClick={() => mirrorAnchor(idx, 'y')}
                title="Vertikal spiegeln"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink"
              >
                <FlipVertical size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <Input value={a.name} onChange={e => {
                  const arr = [...cfg.anchors]; arr[idx].name = e.target.value;
                  setCfg(c => ({ ...c, anchors: arr }))
                }} />
              </Field>
              <Field label="Label">
                <Input value={a.label} onChange={e => {
                  const arr = [...cfg.anchors]; arr[idx].label = e.target.value;
                  setCfg(c => ({ ...c, anchors: arr }))
                }} />
              </Field>
              <Field label="X">
                <NumberInput step="0.5" value={a.x} onChange={e => {
                  const arr = [...cfg.anchors]; arr[idx].x = parseFloat(e.target.value) || 0;
                  setCfg(c => ({ ...c, anchors: arr }))
                }} />
              </Field>
              <Field label="Y">
                <NumberInput step="0.5" value={a.y} onChange={e => {
                  const arr = [...cfg.anchors]; arr[idx].y = parseFloat(e.target.value) || 0;
                  setCfg(c => ({ ...c, anchors: arr }))
                }} />
              </Field>
              <Field label="Form">
                <select value={a.shape} onChange={e => {
                  const arr = [...cfg.anchors]; arr[idx].shape = e.target.value as 'Kreis' | 'Rechteck' | 'Keine';
                  setCfg(c => ({ ...c, anchors: arr }))
                }} className="w-full bg-panel/50 border border-rim text-ink text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Kreis</option>
                  <option>Rechteck</option>
                  <option>Keine</option>
                </select>
              </Field>
              <Field label="Größe (pt)">
                <NumberInput step="0.5" value={a.size} onChange={e => {
                  const arr = [...cfg.anchors]; arr[idx].size = parseFloat(e.target.value) || 0;
                  setCfg(c => ({ ...c, anchors: arr }))
                }} />
              </Field>
            </div>
          </Collapsible>
        ))}
        <button
          onClick={() => setCfg(c => ({
            ...c, anchors: [...c.anchors, {
              id: genId(), name: getNextName("A", c.anchors), x: 0, y: 0, size: 2.0, shape: 'Kreis', label: ""
            }]
          }))}
          className="w-full py-2 flex items-center justify-center gap-2 border border-rim border-dashed rounded-lg text-ink hover:bg-overlay/50 transition-colors"
        >
          <Plus size={16} /> Punkt hinzufügen
        </button>
      </div>
    </Accordion>
  )
}
