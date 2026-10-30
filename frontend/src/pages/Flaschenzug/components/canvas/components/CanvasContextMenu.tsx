// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useMemo } from 'react'
import type { AnchorConfig, FlaschenzugConfig, PulleyConfig, RopeConfig, RopeSegmentConfig } from '../../../typesFlasche'
import { type ContextMenuState, getElementNameMap } from '../types'
import { PulleyContextMenu } from './contextMenus/PulleyContextMenu'
import { AnchorContextMenu } from './contextMenus/AnchorContextMenu'
import { RopeContextMenu } from './contextMenus/RopeContextMenu'

export interface CanvasContextMenuProps {
  state: ContextMenuState
  onClose: () => void
  cfg: FlaschenzugConfig
  setCfg: React.Dispatch<React.SetStateAction<FlaschenzugConfig>>
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  state,
  onClose,
  cfg,
  setCfg,
}) => {
  const elementNames = useMemo(() => getElementNameMap(cfg), [cfg])

  const updatePulley = (id: string, updates: Partial<PulleyConfig>) => {
    setCfg(c => {
      const oldPulley = c.pulleys.find(p => p.id === id)
      const newPulleys = c.pulleys.map(p => (p.id === id ? { ...p, ...updates } : p))

      if (updates.name && oldPulley && oldPulley.name !== updates.name) {
        const oldName = oldPulley.name
        const newName = updates.name
        return {
          ...c,
          pulleys: newPulleys,
          ropes: c.ropes.map(r => ({
            ...r,
            path: r.path.map(seg => (seg.name === oldName ? { ...seg, name: newName } : seg)),
          })),
          masses: c.masses.map(m => (m.ref === oldName ? { ...m, ref: newName } : m)),
          forces: c.forces.map(f => (f.ref_name === oldName ? { ...f, ref_name: newName } : f)),
        }
      }

      return { ...c, pulleys: newPulleys }
    })
  }

  const removePulley = (id: string) => {
    setCfg(c => {
      const p = c.pulleys.find(x => x.id === id)
      if (!p) return c
      return {
        ...c,
        pulleys: c.pulleys.filter(x => x.id !== id),
        ropes: c.ropes.map(r => ({
          ...r,
          path: r.path.filter(seg => seg.name !== p.name),
        })),
      }
    })
    onClose()
  }

  const updateAnchor = (id: string, updates: Partial<AnchorConfig>) => {
    setCfg(c => {
      const oldAnchor = c.anchors.find(a => a.id === id)
      const newAnchors = c.anchors.map(a => (a.id === id ? { ...a, ...updates } : a))

      if (updates.name && oldAnchor && oldAnchor.name !== updates.name) {
        const oldName = oldAnchor.name
        const newName = updates.name
        return {
          ...c,
          anchors: newAnchors,
          ropes: c.ropes.map(r => ({
            ...r,
            path: r.path.map(seg => (seg.name === oldName ? { ...seg, name: newName } : seg)),
          })),
          masses: c.masses.map(m => (m.ref === oldName ? { ...m, ref: newName } : m)),
          forces: c.forces.map(f => (f.ref_name === oldName ? { ...f, ref_name: newName } : f)),
        }
      }

      return { ...c, anchors: newAnchors }
    })
  }

  const removeAnchor = (id: string) => {
    setCfg(c => {
      const a = c.anchors.find(x => x.id === id)
      if (!a) return c
      return {
        ...c,
        anchors: c.anchors.filter(x => x.id !== id),
        ropes: c.ropes.map(r => ({
          ...r,
          path: r.path.filter(seg => seg.name !== a.name),
        })),
      }
    })
    onClose()
  }

  const updateRopeSegmentSide = (ropeId: string, segmentIdx: number, side: RopeSegmentConfig['side']) => {
    setCfg(c => ({
      ...c,
      ropes: c.ropes.map(r => r.id === ropeId ? {
        ...r,
        path: r.path.map((seg, idx) => idx === segmentIdx ? { ...seg, side } : seg),
      } : r),
    }))
  }

  const removeRopeSegment = (ropeId: string, segmentIdx: number) => {
    setCfg(c => ({
      ...c,
      ropes: c.ropes.map(r => r.id === ropeId ? {
        ...r,
        path: r.path.filter((_, idx) => idx !== segmentIdx),
      } : r),
    }))
    onClose()
  }

  const updateRope = (ropeId: string, updates: Partial<RopeConfig>) => {
    setCfg(c => ({
      ...c,
      ropes: c.ropes.map(r => r.id === ropeId ? { ...r, ...updates } : r),
    }))
  }

  const removeRope = (ropeId: string) => {
    setCfg(c => ({
      ...c,
      ropes: c.ropes.filter(r => r.id !== ropeId),
    }))
    onClose()
  }

  return (
    <div
      className="absolute z-30 w-60 rounded-xl border border-line bg-panel p-3 shadow-2xl space-y-2.5 max-h-[380px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
      style={{ left: state.x, top: state.y }}
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="px-1 py-0.5 text-[11px] font-bold text-muted border-b border-line/60 pb-1.5 truncate">
        {state.title}
      </div>

      {state.type === 'pulley' && (() => {
        const p = cfg.pulleys.find(x => x.id === state.targetId)
        if (!p) return null
        return <PulleyContextMenu pulley={p} onUpdate={updatePulley} onRemove={removePulley} />
      })()}

      {state.type === 'anchor' && (() => {
        const a = cfg.anchors.find(x => x.id === state.targetId)
        if (!a) return null
        return <AnchorContextMenu anchor={a} onUpdate={updateAnchor} onRemove={removeAnchor} />
      })()}

      {state.type === 'rope_segment' && (() => {
        const rope = cfg.ropes.find(r => r.id === state.targetId)
        if (!rope) return null
        return (
          <RopeContextMenu
            rope={rope}
            segmentIndex={state.segmentIndex}
            elementNames={elementNames}
            onUpdateSegmentSide={updateRopeSegmentSide}
            onRemoveSegment={removeRopeSegment}
            onUpdateRope={updateRope}
            onRemoveRope={removeRope}
          />
        )
      })()}
    </div>
  )
}
