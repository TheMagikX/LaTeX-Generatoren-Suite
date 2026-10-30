// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Trash2 } from 'lucide-react'
import type { RopeConfig, RopeSegmentConfig } from '../../../../typesFlasche'
import { PATH_SIDE_OPTIONS } from '../../types'

interface RopeContextMenuProps {
  rope: RopeConfig
  segmentIndex?: number
  elementNames: Map<string, { x: number; y: number; kind: 'pulley' | 'anchor' }>
  onUpdateSegmentSide: (ropeId: string, segmentIdx: number, side: RopeSegmentConfig['side']) => void
  onRemoveSegment: (ropeId: string, segmentIdx: number) => void
  onUpdateRope: (ropeId: string, updates: Partial<RopeConfig>) => void
  onRemoveRope: (ropeId: string) => void
}

export const RopeContextMenu: React.FC<RopeContextMenuProps> = ({
  rope,
  segmentIndex,
  elementNames,
  onUpdateSegmentSide,
  onRemoveSegment,
  onUpdateRope,
  onRemoveRope,
}) => {
  const segIdx = segmentIndex ?? 0
  const segment = rope.path[segIdx]
  const targetKind = segment ? elementNames.get(segment.name)?.kind : null

  return (
    <div className="space-y-2 text-xs">
      {segment && targetKind === 'pulley' && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Rollen-Seite ({segment.name})
          </label>
          <div className="grid grid-cols-3 gap-1">
            {PATH_SIDE_OPTIONS.map(side => (
              <button
                key={side}
                type="button"
                onClick={() => onUpdateSegmentSide(rope.id, segIdx, side)}
                className={`px-1 py-1 text-[11px] font-semibold rounded border transition-colors ${
                  segment.side === side
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-line bg-raised text-muted hover:bg-overlay'
                }`}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
      )}

      {segment && (
        <button
          type="button"
          onClick={() => onRemoveSegment(rope.id, segIdx)}
          className="w-full py-1 text-[11px] font-semibold rounded border border-line bg-raised text-muted hover:bg-overlay hover:text-ink transition-colors"
        >
          Segment #{segIdx + 1} entfernen
        </button>
      )}

      <div className="pt-2 border-t border-line/60 space-y-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Seil Name</label>
          <input
            type="text"
            value={rope.name}
            onChange={e => onUpdateRope(rope.id, { name: e.target.value })}
            className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Stil</label>
            <select
              value={rope.style}
              onChange={e => onUpdateRope(rope.id, { style: e.target.value as 'plain' | 'rope' })}
              className="w-full bg-raised border border-line rounded-md px-1 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="plain">Glatt</option>
              <option value="rope">Geflochten</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Farbe</label>
            <input
              type="text"
              value={rope.color}
              onChange={e => onUpdateRope(rope.id, { color: e.target.value })}
              className="w-full bg-raised border border-line rounded-md px-1 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Dicke</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={rope.width}
              onChange={e => onUpdateRope(rope.id, { width: parseFloat(e.target.value) || 1 })}
              className="w-full bg-raised border border-line rounded-md px-1 py-1 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="pt-1.5 border-t border-line/60">
        <button
          type="button"
          onClick={() => onRemoveRope(rope.id)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-error hover:bg-error/10 transition-colors"
        >
          <Trash2 size={13} />
          <span>Seil löschen</span>
        </button>
      </div>
    </div>
  )
}
