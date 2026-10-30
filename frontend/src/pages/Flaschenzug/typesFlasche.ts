// SPDX-License-Identifier: AGPL-3.0-or-later

export type PulleyLabelPos =
  | 'above'
  | 'above right'
  | 'right'
  | 'below right'
  | 'below'
  | 'below left'
  | 'left'
  | 'above left'

export interface PulleyConfig {
  id: string
  name: string
  x: number
  y: number
  radius: number
  label: string
  label_pos: PulleyLabelPos
  mount: 'Keine' | 'Einseitig' | 'Zweiseitig'
  mount_angle: number
  mount_length: number
}

export interface AnchorConfig {
  id: string
  name: string
  x: number
  y: number
  label: string
  shape: 'Kreis' | 'Rechteck' | 'Keine'
  size: number
}

export interface RopeSegmentConfig {
  name: string
  side: 'cw' | 'ccw' | 'none'
}

export interface RopeConfig {
  id: string
  name: string
  path: RopeSegmentConfig[]
  style: 'plain' | 'rope'
  color: string
  width: number
}

export interface MassConfig {
  id: string
  ref: string
  name: string
  length: number
  label: string
  relation: string
}

export interface ForceConfig {
  id: string
  ref_type: string
  ref_name: string
  magnitude: number
  angle: number
  label: string
  color: string
}

export interface ManualMountConfig {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  type: string
}

export interface FlaschenzugGlobalConfig {
  style_scale: number
  tikz_opts: string
  preview_grid: boolean
  coordinate_helpers_preview_only: boolean
  show_labels: boolean
  rope_style: string
  rope_color: string
}

export interface FlaschenzugEnvironmentConfig {
  show_boden: boolean
  boden_y: number
  boden_width: number
  show_decke: boolean
  decke_y: number
  decke_width: number
}

export interface FlaschenzugConfig {
  pulleys: PulleyConfig[]
  anchors: AnchorConfig[]
  ropes: RopeConfig[]
  masses: MassConfig[]
  forces: ForceConfig[]
  manual_mounts: ManualMountConfig[]
  global_opts: FlaschenzugGlobalConfig
  environment: FlaschenzugEnvironmentConfig
}
