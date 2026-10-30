// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Scale, Layout, Target, Check } from 'lucide-react'
import { SecHead, Slider, Switch } from '../../../components/ui'
import type { Student } from '../typesSitz'

interface SitzplanPrefsTabProps {
  students: Student[]
  setStudents: (students: Student[]) => void
  wFront: number
  setWFront: (v: number) => void
  wNeighbor: number
  setWNeighbor: (v: number) => void
  includeVertical: boolean
  setIncludeVertical: (v: boolean) => void
  includeDiagonal: boolean
  setIncludeDiagonal: (v: boolean) => void
  mutualFactor: number
  setMutualFactor: (v: number) => void
  dislikeDistance: number
  setDislikeDistance: (v: number) => void
}

const SitzplanPrefsTab: React.FC<SitzplanPrefsTabProps> = ({
  students,
  setStudents,
  wFront,
  setWFront,
  wNeighbor,
  setWNeighbor,
  includeVertical,
  setIncludeVertical,
  includeDiagonal,
  setIncludeDiagonal,
  mutualFactor,
  setMutualFactor,
  dislikeDistance,
  setDislikeDistance,
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <SecHead icon={<Scale size={14} />}>Gewichtung</SecHead>
          <div className="space-y-6">
            <Slider label="Gewichtung 'vorn'" min={1} max={10} value={wFront} onChange={setWFront} />
            <Slider label="Gewichtung 'Nachbarn'" min={1} max={10} value={wNeighbor} onChange={setWNeighbor} />
            <Slider label="Gegenseitigkeits-Bonus" min={1} max={5} value={mutualFactor} onChange={setMutualFactor} />
            <Slider label="Mindestabstand bei Abneigungen" min={1} max={5} value={dislikeDistance} onChange={setDislikeDistance} />
          </div>
        </div>

        <div>
          <SecHead icon={<Layout size={14} />}>Nachbarschaftstyp</SecHead>
          <div className="space-y-4">
            <Switch label="Vertikale Nachbarschaft" description="Oben/Unten zählt als neben" checked={includeVertical} onChange={setIncludeVertical} />
            <Switch label="Diagonale Nachbarschaft" description="Schräg gegenüber zählt als neben" checked={includeDiagonal} onChange={setIncludeDiagonal} />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-line">
        <SecHead icon={<Target size={14} />}>Front-Wünsche pro Schüler</SecHead>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {students.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                const newStudents = [...students]
                newStudents[idx].wants_front = !newStudents[idx].wants_front
                setStudents(newStudents)
              }}
              className={`px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between border ${s.wants_front
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-raised/40 border-line text-muted hover:border-rim'
                }`}
            >
              <span className="truncate mr-2">{s.name}</span>
              {s.wants_front && <Check size={12} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SitzplanPrefsTab
