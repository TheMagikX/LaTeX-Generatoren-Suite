// SPDX-License-Identifier: AGPL-3.0-or-later

export interface DatasetParams {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean?: number
  std_dev?: number
  variance?: number
}

export interface DatasetConfig {
  name: string
  data_mode: 'Raw' | 'Parameters' | 'Frequency'
  raw_data: number[]
  raw_data_string: string
  freq_data_string: string
  bar_labels_string: string
  category_colors?: Record<string, string>
  params?: DatasetParams
  color: string
  show_outliers: boolean
  enabled: boolean
}

export interface AxisConfig {
  min: number | null
  max: number | null
  step: number
  label: string
  show_grid: boolean
  grid_style?: 'kaestchen' | 'major'
  tick_mode: 'Automatisch' | 'Manuell'
  tick_list: string
  tick_pos_manuell?: string
  tick_label_manuell?: string
  majorticklabels: boolean
  ticks_show: boolean
}

export interface TitleConfig {
  show: boolean
  text: string
  color: string
  font_size: string
  font_weight: 'bold' | 'normal' | 'italic'
  align: 'center' | 'left' | 'right'
  custom_style?: string
}

export interface StatistikConfig {
  type: 'Boxplot' | 'Histogramm' | 'Säulendiagramm' | 'Summenkurve' | 'Violin'
  datasets: DatasetConfig[]
  x_axis: AxisConfig
  y_axis: AxisConfig
  boxplot_opts: {
    orientation: 'horizontal' | 'vertical'
    box_width: number
    draw_mean: boolean
  }
  histogram_opts: {
    bin_width: number
    density: boolean
  }
  barchart_opts: {
    orientation: 'horizontal' | 'vertical'
    width_mode?: 'cm' | 'boxes'
    bar_width: number
    bar_width_boxes?: number
    bar_gap_boxes?: number
    bar_gap?: number
    margin_boxes?: number
    show_grid?: boolean
    opacity?: number
    vertical_labels?: boolean
    show_values: boolean
  }
  summenkurve_opts: {
    smooth: boolean
    as_percent: boolean
  }
  violin_opts: {
    orientation: 'horizontal' | 'vertical'
    violin_width: number
    bandwidth: number
    show_inner_box: boolean
  }
  title_opts: TitleConfig
  font_family: string
  font_size: string
  width_cm: number
  height_cm: number
}

export interface StatistikResult {
  name: string
  params?: DatasetParams
}

export type StatistikSetter = <K extends keyof StatistikConfig>(key: K, value: StatistikConfig[K]) => void
export type StatistikDatasetUpdater = <K extends keyof DatasetConfig>(idx: number, field: K, value: DatasetConfig[K]) => void
export type StatistikAxisUpdater = <A extends 'x_axis' | 'y_axis', K extends keyof AxisConfig>(axisKey: A, field: K, value: AxisConfig[K]) => void
