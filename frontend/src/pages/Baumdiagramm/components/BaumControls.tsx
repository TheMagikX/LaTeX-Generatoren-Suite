// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label } from '../../../components/ui'

export const Chk = ({ checked, onChange, label, help }: { checked: boolean; onChange: (v: boolean) => void; label: string; help?: string }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none" title={help}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
    <span className="text-sm text-ink">{label}</span>
  </label>
)

export const SecHead = ({ children }: { children: string }) => (
  <h3 className="text-section-label mb-3">{children}</h3>
)

export const SelectField = <T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly (T | { value: T; label: string })[];
}) => (
  <div>
    <Label>{label}</Label>
    <select value={value} onChange={e => onChange(e.target.value as T)}
      className="w-full px-3 py-2 bg-panel border border-line rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
      {options.map(o => {
        const optVal = typeof o === 'string' ? o : o.value
        const optLabel = typeof o === 'string' ? o : o.label
        return <option key={optVal} value={optVal}>{optLabel}</option>
      })}
    </select>
  </div>
)
