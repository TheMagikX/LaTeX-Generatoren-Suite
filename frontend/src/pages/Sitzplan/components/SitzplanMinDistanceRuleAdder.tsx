// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { Student, HardRules } from '../typesSitz'

interface MinDistanceRuleAdderProps {
  students: Student[]
  hardRules: HardRules
  setHardRules: (r: HardRules) => void
}

export const MinDistanceRuleAdder: React.FC<MinDistanceRuleAdderProps> = ({ students, hardRules, setHardRules }) => {
  const [selA, setSelA] = useState('')
  const [selB, setSelB] = useState('')
  const [k, setK] = useState(2)

  const nameA = selA || students[0]?.name || ''
  const nameB = selB || students[0]?.name || ''

  const add = () => {
    if (nameA && nameB && nameA !== nameB) {
      setHardRules({ ...hardRules, min_distance: [...hardRules.min_distance, { names: [nameA, nameB], k }] })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <select
          value={selA} onChange={e => setSelA(e.target.value)}
          className="flex-1 min-w-[100px] bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:outline-none"
        >
          {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        <select
          value={selB} onChange={e => setSelB(e.target.value)}
          className="flex-1 min-w-[100px] bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:outline-none"
        >
          {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        <div className="flex items-center gap-2 bg-canvas border border-line rounded-lg px-3">
          <span className="text-xs text-ghost whitespace-nowrap">k ≥</span>
          <input
            type="number" min={1} max={10} value={k}
            onChange={e => setK(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 bg-transparent text-sm text-ink focus:outline-none text-center"
          />
        </div>
        <Button onClick={add} className="p-2"><Plus size={18} /></Button>
      </div>
      <p className="text-metadata">k = Manhattan-Abstand (1 = nicht nebeneinander, 2 = mind. 1 freier Platz dazwischen)</p>
      <div className="space-y-2">
        {hardRules.min_distance.map((rule, i) => (
          <div key={i} className="flex items-center gap-2 bg-canvas px-2 py-1.5 rounded-lg border border-line">
            <select 
              value={rule.names[0]} 
              onChange={e => { 
                const r = hardRules.min_distance.map((d, idx) => idx === i ? { ...d, names: [e.target.value, d.names[1]] as [string, string] } : d); 
                setHardRules({ ...hardRules, min_distance: r }) 
              }} 
              className="flex-1 bg-transparent text-xs text-ink focus:outline-none cursor-pointer"
            >
              {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <span className="text-ghost shrink-0">↔</span>
            <select 
              value={rule.names[1]} 
              onChange={e => { 
                const r = hardRules.min_distance.map((d, idx) => idx === i ? { ...d, names: [d.names[0], e.target.value] as [string, string] } : d); 
                setHardRules({ ...hardRules, min_distance: r }) 
              }} 
              className="flex-1 bg-transparent text-xs text-ink focus:outline-none cursor-pointer"
            >
              {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-metadata">k≥</span>
              <input 
                type="number" min={1} max={10} value={rule.k} 
                onChange={e => { 
                  const r = hardRules.min_distance.map((d, idx) => idx === i ? { ...d, k: Math.max(1, parseInt(e.target.value) || 1) } : d); 
                  setHardRules({ ...hardRules, min_distance: r }) 
                }} 
                className="w-10 bg-transparent text-xs text-ink focus:outline-none text-center border-none" 
              />
            </div>
            <button 
              onClick={() => setHardRules({ ...hardRules, min_distance: hardRules.min_distance.filter((_, idx) => i !== idx) })} 
              className="text-ghost hover:text-red-400 shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

