// SPDX-License-Identifier: AGPL-3.0-or-later

export interface ShadeConfig {
    show: boolean; a: number | null; b: number | null
    fill: string; pattern: string; alpha: number; draw: string
}

export interface BetweenConfig {
    show: boolean; other_index: number; a: number | null; b: number | null
    fill: string; pattern: string; alpha: number; draw: string
}

export interface SlopeConfig {
    show: boolean; x0: number; dx: number; style: string
    label_show: boolean; label_x: string; label_y: string; label_style: string
}

export interface TangentConfig {
    show: boolean; x0: number; xmin: number | null; xmax: number | null
    style: string; is_normal: boolean
    label_show: boolean; label_text: string; label_pos: number
}

export interface Plot {
    show: boolean; func: string
    color: string; line_width: string; line_style: string; custom_style?: string
    settings?: string
    xmin: number | null; xmax: number | null
    label_text: string; label_pos: number; label_style: string
    shades: ShadeConfig[]; betweens: BetweenConfig[]; slopes: SlopeConfig[]; tangents: TangentConfig[]
}

export interface CSVPlot {
    show: boolean; path: string
    color: string; line_width: string; line_style: string; custom_style?: string
    style?: string
    xcol: string; ycol: string; sep: string; read_comma: boolean
    only_marks: boolean; marker_symbol: string; marker_size: number; marker_options: string
}

export interface NodeItem {
    show: boolean; x: number; y: number
    text: string
    color?: string; font_size?: string; anchor?: string; custom_opts?: string; opts?: string
    bg_white: boolean
    marker: boolean; mark_style: string; mark_size: number
    arrow: boolean; arrow_style: string; dx: number; dy: number
}

export interface PointItem {
    show: boolean; x: number; y: number
    label: string; color: string
    anchor?: string; custom_label_style?: string
    label_style?: string
    mark: string; size: number; mark_style?: string
}

export interface ParametricPlot {
    show: boolean; x_t: string; y_t: string
    color: string; line_width: string; line_style: string; custom_style?: string
    settings?: string
    tmin: number; tmax: number; ymin: number | null; ymax: number | null
    label_show: boolean; label_text: string; label_pos: number; label_style: string
}

export interface Config {
    xmin: number; xmax: number; ymin: number; ymax: number
    label_show: boolean
    xlabel: string; xlabel_pos: string; xlabel_background: boolean; xlabel_background_sep: number
    ylabel: string; ylabel_pos: string; ylabel_background: boolean; ylabel_background_sep: number; ylabel_rot: boolean
    majorticklabels: boolean; ticks_show: boolean; tick_mode: string
    xticklist: string; yticklist: string
    x_tick_pos_manuell: string; x_tick_label_manuell: string
    y_tick_pos_manuell: string; y_tick_label_manuell: string
    scale_x: number; scale_y: number
    xtickformat: string; ytickformat: string
    xtickfrac: boolean; ytickfrac: boolean
    mult_x: number; mult_y: number
    prec_x: number; prec_y: number
    minor_x: number; minor_y: number
    sep_x: boolean; sep_y: boolean
    label_suffix_x: string; label_suffix_y: string
    xlog: boolean; ylog: boolean
    grid_show: boolean
    grid_major_color: string; grid_major_width: number; grid_major_extras: string
    grid_minor_color: string; grid_minor_width: number; grid_minor_extras: string
    axis_width: number; axis_color: string; axis_extras: string
    tick_width: number; tick_color: string; tick_extras: string
    width_cm: number; samples: number
    plots: Plot[]; csv_plots: CSVPlot[]; nodes: NodeItem[]; points: PointItem[]; parametric_plots: ParametricPlot[]
    manual_code: string
    pakete_laden: boolean; command_laden: boolean; font_family: string
}
