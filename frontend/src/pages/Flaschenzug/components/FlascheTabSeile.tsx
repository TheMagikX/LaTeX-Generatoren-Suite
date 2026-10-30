// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { AlertTriangle, Settings, Trash2, Plus } from 'lucide-react'
import { Accordion, Collapsible, Field, Input, SecHead } from '../../../components/ui'
import type { FlaschenzugConfig } from '../typesFlasche'
import { genId, validateRopePaths } from '../utilsFlasche'

interface Props {
  cfg: FlaschenzugConfig
  setCfg: React.Dispatch<React.SetStateAction<FlaschenzugConfig>>
}

export const FlascheTabSeile: React.FC<Props> = ({ cfg, setCfg }) => {
  const diagnostics = validateRopePaths(cfg)

  return (
    <Accordion title="Seilführung" icon={<Settings size={18} />}>
      <div className="space-y-3">
        {cfg.ropes.map((rope, rIdx) => (
          <Collapsible
            key={rope.id}
            title={rope.name || `Seil ${rIdx + 1}`}
            onRemove={() => setCfg(c => ({ ...c, ropes: c.ropes.filter(x => x.id !== rope.id) }))}
          >
            {diagnostics.filter(d => d.ropeId === rope.id).length > 0 && (
              <div className="mb-3 rounded-lg border border-error/25 bg-error/8 p-3 text-xs text-error">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertTriangle size={14} />
                  Pfad prüfen
                </div>
                <ul className="space-y-1">
                  {diagnostics.filter(d => d.ropeId === rope.id).map((d, idx) => (
                    <li key={`${d.message}-${idx}`}>{d.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-2">
              <Field label="Name">
                <Input value={rope.name} onChange={e => {
                  const r = [...cfg.ropes]; r[rIdx].name = e.target.value; setCfg(c => ({ ...c, ropes: r }))
                }} />
              </Field>
              <Field label="Farbe">
                <Input value={rope.color} onChange={e => {
                  const r = [...cfg.ropes]; r[rIdx].color = e.target.value; setCfg(c => ({ ...c, ropes: r }))
                }} />
              </Field>
            </div>

            <SecHead>Pfade (Reihenfolge)</SecHead>
            <div className="space-y-2">
              {rope.path.map((seg, sIdx) => {
                const isCustom = Boolean(seg.name && !cfg.pulleys.some(p => p.name === seg.name) && !cfg.anchors.some(a => a.name === seg.name))
                return (
                  <div key={sIdx} className="flex gap-2 items-center bg-panel/50 p-2 rounded border border-rim">
                    <select
                      value={seg.name}
                      onChange={e => {
                        const r = [...cfg.ropes]
                        r[rIdx].path[sIdx].name = e.target.value
                        setCfg(c => ({ ...c, ropes: r }))
                      }}
                      className="flex-1 h-8 bg-panel/50 border border-rim text-ink text-xs rounded px-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Punkt wählen --</option>
                      {isCustom && (
                        <option value={seg.name}>{seg.name} (benutzerdefiniert)</option>
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
                    <select
                      value={seg.side}
                      onChange={e => {
                        const r = [...cfg.ropes]; r[rIdx].path[sIdx].side = e.target.value as 'cw' | 'ccw' | 'none'; setCfg(c => ({ ...c, ropes: r }))
                      }}
                      className="h-8 bg-raised border border-rim text-ink text-xs rounded px-1"
                    >
                      <option value="cw">Rechts (cw)</option>
                      <option value="ccw">Links (ccw)</option>
                      <option value="none">Mitte</option>
                    </select>
                    <button
                      onClick={() => {
                        const r = [...cfg.ropes]; r[rIdx].path.splice(sIdx, 1); setCfg(c => ({ ...c, ropes: r }))
                      }}
                      className="text-red-400 p-1 hover:bg-overlay rounded"
                      title="Segment entfernen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
              <button onClick={() => {
                const r = [...cfg.ropes]; r[rIdx].path.push({ name: '', side: 'cw' }); setCfg(c => ({ ...c, ropes: r }))
              }} className="w-full text-xs py-1 border border-dashed border-rim text-ink hover:bg-overlay rounded">
                + Segment anhängen
              </button>
            </div>
          </Collapsible>
        ))}
        <button
          onClick={() => setCfg(c => ({
            ...c, ropes: [...c.ropes, {
              id: genId(), name: `Seil ${c.ropes.length + 1}`, path: [], style: 'plain', color: 'black', width: 1.0
            }]
          }))}
          className="w-full py-2 flex items-center justify-center gap-2 border border-rim border-dashed rounded-lg text-ink hover:bg-overlay/50 transition-colors"
        >
          <Plus size={16} /> Seil hinzufügen
        </button>
      </div>
    </Accordion>
  )
}
