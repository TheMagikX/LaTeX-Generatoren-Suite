// SPDX-License-Identifier: AGPL-3.0-or-later

export interface CircuitNode {
  id: string
  name: string
  x: number
  y: number
  show_dot?: boolean | null
}

export interface CircuitComponent {
  id: string
  type_name: string
  from_node: string
  to_node: string
  label: string
  value: string
  style: string
}

export interface SchaltplanConfig {
  nodes: CircuitNode[]
  components: CircuitComponent[]
  style_standard: string
  style_scale: number
  show_grid: boolean
  show_nodes: boolean
  show_node_labels: boolean
  style_tikz_opts: string
  load_packages: boolean
  load_commands: boolean
  font_family: string
  preamble_add: string
}
