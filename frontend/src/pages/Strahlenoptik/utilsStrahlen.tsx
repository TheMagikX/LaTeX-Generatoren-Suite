// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { AlertTriangle } from 'lucide-react'

export const Chk = ({
  checked, onChange, label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
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

export const WarningBox = ({ children, variant = 'warning' }: { children: React.ReactNode, variant?: 'warning' | 'error' }) => {
  const bg = variant === 'error' ? 'bg-red-900/40 border-red-700 text-red-300' : 'bg-amber-900/40 border-amber-700 text-amber-300'
  return (
    <div className={`flex items-start gap-2 border rounded-lg p-3 text-sm ${bg}`}>
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export const LightZoneWarning = () => (
  <WarningBox>
    <strong>Hinweis:</strong> Die Option „Lichtkegel ausfüllen“ ist mit Brechungsmedien
    nicht vollständig kompatibel — die ausgefüllte Fläche berücksichtigt die Brechung
    möglicherweise nicht korrekt. Unerwartetes Verhalten kann nicht ausgeschlossen werden.
  </WarningBox>
)
