// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Plus, ChevronDown, ChevronRight, Trash2, GripVertical } from 'lucide-react'
import { Button, Input, Label, Slider, NumberInput } from '../../../components/ui'
import { SecHead, Chk } from '../utilsStrahlen'
import { DEFAULT_BARRIER, DEFAULT_NODE } from '../constantsStrahlen'
import type { StrahlenBarrierUpdater, StrahlenPathNodeUpdater, StrahlenSetter, StrahlenoptikConfig } from '../typesStrahlen'

interface StrahlenTabHindernisseProps {
  config: StrahlenoptikConfig
  updateConfig: StrahlenSetter
  collapsedBarriers: Set<number>
  toggleBarrier: (idx: number) => void
  draggedIdx: number | null
  setDraggedIdx: (idx: number | null) => void
  dragType: string | null
  setDragType: (type: string | null) => void
}

export const StrahlenTabHindernisse = ({
  config,
  updateConfig,
  collapsedBarriers,
  toggleBarrier,
  draggedIdx,
  setDraggedIdx,
  dragType,
  setDragType
}: StrahlenTabHindernisseProps) => {

  const updateBarrier: StrahlenBarrierUpdater = (bi, key, value) => {
    const next = [...config.barriers]
    next[bi] = { ...next[bi], [key]: value }
    updateConfig('barriers', next)
  }

  const addBarrier = () =>
    updateConfig('barriers', [...config.barriers, { ...DEFAULT_BARRIER }])

  const removeBarrier = (bi: number) =>
    updateConfig('barriers', config.barriers.filter((_, i) => i !== bi))

  const updateNode: StrahlenPathNodeUpdater = (bi, ni, key, value) => {
    const nextBarriers = [...config.barriers]
    const nextNodes = [...nextBarriers[bi].nodes]
    nextNodes[ni] = { ...nextNodes[ni], [key]: value }
    nextBarriers[bi] = { ...nextBarriers[bi], nodes: nextNodes }
    updateConfig('barriers', nextBarriers)
  }

  const addNode = (bi: number) => {
    const b = config.barriers[bi]
    const last = b.nodes.at(-1) ?? { x: 0, y: 0 }
    const newNode = { ...DEFAULT_NODE, x: last.x + 1, y: last.y }
    updateBarrier(bi, 'nodes', [...b.nodes, newNode])
  }

  const removeNode = (bi: number, ni: number) => {
    const b = config.barriers[bi]
    if (b.nodes.length <= 1) return
    updateBarrier(bi, 'nodes', b.nodes.filter((_, i) => i !== ni))
  }

  const onNodeDragStart = (e: React.DragEvent, bi: number, ni: number) => {
    setDraggedIdx(ni)
    setDragType(`barrier-${bi}`)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onNodeDragOver = (e: React.DragEvent, bi: number, ni: number) => {
    e.preventDefault()
    if (dragType !== `barrier-${bi}` || draggedIdx === null || draggedIdx === ni) return
    
    const nextBarriers = [...config.barriers]
    const nextNodes = [...nextBarriers[bi].nodes]
    const item = nextNodes[draggedIdx]
    nextNodes.splice(draggedIdx, 1)
    nextNodes.splice(ni, 0, item)
    nextBarriers[bi] = { ...nextBarriers[bi], nodes: nextNodes }
    setDraggedIdx(ni)
    updateConfig('barriers', nextBarriers)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SecHead>Hindernisse</SecHead>
        <Button onClick={addBarrier} size="sm" className="h-8 flex items-center gap-1">
          <Plus size={14} /> Hindernis
        </Button>
      </div>

      {config.barriers.map((barrier, bi) => {
        const collapsed = collapsedBarriers.has(bi)
        return (
          <div key={bi} className="bg-raised/30 border border-line rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-raised/40 transition-colors"
              onClick={() => toggleBarrier(bi)}
            >
              <div className="flex items-center gap-2">
                {collapsed ? <ChevronRight size={14} className="text-ghost" /> : <ChevronDown size={14} className="text-ghost" />}
                <span className="text-section-label">
                  Hindernis {bi + 1}{barrier.label ? ` · ${barrier.label}` : ''}
                </span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeBarrier(bi) }}
                className="p-1 text-ghost hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {!collapsed && (
              <div className="px-4 pb-4 space-y-4 border-t border-line/60">
                <div className="grid grid-cols-2 gap-4 pt-3">
                  <Chk
                    checked={barrier.reflecting}
                    onChange={v => updateBarrier(bi, 'reflecting', v)}
                    label="Reflektierend (Spiegel)"
                  />
                  <Chk
                    checked={barrier.is_closed}
                    onChange={v => updateBarrier(bi, 'is_closed', v)}
                    label="Geschlossener Pfad"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Farbe</Label>
                    <Input value={barrier.color}
                      onChange={e => updateBarrier(bi, 'color', e.target.value)}
                      placeholder="black" />
                  </div>
                  <div>
                    <Label>Linienbreite (pt)</Label>
                    <NumberInput step={0.5} min={0.5} value={barrier.line_width}
                      onChange={e => updateBarrier(bi, 'line_width', parseFloat(e.target.value))} />
                  </div>
                </div>

                <div>
                  <Label>Beschriftung</Label>
                  <Input value={barrier.label}
                    onChange={e => updateBarrier(bi, 'label', e.target.value)}
                    placeholder="Spiegel" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ghost">Punkte & Verbindungen</span>
                    <button
                      onClick={() => addNode(bi)}
                      className="text-xs text-primary hover:text-blue-400 flex items-center gap-1"
                    >
                      <Plus size={12} /> Punkt
                    </button>
                  </div>

                  <div className="space-y-2">
                    {barrier.nodes.map((node, ni) => (
                      <div 
                        key={ni} 
                        draggable
                        onDragStart={(e) => onNodeDragStart(e, bi, ni)}
                        onDragOver={(e) => onNodeDragOver(e, bi, ni)}
                        onDragEnd={() => { setDraggedIdx(null); setDragType(null); }}
                        className={`bg-panel/60 rounded-lg p-3 space-y-3 border transition-all ${
                          draggedIdx === ni && dragType === `barrier-${bi}`
                            ? 'border-primary border-dashed opacity-50 scale-95'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="cursor-grab active:cursor-grabbing text-ghost hover:text-muted">
                              <GripVertical size={14} />
                            </div>
                            <span className="text-metadata">P{ni + 1}</span>
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <NumberInput step={0.5} value={node.x} onChange={e => updateNode(bi, ni, 'x', parseFloat(e.target.value))} />
                            <NumberInput step={0.5} value={node.y} onChange={e => updateNode(bi, ni, 'y', parseFloat(e.target.value))} />
                          </div>
                          <button
                            onClick={() => removeNode(bi, ni)}
                            disabled={barrier.nodes.length <= 1}
                            className="text-ghost hover:text-red-400 transition-colors disabled:opacity-30 ml-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {(ni < barrier.nodes.length - 1 || barrier.is_closed) && (
                          <div className="pl-6 py-2 border-l border-line space-y-3">
                            <div className="flex items-center justify-between">
                          <span className="text-caption">Verbindung zu P{(ni + 1) % barrier.nodes.length + 1}</span>
                          <div className="flex gap-1">
                                {(['line', 'arc', 'bezier'] as const).map(ct => (
                                  <button
                                    key={ct}
                                    onClick={() => updateNode(bi, ni, 'connection', ct)}
                                    className={`text-metadata px-2 py-0.5 rounded capitalize ${node.connection === ct ? 'bg-primary text-white' : 'bg-raised text-muted'}`}
                                  >
                                    {ct === 'line' ? 'Gerade' : ct === 'arc' ? 'Bogen' : 'Bézier'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {node.connection === 'arc' && (
                              <Slider
                                label={`Biegung: ${node.bend}°`}
                                min={-180} max={180} step={1}
                                value={node.bend}
                                onChange={v => updateNode(bi, ni, 'bend', v)}
                              />
                            )}

                            {node.connection === 'bezier' && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-metadata">Auswinkel (P{ni + 1})</Label>
                                  <NumberInput step={5} value={node.out_angle} onChange={e => updateNode(bi, ni, 'out_angle', parseFloat(e.target.value))} />
                                </div>
                                <div>
                                  <Label className="text-metadata">Einwinkel (P{(ni + 1) % barrier.nodes.length + 1})</Label>
                                  <NumberInput step={5} value={node.in_angle} onChange={e => updateNode(bi, ni, 'in_angle', parseFloat(e.target.value))} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {config.barriers.length === 0 && (
        <p className="text-sm text-ghost text-center py-4">
          Noch keine Hindernisse. Klicke auf „+ Hindernis".
        </p>
      )}
    </div>
  )
}
