// SPDX-License-Identifier: AGPL-3.0-or-later

export interface StellenwertColumn {
  id: string
  label: string
  color: string
  active: boolean
}

export interface StellenwertGroup {
  id: string
  label: string
  start_col_id: string
  end_col_id: string
  color: string
}

export interface StellenwertRow {
  id: string
  label?: string
  values: Record<string, number | null>
  active?: boolean
  is_placeholder?: boolean
}

export interface StellenwertLayout {
  show_header: boolean
  show_row_labels: boolean
  show_grid: boolean
  row_height: number
  col_width: number
  token_style: 'filled' | 'outline' | 'cross'
  token_size: number
  max_tokens_per_row: number
  header_vertical: boolean
  auto_header_height: boolean
  header_height: number
  color_column_rows: boolean
  column_bg_opacity: number
  header_bg_opacity: number
  column_bg_opacity_ratio: number
}

export interface StellenwertConfig {
  columns: StellenwertColumn[]
  groups: StellenwertGroup[]
  rows: StellenwertRow[]
  mode: 'Ziffern' | 'Plättchen' | 'Beides' | 'Leer'
  layout: StellenwertLayout
  decimal_separator_pos: number | null
  font_size: string
  font_family: string
  use_fira?: boolean // Legacy
}

export type StellenwertLayoutUpdater = <K extends keyof StellenwertLayout>(key: K, value: StellenwertLayout[K]) => void
export type StellenwertColumnUpdater = <K extends keyof StellenwertColumn>(idx: number, field: K, value: StellenwertColumn[K]) => void
export type StellenwertGroupUpdater = <K extends keyof StellenwertGroup>(idx: number, field: K, value: StellenwertGroup[K]) => void
