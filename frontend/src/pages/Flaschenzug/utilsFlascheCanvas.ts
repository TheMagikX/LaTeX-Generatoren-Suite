// SPDX-License-Identifier: AGPL-3.0-or-later

import type { AnchorConfig, FlaschenzugConfig, PulleyConfig, RopeConfig } from './typesFlasche'
import { genId, getNextName } from './utilsFlasche'

export type CanvasEditorMode = 'move' | 'pulley' | 'anchor' | 'rope'
export type CanvasElementKind = 'pulley' | 'anchor'

export interface CanvasPoint {
  x: number
  y: number
}

export interface CanvasBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface CanvasElementHit {
  kind: CanvasElementKind
  id: string
  name: string
}

export const CANVAS_WIDTH = 1000
export const CANVAS_HEIGHT = 600
export const CANVAS_PADDING = 30
export const CANVAS_GRID_STEP = 0.5
export const CANVAS_SNAP_STEP = 0.25

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const snapCanvasPoint = (point: CanvasPoint, step = CANVAS_SNAP_STEP): CanvasPoint => ({
  x: Math.round(point.x / step) * step,
  y: Math.round(point.y / step) * step,
})

export const getCanvasBounds = (
  cfg: FlaschenzugConfig,
  panOffset: CanvasPoint = { x: 0, y: 0 },
): CanvasBounds => {
  const xs = [
    ...cfg.pulleys.map(p => p.x),
    ...cfg.anchors.map(a => a.x),
    -4,
    4,
  ]
  const ys = [
    ...cfg.pulleys.map(p => p.y),
    ...cfg.anchors.map(a => a.y),
    -2,
    5,
  ]

  const baseMinX = Math.min(-4, Math.floor(Math.min(...xs) - 1))
  const baseMaxX = Math.max(4, Math.ceil(Math.max(...xs) + 1))
  const baseMinY = Math.min(-2, Math.floor(Math.min(...ys) - 1))
  const baseMaxY = Math.max(5, Math.ceil(Math.max(...ys) + 1))

  return {
    minX: baseMinX + panOffset.x,
    maxX: baseMaxX + panOffset.x,
    minY: baseMinY + panOffset.y,
    maxY: baseMaxY + panOffset.y,
  }
}

export const getCanvasScale = (bounds: CanvasBounds, zoomLevel = 1.0): number => {
  const innerW = CANVAS_WIDTH - CANVAS_PADDING * 2
  const innerH = CANVAS_HEIGHT - CANVAS_PADDING * 2
  const spanX = Math.max(0.1, bounds.maxX - bounds.minX)
  const spanY = Math.max(0.1, bounds.maxY - bounds.minY)
  return Math.min(innerW / spanX, innerH / spanY) * zoomLevel
}

export const worldToCanvas = (point: CanvasPoint, bounds: CanvasBounds, zoomLevel = 1.0): CanvasPoint => {
  const scale = getCanvasScale(bounds, zoomLevel)
  const midWorldX = (bounds.minX + bounds.maxX) / 2
  const midWorldY = (bounds.minY + bounds.maxY) / 2
  return {
    x: CANVAS_WIDTH / 2 + (point.x - midWorldX) * scale,
    y: CANVAS_HEIGHT / 2 - (point.y - midWorldY) * scale,
  }
}

export const canvasToWorld = (point: CanvasPoint, bounds: CanvasBounds, zoomLevel = 1.0): CanvasPoint => {
  const scale = getCanvasScale(bounds, zoomLevel)
  const midWorldX = (bounds.minX + bounds.maxX) / 2
  const midWorldY = (bounds.minY + bounds.maxY) / 2
  return snapCanvasPoint({
    x: midWorldX + (point.x - CANVAS_WIDTH / 2) / scale,
    y: midWorldY - (point.y - CANVAS_HEIGHT / 2) / scale,
  })
}

export const getPointerCanvasPoint = (
  clientX: number,
  clientY: number,
  target: Element | null,
): CanvasPoint => {
  const svg = target ? (target.closest('svg') ?? (target as unknown as SVGSVGElement)) : null
  if (!svg) return { x: 0, y: 0 }
  const rect = svg.getBoundingClientRect()

  return {
    x: clamp(((clientX - rect.left) / rect.width) * CANVAS_WIDTH, 0, CANVAS_WIDTH),
    y: clamp(((clientY - rect.top) / rect.height) * CANVAS_HEIGHT, 0, CANVAS_HEIGHT),
  }
}

export const createPulleyAt = (cfg: FlaschenzugConfig, point: CanvasPoint): PulleyConfig => ({
  id: genId(),
  name: getNextName('R', cfg.pulleys),
  x: point.x,
  y: point.y,
  radius: 0.3,
  label: '',
  label_pos: 'above right',
  mount: 'Keine',
  mount_angle: 90,
  mount_length: 0.5,
})

export const createAnchorAt = (cfg: FlaschenzugConfig, point: CanvasPoint): AnchorConfig => ({
  id: genId(),
  name: getNextName('A', cfg.anchors),
  x: point.x,
  y: point.y,
  label: '',
  shape: 'Kreis',
  size: 2.0,
})

