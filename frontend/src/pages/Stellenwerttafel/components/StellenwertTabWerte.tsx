// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { SecHead, Button, Collapsible, Label, Input, NumberInput, Switch } from '../../../components/ui'
import { Plus, Wand2, GripVertical } from 'lucide-react'
import type { StellenwertConfig, StellenwertColumn } from '../typesStellenwert'

interface StellenwertTabWerteProps {
  config: StellenwertConfig
  updateConfig: (key: keyof StellenwertConfig, value: unknown) => void
}

function decomposeNumber(
  input: string,
  activeCols: StellenwertColumn[],
  decimalSeparatorPos: number | null
): Record<string, number | null> {
  const cleaned = input.trim().replace(',', '.')
  const dotIndex = cleaned.indexOf('.')
  const intRaw = dotIndex >= 0 ? cleaned.slice(0, dotIndex) : cleaned
  const decRaw = dotIndex >= 0 ? cleaned.slice(dotIndex + 1) : ''

  const intDigits = intRaw.replace(/\D/g, '')
  const decDigits = decRaw.replace(/\D/g, '')

  const sepPos = decimalSeparatorPos ?? activeCols.length
  const intCols = activeCols.slice(0, sepPos)
  const decCols = activeCols.slice(sepPos)

  const result: Record<string, number | null> = {}

  // Integer part: right-align digits into intCols
  for (let i = 0; i < intCols.length; i++) {
    const digitIdx = intDigits.length - intCols.length + i
    result[intCols[i].id] = digitIdx >= 0 ? parseInt(intDigits[digitIdx]) : null
  }

  // Decimal part: left-align digits into decCols
  for (let i = 0; i < decCols.length; i++) {
    result[decCols[i].id] = i < decDigits.length ? parseInt(decDigits[i]) : null
  }

  return result
}

