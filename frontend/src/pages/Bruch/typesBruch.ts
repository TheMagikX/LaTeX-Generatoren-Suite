// SPDX-License-Identifier: AGPL-3.0-or-later

export interface BruchConfig {
  zaehler: number
  nenner: number
  form: string
  fill_color: string
  border_color: string
  seed: number
  show_label: boolean
  label_override: string
  rect_mode: string
  rect_rows: number
  erweiter_faktor: number
  split_mode: string
  split_style: string
  border_width: number
  fill_pattern: string
  mixed_number: boolean
  show_erweitern: boolean
  show_kuerzen: boolean
  font_family: string
}

export interface CompileResult {
  ok: boolean
  png_base64?: string
  pdf_base64?: string
  svg_base64?: string
  log?: string
}
