// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2, Layers } from 'lucide-react'
import { Card, Button, Switch, Label, Input, NumberInput, SliderNumberInput } from '../../../../components/ui'
import type { Shape3D, Point3D } from '../../typesKoord3D'
import { SectionExpander } from '../../utilsKoord3D'
import { ColorSelector, LineStyleSelector } from './Koord3DVectorCard'

interface Koord3DShapeCardProps {
  index: number
  shape: Shape3D
  points: Point3D[]
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: <K extends keyof Shape3D>(field: K, value: Shape3D[K]) => void
  onRemove: () => void
  onDuplicate: () => void
  isDesignExpanded: boolean
  onToggleDesignExpand: () => void
}

export const Koord3DShapeCard = ({
  index,
  shape,
  points,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onDuplicate,
  isDesignExpanded,
  onToggleDesignExpand,
}: Koord3DShapeCardProps) => {
  const getPointDisplayName = (pt: Point3D, ptIdx: number) =>
    pt.name || pt.label || `Punkt ${ptIdx + 1}`

  return (
    <Card className="border-line bg-canvas/50 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggleExpand()}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-raised/40 transition-colors cursor-pointer"
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-primary shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-muted shrink-0" />
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-xs"
            style={{ backgroundColor: shape.color?.startsWith('#') ? shape.color : '#1e293b' }}
          />
          <span className="text-sm font-medium text-ink truncate">{shape.name || `Shape ${index + 1}`}</span>
        </div>
        {!isExpanded && (
          <span className="text-metadata truncate max-w-[280px]">
            {shape.point_indices.length} Punkte — Rand: {shape.color}, Füllung: {shape.fill_color}
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={ev => ev.stopPropagation()}>
          <Switch checked={shape.show} onChange={val => onUpdate('show', val)} />
          <Button
            onClick={onDuplicate}
            className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2"
            title="Duplizieren"
          >
            <Copy size={15} />
          </Button>
          <Button
            onClick={onRemove}
            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2"
            title="Löschen"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-line/60 space-y-4 pt-3">
          {/* Name */}
          <div>
            <Label>Name (nur zur Übersicht)</Label>
            <Input
              value={shape.name}
              onChange={val => onUpdate('name', val.target.value)}
              placeholder={`Shape ${index + 1}`}
              className="h-9"
            />
          </div>

          {/* Punkte hinzufügen */}
          <div className="space-y-1">
            <Label>Punkte hinzufügen</Label>
            <select
              className="w-full h-9 px-3 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              onChange={e => {
                const ptIdx = parseInt(e.target.value)
                if (!isNaN(ptIdx)) {
                  onUpdate('point_indices', [...shape.point_indices, ptIdx])
                  e.target.value = ''
                }
              }}
              value=""
            >
              <option value="">Punkt wählen...</option>
              {points.map((pt, ptIdx) => (
                <option key={ptIdx} value={ptIdx}>
                  {getPointDisplayName(pt, ptIdx)} ({pt.x}, {pt.y}, {pt.z})
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Punktliste */}
          {shape.point_indices.length > 0 && (
            <div className="space-y-2">
              <Label>Reihenfolge der Punkte (Drag &amp; Drop)</Label>
              <div className="space-y-1.5">
                {shape.point_indices.map((ptIdx, idx) => {
                  const pt = points[ptIdx]
                  if (!pt) return null
                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('text/plain', idx.toString())}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault()
                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'))
                        const toIdx = idx
                        if (fromIdx === toIdx) return
                        const newIndices = [...shape.point_indices]
                        const [moved] = newIndices.splice(fromIdx, 1)
                        newIndices.splice(toIdx, 0, moved)
                        onUpdate('point_indices', newIndices)
                      }}
                      className="flex items-center gap-2 p-2 bg-raised/50 border border-line rounded-lg group cursor-move hover:bg-overlay/50 transition-colors"
                    >
                      <Layers size={14} className="text-ghost" />
                      <span className="text-xs text-muted w-4">{idx + 1}.</span>
                      <span className="text-sm text-ink flex-1">
                        {getPointDisplayName(pt, ptIdx)} ({pt.x}, {pt.y}, {pt.z})
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            const newIndices = shape.point_indices.filter((_, subIdx) => subIdx !== idx)
                            onUpdate('point_indices', newIndices)
                          }}
                          className="p-1 hover:bg-red-500/10 rounded text-red-500 cursor-pointer"
                          title="Punkt entfernen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Darstellung Section */}
          <SectionExpander
            title="Darstellung"
            expanded={isDesignExpanded}
            onToggle={onToggleDesignExpand}
          >
            <div className="space-y-3 pt-1">
              {/* Linienstil & Rand: Farbe (links), Stil (zentriert), Dicke (rechts) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
                <div className="flex items-center shrink-0">
                  <ColorSelector
                    color={shape.color}
                    onChange={val => onUpdate('color', val)}
                    label="Linienfarbe"
                    fallbackColor="#1e293b"
                  />
                </div>

                <div className="flex items-center justify-center flex-1 min-w-fit">
                  <LineStyleSelector
                    style={shape.style}
                    onChange={val => onUpdate('style', val)}
                    label="Stil"
                  />
                </div>

                <div className="flex items-center justify-end gap-1.5 shrink-0" title="Linienstärke (pt)">
                  <span className="text-caption text-muted whitespace-nowrap">Dicke:</span>
                  <NumberInput
                    step="0.2"
                    min="0.2"
                    value={shape.width}
                    onChange={val => onUpdate('width', parseFloat(val.target.value))}
                    className="h-7 w-22 text-xs text-center shrink-0"
                  />
                  <span className="text-caption text-ghost">pt</span>
                </div>
              </div>

              {/* Füllung: Füllfarbe (links) & Füll-Alpha Slider (rechts) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
                <div className="flex items-center shrink-0">
                  <ColorSelector
                    color={shape.fill_color}
                    onChange={val => onUpdate('fill_color', val)}
                    label="Füllfarbe"
                    fallbackColor="#2563eb"
                  />
                </div>

                <div className="flex items-center justify-end flex-1 min-w-[180px] max-w-[280px]">
                  <SliderNumberInput
                    value={shape.fill_alpha}
                    onChange={val => onUpdate('fill_alpha', val)}
                    min={0}
                    max={100}
                    step={5}
                    unit="%"
                    label="Füll-Alpha"
                  />
                </div>
              </div>
            </div>
          </SectionExpander>
        </div>
      )}
    </Card>
  )
}

