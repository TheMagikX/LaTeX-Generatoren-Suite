// SPDX-License-Identifier: AGPL-3.0-or-later

import type { OptikConfig, OptikObject, LightSource } from './typesOptik'

export const DEFAULT_OBJECT: OptikObject = {
  show: true,
  x: -5, G: 2, label: 'G', color: 'blue',
  parallel_ray: { show: true, color: 'orange', width: 1.0 },
  central_ray: { show: true, color: 'green!60!black', width: 1.0 },
  focal_ray: { show: true, color: 'violet', width: 1.0 }
}

export const DEFAULT_SOURCE: LightSource = {
  show: true,
  x: -7, y: 2, label: '', source_size: 2,
  parallel_ray: { show: false, color: 'yellow!90!black', width: 0.8 },
  central_ray: { show: true, color: 'yellow!90!black', width: 0.8 },
  focal_ray: { show: false, color: 'yellow!90!black', width: 0.8 }
}

export const DEFAULT_CONFIG: OptikConfig = {
  telescope_mode: false,
  alpha: 5.0,
  objects: [{ ...DEFAULT_OBJECT }],
  light_sources: [],
  lenses: [{ x: 0.0, f: 3.0, h: 4.0 }],
  axis_extra: 1.5,
  realistic_lens: true,
  show_lens_plane: true,
  show_annot_g: false,
  show_annot_b: false,
  show_annot_f: false,
  show_annot_G: false,
  show_annot_B: false,
  virtual_ray_extension: 1.0,
  font_family: 'Fira',
}
