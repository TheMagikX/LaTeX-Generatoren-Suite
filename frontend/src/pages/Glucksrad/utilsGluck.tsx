// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label } from '../../components/ui'

export const SecHeadComponent = ({ children }: { children: string }) => (
  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{children}</h3>
)

export const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
  <div>
    <Label>{label}</Label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-panel border border-line rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
)
