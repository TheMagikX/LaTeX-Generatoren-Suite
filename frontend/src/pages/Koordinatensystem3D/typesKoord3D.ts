// SPDX-License-Identifier: AGPL-3.0-or-later

export interface Point3D {
  show: boolean; name: string; x: number; y: number; z: number
  label: string; color: string; mark: string; size: number; anchor: string
  trail: boolean; trail_marks: boolean; trail_color: string; trail_style: string; trail_width: number; trail_alpha: number
  proj_xy: boolean; proj_xz: boolean; proj_yz: boolean; proj_color: string; proj_style: string
}

export interface Vector3D {
  show: boolean; name: string; x1: number; y1: number; z1: number; x2: number; y2: number; z2: number
  color: string; style: string; width: number; arrow: string; label: string; label_pos: string
  draw_mode: 'vorne' | 'hinten' | 'automatisch'; behind_style: string
  start_point_idx: number | null; end_point_idx: number | null
}

export interface Line3D {
  show: boolean; name: string; x0: number; y0: number; z0: number; rx: number; ry: number; rz: number
  color: string; style: string; width: number; tmin: number; tmax: number
  rvec_show: boolean; rvec_color?: string; rvec_style?: string; rvec_width?: number; rvec_arrow?: string; rvec_label: string; rvec_label_style: string
  svec_show: boolean; svec_color?: string; svec_style?: string; svec_width?: number; svec_arrow?: string; svec_label: string; svec_label_style: string
  draw_mode: 'vorne' | 'hinten' | 'automatisch'; behind_style: string
  line_mode: 'stuetz_richtung' | '2_punkte'
  svec_point_idx: number | null
  pt1_x: number; pt1_y: number; pt1_z: number
  pt2_x: number; pt2_y: number; pt2_z: number
  pt1_idx: number | null; pt2_idx: number | null
}

export interface Plane3D {
  show: boolean; name: string; mode: string
  x1: number; y1: number; z1: number; x2: number; y2: number; z2: number; x3: number; y3: number; z3: number
  n1: number; n2: number; n3: number; d: number
  color: string; alpha: number; pattern: string
  normal_show: boolean
  normal_color?: string
  normal_style?: string
  normal_width?: number
  normal_arrow?: string
  normal_label?: string
  normal_label_pos?: string
  p1_idx: number | null; p2_idx: number | null; p3_idx: number | null
}

export interface Shape3D {
  show: boolean
  name: string
  point_indices: number[]
  color: string
  fill_color: string
  fill_alpha: number
  width: number
  style: string
  closed: boolean
}

export interface Intersection {
  show: boolean; type: string; item1_index: number; item2_index: number;
  color: string; label: string; mark: string; size: number; width: number; style: string;
}

export interface Config3D {
  xmin: number; xmax: number; ymin: number; ymax: number; zmin: number; zmax: number
  label_show: boolean
  xlabel: string; xlabel_pos: string; xlabel_background: boolean; xlabel_background_sep: number
  ylabel: string; ylabel_pos: string; ylabel_background: boolean; ylabel_background_sep: number
  zlabel: string; zlabel_pos: string; zlabel_background: boolean; zlabel_background_sep: number
  majorticklabels: boolean; ticks_show: boolean; tick_mode: string
  xticklist: string; yticklist: string; zticklist: string
  scale_x: number; scale_y: number; scale_z: number
  tickformat_x: string; tickformat_y: string; tickformat_z: string
  mult_x: number; mult_y: number; mult_z: number
  prec_x: number; prec_y: number; prec_z: number
  sep_x: boolean; sep_y: boolean; sep_z: boolean
  label_suffix_x: string; label_suffix_y: string; label_suffix_z: string
  axis_width: number; axis_color: string; axis_arrow: string; axis_on_top: boolean
  tick_width: number; tick_color: string; tick_length: number; minor_ticks: boolean; minor_tick_num: number
  azimuth: number; elevation: number
  width_cm: number
  points: Point3D[]; vectors: Vector3D[]; lines: Line3D[]; planes: Plane3D[]; intersections: Intersection[]; shapes: Shape3D[]
  manual_code: string
  pakete_laden: boolean; command_laden: boolean; font_family: string
}

export type Koord3DCollection = 'points' | 'vectors' | 'lines' | 'planes' | 'intersections' | 'shapes'
export type Koord3DCollectionMap = {
  points: Point3D[]
  vectors: Vector3D[]
  lines: Line3D[]
  planes: Plane3D[]
  intersections: Intersection[]
  shapes: Shape3D[]
}
export type Koord3DItem<C extends Koord3DCollection> = Koord3DCollectionMap[C][number]
export type Config3DSetter = <K extends keyof Config3D>(key: K, value: Config3D[K]) => void
export type Koord3DItemUpdater<C extends Koord3DCollection> = <K extends keyof Koord3DItem<C>>(i: number, field: K, value: Koord3DItem<C>[K]) => void
export type Point3DUpdater = Koord3DItemUpdater<'points'>
export type Vector3DUpdater = Koord3DItemUpdater<'vectors'>
export type Line3DUpdater = Koord3DItemUpdater<'lines'>
export type Plane3DUpdater = Koord3DItemUpdater<'planes'>
export type Shape3DUpdater = Koord3DItemUpdater<'shapes'>
export type IntersectionUpdater = Koord3DItemUpdater<'intersections'>
