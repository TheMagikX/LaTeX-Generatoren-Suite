// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label, NumberInput, Input, Switch } from '../../components/ui'
import type { RayConfig } from './typesOptik'

export const Chk = ({
  checked,
  onChange,
  label,
  help,
  disabled
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  help?: string
  disabled?: boolean
}) => (
  <label className={`flex items-center gap-2 select-none ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`} title={help}>
    <input
      type="checkbox"
      checked={checked}
      onChange={e => !disabled && onChange(e.target.checked)}
      disabled={disabled}
      className="w-4 h-4 accent-primary rounded"
    />
    <span className="text-sm text-ink">{label}</span>
  </label>
)

export const SecHead = ({ children }: { children: string }) => (
  <h3 className="text-section-label mb-3">
    {children}
  </h3>
)

export const RayEditor = ({
  label,
  config,
  onChange,
  disabled
}: {
  label: string
  config?: RayConfig
  onChange: (updates: Partial<RayConfig>) => void
  disabled?: boolean
}) => {
  if (!config) return null
  return (
    <div className={`space-y-2 p-3 bg-panel/40 rounded-lg border border-line/50 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <Switch checked={config.show} onChange={v => onChange({ show: v })} />
      </div>
      {config.show && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <Label className="text-metadata">Farbe</Label>
            <Input 
              value={config.color} 
              onChange={e => onChange({ color: e.target.value })}
              className="h-7 text-xs px-2"
            />
          </div>
          <div>
            <Label className="text-metadata">Breite</Label>
            <NumberInput 
              value={config.width} 
              step={0.1} min={0.1} max={5}
              onChange={e => onChange({ width: parseFloat(e.target.value) })}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}
