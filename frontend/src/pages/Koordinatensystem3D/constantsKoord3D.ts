// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Config3D } from './typesKoord3D'

export const DEFAULT_CONFIG: Config3D = {
  xmin: 0.0, xmax: 5.0, ymin: 0.0, ymax: 5.0, zmin: 0.0, zmax: 5.0,
  label_show: true,
  xlabel: '\\large $x_1$', xlabel_pos: 'axis cs:4.5,0,0.4', xlabel_background: false, xlabel_background_sep: 1.5,
  ylabel: '\\large $x_2$', ylabel_pos: 'axis cs:0,4.5,0.3', ylabel_background: false, ylabel_background_sep: 1.5,
  zlabel: '\\large $x_3$', zlabel_pos: 'axis cs:0.5,0,4.7', zlabel_background: false, zlabel_background_sep: 1.5,
  majorticklabels: true, ticks_show: true, tick_mode: 'Automatisch',
  xticklist: '0,...,5', yticklist: '0,...,5', zticklist: '0,...,5',
  scale_x: 1.0, scale_y: 1.0, scale_z: 1.0,
  tickformat_x: 'font=\\normalsize', tickformat_y: 'font=\\normalsize', tickformat_z: 'font=\\normalsize',
  mult_x: 1.0, mult_y: 1.0, mult_z: 1.0,
  prec_x: 0, prec_y: 0, prec_z: 0,
  sep_x: false, sep_y: false, sep_z: false,
  label_suffix_x: '', label_suffix_y: '', label_suffix_z: '',
  axis_width: 1.25, axis_color: 'black', axis_arrow: '', axis_on_top: false,
  tick_width: 1.0, tick_color: 'black', tick_length: 3.0, minor_ticks: false, minor_tick_num: 4,
  azimuth: 0, elevation: 30,
  width_cm: 12.0,
  points: [], vectors: [], lines: [], planes: [], intersections: [], shapes: [],
  manual_code: '',
  pakete_laden: true, command_laden: true, font_family: 'Fira',
}

export const FILL_PATTERNS = ['none', 'north east lines', 'north west lines', 'dots', 'crosshatch', 'grid', 'vertical lines', 'horizontal lines']
