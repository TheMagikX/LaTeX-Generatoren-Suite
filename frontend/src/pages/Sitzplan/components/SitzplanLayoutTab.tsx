// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Label, Button, Slider, Field } from '../../../components/ui'
import type { LayoutConfig } from '../typesSitz'

interface SitzplanLayoutTabProps {
  layout: LayoutConfig
  setLayout: (layout: LayoutConfig) => void
}

const SitzplanLayoutTab: React.FC<SitzplanLayoutTabProps> = ({ 
  layout, 
  setLayout 
}) => {
  const toggleSeat = (r: number, c: number) => {
    const newMatrix = [...layout.matrix.map(row => [...row])]
    newMatrix[r][c] = newMatrix[r][c] === 1 ? 0 : 1
    setLayout({ ...layout, matrix: newMatrix })
  }

  const updateDimensions = (rows: number, cols: number) => {
    const newMatrix = Array(rows).fill(0).map((_, r) =>
      Array(cols).fill(0).map((_, c) => {
        if (r < layout.rows && c < layout.cols) return layout.matrix[r][c]
        return c === Math.floor(cols / 2) ? 0 : 1
      })
    )
    setLayout({ ...layout, rows, cols, matrix: newMatrix })
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field label="Reihen">
          <Slider min={1} max={10} value={layout.rows} onChange={v => updateDimensions(v, layout.cols)} label="" />
        </Field>
        <Field label="Spalten">
          <Slider min={1} max={15} value={layout.cols} onChange={v => updateDimensions(layout.rows, v)} label="" />
        </Field>
        <Field label="Vordere Reihen">
          <Slider min={1} max={layout.rows} value={layout.front_rows} onChange={v => setLayout({ ...layout, front_rows: v })} label="" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-caption mr-1">Preset:</span>
        <Button onClick={() => setLayout({
          ...layout,
          rows: 4, cols: 9, front_rows: 1,
          matrix: Array(4).fill(0).map(() => [1, 1, 1, 1, 0, 1, 1, 1, 1])
        })} className="text-caption py-1 px-3 bg-raised hover:bg-overlay">Reihen</Button>
        <Button onClick={() => setLayout({
          ...layout,
          rows: 7, cols: 7, front_rows: 1,
          matrix: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 1, 1],
          ]
        })} className="text-caption py-1 px-3 bg-raised hover:bg-overlay">U-Form</Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Raumplan Editor <span className="text-caption ml-2">(Klicken zum Umschalten)</span></Label>
          <div className="flex gap-2">
            <Button onClick={() => setLayout({ ...layout, matrix: Array(layout.rows).fill(0).map(() => Array(layout.cols).fill(1)) })} className="text-caption py-1 px-3 bg-raised hover:bg-overlay">Alle Plätze</Button>
            <Button onClick={() => setLayout({ ...layout, matrix: Array(layout.rows).fill(0).map(() => Array(layout.cols).fill(0)) })} className="text-caption py-1 px-3 bg-raised hover:bg-overlay">Keine Plätze</Button>
          </div>
        </div>
        <div className="bg-canvas p-8 rounded-2xl border border-line overflow-auto flex justify-center shadow-inner">
          <div className="inline-grid gap-2" style={{
            gridTemplateColumns: `repeat(${layout.cols}, minmax(40px, 1fr))`
          }}>
            {layout.matrix.map((row, r) => (
              row.map((val, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => toggleSeat(r, c)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${val === 1
                      ? r >= layout.rows - layout.front_rows ? 'bg-primary/40 border-primary/60 text-primary shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-raised border-rim text-muted'
                      : 'bg-transparent border-rim border-dashed text-ghost hover:border-slate-500 hover:text-ghost'
                    } border-2`}
                >
                  {val === 1 ? (r >= layout.rows - layout.front_rows ? 'F' : 'S') : '+'}
                </button>
              ))
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-6 text-caption pt-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary/40 border border-primary/60 rounded" /> Vordere Reihen</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-raised border border-rim rounded" /> Normale Sitze</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-panel border border-line border-dashed rounded" /> Kein Tisch / Gang</div>
        </div>
      </div>
    </div>
  )
}

export default SitzplanLayoutTab
