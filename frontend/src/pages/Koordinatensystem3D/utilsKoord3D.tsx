// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight } from 'lucide-react'
/* eslint-disable react-refresh/only-export-components */
import { Label } from '../../components/ui'
import { FILL_PATTERNS } from './constantsKoord3D'

export const Chk = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
    <span className="text-sm text-ink">{label}</span>
  </label>
)

export const SecHead = ({ children }: { children: string }) => (
  <h3 className="text-section-label mb-3">{children}</h3>
)

export const SectionExpander = ({ title, expanded, onToggle, children }: { title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) => (
  <div className="border border-line rounded-xl overflow-hidden bg-canvas/30">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-3 text-left hover:bg-raised/50 transition-colors"
    >
      {expanded ? <ChevronDown size={16} className="text-primary" /> : <ChevronRight size={16} className="text-ghost" />}
      <span className="text-caption text-ink">{title}</span>
    </button>
    {expanded && (
      <div className="p-4 border-t border-line bg-panel/50">
        {children}
      </div>
    )}
  </div>
)

export const PatternSel = ({ value, onChange, compact = false }: { value: string; onChange: (v: string) => void; compact?: boolean }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 shrink-0" title="Muster">
        <span className="text-caption text-muted whitespace-nowrap">Muster:</span>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-7 px-2 bg-raised border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
        >
          {FILL_PATTERNS.map(p => <option key={p} value={p}>{p || 'Keines'}</option>)}
        </select>
      </div>
    )
  }
  return (
    <div>
      <Label>Muster</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-raised border border-line rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      >
        {FILL_PATTERNS.map(p => <option key={p} value={p}>{p || 'Keines'}</option>)}
      </select>
    </div>
  )
}

export const calcDefaultTickRange = (minVal: number, maxVal: number): string => {
  if (isNaN(minVal) || isNaN(maxVal)) return ''
  const start = Math.floor(minVal)
  const end = Math.ceil(maxVal)
  if (start >= end) return `${start}`
  if (start + 1 === end) return `${start},${end}`
  return `${start},${start + 1},...,${end}`
}
