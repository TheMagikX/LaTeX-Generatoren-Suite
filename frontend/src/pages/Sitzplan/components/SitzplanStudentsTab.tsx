// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Plus, Trash2, X, RotateCcw } from 'lucide-react'
import Papa from 'papaparse'
import { Label, Input, Button } from '../../../components/ui'
import type { Student } from '../typesSitz'
import { parseStudentCSV } from '../utilsSitz'

interface SitzplanStudentsTabProps {
  students: Student[]
  setStudents: (students: Student[]) => void
  availableSeatsCount: number
}

const SitzplanStudentsTab: React.FC<SitzplanStudentsTabProps> = ({ 
  students, 
  setStudents, 
  availableSeatsCount 
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newStudents = parseStudentCSV(results.data as Array<Record<string, unknown>>)
        setStudents(newStudents)
      }
    })
  }

  const loadExampleData = () => {
    setStudents([
      { name: "Felix", wants_neighbors: ["Timo", "Ben"], dislikes_neighbors: [], wants_front: false },
      { name: "Timo", wants_neighbors: ["Felix", "Noah"], dislikes_neighbors: [], wants_front: false },
      { name: "Ben", wants_neighbors: ["Felix"], dislikes_neighbors: [], wants_front: false },
      { name: "Noah", wants_neighbors: ["Timo"], dislikes_neighbors: [], wants_front: false },
      { name: "Mia", wants_neighbors: [], dislikes_neighbors: [], wants_front: false },
      { name: "Luca", wants_neighbors: [], dislikes_neighbors: [], wants_front: false },
      { name: "Max", wants_neighbors: [], dislikes_neighbors: [], wants_front: false },
      { name: "Lena", wants_neighbors: [], dislikes_neighbors: [], wants_front: false },
    ])
  }

  const handleRename = (idx: number, newName: string) => {
    const oldName = students[idx].name
    const updated = students.map((st, i) => {
      if (i === idx) {
        return { ...st, name: newName }
      }
      if (!oldName) return st
      return {
        ...st,
        wants_neighbors: st.wants_neighbors.map(n => n === oldName ? newName : n),
        dislikes_neighbors: st.dislikes_neighbors.map(n => n === oldName ? newName : n),
      }
    })
    setStudents(updated)
  }

  const handleDelete = (idx: number) => {
    const removedName = students[idx].name
    const updated = students
      .filter((_, i) => i !== idx)
      .map(st => ({
        ...st,
        wants_neighbors: st.wants_neighbors.filter(n => n !== removedName),
        dislikes_neighbors: st.dislikes_neighbors.filter(n => n !== removedName),
      }))
    setStudents(updated)
  }

  const addWish = (idx: number, targetName: string) => {
    if (!targetName) return
    const updated = [...students]
    const currentWants = updated[idx].wants_neighbors || []
    if (!currentWants.includes(targetName)) {
      updated[idx] = {
        ...updated[idx],
        wants_neighbors: [...currentWants, targetName]
      }
      setStudents(updated)
    }
  }

  const removeWish = (idx: number, targetName: string) => {
    const updated = [...students]
    updated[idx] = {
      ...updated[idx],
      wants_neighbors: (updated[idx].wants_neighbors || []).filter(n => n !== targetName)
    }
    setStudents(updated)
  }

  const addDislike = (idx: number, targetName: string) => {
    if (!targetName) return
    const updated = [...students]
    const currentDislikes = updated[idx].dislikes_neighbors || []
    if (!currentDislikes.includes(targetName)) {
      updated[idx] = {
        ...updated[idx],
        dislikes_neighbors: [...currentDislikes, targetName]
      }
      setStudents(updated)
    }
  }

  const removeDislike = (idx: number, targetName: string) => {
    const updated = [...students]
    updated[idx] = {
      ...updated[idx],
      dislikes_neighbors: (updated[idx].dislikes_neighbors || []).filter(n => n !== targetName)
    }
    setStudents(updated)
  }

  const availableWishCandidates = (student: Student) => {
    return students.filter(
      other => other.name && other.name !== student.name && !student.wants_neighbors?.includes(other.name)
    )
  }

  const availableDislikeCandidates = (student: Student) => {
    return students.filter(
      other => other.name && other.name !== student.name && !student.dislikes_neighbors?.includes(other.name)
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label>CSV Import</Label>
          <div className="flex gap-2">
            <Input type="file" accept=".csv" onChange={handleFileUpload} className="text-xs" />
            <Button onClick={loadExampleData} className="whitespace-nowrap bg-raised hover:bg-overlay">Beispiel</Button>
            {students.length > 0 && (
              <Button onClick={() => setStudents([])} className="whitespace-nowrap bg-raised hover:bg-overlay text-ghost hover:text-red-400" title="Liste leeren">
                <RotateCcw size={14} />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 bg-canvas px-4 py-2 rounded-lg border border-line">
          <div className="text-center">
            <div className="text-xs text-ghost uppercase font-bold tracking-wider">Schüler</div>
            <div className="text-xl font-bold text-primary">{students.length}</div>
          </div>
          <div className="w-px h-8 bg-raised" />
          <div className="text-center">
            <div className="text-xs text-ghost uppercase font-bold tracking-wider">Plätze</div>
            <div className={`text-xl font-bold ${availableSeatsCount < students.length ? 'text-red-500' : 'text-emerald-500'}`}>
              {availableSeatsCount}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-line rounded-xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-canvas border-b border-line">
              <th className="py-2.5 px-3 text-caption w-[25%] min-w-[160px]">Name</th>
              <th className="py-2.5 px-3 text-caption w-[35%] min-w-[200px]">Wünsche (Klick = Entfernen)</th>
              <th className="py-2.5 px-3 text-caption w-[35%] min-w-[200px]">Abneigungen (Klick = Entfernen)</th>
              <th className="py-2.5 px-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {students.map((s, idx) => {
              const wishCandidates = availableWishCandidates(s)
              const dislikeCandidates = availableDislikeCandidates(s)

              return (
                <tr key={idx} className="hover:bg-raised/20 transition-colors">
                  <td className="py-2 px-3 align-middle">
                    <input
                      value={s.name}
                      onChange={e => handleRename(idx, e.target.value)}
                      placeholder="Name des Schülers"
                      className="bg-transparent border-none focus:ring-1 focus:ring-primary/50 rounded px-1.5 py-0.5 w-full text-ink font-medium text-sm"
                    />
                  </td>
                  
                  {/* Wünsche */}
                  <td className="py-2 px-3 align-middle">
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                      {s.wants_neighbors.map((targetName) => (
                        <button
                          key={targetName}
                          type="button"
                          onClick={() => removeWish(idx, targetName)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 transition-colors group cursor-pointer"
                          title={`Wunsch '${targetName}' entfernen`}
                        >
                          <span>{targetName}</span>
                          <X size={12} className="opacity-60 group-hover:opacity-100" />
                        </button>
                      ))}

                      {wishCandidates.length > 0 && (
                        <div className="relative inline-flex items-center">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                addWish(idx, e.target.value)
                              }
                            }}
                            className="bg-raised/70 hover:bg-overlay border border-line text-ghost hover:text-ink text-xs rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                            title="Wunsch hinzufügen"
                          >
                            <option value="" disabled>+ Wunsch</option>
                            {wishCandidates.map(opt => (
                              <option key={opt.name} value={opt.name} className="bg-canvas text-ink">
                                {opt.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Abneigungen */}
                  <td className="py-2 px-3 align-middle">
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                      {s.dislikes_neighbors.map((targetName) => (
                        <button
                          key={targetName}
                          type="button"
                          onClick={() => removeDislike(idx, targetName)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 hover:border-red-500/50 hover:text-red-200 transition-colors group cursor-pointer"
                          title={`Abneigung '${targetName}' entfernen`}
                        >
                          <span>{targetName}</span>
                          <X size={12} className="opacity-60 group-hover:opacity-100" />
                        </button>
                      ))}

                      {dislikeCandidates.length > 0 && (
                        <div className="relative inline-flex items-center">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                addDislike(idx, e.target.value)
                              }
                            }}
                            className="bg-raised/70 hover:bg-overlay border border-line text-ghost hover:text-ink text-xs rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                            title="Abneigung hinzufügen"
                          >
                            <option value="" disabled>+ Abneigung</option>
                            {dislikeCandidates.map(opt => (
                              <option key={opt.name} value={opt.name} className="bg-canvas text-ink">
                                {opt.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-3 align-middle text-right">
                    <button onClick={() => handleDelete(idx)} className="text-ghost hover:text-red-400 p-1 rounded hover:bg-raised" title="Schüler löschen">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
            <tr>
              <td colSpan={4} className="p-2">
                <Button
                  onClick={() => setStudents([...students, { name: 'Neuer Schüler', wants_neighbors: [], dislikes_neighbors: [], wants_front: false }])}
                  className="w-full bg-raised hover:bg-overlay py-1.5 flex items-center justify-center gap-2 text-xs"
                >
                  <Plus size={14} /> Schüler hinzufügen
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SitzplanStudentsTab
