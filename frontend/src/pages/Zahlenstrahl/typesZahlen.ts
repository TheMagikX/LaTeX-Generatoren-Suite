// SPDX-License-Identifier: AGPL-3.0-or-later

export interface MarkedPointConfig {
  value: number
  type: string
  label: string
  visible: boolean
  color?: string
  label_color?: string
}

export interface JumpConfig {
  start: number
  end: number
  label: string
  style: string
  arrow: string
  visible: boolean
  color?: string
  label_color?: string
}

export interface IntervalConfig {
  von: number
  bis: number
  color: string
  left_type: string
  right_type: string
  visible: boolean
}

export interface PointerConfig {
  value: number
  label: string
  color: string
  label_color?: string
  visible: boolean
}

export interface ZahlenstrahlConfig {
  min_val: number
  max_val: number
  width_cm: number
  x_scale?: number
  padding: number

  // Ticks - Dreistufige Hierarchie
  step_main: number
  step_mid: number | null
  step_sub: number | null
  tick_main_h: number
  tick_mid_h: number
  tick_sub_h: number
  tick_main_width: string
  tick_mid_width: string
  tick_sub_width: string
  line_width: string

  // Beschriftung & Formatierung
  show_labels: boolean
  label_density: 'major_only' | 'major_and_mid' | 'all' | 'every_nth'
  label_every_nth: number
  label_as_fraction: boolean
  fraction_style: 'auto' | 'fixed_denominator' | 'mixed'
  fraction_denominator: number | null
  fraction_inline: boolean
  decimal_separator: string
  decimal_precision: number | null
  decimal_fixed_zerofill: boolean
  hidden_ticks: number[]
  hide_style: string

  // Presets
  scale_preset?: string | null

  // Style
  arrow_type: string
  jump_out_angle: number

  // Colors
  color_axis: string
  color_main_tick: string
  color_mid_tick?: string | null
  color_sub_tick: string
  color_label: string
  color_point: string
  color_jump: string

  // Collections
  points: MarkedPointConfig[]
  jumps: JumpConfig[]
  intervals: IntervalConfig[]
  pointers: PointerConfig[]
  zoom_points: MarkedPointConfig[]
  zoom_intervals: IntervalConfig[]
  zoom_pointers: PointerConfig[]

  // Zoom
  zoom_active: boolean
  zoom_min: number
  zoom_max: number
  zoom_scale: number
  zoom_use_divisions: boolean
  zoom_divisions_main: number
  zoom_divisions_sub: number
  zoom_step_main: number | null
  zoom_step_mid?: number | null
  zoom_step_sub: number | null
  zoom_show_labels: boolean
  zoom_label_density?: string | null
  zoom_show_points: boolean
  zoom_show_pointers: boolean
  zoom_show_jumps: boolean
  zoom_show_intervals: boolean

  font_family: string
}

export type ZahlenCollection = 'points' | 'jumps' | 'intervals' | 'pointers' | 'zoom_points' | 'zoom_intervals' | 'zoom_pointers'
export type ZahlenZoomCollection = 'zoom_points' | 'zoom_intervals' | 'zoom_pointers'
export type ZahlenSetter = <K extends keyof ZahlenstrahlConfig>(key: K, value: ZahlenstrahlConfig[K]) => void
export type ZahlenBatchSetter = (updates: Partial<ZahlenstrahlConfig>) => void
export type ZahlenItem = MarkedPointConfig | JumpConfig | IntervalConfig | PointerConfig
export type ZahlenUpdateItem = <C extends ZahlenCollection, K extends keyof ZahlenstrahlConfig[C][number]>(
  collection: C,
  idx: number,
  field: K,
  value: ZahlenstrahlConfig[C][number][K]
) => void
