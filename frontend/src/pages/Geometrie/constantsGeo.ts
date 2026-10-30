// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Config, HelperLine } from './typesGeo'

export const DEFAULT_HELPER: HelperLine = {
  show: false,
  show_label: true,
  show_right_angle: true,
  label: '',
  options: String.raw`pos=0.5, auto, font=\tiny`,
  style: 'dashed, color=gray',
}

export const DEFAULT_CONFIG: Config = {
  shape: 'Triangle',
  construction: { mode: 'SSS', rotation: 0, a: 4.0, b: 3.5, c: 5.0, alpha: 40, beta: 60, step: 0 },
  quad_construction: { mode: 'Rectangle', a: 5.0, b: 3.0, c: 4.0, alpha: 70, height: 3.0, offset_c: 1.0, p_ax: 0, p_ay: 0, p_bx: 5, p_by: 0, p_cx: 6, p_cy: 3, p_dx: 1, p_dy: 3 },
  elements: {
    points: { show: true, labels: { A: String.raw`$A$`, B: String.raw`$B$`, C: String.raw`$C$`, D: String.raw`$D$` } },
    angles: {
      show_arcs: true,
      show_labels: true,
      labels: { alpha: String.raw`$\alpha$`, beta: String.raw`$\beta$`, gamma: String.raw`$\gamma$`, delta: String.raw`$\delta$` },
      colors: { alpha: 'F1C40F', beta: 'F1C40F', gamma: 'F1C40F', delta: 'F1C40F' },
      radii: { alpha: 7, beta: 7, gamma: 7, delta: 7 },
      opacities: { alpha: 0.2, beta: 0.2, gamma: 0.2, delta: 0.2 },
    },
    measurements: {
      show_sides: { a: false, b: false, c: false, d: false },
      show_angles: { alpha: false, beta: false, gamma: false, delta: false },
    },
    heights: {
      ha: { ...DEFAULT_HELPER, label: String.raw`$h_a$` },
      hb: { ...DEFAULT_HELPER, label: String.raw`$h_b$` },
      hc: { ...DEFAULT_HELPER, label: String.raw`$h_c$` },
    },
    medians: {
      sa: { ...DEFAULT_HELPER, label: String.raw`$s_a$`, options: String.raw`pos=0.7, auto, swap, font=\tiny` },
      sb: { ...DEFAULT_HELPER, label: String.raw`$s_b$`, options: String.raw`pos=0.7, auto, swap, font=\tiny` },
      sc: { ...DEFAULT_HELPER, label: String.raw`$s_c$`, options: String.raw`pos=0.7, auto, swap, font=\tiny` },
    },
    angle_bisectors: {
      wa: { ...DEFAULT_HELPER, label: String.raw`$w_\alpha$`, options: String.raw`pos=0.8, auto, font=\tiny` },
      wb: { ...DEFAULT_HELPER, label: String.raw`$w_\beta$`, options: String.raw`pos=0.8, auto, font=\tiny` },
      wc: { ...DEFAULT_HELPER, label: String.raw`$w_\gamma$`, options: String.raw`pos=0.8, auto, font=\tiny` },
    },
    perpendicular_bisectors: {
      ma: { ...DEFAULT_HELPER, label: String.raw`$m_a$` },
      mb: { ...DEFAULT_HELPER, label: String.raw`$m_b$` },
      mc: { ...DEFAULT_HELPER, label: String.raw`$m_c$` },
    },
    others: { circumcircle: false, incircle: false, grid: false },
  },
  style: {
    fill_color: String.raw`{rgb,255:red,230; green,126; blue,34}`,
    fill_opacity: 0.2,
    stroke_color: 'black',
    line_width: 'semithick',
    helper_style_default: 'dashed, color=gray',
  },
  pakete_laden: true,
  command_laden: true,
  font_family: 'Fira',
  preamble_add: '',
}
