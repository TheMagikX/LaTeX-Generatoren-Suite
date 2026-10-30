// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Trash2 } from 'lucide-react'
import type { AnchorConfig } from '../../../../typesFlasche'

interface AnchorContextMenuProps {
  anchor: AnchorConfig
  onUpdate: (id: string, updates: Partial<AnchorConfig>) => void
  onRemove: (id: string) => void
}

export const AnchorContextMenu: React.FC<AnchorContextMenuProps> = ({
  anchor: a,
  onUpdate,
  onRemove,
}) => {
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Name</label>
          <input
            type="text"
            value={a.name}
            onChange={e => onUpdate(a.id, { name: e.target.value })}
            className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Label</label>
          <input
            type="text"
            value={a.label}
            onChange={e => onUpdate(a.id, { label: e.target.value })}
            placeholder="z.B. Decke"
            className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Form</label>
          <select
            value={a.shape}
            onChange={e => onUpdate(a.id, { shape: e.target.value as AnchorConfig['shape'] })}
            className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="Kreis">Kreis</option>
            <option value="Rechteck">Rechteck</option>
            <option value="Keine">Keine</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Größe</label>
          <input
            type="number"
            step="0.5"
            value={a.size}
            onChange={e => onUpdate(a.id, { size: parseFloat(e.target.value) || 1 })}
            className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="pt-1.5 border-t border-line/60">
        <button
          type="button"
          onClick={() => onRemove(a.id)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-error hover:bg-error/10 transition-colors"
        >
          <Trash2 size={13} />
          <span>Punkt löschen</span>
        </button>
      </div>
    </div>
  )
}
