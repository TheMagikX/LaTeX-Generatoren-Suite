// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState } from 'react'
import { Play, Download, Users } from 'lucide-react'
import Papa from 'papaparse'
import { Label, Button, SecHead } from '../../../components/ui'
import type { LayoutConfig, SitzplanResponse } from '../typesSitz'

interface SitzplanResultTabProps {
  result: SitzplanResponse | null
  isLoading: boolean
  handleCalculate: () => void
  onSwapAssignment: (newAssignment: Record<string, number>) => void
  layout: LayoutConfig
  studentsCount: number
}

const SitzplanResultTab: React.FC<SitzplanResultTabProps> = ({
  result,
  isLoading,
  handleCalculate,
  onSwapAssignment,
  layout,
  studentsCount
}) => {
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null)

  const executeSwap = (sourceSid: number, targetSid: number) => {
    if (!result) return
    if (sourceSid === targetSid) {
      setSelectedSeatId(null)
      return
    }
    const sourceName = Object.keys(result.assignment).find(k => result.assignment[k] === sourceSid)
    if (!sourceName) return
    const targetName = Object.keys(result.assignment).find(k => result.assignment[k] === targetSid)

    const nextAssignment = { ...result.assignment }
    nextAssignment[sourceName] = targetSid
    if (targetName) {
      nextAssignment[targetName] = sourceSid
    }
    setSelectedSeatId(null)
    onSwapAssignment(nextAssignment)
  }

  const handleSeatClick = (sid: number, isAllowed: boolean, occupantName?: string) => {
    if (!isAllowed || isLoading) return
    if (selectedSeatId === null) {
      if (!occupantName) return
      setSelectedSeatId(sid)
    } else if (selectedSeatId === sid) {
      setSelectedSeatId(null)
    } else {
      executeSwap(selectedSeatId, sid)
    }
  }
  const downloadCsv = () => {
    if (!result) return
    const rows = []
    const seatToName: Record<number, string> = {}
    Object.entries(result.assignment).forEach(([name, id]) => {
      seatToName[id] = name
    })

    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        const id = r * layout.cols + c
        if (seatToName[id]) {
          const name = seatToName[id]
          const repRow = result.report.find(item => item.Schüler === name)
          rows.push({
            Name: name,
            Reihe: r,
            Spalte: c,
            Partner: repRow?.Partner || ''
          })
        }
      }
    }

    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'sitzplan.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-ghost gap-4">
        <Play size={48} className="opacity-20" />
        <p className="font-medium">Berechnung noch nicht gestartet</p>
        <Button onClick={handleCalculate} disabled={isLoading || studentsCount === 0} className="flex items-center gap-2 px-8 py-3">
          {isLoading ? 'Berechne...' : '🚀 Sitzplan erstellen'}
        </Button>
      </div>
    )
  }

  const selectedStudentName =
    selectedSeatId !== null
      ? Object.keys(result.assignment).find(k => result.assignment[k] === selectedSeatId)
      : undefined

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-3">
            <Label className="mb-0 text-caption">Raumplan</Label>
            {result.solver_used === 'ortools' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                OR-Tools (Optimal)
              </span>
            ) : result.solver_used === 'manual' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption bg-sky-500/15 border border-sky-500/30 text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                Manuell angepasst
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Greedy (Heuristik)
              </span>
            )}
          </div>
          <Button
            onClick={() => {
              setSelectedSeatId(null)
              handleCalculate()
            }}
            disabled={isLoading}
            className="text-caption py-1 bg-raised hover:bg-overlay"
          >
            Neu berechnen
          </Button>
        </div>

        {selectedSeatId !== null && selectedStudentName ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300">
            <span>
              🔄 Tauschmodus: Wähle einen Zielplatz für „{selectedStudentName}“ (oder klicke denselben Platz zum Abbrechen).
            </span>
            <button
              type="button"
              onClick={() => setSelectedSeatId(null)}
              className="ml-3 shrink-0 px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 font-medium transition-colors"
            >
              Auswahl aufheben
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-raised/50 border border-line text-xs text-muted">
            <span>
              💡 Tipp: Klicke einen besetzten Platz an (oder ziehe ihn per Drag &amp; Drop), um Plätze manuell zu tauschen.
            </span>
          </div>
        )}

        <div className="bg-canvas p-8 rounded-2xl border border-line overflow-auto flex justify-center shadow-inner">
          <div className="inline-grid gap-3" style={{
            gridTemplateColumns: `repeat(${layout.cols}, minmax(60px, 1fr))`
          }}>
            {layout.matrix.map((row, r) => (
              row.map((val, c) => {
                const sid = r * layout.cols + c
                const name = Object.keys(result.assignment).find(k => result.assignment[k] === sid)
                const rep = name ? result.per_student_report[name] : null

                let color = 'bg-panel/20 border-slate-900 border-dashed opacity-30 text-slate-800'
                if (val === 1) {
                  color = 'bg-raised border-rim text-muted'
                  if (rep) {
                    if (rep.violates_dislike || rep.violates_no_alone || rep.violates_hard_rule) color = 'bg-red-500/20 border-red-500/50 text-red-400'
                    else if (rep.front_wish && rep.front_ok) color = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    else if (rep.neighbors_ok.length > 0) color = 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  }
                }

                const interactionClasses = val === 1
                  ? 'cursor-pointer hover:brightness-110 select-none'
                  : 'cursor-not-allowed select-none'
                const selectedClasses = selectedSeatId === sid ? 'ring-2 ring-sky-400 scale-105 shadow-md' : ''

                let seatTitle: string | undefined = name
                if (name && rep) {
                  const reasons: string[] = []
                  if (rep.violates_dislike) reasons.push('Abneigung verletzt')
                  if (rep.violates_no_alone) reasons.push('Sitzt alleine')
                  if (rep.hard_rule_violations && rep.hard_rule_violations.length > 0) {
                    reasons.push(...rep.hard_rule_violations)
                  }
                  if (reasons.length > 0) {
                    seatTitle = `${name}: ${reasons.join(', ')}`
                  }
                }

                return (
                  <div
                    key={sid}
                    title={seatTitle}
                    onClick={() => handleSeatClick(sid, val === 1, name)}
                    draggable={val === 1 && Boolean(name) && !isLoading}
                    onDragStart={(e) => {
                      if (val !== 1 || !name || isLoading) return
                      e.dataTransfer.setData('text/plain', String(sid))
                      e.dataTransfer.effectAllowed = 'move'
                      setSelectedSeatId(sid)
                    }}
                    onDragOver={(e) => {
                      if (val === 1 && !isLoading) {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (val !== 1 || isLoading) return
                      const raw = e.dataTransfer.getData('text/plain')
                      const sourceSid = raw !== '' ? Number(raw) : selectedSeatId
                      if (sourceSid !== null && !Number.isNaN(sourceSid)) {
                        executeSwap(sourceSid, sid)
                      }
                    }}
                    className={`w-16 h-12 rounded-xl flex flex-col items-center justify-center transition-all border-2 text-[9px] font-bold ${color} ${interactionClasses} ${selectedClasses}`}
                  >
                    {name ? (
                      <>
                        <span className="truncate w-full text-center px-1 uppercase tracking-tighter">{name}</span>
                        {rep && (
                          <span className="opacity-70 text-[8px]">
                            {rep.is_alone ? '❌ Allein' : `👥 ${rep.partners?.length || 0}`}
                          </span>
                        )}
                      </>
                    ) : (val === 1 ? 'LEER' : '⛔')}
                  </div>
                )
              })
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <SecHead icon={<Users size={14} />}>Detaillierter Report</SecHead>
          <Button onClick={downloadCsv} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-1.5 px-4 text-xs">
            <Download size={14} /> CSV Export
          </Button>
        </div>
        <div className="overflow-x-auto border border-line rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-line">
              <tr>
                <th className="py-3 px-4 text-caption">Schüler</th>
                <th className="py-3 px-4 text-caption">Platz</th>
                <th className="py-3 px-4 text-caption">Partner (Nicht allein)</th>
                <th className="py-3 px-4 text-caption">Front</th>
                <th className="py-3 px-4 text-caption">Wünsche</th>
                <th className="py-3 px-4 text-caption">Abneigungen &amp; Regeln</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {result.report.map((r, i) => (
                <tr key={i} className="hover:bg-raised/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-ink">{r.Schüler}</td>
                  <td className="py-3 px-4 text-muted">R:{r.Reihe} / S:{r.Spalte}</td>
                  <td className="py-3 px-4">
                    <span className={r.Partner?.startsWith('❌') ? 'text-red-400 font-semibold' : 'text-emerald-400 font-medium'}>
                      {r.Partner || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{r["Front erfüllt"]}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-ink">{r["Neben erfüllt"]}</span>
                      {r["Nicht erfüllte Wünsche"] !== '—' && (
                        <span className="text-metadata opacity-80">Fehlt: {r["Nicht erfüllte Wünsche"]}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span>{r["Abneigungen eingehalten"]}</span>
                      {r["Regelverstöße"] && r["Regelverstöße"] !== '✅' && (
                        <span className="text-metadata text-red-400 font-medium">{r["Regelverstöße"]}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SitzplanResultTab
