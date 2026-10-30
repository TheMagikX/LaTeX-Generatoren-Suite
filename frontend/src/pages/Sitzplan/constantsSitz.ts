// SPDX-License-Identifier: AGPL-3.0-or-later

import type { LayoutConfig, HardRules, SitzplanConfig } from './typesSitz'

export const DEFAULT_LAYOUT: LayoutConfig = {
  rows: 4,
  cols: 9,
  matrix: Array(4).fill(0).map(() => Array(9).fill(1).map((_, c) => c === 4 ? 0 : 1)),
  front_rows: 1,
  blocked_seats: []
}

export const INITIAL_HARD_RULES: HardRules = {
  not_same_row: [],
  not_same_col: [],
  min_distance: [],
  no_alone: false,
  no_alone_vertical: false,
  no_alone_diagonal: false
}

export const DEFAULT_SITZPLAN_CONFIG: SitzplanConfig = {
  students: [],
  layout: DEFAULT_LAYOUT,
  wFront: 2,
  wNeighbor: 4,
  includeVertical: true,
  includeDiagonal: true,
  mutualFactor: 2,
  dislikeDistance: 1,
  hardRules: INITIAL_HARD_RULES
}
