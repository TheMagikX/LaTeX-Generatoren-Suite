// SPDX-License-Identifier: AGPL-3.0-or-later

import { deepMergeConfig } from '../../utils/deepMergeConfig'
import { DEFAULT_CONFIG } from './constantsKoord'
import type {
  BetweenConfig,
  CSVPlot,
  Config,
  NodeItem,
  ParametricPlot,
  Plot,
  PointItem,
  ShadeConfig,
  SlopeConfig,
  TangentConfig,
} from './typesKoord'

const DEFAULT_SHADE: ShadeConfig = {
  show: true,
  a: null,
  b: null,
  fill: 'blue',
  pattern: 'none',
  alpha: 0.2,
  draw: 'none',
}

const DEFAULT_BETWEEN: BetweenConfig = {
  show: true,
  other_index: 0,
  a: null,
  b: null,
  fill: 'blue',
  pattern: 'none',
  alpha: 0.2,
  draw: 'none',
}

const DEFAULT_SLOPE: SlopeConfig = {
  show: true,
  x0: 1,
  dx: 1,
  style: 'red, thick',
  label_show: true,
  label_x: '',
  label_y: '',
  label_style: '',
}

const DEFAULT_TANGENT: TangentConfig = {
  show: true,
  x0: 1,
  xmin: null,
  xmax: null,
  style: 'red, dashed',
  is_normal: false,
  label_show: false,
  label_text: '',
  label_pos: 0.5,
}

const DEFAULT_PLOT: Plot = {
  show: true,
  func: 'x^2',
  color: '#1e293b',
  line_width: 'thick',
  line_style: 'solid',
  custom_style: '',
  xmin: null,
  xmax: null,
  label_text: '',
  label_pos: 0.6,
  label_style: 'above, sloped, font=\\small, fill=white, inner sep=1pt',
  shades: [],
  betweens: [],
  slopes: [],
  tangents: [],
}

const DEFAULT_CSV_PLOT: CSVPlot = {
  show: true,
  path: '',
  color: '#1e293b',
  line_width: 'thick',
  line_style: 'solid',
  custom_style: '',
  xcol: '',
  ycol: '',
  sep: 'semicolon',
  read_comma: true,
  only_marks: false,
  marker_symbol: '*',
  marker_size: 1.0,
  marker_options: '',
}

const DEFAULT_NODE: NodeItem = {
  show: true,
  x: 0,
  y: 0,
  text: 'Hinweis',
  color: '#1e293b',
  font_size: '\\small',
  anchor: 'center',
  custom_opts: '',
  bg_white: false,
  marker: false,
  mark_style: 'only marks, mark=*, color=black',
  mark_size: 1.6,
  arrow: false,
  arrow_style: '->, thick',
  dx: 0,
  dy: 0,
}

const DEFAULT_POINT: PointItem = {
  show: true,
  x: 2.0,
  y: 1.0,
  label: 'P',
  color: '#1e293b',
  anchor: 'west',
  custom_label_style: '',
  mark: 'x',
  size: 3.0,
  mark_style: 'very thick',
}

const DEFAULT_PARAMETRIC_PLOT: ParametricPlot = {
  show: true,
  x_t: 'cos(deg(t))',
  y_t: 'sin(deg(t))',
  color: '#1e293b',
  line_width: 'very thick',
  line_style: 'solid',
  custom_style: '',
  tmin: 0,
  tmax: 6.28,
  ymin: null,
  ymax: null,
  label_show: false,
  label_text: '\\large $x$',
  label_pos: 0.6,
  label_style: 'above, sloped, font=\\small, fill=white, inner sep=1pt',
}

export function normalizeKoordConfig(loaded: unknown): Config {
  const merged = deepMergeConfig(DEFAULT_CONFIG, loaded)

  return {
    ...merged,
    plots: merged.plots.map((plot) => {
      const base = deepMergeConfig(DEFAULT_PLOT, plot)
      return {
        ...base,
        custom_style: base.custom_style || base.settings || '',
        shades: base.shades.map((sh) => deepMergeConfig(DEFAULT_SHADE, sh)),
        betweens: base.betweens.map((bt) => deepMergeConfig(DEFAULT_BETWEEN, bt)),
        slopes: base.slopes.map((sl) => deepMergeConfig(DEFAULT_SLOPE, sl)),
        tangents: base.tangents.map((tg) => deepMergeConfig(DEFAULT_TANGENT, tg)),
      }
    }),
    csv_plots: merged.csv_plots.map((csv) => {
      const base = deepMergeConfig(DEFAULT_CSV_PLOT, csv)
      return {
        ...base,
        custom_style: base.custom_style || base.style || '',
      }
    }),
    nodes: merged.nodes.map((node) => {
      const base = deepMergeConfig(DEFAULT_NODE, node)
      return {
        ...base,
        custom_opts: base.custom_opts || base.opts || '',
      }
    }),
    points: merged.points.map((pt) => {
      const base = deepMergeConfig(DEFAULT_POINT, pt)
      return {
        ...base,
        custom_label_style: base.custom_label_style || base.label_style || '',
      }
    }),
    parametric_plots: merged.parametric_plots.map((par) => {
      const base = deepMergeConfig(DEFAULT_PARAMETRIC_PLOT, par)
      return {
        ...base,
        custom_style: base.custom_style || base.settings || '',
      }
    }),
  }
}

export const calcXLabelPos = (ymin: number, ymax: number): string => {
  const ykoord = ymin < 0 ? Math.round((Math.abs(ymin / Math.abs(ymax - ymin)) + 0.05) * 100) / 100 : 0.05
  return `0.99,${ykoord}`
}

export const calcYLabelPos = (xmin: number, xmax: number): string => {
  const xkoord = xmin < 0 ? Math.round((Math.abs(xmin / Math.abs(xmax - xmin)) + 0.015) * 100) / 100 : 0.02
  return `${xkoord},0.97`
}

export const calcDefaultTickRange = (minVal: number, maxVal: number): string => {
  if (isNaN(minVal) || isNaN(maxVal)) return ''
  const start = Math.floor(minVal)
  const end = Math.ceil(maxVal)
  if (start >= end) return `${start}`
  if (start + 1 === end) return `${start},${end}`
  return `${start},${start + 1},...,${end}`
}

// ---------------------------------------------------------------------------
// Stateless Helper Components
// ---------------------------------------------------------------------------