export const findCanvasElementHit = (
  cfg: FlaschenzugConfig,
  canvasPoint: CanvasPoint,
  bounds: CanvasBounds,
  zoomLevel = 1.0,
): CanvasElementHit | null => {
  for (const pulley of [...cfg.pulleys].reverse()) {
    const center = worldToCanvas(pulley, bounds, zoomLevel)
    if (Math.hypot(canvasPoint.x - center.x, canvasPoint.y - center.y) <= 24) {
      return { kind: 'pulley', id: pulley.id, name: pulley.name }
    }
  }

  for (const anchor of [...cfg.anchors].reverse()) {
    const center = worldToCanvas(anchor, bounds, zoomLevel)
    if (Math.hypot(canvasPoint.x - center.x, canvasPoint.y - center.y) <= 20) {
      return { kind: 'anchor', id: anchor.id, name: anchor.name }
    }
  }

  return null
}

export const getGridLines = (bounds: CanvasBounds, zoomLevel = 1.0) => {
  const topLeft = canvasToWorld({ x: -100, y: -100 }, bounds, zoomLevel)
  const bottomRight = canvasToWorld({ x: CANVAS_WIDTH + 100, y: CANVAS_HEIGHT + 100 }, bounds, zoomLevel)

  const minX = Math.floor(Math.min(topLeft.x, bottomRight.x))
  const maxX = Math.ceil(Math.max(topLeft.x, bottomRight.x))
  const minY = Math.floor(Math.min(topLeft.y, bottomRight.y))
  const maxY = Math.ceil(Math.max(topLeft.y, bottomRight.y))

  const vertical: number[] = []
  const horizontal: number[] = []

  for (let x = minX; x <= maxX; x += CANVAS_GRID_STEP) {
    vertical.push(Number(x.toFixed(2)))
  }
  for (let y = minY; y <= maxY; y += CANVAS_GRID_STEP) {
    horizontal.push(Number(y.toFixed(2)))
  }

  return { vertical, horizontal }
}

export interface CanvasRopeLinePart {
  type: 'line'
  segmentIndex: number
  p1Canvas: CanvasPoint
  p2Canvas: CanvasPoint
  pathD: string
}

export interface CanvasRopeArcPart {
  type: 'arc'
  segmentIndex: number
  startCanvas: CanvasPoint
  endCanvas: CanvasPoint
  centerCanvas: CanvasPoint
  radiusPx: number
  largeArcFlag: number
  sweepFlag: number
  pathD: string
}

export type CanvasRopePart = CanvasRopeLinePart | CanvasRopeArcPart