export const StellenwertTabWerte = ({ config, updateConfig }: StellenwertTabWerteProps) => {
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>({})
  const [draggedRowIdx, setDraggedRowIdx] = useState<number | null>(null)

  const addRow = () => {
    const id = Math.random().toString(36).substr(2, 9)
    updateConfig('rows', [...config.rows, { id, label: `Zahl ${config.rows.length + 1}`, values: {}, active: true }])
  }

  const removeRow = (idx: number) => {
    updateConfig('rows', config.rows.filter((_, i) => i !== idx))
  }

  const toggleRowActive = (idx: number) => {
    const nextRows = [...config.rows]
    nextRows[idx] = { ...nextRows[idx], active: !(nextRows[idx].active ?? true) }
    updateConfig('rows', nextRows)
  }

  const updateRowValue = (rowIdx: number, colId: string, value: number | null) => {
    const nextRows = [...config.rows]
    nextRows[rowIdx] = {
      ...nextRows[rowIdx],
      values: { ...nextRows[rowIdx].values, [colId]: value }
    }
    updateConfig('rows', nextRows)
  }

  const updateRowLabel = (rowIdx: number, label: string) => {
    const nextRows = [...config.rows]
    nextRows[rowIdx] = { ...nextRows[rowIdx], label }
    updateConfig('rows', nextRows)
  }

  const applyNumber = (rowIdx: number) => {
    const rowId = config.rows[rowIdx].id
    const numStr = numberInputs[rowId] ?? ''
    if (!numStr.trim()) return
    const activeCols = config.columns.filter(c => c.active)
    const decomposed = decomposeNumber(numStr, activeCols, config.decimal_separator_pos)
    const nextRows = [...config.rows]
    nextRows[rowIdx] = { ...nextRows[rowIdx], values: { ...nextRows[rowIdx].values, ...decomposed } }
    updateConfig('rows', nextRows)
  }

  const addPlaceholderRow = () => {
    const id = Math.random().toString(36).substr(2, 9)
    updateConfig('rows', [...config.rows, {
      id,
      label: `Platzhalter ${config.rows.length + 1}`,
      values: {},
      active: true,
      is_placeholder: true,
    }])
  }

  const updateRowPlaceholder = (rowIdx: number, isPlaceholder: boolean) => {
    const nextRows = [...config.rows]
    nextRows[rowIdx] = { ...nextRows[rowIdx], is_placeholder: isPlaceholder }
    updateConfig('rows', nextRows)
  }

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRowIdx(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedRowIdx === null || draggedRowIdx === index) return

    const nextRows = [...config.rows]
    const item = nextRows[draggedRowIdx]
    nextRows.splice(draggedRowIdx, 1)
    nextRows.splice(index, 0, item)
    setDraggedRowIdx(index)
    updateConfig('rows', nextRows)
  }

  const onDragEnd = () => {
    setDraggedRowIdx(null)
  }

  const activeCols = config.columns.filter(c => c.active)

  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex justify-between items-center">
        <SecHead>Zeilen & Werte</SecHead>
        <div className="flex items-center gap-2">
          <Button onClick={addPlaceholderRow} size="sm" variant="secondary" className="h-8 flex items-center gap-1.5">
            <Plus size={15} /> Platzhalter
          </Button>
          <Button onClick={addRow} size="sm" className="h-8 flex items-center gap-1.5">
            <Plus size={15} /> Zeile
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {config.rows.map((row, rIdx) => (
          <div
            key={row.id}
            draggable
            onDragStart={(e) => onDragStart(e, rIdx)}
            onDragOver={(e) => onDragOver(e, rIdx)}
            onDragEnd={onDragEnd}
            className={`flex items-center gap-2 transition-all ${draggedRowIdx === rIdx
              ? 'opacity-40 scale-[0.98]'
              : ''
              }`}
          >
            <div className="cursor-grab active:cursor-grabbing text-ghost hover:text-muted p-1 shrink-0" title="Ziehen zum Sortieren">
              <GripVertical size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <Collapsible
                title={row.label || `Zeile ${rIdx + 1}`}
                enabled={row.active ?? true}
                onToggleEnabled={() => toggleRowActive(rIdx)}
                onRemove={() => removeRow(rIdx)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex-1">
                      <Label>Zeilen-Beschriftung (optional)</Label>
                      <Input
                        value={row.label || ''}
                        onChange={e => updateRowLabel(rIdx, e.target.value)}
                        placeholder="z.B. Ergebnis"
                      />
                    </div>
                    <div className="pt-5">
                      <Switch
                        label="Platzhalter (Leere Zeile)"
                        checked={row.is_placeholder ?? false}
                        onChange={v => updateRowPlaceholder(rIdx, v)}
                      />
                    </div>
                  </div>

                  {!row.is_placeholder && (
                    <>
                      <div>
                        <Label>Zahl eingeben</Label>
                        <div className="flex gap-2">
                          <Input
                            value={numberInputs[row.id] ?? ''}
                            onChange={e => setNumberInputs(prev => ({ ...prev, [row.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') applyNumber(rIdx) }}
                            placeholder="z.B. 435 oder 12,5"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => applyNumber(rIdx)}
                            size="sm"
                            variant="secondary"
                            className="h-9 px-3 flex items-center gap-1.5 shrink-0"
                          >
                            <Wand2 size={15} />
                            Zerlegen
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {activeCols.map(col => (
                          <div key={col.id}>
                            <Label className="text-caption mb-1">{col.label}</Label>
                            <NumberInput
                              value={row.values[col.id] ?? ''}
                              min={0} max={99}
                              onChange={e => {
                                const raw = e.target.value
                                updateRowValue(rIdx, col.id, raw === '' ? null : (isNaN(parseInt(raw)) ? null : parseInt(raw)))
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {row.is_placeholder && (
                    <p className="text-xs text-muted italic bg-raised/40 p-2.5 rounded-lg border border-line">
                      Diese Zeile wird als leere Platzhalterzeile dargestellt (keine Zahlen/Plättchen gerendert).
                    </p>
                  )}
                </div>
              </Collapsible>
            </div>
          </div>
        ))}
      </div>

      {config.rows.length === 0 && (
        <p className="text-center text-ghost py-8 italic text-sm">Füge eine Zeile hinzu, um Werte einzugeben.</p>
      )}
    </div>
  )
}
