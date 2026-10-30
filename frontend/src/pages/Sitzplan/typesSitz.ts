// SPDX-License-Identifier: AGPL-3.0-or-later

export interface Student {
  name: string
  wants_neighbors: string[]
  dislikes_neighbors: string[]
  wants_front: boolean
}

export interface LayoutConfig {
  rows: number
  cols: number
  matrix: number[][]
  front_rows: number
  blocked_seats: [number, number][]
}

export interface HardRules {
  not_same_row: [string, string][]
  not_same_col: [string, string][]
  min_distance: { names: [string, string], k: number }[]
  no_alone?: boolean
  no_alone_vertical?: boolean
  no_alone_diagonal?: boolean
}

export interface SitzplanConfig {
  students: Student[]
  layout: LayoutConfig
  wFront: number
  wNeighbor: number
  includeVertical: boolean
  includeDiagonal: boolean
  mutualFactor: number
  dislikeDistance: number
  hardRules: HardRules
}

export interface SitzplanRequest {
  students: Student[]
  layout: LayoutConfig
  w_front: number
  w_neighbor: number
  include_vertical: boolean
  include_diagonal: boolean
  mutual_factor: number
  dislike_distance: number
  hard_rules: HardRules
}

export interface StudentReport {
  wanted_neighbors: string[]
  neighbors_ok: string[]
  violates_dislike: boolean
  front_wish: boolean
  front_ok: boolean
  partners?: string[]
  is_alone?: boolean
  violates_no_alone?: boolean
}

export interface SitzplanReportRow {
  Schüler: string
  Reihe: number
  Spalte: number
  'Front erfüllt': string
  'Neben erfüllt': string
  'Nicht erfüllte Wünsche': string
  'Abneigungen eingehalten': string
  'Partner'?: string
}

export interface SitzplanResponse {
  assignment: Record<string, number>
  report: SitzplanReportRow[]
  per_student_report: Record<string, StudentReport>
  solver_used: 'ortools' | 'greedy'
}
