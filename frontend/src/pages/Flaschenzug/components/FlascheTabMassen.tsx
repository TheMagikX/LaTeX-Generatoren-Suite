// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Copy, FlipHorizontal, Settings, Plus } from 'lucide-react'
import { Accordion, Collapsible, Field, Input, NumberInput, SecHead } from '../../../components/ui'
import type { FlaschenzugConfig } from '../typesFlasche'
import { genId, getNextName } from '../utilsFlasche'

interface Props {
  cfg: FlaschenzugConfig
  setCfg: React.Dispatch<React.SetStateAction<FlaschenzugConfig>>
}

export const FlascheTabMassen: React.FC<Props> = ({ cfg, setCfg }) => {
  const duplicateMass = (idx: number) => {
    setCfg(c => {
      const source = c.masses[idx]
      if (!source) return c
      return {
        ...c,
        masses: [...c.masses, {
          ...source,
          id: genId(),
          name: getNextName('M', c.masses),
        }],
      }
    })
  }

  const mirrorMass = (idx: number) => {
    setCfg(c => ({
      ...c,
      masses: c.masses.map((item, itemIdx) => {
        if (itemIdx !== idx) return item
        if (item.relation === 'Links') return { ...item, relation: 'Rechts' }
        if (item.relation === 'Rechts') return { ...item, relation: 'Links' }
        return item
      }),
    }))
  }

  return (
    <Accordion title="Massestücke & Halterungen" icon={<Settings size={18} />}>
      <SecHead>Massen</SecHead>
      <div className="space-y-3 mb-6">
        {cfg.masses.map((m, idx) => {
          const isCustom = Boolean(m.ref && !cfg.pulleys.some(p => p.name === m.ref) && !cfg.anchors.some(a => a.name === m.ref))
          const isAnchor = Boolean(cfg.anchors.some(a => a.name === m.ref))

          return (
            <Collapsible
              key={m.id}
              title={m.label ? `Masse: ${m.label}` : (m.ref ? `Masse an ${m.ref}` : `Masse ${idx + 1}`)}
              onRemove={() => setCfg(c => ({ ...c, masses: c.masses.filter(x => x.id !== m.id) }))}
            >
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => duplicateMass(idx)}
                  title="Masse duplizieren"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => mirrorMass(idx)}
                  title="Aufhängung links/rechts spiegeln"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink"
                >
                  <FlipHorizontal size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Aufhängepunkt">
                  <select
                    value={m.ref}
                    onChange={e => {
                      const arr = [...cfg.masses]
                      arr[idx].ref = e.target.value
                      setCfg(c => ({ ...c, masses: arr }))
                    }}
                    className="w-full h-8 bg-panel/50 border border-rim text-ink text-sm rounded px-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Aufhängepunkt wählen --</option>
                    {isCustom && (
                      <option value={m.ref}>{m.ref} (benutzerdefiniert)</option>
                    )}
                    {cfg.pulleys.length > 0 && (
                      <optgroup label="Rollen">
                        {cfg.pulleys.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name}{p.label ? ` (${p.label})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {cfg.anchors.length > 0 && (
                      <optgroup label="Anker / Fixpunkte">
                        {cfg.anchors.map(a => (
                          <option key={a.id} value={a.name}>
                            {a.name}{a.label ? ` (${a.label})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </Field>
                <Field label="Label">
                  <Input
                    value={m.label}
                    onChange={e => {
                      const arr = [...cfg.masses]; arr[idx].label = e.target.value; setCfg(c => ({ ...c, masses: arr }))
                    }}
                    placeholder="z.B. $m = 50\,\text{kg}$"
                    className="h-8 text-sm"
                  />
                </Field>
                <Field label="Länge Seil">
                  <NumberInput
                    step="0.1"
                    value={m.length}
                    onChange={e => {
                      const arr = [...cfg.masses]; arr[idx].length = parseFloat(e.target.value) || 0; setCfg(c => ({ ...c, masses: arr }))
                    }}
                    className="h-8 text-sm"
                  />
                </Field>
                <Field label="Position am Punkt">
                  <select
                    value={isAnchor ? 'Mitte' : m.relation}
                    disabled={isAnchor}
                    onChange={e => {
                      const arr = [...cfg.masses]; arr[idx].relation = e.target.value; setCfg(c => ({ ...c, masses: arr }))
                    }}
                    className="w-full h-8 bg-panel/50 border border-rim text-ink text-sm rounded px-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="Mitte">Mitte (Achse)</option>
                    <option value="Links">Links (Außen)</option>
                    <option value="Rechts">Rechts (Außen)</option>
                  </select>
                </Field>
              </div>
            </Collapsible>
          )
        })}
        <button
          onClick={() => setCfg(c => ({ ...c, masses: [...c.masses, { id: genId(), name: `M${c.masses.length + 1}`, ref: '', length: 1.0, label: '', relation: 'Mitte' }] }))}
          className="w-full py-1.5 flex items-center justify-center gap-2 border border-rim border-dashed rounded-lg text-xs text-ink hover:bg-overlay/50 transition-colors"
        >
          <Plus size={14} /> Masse hinzufügen
        </button>
      </div>

      <SecHead>Manuelle Halterungen</SecHead>
      <div className="space-y-3">
        {cfg.manual_mounts.map((hm, idx) => (
          <Collapsible
            key={hm.id}
            title={`Halterung ${idx + 1}`}
            onRemove={() => setCfg(c => ({ ...c, manual_mounts: c.manual_mounts.filter(x => x.id !== hm.id) }))}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Typ">
                  <select value={hm.type} onChange={e => {
                    const arr = [...cfg.manual_mounts]; arr[idx].type = e.target.value; setCfg(c => ({ ...c, manual_mounts: arr }))
                  }} className="w-full h-8 bg-panel/50 border border-rim text-ink text-sm rounded px-2 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Einseitig</option>
                    <option>Zweiseitig</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Field label="X1"><NumberInput step="0.5" value={hm.x1} onChange={e => { const arr = [...cfg.manual_mounts]; arr[idx].x1 = parseFloat(e.target.value) || 0; setCfg(c => ({ ...c, manual_mounts: arr })) }} className="h-8 text-xs" /></Field>
                <Field label="Y1"><NumberInput step="0.5" value={hm.y1} onChange={e => { const arr = [...cfg.manual_mounts]; arr[idx].y1 = parseFloat(e.target.value) || 0; setCfg(c => ({ ...c, manual_mounts: arr })) }} className="h-8 text-xs" /></Field>
                <Field label="X2"><NumberInput step="0.5" value={hm.x2} onChange={e => { const arr = [...cfg.manual_mounts]; arr[idx].x2 = parseFloat(e.target.value) || 0; setCfg(c => ({ ...c, manual_mounts: arr })) }} className="h-8 text-xs" /></Field>
                <Field label="Y2"><NumberInput step="0.5" value={hm.y2} onChange={e => { const arr = [...cfg.manual_mounts]; arr[idx].y2 = parseFloat(e.target.value) || 0; setCfg(c => ({ ...c, manual_mounts: arr })) }} className="h-8 text-xs" /></Field>
              </div>
            </div>
          </Collapsible>
        ))}
        <button
          onClick={() => setCfg(c => ({ ...c, manual_mounts: [...c.manual_mounts, { id: genId(), x1: 0, y1: 0, x2: 0.5, y2: 0, type: 'Einseitig' }] }))}
          className="w-full py-1.5 flex items-center justify-center gap-2 border border-rim border-dashed rounded-lg text-xs text-ink hover:bg-overlay/50 transition-colors"
        >
          <Plus size={14} /> Halterung hinzufügen
        </button>
      </div>
    </Accordion>
  )
}
