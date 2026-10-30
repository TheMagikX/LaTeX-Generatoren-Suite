// SPDX-License-Identifier: AGPL-3.0-or-later

export interface LensConfig {
  x: number
  f: number
  h: number
}

export interface RayConfig {
  show: boolean
  color: string
  width: number
}

export interface LightSource {
  show: boolean
  x: number
  y: number
  label: string
  source_size: number
  parallel_ray: RayConfig
  central_ray: RayConfig
  focal_ray: RayConfig
}

export interface OptikObject {
  show: boolean
  x: number
  G: number
  label: string
  color: string
  parallel_ray: RayConfig
  central_ray: RayConfig
  focal_ray: RayConfig
}

export interface OptikConfig {
  telescope_mode: boolean
  alpha: number
  objects: OptikObject[]
  light_sources: LightSource[]
  lenses: LensConfig[]
  axis_extra: number
  realistic_lens: boolean
  show_lens_plane: boolean
  show_annot_g: boolean
  show_annot_b: boolean
  show_annot_f: boolean
  show_annot_G: boolean
  show_annot_B: boolean
  virtual_ray_extension: number
  font_family: string
}

export interface ImageMetric {
  x: number | null
  y: number | null
  b: number | null
  g: number | null
  m: number | null
  virtual: boolean
}

export type OptikSetter = <K extends keyof OptikConfig>(key: K, value: OptikConfig[K]) => void
export type OptikObjectUpdater = <K extends keyof OptikObject>(idx: number, key: K, value: OptikObject[K]) => void
export type LightSourceUpdater = <K extends keyof LightSource>(idx: number, key: K, value: LightSource[K]) => void
