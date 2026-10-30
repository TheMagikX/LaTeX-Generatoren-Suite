// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Trash2 } from 'lucide-react'
import type { PulleyConfig } from '../../../../typesFlasche'
import { PULLEY_LABEL_POSITIONS } from '../../../../constantsFlasche'

interface PulleyContextMenuProps {
  pulley: PulleyConfig
  onUpdate: (id: string, updates: Partial<PulleyConfig>) => void
  onRemove: (id: string) => void
}

export const PulleyContextMenu: React.FC<PulleyContextMenuProps> = ({
  pulley: p,
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
            value={p.name}
            onChange={e => onUpdate(p.id, { name: e.target.value })}
            className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Label</label>
          <input
            type="text"
            value={p.label}
            onChange={e => onUpdate(p.id, { label: e.target.value })}
            placeholder="z.B. R1"
            className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Radius (Größe)</label>
          <input
            type="number"
            step="0.05"
            min="0.05"
            max="3"
            value={p.radius}
            onChange={e => onUpdate(p.id, { radius: parseFloat(e.target.value) || 0.1 })}
            className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Label Pos.</label>
          <select
            value={p.label_pos}
            onChange={e => onUpdate(p.id, { label_pos: e.target.value as PulleyConfig['label_pos'] })}
            className="w-full bg-raised border border-line rounded-md px-1.5 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {PULLEY_LABEL_POSITIONS.map(pos => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Halterung (Mount)</label>
        <select
          value={p.mount}
          onChange={e => onUpdate(p.id, { mount: e.target.value as PulleyConfig['mount'] })}
          className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="Keine">Keine</option>
          <option value="Einseitig">Einseitig</option>
          <option value="Zweiseitig">Zweiseitig</option>
        </select>
      </div>

      {p.mount !== 'Keine' && (
        <div className="grid grid-cols-2 gap-1.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">H-Winkel (°)</label>
            <input
              type="number"
              step="5"
              value={p.mount_angle}
              onChange={e => onUpdate(p.id, { mount_angle: parseFloat(e.target.value) || 0 })}
              className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">H-Länge</label>
            <input
              type="number"
              step="0.1"
              value={p.mount_length}
              onChange={e => onUpdate(p.id, { mount_length: parseFloat(e.target.value) || 0.1 })}
              className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      <div className="pt-1.5 border-t border-line/60">
        <button
          type="button"
          onClick={() => onRemove(p.id)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-error hover:bg-error/10 transition-colors"
        >
          <Trash2 size={13} />
          <span>Rolle löschen</span>
        </button>
      </div>
    </div>
  )
}
