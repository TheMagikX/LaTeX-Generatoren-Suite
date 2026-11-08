// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { AlertTriangle, Settings, Trash2, Plus } from 'lucide-react'
import { Accordion, Collapsible, Field, Input, ReorderList, SecHead } from '../../../components/ui'
import type { FlaschenzugConfig, RopeConfig, RopeSegmentConfig } from '../typesFlasche'
import { genId, updateListItem, validateRopePaths } from '../utilsFlasche'

const SIDE_LABELS: Record<RopeSegmentConfig['side'], string> = {
  cw: 'Rechts (cw)',
  ccw: 'Links (ccw)',
  none: 'Mitte',
}

const createSegmentId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `seg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

const segmentKeyMap = new WeakMap<object, string>()

export const getSegmentKey = (seg: RopeSegmentConfig): string => {
  if (seg.id) return seg.id
  let key = segmentKeyMap.get(seg)
  if (!key) {
    key = createSegmentId()
    segmentKeyMap.set(seg, key)
  }
  return key
}

const getSegmentLabel = (seg: RopeSegmentConfig): string =>
  `Pfadpunkt ${seg.name || 'Unbenannt'} (${SIDE_LABELS[seg.side] ?? seg.side})`

interface Props {
  cfg: FlaschenzugConfig
  setCfg: React.Dispatch<React.SetStateAction<FlaschenzugConfig>>
}

export const FlascheTabSeile: React.FC<Props> = ({ cfg, setCfg }) => {
  const diagnostics = validateRopePaths(cfg)

  const updateRope = (
    rIdx: number,
    patchOrUpdater: Partial<RopeConfig> | ((rope: RopeConfig) => RopeConfig),
  ) => {
    setCfg(c => ({
      ...c,
      ropes: updateListItem(c.ropes, rIdx, patchOrUpdater),
    }))
  }

  const updateSegment = (
    rIdx: number,
    sIdx: number,
    patch: Partial<RopeSegmentConfig>,
  ) => {
    updateRope(rIdx, rope => ({
      ...rope,
      path: updateListItem(rope.path, sIdx, oldSeg => {
        const id = getSegmentKey(oldSeg)
        const nextSeg: RopeSegmentConfig = { ...oldSeg, ...patch, id }
        segmentKeyMap.set(nextSeg, id)
        return nextSeg
      }),
    }))
  }

  const reorderSegments = (rIdx: number, nextPath: RopeSegmentConfig[]) => {
    updateRope(rIdx, rope => ({
      ...rope,
      path: nextPath,
    }))
  }

  const removeSegment = (rIdx: number, sIdx: number) => {
    updateRope(rIdx, rope => ({
      ...rope,
      path: rope.path.filter((_, idx) => idx !== sIdx),
    }))
  }

  const addSegment = (rIdx: number) => {
    updateRope(rIdx, rope => ({
      ...rope,
      path: [
        ...rope.path,
        { id: createSegmentId(), name: '', side: 'cw' },
      ],
    }))
  }

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
                <Input
                  value={rope.name}
                  onChange={e => updateRope(rIdx, { name: e.target.value })}
                />
              </Field>
              <Field label="Farbe">
                <Input
                  value={rope.color}
                  onChange={e => updateRope(rIdx, { color: e.target.value })}
                />
              </Field>
            </div>

            <SecHead>Pfade (Reihenfolge)</SecHead>
            <div className="space-y-2">
              <ReorderList
                items={rope.path}
                getId={seg => getSegmentKey(seg)}
                getLabel={seg => getSegmentLabel(seg)}
                onReorder={nextPath => reorderSegments(rIdx, nextPath)}
                label={`Seilpfad ${rope.name || `Seil ${rIdx + 1}`}`}
              >
                {(seg, sIdx) => {
                  const isCustom = Boolean(
                    seg.name &&
                    !cfg.pulleys.some(p => p.name === seg.name) &&
                    !cfg.anchors.some(a => a.name === seg.name),
                  )
                  return (
                    <div className="flex gap-2 items-center w-full">
                      <select
                        aria-label={`Pfadpunkt ${sIdx + 1} Element`}
                        value={seg.name}
                        onChange={e => updateSegment(rIdx, sIdx, { name: e.target.value })}
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
                        aria-label={`Pfadpunkt ${sIdx + 1} Richtung`}
                        value={seg.side}
                        onChange={e =>
                          updateSegment(rIdx, sIdx, {
                            side: e.target.value as RopeSegmentConfig['side'],
                          })
                        }
                        className="h-8 bg-raised border border-rim text-ink text-xs rounded px-1"
                      >
                        <option value="cw">Rechts (cw)</option>
                        <option value="ccw">Links (ccw)</option>
                        <option value="none">Mitte</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSegment(rIdx, sIdx)}
                        className="text-red-400 p-1 hover:bg-overlay rounded"
                        title="Segment entfernen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                }}
              </ReorderList>
              <button
                type="button"
                onClick={() => addSegment(rIdx)}
                className="w-full text-xs py-1 border border-dashed border-rim text-ink hover:bg-overlay rounded"
              >
                + Segment anhängen
              </button>
            </div>
          </Collapsible>
        ))}
        <button
          type="button"
          onClick={() =>
            setCfg(c => ({
              ...c,
              ropes: [
                ...c.ropes,
                {
                  id: genId(),
                  name: `Seil ${c.ropes.length + 1}`,
                  path: [],
                  style: 'plain',
                  color: 'black',
                  width: 1.0,
                },
              ],
            }))
          }
          className="w-full py-2 flex items-center justify-center gap-2 border border-rim border-dashed rounded-lg text-ink hover:bg-overlay/50 transition-colors"
        >
          <Plus size={16} /> Seil hinzufügen
        </button>
      </div>
    </Accordion>
  )
}
