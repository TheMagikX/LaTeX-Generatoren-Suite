// SPDX-License-Identifier: AGPL-3.0-or-later

import type { FlaschenzugConfig, RopeConfig, RopeSegmentConfig } from './typesFlasche'

// Generate unique ID utility
export const genId = () => crypto.randomUUID()

// Generate a next available name (e.g., R1, R2, A1, A2)
export const getNextName = (prefix: string, items: { name: string }[]) => {
  const existing = new Set(items.map(i => i.name))
  for (let i = 1; i < 200; i++) {
    const p = `${prefix}${i}`
    if (!existing.has(p)) return p
  }
  return `${prefix}99`
}

type RopeElement =
  | { type: 'pulley'; name: string; x: number; y: number; radius: number }
  | { type: 'anchor'; name: string; x: number; y: number; radius: 0 }

export interface RopePathDiagnostic {
  ropeId: string
  ropeName: string
  severity: 'error' | 'warning'
  message: string
  segmentIndex?: number
}

const distance = (a: RopeElement, b: RopeElement) => Math.hypot(b.x - a.x, b.y - a.y)

const buildElementMap = (cfg: FlaschenzugConfig) => {
  const elements = new Map<string, RopeElement>()
  cfg.pulleys.forEach(p => {
    if (p.name.trim()) elements.set(p.name.trim(), { type: 'pulley', name: p.name.trim(), x: p.x, y: p.y, radius: p.radius })
  })
  cfg.anchors.forEach(a => {
    if (a.name.trim()) elements.set(a.name.trim(), { type: 'anchor', name: a.name.trim(), x: a.x, y: a.y, radius: 0 })
  })
  return elements
}

const segmentLabel = (idx: number) => `Segment ${idx + 1}`

const validateTransition = (
  rope: RopeConfig,
  prevSeg: RopeSegmentConfig,
  seg: RopeSegmentConfig,
  prev: RopeElement,
  current: RopeElement,
  idx: number,
): RopePathDiagnostic | null => {
  if (prev.name === current.name) {
    return {
      ropeId: rope.id,
      ropeName: rope.name,
      severity: 'error',
      segmentIndex: idx,
      message: `${segmentLabel(idx)} wiederholt "${current.name}" direkt hintereinander.`,
    }
  }

  const d = distance(prev, current)
  if (d < 1e-9) {
    return {
      ropeId: rope.id,
      ropeName: rope.name,
      severity: 'error',
      segmentIndex: idx,
      message: `${prev.name} und ${current.name} liegen auf demselben Punkt.`,
    }
  }

  const sideA = prev.type === 'pulley' ? prevSeg.side : 'none'
  const sideB = current.type === 'pulley' ? seg.side : 'none'

  if (prev.type === 'pulley' && current.type === 'pulley') {
    const limit = sideA === sideB
      ? Math.abs(prev.radius - current.radius)
      : prev.radius + current.radius
    if (d < limit) {
      return {
        ropeId: rope.id,
        ropeName: rope.name,
        severity: 'error',
        segmentIndex: idx,
        message: `${prev.name} -> ${current.name}: Tangente nicht möglich, Rollen überlappen für diese Seitenwahl.`,
      }
    }
  }

  if (prev.type !== current.type) {
    const pulley = prev.type === 'pulley' ? prev : current
    if (d < pulley.radius) {
      return {
        ropeId: rope.id,
        ropeName: rope.name,
        severity: 'error',
        segmentIndex: idx,
        message: `${prev.name} -> ${current.name}: Punkt liegt innerhalb der Rolle, Tangente nicht möglich.`,
      }
    }
  }

  return null
}

export const validateRopePaths = (cfg: FlaschenzugConfig): RopePathDiagnostic[] => {
  const elements = buildElementMap(cfg)
  const diagnostics: RopePathDiagnostic[] = []

  cfg.ropes.forEach((rope, ropeIdx) => {
    const ropeName = rope.name || `Seil ${ropeIdx + 1}`

    if (rope.path.length === 0) {
      diagnostics.push({
        ropeId: rope.id,
        ropeName,
        severity: 'error',
        message: `${ropeName} hat keinen Pfad.`,
      })
      return
    }

    if (rope.path.length === 1) {
      diagnostics.push({
        ropeId: rope.id,
        ropeName,
        severity: 'error',
        segmentIndex: 0,
        message: `${ropeName} braucht mindestens zwei Pfadpunkte.`,
      })
    }

    let previous: RopeElement | null = null
    let previousSeg: RopeSegmentConfig | null = null

    rope.path.forEach((seg, idx) => {
      const name = seg.name.trim()
      if (!name) {
        diagnostics.push({
          ropeId: rope.id,
          ropeName,
          severity: 'error',
          segmentIndex: idx,
          message: `${segmentLabel(idx)} hat keinen Elementnamen.`,
        })
        previous = null
        previousSeg = null
        return
      }

      const elem = elements.get(name)
      if (!elem) {
        diagnostics.push({
          ropeId: rope.id,
          ropeName,
          severity: 'error',
          segmentIndex: idx,
          message: `${segmentLabel(idx)} verweist auf unbekanntes Element "${name}".`,
        })
        previous = null
        previousSeg = null
        return
      }

      if (previous && previousSeg) {
        const transitionDiagnostic = validateTransition(rope, previousSeg, seg, previous, elem, idx)
        if (transitionDiagnostic) diagnostics.push(transitionDiagnostic)
      }

      previous = elem
      previousSeg = seg
    })
  })

  return diagnostics
}
