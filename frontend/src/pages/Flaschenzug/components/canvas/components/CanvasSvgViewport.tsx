// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { forwardRef } from 'react'
import type { AnchorConfig, FlaschenzugConfig, PulleyConfig, RopeConfig } from '../../../typesFlasche'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type CanvasBounds,
  type CanvasEditorMode,
  type CanvasElementHit,
  computeRopeCanvasPath,
  worldToCanvas,
} from '../../../utilsFlascheCanvas'

const LABEL_SVG_OFFSETS: Record<string, { dx: number; dy: number; textAnchor: 'start' | 'middle' | 'end'; dominantBaseline: 'hanging' | 'middle' | 'auto' }> = {
  'above': { dx: 0, dy: 1, textAnchor: 'middle', dominantBaseline: 'auto' },
  'above right': { dx: 0.7071, dy: 0.7071, textAnchor: 'start', dominantBaseline: 'auto' },
  'right': { dx: 1, dy: 0, textAnchor: 'start', dominantBaseline: 'middle' },
  'below right': { dx: 0.7071, dy: -0.7071, textAnchor: 'start', dominantBaseline: 'hanging' },
  'below': { dx: 0, dy: -1, textAnchor: 'middle', dominantBaseline: 'hanging' },
  'below left': { dx: -0.7071, dy: -0.7071, textAnchor: 'end', dominantBaseline: 'hanging' },
  'left': { dx: -1, dy: 0, textAnchor: 'end', dominantBaseline: 'middle' },
  'above left': { dx: -0.7071, dy: 0.7071, textAnchor: 'end', dominantBaseline: 'auto' },
}

export interface CanvasSvgViewportProps {
  mode: CanvasEditorMode
  isPanning: boolean
  dragging: CanvasElementHit | null
  bounds: CanvasBounds
  zoomLevel: number
  grid: { vertical: number[]; horizontal: number[] }
  canvasScale: number
  cfg: FlaschenzugConfig
  activeRope?: RopeConfig
  handleCanvasPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void
  handleCanvasPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void
  handleCanvasPointerUp: () => void
  handleCanvasContextMenu: (event: React.MouseEvent<SVGSVGElement>) => void
  handleElementPointerDown: (event: React.PointerEvent<SVGElement>, hit: CanvasElementHit) => void
  handlePulleyContextMenu: (event: React.MouseEvent, pulley: PulleyConfig) => void
  handleAnchorContextMenu: (event: React.MouseEvent, anchor: AnchorConfig) => void
  handleRopeSegmentContextMenu: (event: React.MouseEvent, rope: RopeConfig, segmentIdx: number) => void
}

