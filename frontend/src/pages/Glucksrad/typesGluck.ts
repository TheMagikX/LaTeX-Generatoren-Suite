// SPDX-License-Identifier: AGPL-3.0-or-later

export interface ColorSectorConfig {
  farbe: string;
  haeufigkeit: number;
  label: string;
}

export interface TikZArrowConfig {
  color: string;
  handdrawn: boolean;
  length: number;
  shaftwidth: number;
  circleradius: number;
  widthtip: number;
  heighttip: number;
  tailwingwidth: number;
  tailheight: number;
  taildrop: number;
  segment_length: number;
  amplitude: number;
}

export interface GluckConfig {
  mode: 'standard' | 'variable';
  anzahl: number;
  seed: number;
  radius: number;
  sectors: ColorSectorConfig[];
  show_labels: boolean;
  label_fontsize: string;
  label_mode: string;
  show_rim: boolean;
  show_pins: boolean;
  center_style: string;
  arrow_style: string;
  pointer_pos: string;
  arrow_params: TikZArrowConfig;
  font_family: string;
}

export type GluckSetter = <K extends keyof GluckConfig>(key: K, value: GluckConfig[K]) => void
export type ColorSectorUpdater = <K extends keyof ColorSectorConfig>(idx: number, key: K, value: ColorSectorConfig[K]) => void
