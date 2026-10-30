// SPDX-License-Identifier: AGPL-3.0-or-later

import type { StellenwertColumn, StellenwertRow, StellenwertConfig } from './typesStellenwert'

export const DEFAULT_COLUMNS: StellenwertColumn[] = [
  { id: 'h', label: 'H', color: '#16a34a', active: true },
  { id: 'z', label: 'Z', color: '#dc2626', active: true },
  { id: 'e', label: 'E', color: '#2563eb', active: true },
]

export const DEFAULT_ROWS: StellenwertRow[] = [
  { id: 'row1', label: 'Zahl 1', values: { 'h': null, 'z': 3, 'e': 5 } }
]

export const DEFAULT_CONFIG: StellenwertConfig = {
  columns: DEFAULT_COLUMNS,
  groups: [],
  rows: DEFAULT_ROWS,
  mode: 'Plättchen',
  layout: {
    show_header: true,
    show_row_labels: false,
    show_grid: true,
    row_height: 1.5,
    col_width: 2.0,
    token_style: 'filled',
    token_size: 0.12,
    max_tokens_per_row: 5,
    header_vertical: false,
    auto_header_height: true,
    header_height: 1.0,
    color_column_rows: false,
    column_bg_opacity: 0.1,
    header_bg_opacity: 0.85,
    column_bg_opacity_ratio: 0.80
  },
  decimal_separator_pos: null,
  font_size: 'Large',
  font_family: 'Fira',
}
