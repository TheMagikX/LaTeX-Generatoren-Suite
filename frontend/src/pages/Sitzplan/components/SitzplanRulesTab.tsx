// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Users, Plus, Trash2, Scale, UserX } from 'lucide-react'
import { SecHead, Button, Switch } from '../../../components/ui'
import type { Student, HardRules } from '../typesSitz'
import { MinDistanceRuleAdder } from './SitzplanMinDistanceRuleAdder'

interface SitzplanRulesTabProps {
  students: Student[]
  hardRules: HardRules
  setHardRules: (rules: HardRules) => void
}

const SitzplanRulesTab: React.FC<SitzplanRulesTabProps> = ({
  students,
  hardRules,
  setHardRules
}) => {
  const addNotSameRow = () => {
    const a = (document.getElementById('row_a') as HTMLSelectElement).value
    const b = (document.getElementById('row_b') as HTMLSelectElement).value
    if (a && b && a !== b) setHardRules({ ...hardRules, not_same_row: [...hardRules.not_same_row, [a, b]] })
  }

  const addNotSameCol = () => {
    const a = (document.getElementById('col_a') as HTMLSelectElement).value
    const b = (document.getElementById('col_b') as HTMLSelectElement).value
    if (a && b && a !== b) setHardRules({ ...hardRules, not_same_col: [...hardRules.not_same_col, [a, b]] })
  }

  return (
    <div className="space-y-8">
      {/* Keine Einzelsitze Section */}
      <div className="p-4 bg-canvas rounded-2xl border border-line space-y-4">
        <SecHead icon={<UserX size={14} />}>Keine Einzelsitze (Niemand sitzt alleine)</SecHead>
        
        <Switch
          label="Niemand darf alleine sitzen"
          description="Verpflichtend: Jeder Schüler muss mindestens einen direkten Partner als Sitznachbarn haben"
          checked={!!hardRules.no_alone}
          onChange={(v) => setHardRules({ ...hardRules, no_alone: v })}
        />

        <div className={`pt-3 border-t border-line/60 grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${hardRules.no_alone ? 'opacity-100' : 'opacity-60'}`}>
          <Switch
            label="Vertikal als Partner werten"
            description="Oben / Unten (Vorder- & Hinterleute) zählt als Partner"
            checked={!!hardRules.no_alone_vertical}
            onChange={(v) => setHardRules({ ...hardRules, no_alone_vertical: v })}
          />
          <Switch
            label="Diagonal als Partner werten"
            description="Schräg gegenüberliegende Plätze zählen als Partner"
            checked={!!hardRules.no_alone_diagonal}
            onChange={(v) => setHardRules({ ...hardRules, no_alone_diagonal: v })}
          />
        </div>

        <p className="text-xs text-ghost italic">
          💡 Hinweis: Horizontale Nachbarn (links / rechts am Tisch) zählen immer als Partner. Die Schalter steuern zusätzlich, ob auch Vorder-/Hinterleute oder diagonale Nachbarn das Alleinsitzen aufheben.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SecHead icon={<Users size={14} />}>Nicht in gleiche Reihe</SecHead>
          <div className="flex gap-2">
            <select className="flex-1 bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:outline-none" id="row_a">
              {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <select className="flex-1 bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:outline-none" id="row_b">
              {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <Button onClick={addNotSameRow} className="p-2"><Plus size={18} /></Button>
          </div>
          <div className="space-y-2">
            {hardRules.not_same_row.map((pair, i) => (
              <div key={i} className="flex items-center gap-2 bg-canvas px-2 py-1.5 rounded-lg border border-line">
                <select value={pair[0]} onChange={e => { const r = [...hardRules.not_same_row]; r[i] = [e.target.value, r[i][1]]; setHardRules({ ...hardRules, not_same_row: r }) }} className="flex-1 bg-transparent text-xs text-ink focus:outline-none cursor-pointer">
                  {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <span className="text-ghost shrink-0">↔</span>
                <select value={pair[1]} onChange={e => { const r = [...hardRules.not_same_row]; r[i] = [r[i][0], e.target.value]; setHardRules({ ...hardRules, not_same_row: r }) }} className="flex-1 bg-transparent text-xs text-ink focus:outline-none cursor-pointer">
                  {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <button onClick={() => setHardRules({ ...hardRules, not_same_row: hardRules.not_same_row.filter((_, idx) => i !== idx) })} className="text-ghost hover:text-red-400 shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <SecHead icon={<Users size={14} />}>Nicht in gleiche Spalte</SecHead>
          <div className="flex gap-2">
            <select className="flex-1 bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:outline-none" id="col_a">
              {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <select className="flex-1 bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-primary focus:outline-none" id="col_b">
              {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <Button onClick={addNotSameCol} className="p-2"><Plus size={18} /></Button>
          </div>
          <div className="space-y-2">
            {hardRules.not_same_col.map((pair, i) => (
              <div key={i} className="flex items-center gap-2 bg-canvas px-2 py-1.5 rounded-lg border border-line">
                <select value={pair[0]} onChange={e => { const r = [...hardRules.not_same_col]; r[i] = [e.target.value, r[i][1]]; setHardRules({ ...hardRules, not_same_col: r }) }} className="flex-1 bg-transparent text-xs text-ink focus:outline-none cursor-pointer">
                  {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <span className="text-ghost shrink-0">↔</span>
                <select value={pair[1]} onChange={e => { const r = [...hardRules.not_same_col]; r[i] = [r[i][0], e.target.value]; setHardRules({ ...hardRules, not_same_col: r }) }} className="flex-1 bg-transparent text-xs text-ink focus:outline-none cursor-pointer">
                  {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <button onClick={() => setHardRules({ ...hardRules, not_same_col: hardRules.not_same_col.filter((_, idx) => i !== idx) })} className="text-ghost hover:text-red-400 shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-line">
        <div className="space-y-4">
          <SecHead icon={<Scale size={14} />}>Mindestabstand (Manhattan)</SecHead>
          <MinDistanceRuleAdder students={students} hardRules={hardRules} setHardRules={setHardRules} />
        </div>
      </div>
    </div>
  )
}

export default SitzplanRulesTab
