// SPDX-License-Identifier: AGPL-3.0-or-later

import type { CircuitComponent, CircuitNode, SchaltplanConfig } from './typesSchalt'

type ExampleCircuit = {
  nodes: Omit<CircuitNode, 'id'>[]
  components: Omit<CircuitComponent, 'id'>[]
}

export const COMP_TYPES = [
  "Draht (Verbindung)", "Widerstand (R)", "Widerstand (Veränderbar)",
  "Kondensator (C)", "Elko", "Spule (L)", "Batterie",
  "Spannungsquelle (DC)", "Spannungsquelle (AC)", "Stromquelle",
  "Lampe", "Diode", "LED", "Schalter (Offen)", "Schalter (Geschlossen)",
  "Schalter (Taster)", "Masse (Ground)", "Voltmeter", "Amperemeter", "Messgerät"
]

export const EXAMPLE_CIRCUITS: Record<string, ExampleCircuit> = {
  "Einfacher Stromkreis": {
    "nodes": [
      { "name": "A", "x": 0.0, "y": 3.0 },
      { "name": "B", "x": 3.0, "y": 3.0 },
      { "name": "C", "x": 3.0, "y": 0.0 },
      { "name": "D", "x": 0.0, "y": 0.0 },
    ],
    "components": [
      { "type_name": "Batterie", "from_node": "D", "to_node": "A", "label": "", "value": "9V", "style": "" },
      { "type_name": "Widerstand (R)", "from_node": "A", "to_node": "B", "label": "R1", "value": "100Ω", "style": "" },
      { "type_name": "Draht (Verbindung)", "from_node": "B", "to_node": "C", "label": "", "value": "", "style": "" },
      { "type_name": "Draht (Verbindung)", "from_node": "C", "to_node": "D", "label": "", "value": "", "style": "" },
    ],
  },
  "Spannungsteiler": {
    "nodes": [
      { "name": "A", "x": 0.0, "y": 4.0 },
      { "name": "B", "x": 3.0, "y": 4.0 },
      { "name": "C", "x": 3.0, "y": 2.0 },
      { "name": "D", "x": 3.0, "y": 0.0 },
      { "name": "E", "x": 0.0, "y": 0.0 },
    ],
    "components": [
      { "type_name": "Batterie", "from_node": "E", "to_node": "A", "label": "", "value": "12V", "style": "" },
      { "type_name": "Draht (Verbindung)", "from_node": "A", "to_node": "B", "label": "", "value": "", "style": "" },
      { "type_name": "Widerstand (R)", "from_node": "B", "to_node": "C", "label": "R1", "value": "10kΩ", "style": "" },
      { "type_name": "Widerstand (R)", "from_node": "C", "to_node": "D", "label": "R2", "value": "10kΩ", "style": "" },
      { "type_name": "Draht (Verbindung)", "from_node": "D", "to_node": "E", "label": "", "value": "", "style": "" },
    ],
  },
}

export const DEFAULT_CONFIG: SchaltplanConfig = {
  nodes: [],
  components: [],
  style_standard: "europe (DIN)",
  style_scale: 1.0,
  show_grid: false,
  show_nodes: false,
  show_node_labels: false,
  style_tikz_opts: "",
  load_packages: true,
  load_commands: true,
  font_family: "Fira",
  preamble_add: ""
}
