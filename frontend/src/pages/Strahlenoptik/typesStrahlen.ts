// SPDX-License-Identifier: AGPL-3.0-or-later

export interface LightSource {
  x: number
  y: number
  angle: number
  spread: number
  num_rays: number
  extended_width: number
  ray_color: string
  label: string
  show_light_zone: boolean
  light_zone_opacity: number
  source_size: number
  ray_line_width: number
}

export interface PathNode {
  x: number
  y: number
  connection: 'line' | 'arc' | 'bezier'
  bend: number
  out_angle: number
  in_angle: number
}

export interface Barrier {
  nodes: PathNode[]
  is_closed: boolean
  reflecting: boolean
  color: string
  line_width: number
  label: string
}

export interface RefractionArea {
  mode: 'rectangle' | 'path'
  x_min: number
  x_max: number
  y_min: number
  y_max: number
  nodes: PathNode[]
  refractive_index: number
  fill_color: string
  fill_opacity: number
  border_color: string
  border_width: number
  label: string
}

export interface RefractionAnnotations {
  show_normals: boolean
  normal_color: string
  normal_line_width: number
  normal_length: number
  normal_style: string
  show_angle_arcs: boolean
  show_angle_labels: boolean
  incident_color: string
  incident_radius: number
  incident_opacity: number
  incident_label: string
  refracted_color: string
  refracted_radius: number
  refracted_opacity: number
  refracted_label: string
}

export interface StrahlenoptikConfig {
  light_sources: LightSource[]
  barriers: Barrier[]
  refraction_areas: RefractionArea[]
  refraction_annotations: RefractionAnnotations
  max_reflections: number
  show_shadow_zones: boolean
  shadow_color: string
  shadow_opacity: number
  partial_shadow_color: string
  partial_shadow_opacity: number
  canvas_x_min: number
  canvas_x_max: number
  canvas_y_min: number
  canvas_y_max: number
  show_grid: boolean
  grid_step: number
  show_axes: boolean
  ray_line_width: number
  ray_arrow: boolean
  font_family: string
}

export type StrahlenSetter = <K extends keyof StrahlenoptikConfig>(key: K, value: StrahlenoptikConfig[K]) => void
export type StrahlenLightSourceUpdater = <K extends keyof LightSource>(idx: number, key: K, value: LightSource[K]) => void
export type StrahlenBarrierUpdater = <K extends keyof Barrier>(idx: number, key: K, value: Barrier[K]) => void
export type StrahlenPathNodeUpdater = <K extends keyof PathNode>(ownerIndex: number, nodeIndex: number, key: K, value: PathNode[K]) => void
export type StrahlenAreaUpdater = <K extends keyof RefractionArea>(idx: number, key: K, value: RefractionArea[K]) => void
export type StrahlenAnnotationUpdater = <K extends keyof RefractionAnnotations>(key: K, value: RefractionAnnotations[K]) => void
