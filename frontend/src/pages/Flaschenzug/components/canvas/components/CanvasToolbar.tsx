// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Circle, MapPin, MousePointer2, Plus, RotateCcw, Route, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import { Field } from '../../../../../components/ui'
import type { FlaschenzugConfig, RopeConfig, RopeSegmentConfig } from '../../../typesFlasche'
import type { CanvasEditorMode, CanvasPoint } from '../../../utilsFlascheCanvas'
import { PATH_SIDE_OPTIONS } from '../types'

const MODE_OPTIONS: { value: CanvasEditorMode; label: string; icon: React.ReactNode; title: string }[] = [
  { value: 'move', label: 'Bewegen', icon: <MousePointer2 size={14} />, title: 'Elemente verschieben oder Arbeitsfläche ziehen' },
  { value: 'pulley', label: 'Rolle', icon: <Circle size={14} />, title: 'Rolle platzieren' },
  { value: 'anchor', label: 'Punkt', icon: <MapPin size={14} />, title: 'Befestigungspunkt platzieren' },
  { value: 'rope', label: 'Seil', icon: <Route size={14} />, title: 'Seilpfad durch Anklicken aufbauen' },
]

export interface CanvasToolbarProps {
  mode: CanvasEditorMode
  setMode: (mode: CanvasEditorMode) => void
  zoomLevel: number
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>
  panOffset: CanvasPoint
  resetView: () => void
  cfg: FlaschenzugConfig
  activeRope?: RopeConfig
  selectedRopeId: string
  setSelectedRopeId: (id: string) => void
  addRope: () => void
  clearActiveRopePath: () => void
  ropeSide: RopeSegmentConfig['side']
  setRopeSide: (side: RopeSegmentConfig['side']) => void
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  mode,
  setMode,
  zoomLevel,
  setZoomLevel,
  panOffset,
  resetView,
  cfg,
  activeRope,
  setSelectedRopeId,
  addRope,
  clearActiveRopePath,
  ropeSide,
  setRopeSide,
}) => {
  const activePathLabel = activeRope?.path
    .map(segment => `${segment.name}${segment.side !== 'none' ? ` (${segment.side})` : ''}`)
    .join(' -> ') || 'Noch keine Punkte'

  return (
    <>
      <div className="flex gap-2 items-center">
        <div className="grid flex-1 grid-cols-4 gap-2">
          {MODE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              title={option.title}
              onClick={() => setMode(option.value)}
              className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-colors ${
                mode === option.value
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-line bg-raised text-muted hover:bg-overlay hover:text-ink'
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-raised p-1 shrink-0">
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.max(0.4, z / 1.2))}
            title="Herauszoomen"
            className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-overlay hover:text-ink transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs font-mono font-medium px-1.5 min-w-[44px] text-center text-muted select-none">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.min(4.0, z * 1.2))}
            title="Hineinzoomen"
            className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-overlay hover:text-ink transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          {(panOffset.x !== 0 || panOffset.y !== 0 || zoomLevel !== 1.0) && (
            <button
              type="button"
              onClick={resetView}
              title="Ansicht und Zoom zurücksetzen"
              className="flex h-8 items-center justify-center gap-1 rounded px-2 text-xs font-semibold text-muted hover:bg-overlay hover:text-ink transition-colors"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
        <Field label="Aktives Seil">
          <select
            value={activeRope?.id ?? ''}
            onChange={event => setSelectedRopeId(event.target.value)}
            className="h-10 w-full rounded-lg border border-line bg-raised px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {cfg.ropes.length === 0 && <option value="">Kein Seil</option>}
            {cfg.ropes.map(rope => (
              <option key={rope.id} value={rope.id}>
                {rope.name}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          onClick={addRope}
          title="Seil hinzufügen"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink"
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          onClick={clearActiveRopePath}
          disabled={!activeRope}
          title="Aktiven Seilpfad leeren"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-error/10 hover:text-error disabled:opacity-40"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_1.35fr] gap-3">
        <Field label="Rollen-Seite">
          <select
            value={ropeSide}
            onChange={event => setRopeSide(event.target.value as RopeSegmentConfig['side'])}
            disabled={mode !== 'rope'}
            className="h-10 w-full rounded-lg border border-line bg-raised px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          >
            {PATH_SIDE_OPTIONS.map(side => (
              <option key={side} value={side}>
                {side}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-caption">Aktueller Pfad</span>
          <div className="flex h-10 items-center overflow-hidden rounded-lg border border-line bg-canvas px-3 text-xs text-muted">
            <span className="truncate">{activePathLabel}</span>
          </div>
        </div>
      </div>
    </>
  )
}
