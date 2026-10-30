// SPDX-License-Identifier: AGPL-3.0-or-later

import { Switch, Field, Input } from '../../components/ui'
import type { HelperLine } from './typesGeo'
import type { ChangeEvent, ReactNode } from 'react'

export const HelperLineEditor = ({
  label,
  value,
  onChange,
}: {
  label: ReactNode
  value: HelperLine
  onChange: (v: HelperLine) => void
}) => {
  const upd = (patch: Partial<HelperLine>) => onChange({ ...value, ...patch })
  return (
    <div className={`flex flex-col gap-2 p-4 rounded-xl border transition-all duration-300 shrink-0 ${value.show ? 'bg-raised/40 border-rim/60 shadow-sm' : 'bg-raised/10 border-line/40 hover:bg-raised/30'}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <Switch checked={value.show} onChange={(v: boolean) => upd({ show: v })} />
      </div>
      {value.show && (
        <div className="pt-4 border-t border-rim/50 space-y-4 mt-2 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex flex-wrap gap-4">
            <Switch label="Beschriftung" checked={value.show_label} onChange={(v: boolean) => upd({ show_label: v })} />
            <Switch label="Rechter Winkel" checked={value.show_right_angle} onChange={(v: boolean) => upd({ show_right_angle: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Beschriftung (LaTeX)">
              <Input value={value.label} onChange={(e: ChangeEvent<HTMLInputElement>) => upd({ label: e.target.value })} className="bg-panel/50 border-rim/50" />
            </Field>
            <Field label="Linienstil">
              <Input value={value.style} onChange={(e: ChangeEvent<HTMLInputElement>) => upd({ style: e.target.value })} className="bg-panel/50 border-rim/50" />
            </Field>
            <div className="col-span-2">
              <Field label="Zusätzliche Optionen (TikZ)">
                <Input value={value.options} onChange={(e: ChangeEvent<HTMLInputElement>) => upd({ options: e.target.value })} className="bg-panel/50 border-rim/50" />
              </Field>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
