// SPDX-License-Identifier: AGPL-3.0-or-later

import type { FlaschenzugConfig, RopeSegmentConfig } from '../../typesFlasche'

export interface ContextMenuState {
  type: 'pulley' | 'anchor' | 'rope_segment'
  targetId: string
  segmentIndex?: number
  title: string
  x: number
  y: number
}

export const PATH_SIDE_OPTIONS: RopeSegmentConfig['side'][] = ['cw', 'ccw', 'none']

export const getElementNameMap = (cfg: FlaschenzugConfig) => {
  const names = new Map<string, { x: number; y: number; kind: 'pulley' | 'anchor' }>()
  cfg.pulleys.forEach(p => names.set(p.name, { x: p.x, y: p.y, kind: 'pulley' }))
  cfg.anchors.forEach(a => names.set(a.name, { x: a.x, y: a.y, kind: 'anchor' }))
  return names
}
