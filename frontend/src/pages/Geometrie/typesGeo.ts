// SPDX-License-Identifier: AGPL-3.0-or-later

export interface HelperLine {
  show: boolean
  show_label: boolean
  show_right_angle: boolean
  label: string
  options: string
  style: string
}

export interface Config {
  shape: 'Triangle' | 'Quadrilateral'
  construction: {
    mode: 'SSS' | 'SWS' | 'WSW'
    rotation: number
    a: number
    b: number
    c: number
    alpha: number
    beta: number
    step: number
  }
  quad_construction: {
    mode: 'Parallelogram' | 'Trapezoid' | 'Rectangle' | 'Rhombus' | 'Kite' | 'FreeQuad'
    a: number
    b: number
    c: number
    alpha: number
    height: number
    offset_c: number
    p_ax: number; p_ay: number
    p_bx: number; p_by: number
    p_cx: number; p_cy: number
    p_dx: number; p_dy: number
  }
  elements: {
    points: {
      show: boolean
      labels: { A: string; B: string; C: string; D: string }
    }
    angles: {
      show_arcs: boolean
      show_labels: boolean
      labels: { alpha: string; beta: string; gamma: string; delta: string }
      colors: { alpha: string; beta: string; gamma: string; delta: string }
      radii: { alpha: number; beta: number; gamma: number; delta: number }
      opacities: { alpha: number; beta: number; gamma: number; delta: number }
    }
    measurements: {
      show_sides: { a: boolean; b: boolean; c: boolean; d: boolean }
      show_angles: { alpha: boolean; beta: boolean; gamma: boolean; delta: boolean }
    }
    heights: { ha: HelperLine; hb: HelperLine; hc: HelperLine }
    medians: { sa: HelperLine; sb: HelperLine; sc: HelperLine }
    angle_bisectors: { wa: HelperLine; wb: HelperLine; wc: HelperLine }
    perpendicular_bisectors: { ma: HelperLine; mb: HelperLine; mc: HelperLine }
    others: { circumcircle: boolean; incircle: boolean; grid: boolean }
  }
  style: {
    fill_color: string
    fill_opacity: number
    stroke_color: string
    line_width: string
    helper_style_default: string
  }
  pakete_laden: boolean
  command_laden: boolean
  font_family: string
  preamble_add: string
}

export interface GeoSolved {
  sides: { a?: number; b?: number; c?: number; d?: number }
  angles: { alpha?: number; beta?: number; gamma?: number; delta?: number }
  diagonals?: { e?: number; f?: number }
  area?: number
  perimeter?: number
}
