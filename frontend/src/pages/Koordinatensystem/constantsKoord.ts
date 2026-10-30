// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Config } from './typesKoord'

export const DEFAULT_CONFIG: Config = {
  xmin: 0.0, xmax: 7.25, ymin: 0.0, ymax: 4.25,
  label_show: true,
  xlabel: '\\large $x$', xlabel_pos: '0.99,0.05', xlabel_background: false, xlabel_background_sep: 1.5,
  ylabel: '\\large $y$', ylabel_pos: '0.02,0.97', ylabel_background: false, ylabel_background_sep: 1.5, ylabel_rot: false,
  majorticklabels: true, ticks_show: true, tick_mode: 'Automatisch',
  xticklist: '', yticklist: '',
  x_tick_pos_manuell: '', x_tick_label_manuell: '',
  y_tick_pos_manuell: '', y_tick_label_manuell: '',
  scale_x: 1.0, scale_y: 1.0,
  xtickformat: 'font=\\normalsize', ytickformat: 'font=\\normalsize',
  xtickfrac: false, ytickfrac: false,
  mult_x: 1.0, mult_y: 1.0,
  prec_x: 0, prec_y: 0,
  minor_x: 1, minor_y: 1,
  sep_x: false, sep_y: false,
  label_suffix_x: '', label_suffix_y: '',
  xlog: false, ylog: false,
  grid_show: true,
  grid_major_color: 'gray!50', grid_major_width: 0.6, grid_major_extras: '',
  grid_minor_color: 'gray!50', grid_minor_width: 0.6, grid_minor_extras: '',
  axis_width: 1.25, axis_color: 'black', axis_extras: '',
  tick_width: 1.0, tick_color: 'black', tick_extras: '',
  width_cm: 12.0, samples: 500,
  plots: [], csv_plots: [], nodes: [], points: [], parametric_plots: [],
  manual_code: '',
  pakete_laden: true, command_laden: true, font_family: 'Fira',
}

export const FILL_PATTERNS = ['none', 'north east lines', 'north west lines', 'dots', 'crosshatch', 'grid', 'vertical lines', 'horizontal lines']
