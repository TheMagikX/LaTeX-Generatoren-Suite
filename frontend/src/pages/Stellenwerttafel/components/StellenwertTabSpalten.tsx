// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState } from 'react'
import { SecHead, Button, Switch, Input, Collapsible, Label } from '../../../components/ui'
import { Plus, GripVertical, Trash2, Paintbrush, X, Check } from 'lucide-react'
import type { StellenwertColumnUpdater, StellenwertConfig, StellenwertGroupUpdater } from '../typesStellenwert'

const COLOR_PRESETS = [
  '#f69a98',
  '#c6cee4',
  '#fde0c7',
  '#c6e8f9',
  '#dbead1',
]

interface StellenwertTabSpaltenProps {
  config: StellenwertConfig
  updateConfig: (key: keyof StellenwertConfig, value: unknown) => void
  draggedIdx: number | null
  setDraggedIdx: (idx: number | null) => void
}

export const StellenwertTabSpalten = ({ config, updateConfig, draggedIdx, setDraggedIdx }: StellenwertTabSpaltenProps) => {

  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const addColumn = () => {
    const id = Math.random().toString(36).substr(2, 9)
    updateConfig('columns', [...config.columns, { id, label: '?', color: '#000000', active: true }])
  }

  const removeColumn = (idx: number) => {
    const colId = config.columns[idx].id
    const nextGroups = config.groups.filter(g => g.start_col_id !== colId && g.end_col_id !== colId)
    updateConfig('groups', nextGroups)
    updateConfig('columns', config.columns.filter((_, i) => i !== idx))
  }

  const updateColumn: StellenwertColumnUpdater = (idx, field, value) => {
    const next = [...config.columns]
    next[idx] = { ...next[idx], [field]: value }
    updateConfig('columns', next)
  }

  const addGroup = () => {
    if (config.columns.length === 0) return
    const id = Math.random().toString(36).substr(2, 9)
    const firstCol = config.columns[0].id
    updateConfig('groups', [...config.groups, { id, label: 'Gruppe', start_col_id: firstCol, end_col_id: firstCol, color: '#f1f5f9' }])
  }

  const removeGroup = (idx: number) => {
    updateConfig('groups', config.groups.filter((_, i) => i !== idx))
  }

  const updateGroup: StellenwertGroupUpdater = (idx, field, value) => {
    const next = [...config.groups]
    next[idx] = { ...next[idx], [field]: value }
    updateConfig('groups', next)
  }

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === index) return

    const next = [...config.columns]
    const item = next[draggedIdx]
    next.splice(draggedIdx, 1)
    next.splice(index, 0, item)
    setDraggedIdx(index)
    updateConfig('columns', next)
  }

  const onDragEnd = () => {
    setDraggedIdx(null)
  }

  const applyColorToAllColumns = () => {
    if (!copiedColor) return
    const next = config.columns.map(c => ({ ...c, color: copiedColor }))
    updateConfig('columns', next)
  }

  const applyPaletteSequentially = () => {
    const next = config.columns.map((c, i) => ({
      ...c,
      color: COLOR_PRESETS[i % COLOR_PRESETS.length],
    }))
    updateConfig('columns', next)
  }

  return (
    <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {/* Spalten */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SecHead>Spalten verwalten</SecHead>
          <Button onClick={addColumn} size="sm" className="h-8 flex items-center gap-2">
            <Plus size={16} /> Spalte
          </Button>
        </div>

        {/* Farb-Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3 rounded-xl bg-raised/60 border border-line">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">Farb-Presets:</span>
            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.map(hex => {
                const isActive = copiedColor === hex
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setCopiedColor(isActive ? null : hex)}
                    title={`Farbe ${hex} als Kopierformat auswählen`}
                    className={`w-6 h-6 rounded-full border transition-all cursor-pointer hover:scale-110 flex items-center justify-center ${isActive
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-panel border-primary scale-110 shadow-sm'
                      : 'border-line hover:border-rim shadow-xs'
                      }`}
                    style={{ backgroundColor: hex }}
                  >
                    {isActive && <Check size={12} className="text-gray-800 drop-shadow-xs" />}
                  </button>
                )
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={applyPaletteSequentially}
            className="text-xs font-medium text-primary hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            title="Weist die 5 Farben nacheinander den Spalten zu"
          >
            Palette reihum zuweisen
          </button>
        </div>

        {copiedColor && (
          <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-primary/10 border border-primary/30 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted">Format kopiert:</span>
              <div className="w-4 h-4 rounded border border-line shadow-xs shrink-0" style={{ backgroundColor: copiedColor }} />
              <code className="font-mono text-ink font-semibold">{copiedColor}</code>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={applyColorToAllColumns}
                className="px-2.5 py-1 rounded-lg bg-primary text-canvas font-semibold hover:bg-amber-400 transition-colors shadow-xs"
              >
                Auf alle Spalten anwenden
              </button>
              <button
                onClick={() => setCopiedColor(null)}
                className="p-1 text-ghost hover:text-ink transition-colors"
                title="Formatübertragung beenden"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {config.columns.map((col, idx) => {
            const isCopySource = copiedColor === col.color
            return (
              <div
                key={col.id}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${draggedIdx === idx
                  ? 'bg-primary/20 border-primary border-dashed opacity-50 scale-95'
                  : 'bg-raised/50 border-rim/50 hover:border-rim'
                  }`}
              >
                <div className="cursor-grab active:cursor-grabbing text-ghost hover:text-muted p-1">
                  <GripVertical size={20} />
                </div>

                <Switch
                  checked={col.active}
                  onChange={(v) => updateColumn(idx, 'active', v)}
                />

                <div className="flex-1 min-w-0">
                  <Input
                    value={col.label}
                    onChange={e => updateColumn(idx, 'label', e.target.value)}
                    className="h-9 font-bold text-center"
                    placeholder="Label"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="color"
                    value={col.color}
                    onChange={e => updateColumn(idx, 'color', e.target.value)}
                    className="w-10 h-9 rounded border-none cursor-pointer bg-transparent"
                    title="Farbe wählen"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (copiedColor && copiedColor !== col.color) {
                        updateColumn(idx, 'color', copiedColor)
                      } else if (isCopySource) {
                        setCopiedColor(null)
                      } else {
                        setCopiedColor(col.color)
                      }
                    }}
                    title={
                      isCopySource
                        ? 'Kopierte Quellfarbe (klicken zum Aufheben)'
                        : copiedColor
                          ? `Kopierte Farbe (${copiedColor}) auf diese Spalte anwenden`
                          : 'Farbe kopieren (Formatüberträgersymbol)'
                    }
                    className={`p-2 rounded-lg border transition-all ${isCopySource
                      ? 'bg-primary/20 border-primary text-primary shadow-xs'
                      : copiedColor
                        ? 'bg-raised hover:bg-primary/20 border-primary/40 text-primary hover:border-primary'
                        : 'bg-raised/80 hover:bg-raised border-line text-ghost hover:text-ink'
                      }`}
                  >
                    {isCopySource ? <Check size={16} /> : <Paintbrush size={16} />}
                  </button>
                </div>

                <button
                  onClick={() => removeColumn(idx)}
                  className="p-2 text-ghost hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )
          })}
        </div>
        {config.columns.length === 0 && (
          <p className="text-center text-ghost py-8 italic text-sm">Keine Spalten vorhanden.</p>
        )}
      </div>

      {/* Gruppen */}
      <div className="space-y-4 pt-6 border-t border-line">
        <div className="flex justify-between items-center">
          <SecHead>Gruppierung (Ober-Header)</SecHead>
          <Button onClick={addGroup} size="sm" variant="secondary" className="h-8 flex items-center gap-2">
            <Plus size={16} /> Gruppe
          </Button>
        </div>

        <div className="space-y-3">
          {config.groups.map((group, idx) => (
            <Collapsible key={group.id} title={group.label} onRemove={() => removeGroup(idx)}>
              <div className="space-y-4 p-1">
                <div>
                  <Label>Beschriftung</Label>
                  <Input value={group.label} onChange={e => updateGroup(idx, 'label', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Von Spalte</Label>
                    <select
                      value={group.start_col_id}
                      onChange={e => updateGroup(idx, 'start_col_id', e.target.value)}
                      className="w-full rounded-md border border-rim bg-panel px-2 py-1.5 text-sm text-ink"
                    >
                      {config.columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Bis Spalte</Label>
                    <select
                      value={group.end_col_id}
                      onChange={e => updateGroup(idx, 'end_col_id', e.target.value)}
                      className="w-full rounded-md border border-rim bg-panel px-2 py-1.5 text-sm text-ink"
                    >
                      {config.columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Hintergrundfarbe</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={group.color}
                      onChange={e => updateGroup(idx, 'color', e.target.value)}
                      className="flex-1 h-8 rounded border-none cursor-pointer bg-raised"
                    />
                    {copiedColor && group.color !== copiedColor && (
                      <button
                        type="button"
                        onClick={() => updateGroup(idx, 'color', copiedColor)}
                        title={`Kopierte Farbe (${copiedColor}) auf diese Gruppe anwenden`}
                        className="px-2.5 py-1.5 rounded-md bg-primary/10 border border-primary/40 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Paintbrush size={13} /> Farbe einfügen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  )
}
