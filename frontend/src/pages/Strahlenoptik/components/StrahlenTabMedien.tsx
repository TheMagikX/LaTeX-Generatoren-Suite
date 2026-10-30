// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Plus, ChevronDown, ChevronRight, Trash2, GripVertical } from 'lucide-react'
import { Button, Input, Label, Slider, NumberInput } from '../../../components/ui'
import { SecHead, Chk } from '../utilsStrahlen'
import { DEFAULT_REFRACTION_AREA, DEFAULT_NODE } from '../constantsStrahlen'
import type { StrahlenAnnotationUpdater, StrahlenAreaUpdater, StrahlenPathNodeUpdater, StrahlenSetter, StrahlenoptikConfig } from '../typesStrahlen'

interface StrahlenTabMedienProps {
  config: StrahlenoptikConfig
  updateConfig: StrahlenSetter
  collapsedAreas: Set<number>
  toggleArea: (idx: number) => void
  draggedIdx: number | null
  setDraggedIdx: (idx: number | null) => void
  dragType: string | null
  setDragType: (type: string | null) => void
  hasRefractionAreas: boolean
}

export const StrahlenTabMedien = ({
  config,
  updateConfig,
  collapsedAreas,
  toggleArea,
  draggedIdx,
  setDraggedIdx,
  dragType,
  setDragType,
  hasRefractionAreas
}: StrahlenTabMedienProps) => {

  const updateArea: StrahlenAreaUpdater = (ai, key, value) => {
    const next = [...config.refraction_areas]
    next[ai] = { ...next[ai], [key]: value }
    updateConfig('refraction_areas', next)
  }

  const addArea = () =>
    updateConfig('refraction_areas', [...config.refraction_areas, { ...DEFAULT_REFRACTION_AREA }])

  const removeArea = (ai: number) =>
    updateConfig('refraction_areas', config.refraction_areas.filter((_, i) => i !== ai))

  const updateNode: StrahlenPathNodeUpdater = (ai, ni, key, value) => {
    const nextAreas = [...config.refraction_areas]
    const nextNodes = [...nextAreas[ai].nodes]
    nextNodes[ni] = { ...nextNodes[ni], [key]: value }
    nextAreas[ai] = { ...nextAreas[ai], nodes: nextNodes }
    updateConfig('refraction_areas', nextAreas)
  }

  const addNode = (ai: number) => {
    const a = config.refraction_areas[ai]
    const last = a.nodes.at(-1) ?? { x: 0, y: 0 }
    const newNode = { ...DEFAULT_NODE, x: last.x + 1, y: last.y }
    updateArea(ai, 'nodes', [...a.nodes, newNode])
  }

  const removeNode = (ai: number, ni: number) => {
    const a = config.refraction_areas[ai]
    if (a.nodes.length <= 1) return
    updateArea(ai, 'nodes', a.nodes.filter((_, i) => i !== ni))
  }

  const onNodeDragStart = (e: React.DragEvent, ai: number, ni: number) => {
    setDraggedIdx(ni)
    setDragType(`area-${ai}`)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onNodeDragOver = (e: React.DragEvent, ai: number, ni: number) => {
    e.preventDefault()
    if (dragType !== `area-${ai}` || draggedIdx === null || draggedIdx === ni) return
    
    const nextAreas = [...config.refraction_areas]
    const nextNodes = [...nextAreas[ai].nodes]
    const item = nextNodes[draggedIdx]
    nextNodes.splice(draggedIdx, 1)
    nextNodes.splice(ni, 0, item)
    nextAreas[ai] = { ...nextAreas[ai], nodes: nextNodes }
    setDraggedIdx(ni)
    updateConfig('refraction_areas', nextAreas)
  }

  const updateAnnotation: StrahlenAnnotationUpdater = (key, value) => {
    updateConfig('refraction_annotations', { ...config.refraction_annotations, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SecHead>Brechungsmedien</SecHead>
        <Button onClick={addArea} size="sm" className="h-8 flex items-center gap-1">
          <Plus size={14} /> Medium
        </Button>
      </div>

      <p className="text-xs text-ghost leading-relaxed">
        Bereiche mit einem anderen Brechungsindex (n &gt; 1).
        Strahlen werden beim Ein- und Austritt nach dem Snellschen Gesetz gebrochen.
      </p>

      {config.refraction_areas.map((area, ai) => {
        const collapsed = collapsedAreas.has(ai)
        const nLabel = area.label ? ` · ${area.label}` : ` · n = ${area.refractive_index}`
        
        return (
          <div key={ai} className="bg-raised/30 border border-line rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-raised/40 transition-colors"
              onClick={() => toggleArea(ai)}
            >
              <div className="flex items-center gap-2">
                {collapsed ? <ChevronRight size={14} className="text-ghost" /> : <ChevronDown size={14} className="text-ghost" />}
                <span className="text-section-label">
                  Medium {ai + 1}{nLabel}
                </span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeArea(ai) }}
                className="p-1 text-ghost hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {!collapsed && (
              <div className="px-4 pb-4 space-y-4 border-t border-line/60">
                
                <div className="pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-metadata">Formmodus</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateArea(ai, 'mode', 'rectangle')}
                          className={`text-metadata px-2 py-0.5 rounded ${area.mode === 'rectangle' ? 'bg-primary text-white' : 'bg-raised text-muted'}`}
                        >
                          Rechteck
                        </button>
                        <button
                          onClick={() => {
                            updateArea(ai, 'mode', 'path');
                            if (area.nodes.length === 0) {
                              updateArea(ai, 'nodes', [
                                { ...DEFAULT_NODE, x: area.x_min, y: area.y_min },
                                { ...DEFAULT_NODE, x: area.x_max, y: area.y_min },
                                { ...DEFAULT_NODE, x: area.x_max, y: area.y_max },
                                { ...DEFAULT_NODE, x: area.x_min, y: area.y_max },
                              ])
                            }
                          }}
                          className={`text-caption px-2 py-0.5 rounded ${area.mode === 'path' ? 'bg-primary text-white' : 'bg-raised text-muted'}`}
                        >
                          Pfad (Polygon/Linsen)
                        </button>
                      </div>
                    </div>

                  {area.mode === 'rectangle' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>x min</Label>
                        <NumberInput step={0.5} value={area.x_min}
                          onChange={e => updateArea(ai, 'x_min', parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <Label>x max</Label>
                        <NumberInput step={0.5} value={area.x_max}
                          onChange={e => updateArea(ai, 'x_max', parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <Label>y min</Label>
                        <NumberInput step={0.5} value={area.y_min}
                          onChange={e => updateArea(ai, 'y_min', parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <Label>y max</Label>
                        <NumberInput step={0.5} value={area.y_max}
                          onChange={e => updateArea(ai, 'y_max', parseFloat(e.target.value))} />
                      </div>
                    </div>
                  )}

                  {area.mode === 'path' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-caption">Pfad-Knoten</span>
                        <button onClick={() => addNode(ai)} className="text-caption text-primary flex items-center gap-1">
                          <Plus size={10} /> Punkt
                        </button>
                      </div>
                      <div className="space-y-2">
                        {area.nodes.map((node, ni) => (
                          <div 
                            key={ni} 
                            draggable
                            onDragStart={(e) => onNodeDragStart(e, ai, ni)}
                            onDragOver={(e) => onNodeDragOver(e, ai, ni)}
                            onDragEnd={() => { setDraggedIdx(null); setDragType(null); }}
                            className={`bg-panel/60 rounded-lg p-3 space-y-3 border transition-all ${
                              draggedIdx === ni && dragType === `area-${ai}`
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
                                <NumberInput step={0.5} value={node.x} onChange={e => updateNode(ai, ni, 'x', parseFloat(e.target.value))} />
                                <NumberInput step={0.5} value={node.y} onChange={e => updateNode(ai, ni, 'y', parseFloat(e.target.value))} />
                              </div>
                              <button onClick={() => removeNode(ai, ni)} disabled={area.nodes.length <= 1} className="text-ghost hover:text-red-400 disabled:opacity-20"><Trash2 size={14} /></button>
                            </div>
                            
                            <div className="pl-6 py-2 border-l border-line space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-caption">Verbindung zu P{(ni + 1) % area.nodes.length + 1}</span>
                                <div className="flex gap-1">
                                  {(['line', 'arc', 'bezier'] as const).map(ct => (
                                    <button
                                      key={ct}
                                      onClick={() => updateNode(ai, ni, 'connection', ct)}
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
                                  onChange={v => updateNode(ai, ni, 'bend', v)}
                                />
                              )}

                              {node.connection === 'bezier' && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-metadata">Auswinkel (P{ni + 1})</Label>
                                    <NumberInput step={5} value={node.out_angle} onChange={e => updateNode(ai, ni, 'out_angle', parseFloat(e.target.value))} />
                                  </div>
                                  <div>
                                    <Label className="text-metadata">Einwinkel (P{(ni + 1) % area.nodes.length + 1})</Label>
                                    <NumberInput step={5} value={node.in_angle} onChange={e => updateNode(ai, ni, 'in_angle', parseFloat(e.target.value))} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-line/60">
                  <Slider
                    label={`Brechungsindex n: ${area.refractive_index.toFixed(2)}`}
                    min={1.0} max={3.0} step={0.05}
                    value={area.refractive_index}
                    onChange={v => updateArea(ai, 'refractive_index', v)}
                  />
                </div>

                <div className="pt-2 border-t border-line/60 space-y-3">
                  <span className="text-xs text-ghost block">Darstellung</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Füllfarbe</Label>
                      <Input value={area.fill_color}
                        onChange={e => updateArea(ai, 'fill_color', e.target.value)}
                        placeholder="cyan" />
                    </div>
                    <div>
                      <Label>Fülldeckkraft</Label>
                      <NumberInput step={0.05} min={0} max={1} value={area.fill_opacity}
                        onChange={e => updateArea(ai, 'fill_opacity', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <Label>Beschriftung (LaTeX)</Label>
                    <Input value={area.label}
                      onChange={e => updateArea(ai, 'label', e.target.value)}
                      placeholder="n = 1{,}5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {config.refraction_areas.length === 0 && (
        <p className="text-sm text-ghost text-center py-4">
          Noch keine Medien. Klicke auf „+ Medium".
        </p>
      )}

      {hasRefractionAreas && (
        <div className="pt-2 border-t border-line/60 space-y-4">
          <SecHead>Normalenlinien &amp; Winkel</SecHead>

          <Chk
            checked={config.refraction_annotations.show_normals}
            onChange={v => updateAnnotation('show_normals', v)}
            label="Normalenlinien anzeigen"
          />
          {config.refraction_annotations.show_normals && (
            <div className="pl-4 space-y-3 border-l border-rim">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Farbe</Label>
                  <Input value={config.refraction_annotations.normal_color}
                    onChange={e => updateAnnotation('normal_color', e.target.value)}
                    placeholder="gray" />
                </div>
                <div>
                  <Label>Stil (TikZ)</Label>
                  <Input value={config.refraction_annotations.normal_style}
                    onChange={e => updateAnnotation('normal_style', e.target.value)}
                    placeholder="dashed" />
                </div>
              </div>
              <Slider label={`Strichbreite: ${config.refraction_annotations.normal_line_width} pt`}
                min={0.2} max={3} step={0.1}
                value={config.refraction_annotations.normal_line_width}
                onChange={v => updateAnnotation('normal_line_width', v)} />
              <Slider label={`Länge: ${config.refraction_annotations.normal_length}`}
                min={0.5} max={8} step={0.25}
                value={config.refraction_annotations.normal_length}
                onChange={v => updateAnnotation('normal_length', v)} />
            </div>
          )}

          <Chk
            checked={config.refraction_annotations.show_angle_arcs}
            onChange={v => updateAnnotation('show_angle_arcs', v)}
            label="Einfalls- und Brechungswinkel anzeigen"
          />
          {config.refraction_annotations.show_angle_arcs && (
            <div className="pl-4 space-y-4 border-l border-rim">
              <Chk
                checked={config.refraction_annotations.show_angle_labels}
                onChange={v => updateAnnotation('show_angle_labels', v)}
                label="Beschriftungen anzeigen"
              />

              <div className="space-y-3">
                <span className="text-xs text-ghost">Einfallswinkel</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Farbe</Label>
                    <Input value={config.refraction_annotations.incident_color}
                      onChange={e => updateAnnotation('incident_color', e.target.value)}
                      placeholder="orange" />
                  </div>
                  <div>
                    <Label>Beschriftung (LaTeX)</Label>
                    <Input value={config.refraction_annotations.incident_label}
                      onChange={e => updateAnnotation('incident_label', e.target.value)}
                      placeholder="$\alpha$" />
                  </div>
                </div>
                <Slider label={`Radius: ${config.refraction_annotations.incident_radius}`}
                  min={0.2} max={4} step={0.1}
                  value={config.refraction_annotations.incident_radius}
                  onChange={v => updateAnnotation('incident_radius', v)} />
              </div>

              <div className="space-y-3 pt-2 border-t border-line/60">
                <span className="text-xs text-ghost">Brechungswinkel</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Farbe</Label>
                    <Input value={config.refraction_annotations.refracted_color}
                      onChange={e => updateAnnotation('refracted_color', e.target.value)}
                      placeholder="teal" />
                </div>
                <div>
                  <Label>Beschriftung (LaTeX)</Label>
                  <Input value={config.refraction_annotations.refracted_label}
                    onChange={e => updateAnnotation('refracted_label', e.target.value)}
                    placeholder="$\beta$" />
                </div>
              </div>
              <Slider label={`Radius: ${config.refraction_annotations.refracted_radius}`}
                min={0.2} max={4} step={0.1}
                value={config.refraction_annotations.refracted_radius}
                onChange={v => updateAnnotation('refracted_radius', v)} />
            </div>
          </div>
        )}
      </div>
    )}
    </div>
  )
}