export const computeRopeCanvasPath = (
  cfg: FlaschenzugConfig,
  rope: RopeConfig,
  bounds: CanvasBounds,
  zoomLevel = 1.0,
): CanvasRopePart[] => {
  if (rope.path.length < 2) return []

  const scale = getCanvasScale(bounds, zoomLevel)

  const findElem = (name: string) => {
    const pulley = cfg.pulleys.find(p => p.name === name)
    if (pulley) return { type: 'pulley' as const, x: pulley.x, y: pulley.y, r: pulley.radius }
    const anchor = cfg.anchors.find(a => a.name === name)
    if (anchor) return { type: 'anchor' as const, x: anchor.x, y: anchor.y, r: 0 }
    return null
  }

  interface ContactPointInternal {
    x: number
    y: number
    r: number
    isPulley: boolean
    name: string
    side: 'cw' | 'ccw' | 'none'
    entry?: { x: number; y: number }
    exit?: { x: number; y: number }
    entryAngleRad?: number
    exitAngleRad?: number
  }

  const contactPoints: ContactPointInternal[] = []
  for (const seg of rope.path) {
    const elem = findElem(seg.name)
    if (!elem) continue
    contactPoints.push({
      x: elem.x,
      y: elem.y,
      r: elem.r,
      isPulley: elem.type === 'pulley',
      name: seg.name,
      side: seg.side,
    })
  }

  if (contactPoints.length < 2) return []

  for (let i = 0; i < contactPoints.length - 1; i++) {
    const cp1 = contactPoints[i]
    const cp2 = contactPoints[i + 1]

    const ax = cp1.x, ay = cp1.y
    const ra = cp1.isPulley ? cp1.r : 0
    const bx = cp2.x, by = cp2.y
    const rb = cp2.isPulley ? cp2.r : 0

    const dx = bx - ax
    const dy = by - ay
    const d = Math.hypot(dx, dy)

    let thetaA = 0
    let thetaB = 0

    if (d < 1e-9) {
      thetaA = 0
      thetaB = 0
    } else {
      const alpha = Math.atan2(dy, dx)
      let mathSideA = cp1.isPulley ? (cp1.side === 'none' ? 'cw' : cp1.side) : 'none'
      let mathSideB = cp2.isPulley ? (cp2.side === 'none' ? 'cw' : cp2.side) : 'none'

      if (mathSideA === 'none' && mathSideB !== 'none') mathSideA = mathSideB
      if (mathSideB === 'none' && mathSideA !== 'none') mathSideB = mathSideA
      if (mathSideA === 'none') mathSideA = 'cw'
      if (mathSideB === 'none') mathSideB = 'cw'

      if (mathSideA === mathSideB) {
        const ratio = Math.max(-1.0, Math.min(1.0, (ra - rb) / d))
        const gamma = Math.acos(ratio)
        if (mathSideA === 'cw') {
          thetaA = alpha + gamma
          thetaB = alpha + gamma
        } else {
          thetaA = alpha - gamma
          thetaB = alpha - gamma
        }
      } else {
        const ratio = Math.max(-1.0, Math.min(1.0, (ra + rb) / d))
        const gamma = Math.acos(ratio)
        if (mathSideA === 'cw') {
          thetaA = alpha + gamma
          thetaB = alpha + gamma - Math.PI
        } else {
          thetaA = alpha - gamma
          thetaB = alpha - gamma + Math.PI
        }
      }
    }

    const ptA = { x: ax + ra * Math.cos(thetaA), y: ay + ra * Math.sin(thetaA) }
    const ptB = { x: bx + rb * Math.cos(thetaB), y: by + rb * Math.sin(thetaB) }

    cp1.exit = ptA
    cp1.exitAngleRad = thetaA
    cp2.entry = ptB
    cp2.entryAngleRad = thetaB
  }

  const cpFirst = contactPoints[0]
  if (cpFirst.isPulley && cpFirst.entry === undefined) {
    cpFirst.entryAngleRad = Math.PI / 2
    cpFirst.entry = {
      x: cpFirst.x + cpFirst.r * Math.cos(Math.PI / 2),
      y: cpFirst.y + cpFirst.r * Math.sin(Math.PI / 2),
    }
  }

  const cpLast = contactPoints[contactPoints.length - 1]
  if (cpLast.isPulley && cpLast.exit === undefined) {
    cpLast.exitAngleRad = -Math.PI / 2
    cpLast.exit = {
      x: cpLast.x + cpLast.r * Math.cos(-Math.PI / 2),
      y: cpLast.y + cpLast.r * Math.sin(-Math.PI / 2),
    }
  }

  const parts: CanvasRopePart[] = []

  for (let i = 0; i < contactPoints.length; i++) {
    const cp = contactPoints[i]

    if (cp.isPulley && cp.entry && cp.exit && cp.entryAngleRad !== undefined && cp.exitAngleRad !== undefined) {
      const startWorld = cp.entry
      const endWorld = cp.exit
      const centerWorld = { x: cp.x, y: cp.y }

      const startCanvas = worldToCanvas(startWorld, bounds)
      const endCanvas = worldToCanvas(endWorld, bounds)
      const centerCanvas = worldToCanvas(centerWorld, bounds)
      const radiusPx = Math.max(1, cp.r * scale)

      const side = cp.side === 'none' ? 'cw' : cp.side
      let diff = cp.exitAngleRad - cp.entryAngleRad

      if (side === 'cw') {
        while (diff > 0) diff -= 2 * Math.PI
        while (diff <= -2 * Math.PI) diff += 2 * Math.PI
      } else {
        while (diff < 0) diff += 2 * Math.PI
        while (diff >= 2 * Math.PI) diff -= 2 * Math.PI
      }

      const sweepRad = Math.abs(diff)
      const largeArcFlag = sweepRad > Math.PI ? 1 : 0
      const sweepFlag = side === 'cw' ? 1 : 0

      const pathD = `M ${startCanvas.x.toFixed(2)} ${startCanvas.y.toFixed(2)} A ${radiusPx.toFixed(2)} ${radiusPx.toFixed(2)} 0 ${largeArcFlag} ${sweepFlag} ${endCanvas.x.toFixed(2)} ${endCanvas.y.toFixed(2)}`

      parts.push({
        type: 'arc',
        segmentIndex: i === 0 ? 0 : i - 1,
        startCanvas,
        endCanvas,
        centerCanvas,
        radiusPx,
        largeArcFlag,
        sweepFlag,
        pathD,
      })
    }

    if (i < contactPoints.length - 1) {
      const fromPtWorld = cp.exit ?? { x: cp.x, y: cp.y }
      const toPtWorld = contactPoints[i + 1].entry ?? { x: contactPoints[i + 1].x, y: contactPoints[i + 1].y }

      const p1Canvas = worldToCanvas(fromPtWorld, bounds)
      const p2Canvas = worldToCanvas(toPtWorld, bounds)

      const pathD = `M ${p1Canvas.x.toFixed(2)} ${p1Canvas.y.toFixed(2)} L ${p2Canvas.x.toFixed(2)} ${p2Canvas.y.toFixed(2)}`

      parts.push({
        type: 'line',
        segmentIndex: i,
        p1Canvas,
        p2Canvas,
        pathD,
      })
    }
  }

  return parts
}
