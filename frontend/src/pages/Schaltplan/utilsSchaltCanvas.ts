// SPDX-License-Identifier: AGPL-3.0-or-later

import type { CircuitNode, SchaltplanConfig } from './typesSchalt'

export type SchaltCanvasMode = 'move' | 'node' | 'component'

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

export interface NodeHit {
  id: string
  name: string
}

export const SCHALT_CANVAS_WIDTH = 680
export const SCHALT_CANVAS_HEIGHT = 420
export const SCHALT_CANVAS_PADDING = 36
export const SCHALT_GRID_STEP = 1.0
export const SCHALT_SNAP_STEP = 1.0

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const snapSchaltPoint = (point: CanvasPoint, step = SCHALT_SNAP_STEP): CanvasPoint => ({
  x: Math.round(point.x / step) * step,
  y: Math.round(point.y / step) * step,
})

export const getNextNodeName = (nodes: CircuitNode[]): string => {
  const existing = new Set(nodes.map(node => node.name))
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  for (let suffixIdx = 0; suffixIdx < 100; suffixIdx++) {
    const suffix = suffixIdx === 0 ? '' : (suffixIdx + 1).toString()
    for (const char of alphabet) {
      const name = `${char}${suffix}`
      if (!existing.has(name)) return name
    }
  }

  return `N${nodes.length + 1}`
}

export const getSchaltCanvasBounds = (
  cfg: SchaltplanConfig,
  panOffset: CanvasPoint = { x: 0, y: 0 }
): CanvasBounds => {
  const xs = cfg.nodes.map(node => node.x)
  const ys = cfg.nodes.map(node => node.y)

  const minUserX = xs.length ? Math.min(...xs) : 0
  const maxUserX = xs.length ? Math.max(...xs) : 0
  const minUserY = ys.length ? Math.min(...ys) : 0
  const maxUserY = ys.length ? Math.max(...ys) : 0

  // Default origin (0,0) at bottom-left corner with range [0..12] for X and [0..7] for Y
  const baseMinX = Math.min(0, Math.floor(minUserX))
  const baseMaxX = Math.max(12, Math.ceil(maxUserX + 1))
  const baseMinY = Math.min(0, Math.floor(minUserY))
  const baseMaxY = Math.max(7, Math.ceil(maxUserY + 1))

  return {
    minX: baseMinX + panOffset.x,
    maxX: baseMaxX + panOffset.x,
    minY: baseMinY + panOffset.y,
    maxY: baseMaxY + panOffset.y,
  }
}

export const worldToSchaltCanvas = (point: CanvasPoint, bounds: CanvasBounds): CanvasPoint => {
  const innerW = SCHALT_CANVAS_WIDTH - SCHALT_CANVAS_PADDING * 2
  const innerH = SCHALT_CANVAS_HEIGHT - SCHALT_CANVAS_PADDING * 2

  return {
    x: SCHALT_CANVAS_PADDING + ((point.x - bounds.minX) / (bounds.maxX - bounds.minX)) * innerW,
    y: SCHALT_CANVAS_PADDING + ((bounds.maxY - point.y) / (bounds.maxY - bounds.minY)) * innerH,
  }
}

export const schaltCanvasToWorld = (point: CanvasPoint, bounds: CanvasBounds): CanvasPoint => {
  const innerW = SCHALT_CANVAS_WIDTH - SCHALT_CANVAS_PADDING * 2
  const innerH = SCHALT_CANVAS_HEIGHT - SCHALT_CANVAS_PADDING * 2

  return snapSchaltPoint({
    x: bounds.minX + ((point.x - SCHALT_CANVAS_PADDING) / innerW) * (bounds.maxX - bounds.minX),
    y: bounds.maxY - ((point.y - SCHALT_CANVAS_PADDING) / innerH) * (bounds.maxY - bounds.minY),
  })
}

export const getSchaltPointerCanvasPoint = (
  clientX: number,
  clientY: number,
  svg: SVGSVGElement | null,
): CanvasPoint => {
  if (!svg) return { x: 0, y: 0 }
  const rect = svg.getBoundingClientRect()

  return {
    x: clamp(((clientX - rect.left) / rect.width) * SCHALT_CANVAS_WIDTH, 0, SCHALT_CANVAS_WIDTH),
    y: clamp(((clientY - rect.top) / rect.height) * SCHALT_CANVAS_HEIGHT, 0, SCHALT_CANVAS_HEIGHT),
  }
}

export const createSchaltNodeAt = (cfg: SchaltplanConfig, point: CanvasPoint): CircuitNode => ({
  id: crypto.randomUUID(),
  name: getNextNodeName(cfg.nodes),
  x: point.x,
  y: point.y,
})

export const findSchaltNodeHit = (
  cfg: SchaltplanConfig,
  canvasPoint: CanvasPoint,
  bounds: CanvasBounds,
): NodeHit | null => {
  for (const node of [...cfg.nodes].reverse()) {
    const center = worldToSchaltCanvas(node, bounds)
    if (Math.hypot(canvasPoint.x - center.x, canvasPoint.y - center.y) <= 22) {
      return { id: node.id, name: node.name }
    }
  }

  return null
}

export const getSchaltGridLines = (bounds: CanvasBounds) => {
  const vertical: number[] = []
  const horizontal: number[] = []

  for (let x = Math.floor(bounds.minX); x <= Math.ceil(bounds.maxX); x += SCHALT_GRID_STEP) {
    vertical.push(Math.round(x))
  }
  for (let y = Math.floor(bounds.minY); y <= Math.ceil(bounds.maxY); y += SCHALT_GRID_STEP) {
    horizontal.push(Math.round(y))
  }

  return { vertical, horizontal }
}

export const getNodeConnectionCount = (nodeName: string, components: SchaltplanConfig['components']): number => {
  let count = 0
  for (const comp of components) {
    if (comp.from_node === nodeName) count++
    if (comp.to_node === nodeName) count++
  }
  return count
}

export const isJunctionNode = (node: CircuitNode, components: SchaltplanConfig['components']): boolean => {
  if (typeof node.show_dot === 'boolean') {
    return node.show_dot
  }
  return getNodeConnectionCount(node.name, components) >= 3
}
