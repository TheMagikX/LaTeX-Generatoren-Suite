// SPDX-License-Identifier: AGPL-3.0-or-later

import type { 
  LightSource, PathNode, Barrier, RefractionArea, 
  RefractionAnnotations, StrahlenoptikConfig 
} from './typesStrahlen'

export const DEFAULT_SOURCE: LightSource = {
  x: -7, y: 0, angle: 0, spread: 0, num_rays: 1,
  extended_width: 0, ray_color: 'yellow!90!black', label: '',
  show_light_zone: false, light_zone_opacity: 0.2,
  source_size: 3, ray_line_width: 2,
}

export const DEFAULT_NODE: PathNode = {
  x: 0, y: 0, connection: 'line', bend: 0, out_angle: 0, in_angle: 0
}

export const DEFAULT_BARRIER: Barrier = {
  nodes: [{ ...DEFAULT_NODE, x: 0, y: -2 }, { ...DEFAULT_NODE, x: 0, y: 2 }],
  is_closed: false, reflecting: false, color: 'black', line_width: 2.0, label: '',
}

export const DEFAULT_REFRACTION_AREA: RefractionArea = {
  mode: 'rectangle',
  x_min: -2, x_max: 2, y_min: -5, y_max: 5,
  nodes: [
    { ...DEFAULT_NODE, x: 0, y: -3, connection: 'arc', bend: 30 },
    { ...DEFAULT_NODE, x: 0, y: 3, connection: 'arc', bend: 30 }
  ],
  refractive_index: 1.5,
  fill_color: 'cyan', fill_opacity: 0.15,
  border_color: 'cyan!60!black', border_width: 0.8,
  label: 'n = 1{,}5',
}

export const DEFAULT_REFRACTION_ANNOTATIONS: RefractionAnnotations = {
  show_normals: false,
  normal_color: 'gray',
  normal_line_width: 0.5,
  normal_length: 2.0,
  normal_style: 'dashed',
  show_angle_arcs: false,
  show_angle_labels: true,
  incident_color: 'orange',
  incident_radius: 1.0,
  incident_opacity: 0.2,
  incident_label: '$\\alpha$',
  refracted_color: 'teal',
  refracted_radius: 1.0,
  refracted_opacity: 0.2,
  refracted_label: '$\\beta$',
}

export const DEFAULT_CONFIG: StrahlenoptikConfig = {
  light_sources: [{ ...DEFAULT_SOURCE }],
  barriers: [],
  refraction_areas: [{ ...DEFAULT_REFRACTION_AREA, mode: 'path' }],
  refraction_annotations: { ...DEFAULT_REFRACTION_ANNOTATIONS },
  max_reflections: 5,
  show_shadow_zones: false,
  shadow_color: 'black',
  shadow_opacity: 0.35,
  partial_shadow_color: 'black',
  partial_shadow_opacity: 0.15,
  canvas_x_min: -10,
  canvas_x_max: 10,
  canvas_y_min: -10,
  canvas_y_max: 10,
  show_grid: false,
  grid_step: 1.0,
  show_axes: true,
  ray_line_width: 0.8,
  ray_arrow: true,
  font_family: 'Inter',
}
