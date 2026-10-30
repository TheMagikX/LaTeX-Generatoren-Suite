// SPDX-License-Identifier: AGPL-3.0-or-later

export interface BaumNodeConfig {
  label: string;
  labelHidden?: boolean;
  edge_label: string;
  edgeLabelHidden?: boolean;
  prob_value: number | null;
  node_style: string | null;
  edge_style: string | null;
  num_children: number;
}

export interface LevelLabelConfig {
  enabled: boolean;
  offset: number;
  style: string;
  texts: Record<number, string>;
}

export interface HighlightConfig {
  enabled: boolean;
  style: string | null;
}

export interface TreeStyleConfig {
  level_distance: number;
  sibling_distance_base: number;
  manual_sibling_dist_active: boolean;
  manual_sibling_distances: Record<number, number>;
  grow_direction: 'right' | 'down' | 'up' | 'left';
  node_shape: 'circle' | 'rectangle' | 'coordinate';
  global_node_style: string;
  global_edge_style: string;
  edge_positioning: string;
  hide_edge_labels: boolean;
  highlight_style_default: string;
}

export interface Config {
  mode: 'Symmetrisch (Standard)' | 'Flexibel (Individuell)';
  max_depth: number;
  branches_global: number;
  use_numeric_probs: boolean;
  root_node: BaumNodeConfig;
  nodes: Record<string, BaumNodeConfig>;
  level_labels: LevelLabelConfig;
  results: Record<string, string>;
  highlights: Record<string, HighlightConfig>;
  show_path_prob_display: boolean;
  show_path_prob_in_result: boolean;
  style_results: string;
  style_result_dist: number;
  width_cm: number;
  style: TreeStyleConfig;
  pakete_laden: boolean;
  command_laden: boolean;
  font_family: string;
  preamble_add: string;
}

export type BaumConfigUpdater = <K extends keyof Config>(key: K, value: Config[K]) => void
export type BaumNodeUpdater = <K extends keyof BaumNodeConfig>(nodeId: string, key: K, value: BaumNodeConfig[K]) => void
export type BaumHighlightUpdater = <K extends keyof HighlightConfig>(leafId: string, key: K, value: HighlightConfig[K]) => void
export type BaumStyleUpdater = <K extends keyof TreeStyleConfig>(key: K, value: TreeStyleConfig[K]) => void