export const CanvasSvgViewport = forwardRef<SVGSVGElement, CanvasSvgViewportProps>(
  (
    {
      mode,
      isPanning,
      dragging,
      bounds,
      zoomLevel,
      grid,
      canvasScale,
      cfg,
      activeRope,
      handleCanvasPointerDown,
      handleCanvasPointerMove,
      handleCanvasPointerUp,
      handleCanvasContextMenu,
      handleElementPointerDown,
      handlePulleyContextMenu,
      handleAnchorContextMenu,
      handleRopeSegmentContextMenu,
    },
    ref,
  ) => {
    const renderRopePath = (rope: RopeConfig) => {
      const parts = computeRopeCanvasPath(cfg, rope, bounds, zoomLevel)
      if (parts.length === 0) return null

      const isSelected = rope.id === activeRope?.id
      const strokeW = Math.max(1.5, (rope.width || 1.0) * (isSelected ? 3.5 : 2.2))

      return (
        <g key={rope.id}>
          {parts.map((part, idx) => (
            <g key={`${rope.id}-part-${idx}`} data-editor-element="true">
              <path
                d={part.pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                className="cursor-pointer"
                pointerEvents="stroke"
                onContextMenu={e => handleRopeSegmentContextMenu(e, rope, part.segmentIndex)}
              />
              <path
                d={part.pathD}
                fill="none"
                stroke={rope.color || 'currentColor'}
                strokeWidth={strokeW}
                strokeDasharray={rope.style === 'rope' ? '6 3' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isSelected ? 0.95 : 0.55}
                pointerEvents="none"
              />
            </g>
          ))}
        </g>
      )
    }

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        className={`h-[580px] w-full touch-none select-none rounded-xl border border-line bg-canvas shadow-inner ${
          mode === 'move'
            ? isPanning || dragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : mode === 'rope'
              ? 'cursor-pointer'
              : 'cursor-crosshair'
        }`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        onContextMenu={handleCanvasContextMenu}
        role="img"
        aria-label="Interaktiver Flaschenzug-Editor"
      >
        <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="transparent" pointerEvents="all" />
        {grid.vertical.map(x => {
          const a = worldToCanvas({ x, y: 0 }, bounds, zoomLevel)
          const isCenter = Math.abs(x) < 1e-6
          const isInteger = Math.abs(x - Math.round(x)) < 1e-6

          return (
            <g key={`vx-${x}`}>
              <line
                x1={a.x}
                y1={0}
                x2={a.x}
                y2={CANVAS_HEIGHT}
                stroke={
                  isCenter
                    ? 'rgba(59,130,246,0.6)'
                    : isInteger
                      ? 'rgba(148,163,184,0.35)'
                      : 'rgba(148,163,184,0.12)'
                }
                strokeWidth={isCenter ? 2 : isInteger ? 1.2 : 0.8}
                strokeDasharray={isInteger ? undefined : '3 3'}
              />
              {isInteger && (
                <text
                  x={a.x}
                  y={CANVAS_HEIGHT - 12}
                  textAnchor="middle"
                  className="fill-muted/75 text-[11px] select-none font-mono font-medium pointer-events-none"
                >
                  {Math.round(x)}
                </text>
              )}
            </g>
          )
        })}
        {grid.horizontal.map(y => {
          const a = worldToCanvas({ x: 0, y }, bounds, zoomLevel)
          const isCenter = Math.abs(y) < 1e-6
          const isInteger = Math.abs(y - Math.round(y)) < 1e-6

          return (
            <g key={`hy-${y}`}>
              <line
                x1={0}
                y1={a.y}
                x2={CANVAS_WIDTH}
                y2={a.y}
                stroke={
                  isCenter
                    ? 'rgba(59,130,246,0.6)'
                    : isInteger
                      ? 'rgba(148,163,184,0.35)'
                      : 'rgba(148,163,184,0.12)'
                }
                strokeWidth={isCenter ? 2 : isInteger ? 1.2 : 0.8}
                strokeDasharray={isInteger ? undefined : '3 3'}
              />
              {isInteger && (
                <text
                  x={18}
                  y={Math.max(22, Math.min(CANVAS_HEIGHT - 22, a.y + 4))}
                  textAnchor="middle"
                  className="fill-muted/75 text-[11px] select-none font-mono font-medium pointer-events-none"
                >
                  {Math.round(y)}
                </text>
              )}
            </g>
          )
        })}

        {cfg.ropes.map(renderRopePath)}

        {cfg.anchors.map(anchor => {
          const center = worldToCanvas(anchor, bounds, zoomLevel)
          const hit: CanvasElementHit = { kind: 'anchor', id: anchor.id, name: anchor.name }
          const sizePx = Math.max(12, (anchor.size || 2.0) * 5)

          return (
            <g
              key={anchor.id}
              data-editor-element="true"
              onPointerDown={event => handleElementPointerDown(event, hit)}
              onContextMenu={event => handleAnchorContextMenu(event, anchor)}
              className="cursor-pointer group"
            >
              <circle cx={center.x} cy={center.y} r={sizePx + 10} fill="transparent" pointerEvents="all" />
              {anchor.shape === 'Kreis' && (
                <circle
                  cx={center.x}
                  cy={center.y}
                  r={sizePx / 2}
                  fill="rgba(20,184,166,0.22)"
                  stroke="rgb(20,184,166)"
                  strokeWidth={2}
                />
              )}
              {anchor.shape === 'Rechteck' && (
                <rect
                  x={center.x - sizePx / 2}
                  y={center.y - sizePx / 2}
                  width={sizePx}
                  height={sizePx}
                  rx={4}
                  fill="rgba(20,184,166,0.22)"
                  stroke="rgb(20,184,166)"
                  strokeWidth={2}
                />
              )}
              {anchor.shape === 'Keine' && <circle cx={center.x} cy={center.y} r={4} fill="rgb(20,184,166)" />}
              <text
                x={center.x}
                y={center.y - sizePx / 2 - 6}
                textAnchor="middle"
                className="fill-teal-300 text-[12px] font-semibold select-none group-hover:fill-white"
              >
                {anchor.name}
                {anchor.label ? ` (${anchor.label})` : ''}
              </text>
            </g>
          )
        })}

        {cfg.pulleys.map(pulley => {
          const center = worldToCanvas(pulley, bounds, zoomLevel)
          const radius = Math.max(14, pulley.radius * canvasScale)
          const hit: CanvasElementHit = { kind: 'pulley', id: pulley.id, name: pulley.name }

          return (
            <g
              key={pulley.id}
              data-editor-element="true"
              onPointerDown={event => handleElementPointerDown(event, hit)}
              onContextMenu={event => handlePulleyContextMenu(event, pulley)}
              className="cursor-pointer group"
            >
              <circle cx={center.x} cy={center.y} r={radius + 12} fill="transparent" pointerEvents="all" />

              <circle
                cx={center.x}
                cy={center.y}
                r={radius}
                fill="rgba(15,23,42,0.92)"
                stroke="rgb(245,158,11)"
                strokeWidth={2.5}
              />
              <circle cx={center.x} cy={center.y} r={4} fill="rgb(245,158,11)" />

              {(() => {
                const labelOffset = LABEL_SVG_OFFSETS[pulley.label_pos] || LABEL_SVG_OFFSETS['above right']
                const labelX = center.x + labelOffset.dx * (radius + 8)
                const labelY = center.y - labelOffset.dy * (radius + 8)
                return (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor={labelOffset.textAnchor}
                    dominantBaseline={labelOffset.dominantBaseline}
                    className="fill-slate-200 text-[12px] font-semibold select-none group-hover:fill-white"
                  >
                    {pulley.name}
                    {pulley.label ? ` (${pulley.label})` : ''}
                  </text>
                )
              })()}

              <text
                x={center.x}
                y={center.y + 4}
                textAnchor="middle"
                className="fill-amber-400 text-[10px] font-mono font-bold select-none pointer-events-none"
              >
                r={pulley.radius}
              </text>
            </g>
          )
        })}

        {/* Halterungen im Vordergrund */}
        {cfg.pulleys
          .filter(p => p.mount !== 'Keine')
          .map(pulley => {
            const center = worldToCanvas(pulley, bounds, zoomLevel)
            const rad = (pulley.mount_angle * Math.PI) / 180
            const mountWorldEnd = {
              x: pulley.x + Math.cos(rad) * pulley.mount_length,
              y: pulley.y + Math.sin(rad) * pulley.mount_length,
            }
            const mountEndCanvas = worldToCanvas(mountWorldEnd, bounds, zoomLevel)

            return (
              <g key={`mount-${pulley.id}`} pointerEvents="none">
                <line
                  x1={center.x}
                  y1={center.y}
                  x2={mountEndCanvas.x}
                  y2={mountEndCanvas.y}
                  stroke="rgb(245,158,11)"
                  strokeWidth={pulley.mount === 'Zweiseitig' ? 4 : 2.5}
                  strokeLinecap="round"
                  opacity={0.95}
                />
                <circle cx={mountEndCanvas.x} cy={mountEndCanvas.y} r={3.5} fill="rgb(245,158,11)" />
              </g>
            )
          })}

        {/* Massestücke */}
        {cfg.masses?.map(m => {
          const pulley = cfg.pulleys.find(p => p.name === m.ref)
          const anchor = !pulley ? cfg.anchors.find(a => a.name === m.ref) : undefined
          const elem = pulley || anchor
          if (!elem) return null

          let sx = elem.x
          const sy = elem.y
          if (pulley) {
            if (m.relation === 'Links') sx -= pulley.radius
            else if (m.relation === 'Rechts') sx += pulley.radius
          }
          const massWorldY = sy - (m.length || 1.0)
          const startPt = worldToCanvas({ x: sx, y: sy }, bounds, zoomLevel)
          const massPt = worldToCanvas({ x: sx, y: massWorldY }, bounds, zoomLevel)

          const massW = Math.max(32, 0.6 * canvasScale)
          const massH = Math.max(26, 0.6 * canvasScale)

          return (
            <g key={`mass-${m.id}`} pointerEvents="none">
              <line
                x1={startPt.x}
                y1={startPt.y}
                x2={massPt.x}
                y2={massPt.y - massH / 2}
                stroke="rgb(148,163,184)"
                strokeWidth={1.5}
                strokeDasharray="3,2"
              />
              <rect
                x={massPt.x - massW / 2}
                y={massPt.y - massH / 2}
                width={massW}
                height={massH}
                rx={4}
                fill="rgba(30,41,59,0.95)"
                stroke="rgb(148,163,184)"
                strokeWidth={1.5}
              />
              <text
                x={massPt.x}
                y={massPt.y + 4}
                textAnchor="middle"
                className="fill-slate-200 text-[11px] font-mono select-none"
              >
                {m.label ? m.label.replace(/[\$\\]/g, '') : (m.name || 'm')}
              </text>
            </g>
          )
        })}
      </svg>
    )
  },
)

CanvasSvgViewport.displayName = 'CanvasSvgViewport'
