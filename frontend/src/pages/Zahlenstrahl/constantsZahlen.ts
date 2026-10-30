// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ZahlenstrahlConfig } from './typesZahlen'

export interface ScalePreset {
  id: string
  label: string
  badge: string
  description: string
  values: Partial<ZahlenstrahlConfig>
}

export const SCALE_PRESETS: ScalePreset[] = [
  {
    id: 'ganze',
    label: 'Ganze Zahlen',
    badge: '1er',
    description: 'Schritte in Ganzen (1, 2, 3...) ohne Unterteilungen',
    values: {
      step_main: 1.0,
      step_mid: null,
      step_sub: null,
      label_as_fraction: false,
      label_density: 'major_only',
      decimal_precision: null,
      scale_preset: 'ganze',
    },
  },
  {
    id: 'zehntel',
    label: 'Zehntel (Dezimal)',
    badge: '0,1',
    description: 'Ganze (1), Hälften (0,5) und Zehntel (0,1)',
    values: {
      step_main: 1.0,
      step_mid: 0.5,
      step_sub: 0.1,
      tick_main_h: 0.14,
      tick_mid_h: 0.09,
      tick_sub_h: 0.05,
      label_as_fraction: false,
      label_density: 'major_only',
      decimal_precision: 1,
      decimal_fixed_zerofill: false,
      scale_preset: 'zehntel',
    },
  },
  {
    id: 'hundertstel',
    label: 'Hundertstel (Dezimal)',
    badge: '0,01',
    description: 'Zehntel (0,1), 0,05-Mitte und Hundertstel (0,01)',
    values: {
      min_val: 0.0,
      max_val: 0.5,
      step_main: 0.1,
      step_mid: 0.05,
      step_sub: 0.01,
      tick_main_h: 0.14,
      tick_mid_h: 0.09,
      tick_sub_h: 0.05,
      label_as_fraction: false,
      label_density: 'major_only',
      decimal_precision: 2,
      decimal_fixed_zerofill: true,
      scale_preset: 'hundertstel',
    },
  },
  {
    id: 'viertel',
    label: 'Halbe & Viertel',
    badge: '1/4',
    description: 'Ganze (1), Hälften (1/2) und Viertel (1/4)',
    values: {
      step_main: 1.0,
      step_mid: 0.5,
      step_sub: 0.25,
      tick_main_h: 0.14,
      tick_mid_h: 0.09,
      tick_sub_h: 0.05,
      label_as_fraction: true,
      fraction_style: 'auto',
      fraction_denominator: 4,
      label_density: 'major_and_mid',
      scale_preset: 'viertel',
    },
  },
  {
    id: 'achtel',
    label: 'Achtel',
    badge: '1/8',
    description: 'Ganze (1), Hälften (1/2), Viertel/Achtel (1/8)',
    values: {
      step_main: 1.0,
      step_mid: 0.5,
      step_sub: 0.125,
      tick_main_h: 0.14,
      tick_mid_h: 0.09,
      tick_sub_h: 0.05,
      label_as_fraction: true,
      fraction_style: 'auto',
      fraction_denominator: 8,
      label_density: 'major_only',
      scale_preset: 'achtel',
    },
  },
  {
    id: 'drittel',
    label: 'Drittel & Sechstel',
    badge: '1/3',
    description: 'Ganze (1), Drittel (1/3) und Sechstel (1/6)',
    values: {
      step_main: 1.0,
      step_mid: 0.3333333333,
      step_sub: 0.1666666667,
      tick_main_h: 0.14,
      tick_mid_h: 0.09,
      tick_sub_h: 0.05,
      label_as_fraction: true,
      fraction_style: 'auto',
      fraction_denominator: 6,
      label_density: 'major_only',
      scale_preset: 'drittel',
    },
  },
]

export const DEFAULT_CONFIG: ZahlenstrahlConfig = {
  min_val: -5.0,
  max_val: 5.0,
  width_cm: 12.0,
  padding: 0.5,

  // Ticks
  step_main: 1.0,
  step_mid: null,
  step_sub: 0.5,
  tick_main_h: 0.12,
  tick_mid_h: 0.08,
  tick_sub_h: 0.05,
  tick_main_width: 'semithick',
  tick_mid_width: 'thin',
  tick_sub_width: 'very thin',
  line_width: 'semithick',

  // Beschriftung & Formatierung
  show_labels: true,
  label_density: 'major_only',
  label_every_nth: 1,
  label_as_fraction: false,
  fraction_style: 'auto',
  fraction_denominator: 4,
  fraction_inline: false,
  decimal_separator: ',',
  decimal_precision: null,
  decimal_fixed_zerofill: false,
  hidden_ticks: [],
  hide_style: 'box',

  // Style
  scale_preset: 'ganze',
  arrow_type: '->',
  jump_out_angle: 140,

  // Colors
  color_axis: '#000000',
  color_main_tick: '#000000',
  color_mid_tick: null,
  color_sub_tick: '#000000',
  color_label: '#000000',
  color_point: '#000000',
  color_jump: '#000000',

  // Collections
  points: [],
  jumps: [],
  intervals: [],
  pointers: [],
  zoom_points: [],
  zoom_intervals: [],
  zoom_pointers: [],

  // Zoom
  zoom_active: false,
  zoom_min: 1.0,
  zoom_max: 2.0,
  zoom_scale: 2.0,
  zoom_use_divisions: true,
  zoom_divisions_main: 10,
  zoom_divisions_sub: 5,
  zoom_step_main: null,
  zoom_step_mid: null,
  zoom_step_sub: null,
  zoom_show_labels: true,
  zoom_label_density: null,
  zoom_show_points: true,
  zoom_show_pointers: true,
  zoom_show_jumps: false,
  zoom_show_intervals: true,

  font_family: 'Fira',
}
