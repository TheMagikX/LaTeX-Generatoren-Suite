// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Config } from './typesBaum'

export const DEFAULT_CONFIG: Config = {
  mode: 'Symmetrisch (Standard)',
  max_depth: 2,
  branches_global: 2,
  use_numeric_probs: false,
  root_node: {
    label: 'Start',
    labelHidden: false,
    edge_label: '',
    edgeLabelHidden: false,
    prob_value: null,
    node_style: null,
    edge_style: null,
    num_children: 2
  },
  nodes: {},
  level_labels: {
    enabled: false,
    offset: -4.0,
    style: 'font=\\bfseries\\small, darkgray',
    texts: {}
  },
  results: {},
  highlights: {},
  show_path_prob_display: false,
  show_path_prob_in_result: false,
  style_results: 'draw=none, shape=rectangle, font=\\tiny, gray',
  style_result_dist: 0.5,
  width_cm: 12.0,
  style: {
    level_distance: 1.5,
    sibling_distance_base: 2.5,
    manual_sibling_dist_active: false,
    manual_sibling_distances: {},
    grow_direction: 'down',
    node_shape: 'circle',
    global_node_style: 'inner sep=2pt, font=\\small',
    global_edge_style: 'midway, font=\\scriptsize, inner sep=1pt',
    edge_positioning: 'Außen (Smart)',
    hide_edge_labels: false,
    highlight_style_default: 'draw=red!70!black, line width=2pt, opacity=0.6, line cap=round'
  },
  pakete_laden: true,
  command_laden: true,
  font_family: 'Fira',
  preamble_add: ''
}
