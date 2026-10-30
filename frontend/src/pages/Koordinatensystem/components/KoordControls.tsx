// SPDX-License-Identifier: AGPL-3.0-or-later

import { useMemo } from 'react'
import * as math from 'mathjs'
import { Info } from 'lucide-react'
import { Label } from '../../../components/ui'
import { FILL_PATTERNS } from '../constantsKoord'

export const Chk = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none" >
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
    <span className="text-sm text-ink" > {label} </span>
  </label>
)

export const PatternSel = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-caption" > Muster </Label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-panel border border-line rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer h-8 text-xs" >
      {FILL_PATTERNS.map(p => <option key={p} value={p} > {p} </option>)}
    </select>
  </div>
)

export const IntegralHelper = ({ func, a, b }: { func: string; a: number; b: number }) => {
  const area = useMemo(() => {
    if (!func || a === b) return null
    try {
      const safeFunc = func
        .replace(/(\d)x/g, '$1*x')
        .replace(/x(\d)/g, 'x*$1')
        .replace(/abs\(/g, 'abs(')

      const code = math.compile(safeFunc)
      const n = 1000
      const dx = (b - a) / n
      let sum = 0
      for (let i = 0; i <= n; i++) {
        const x = a + i * dx
        const y = code.evaluate({ x })
        if (i === 0 || i === n) sum += y / 2
        else sum += y
      }
      return Math.abs(sum * dx)
    } catch {
      return null
    }
  }, [func, a, b])

  if (area === null) return null

  return (
    <div className="mt-2 px-2 py-1 bg-primary/10 border border-primary/20 rounded text-metadata text-primary flex items-center gap-1.5" >
      <Info size={12} /> Flächeninhalt ≈ {area.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} FE
    </div>
  )
}
