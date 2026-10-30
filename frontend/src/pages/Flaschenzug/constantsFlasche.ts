// SPDX-License-Identifier: AGPL-3.0-or-later

import type { FlaschenzugConfig, PulleyLabelPos } from './typesFlasche'

export const PULLEY_LABEL_POSITIONS: { value: PulleyLabelPos; label: string }[] = [
  { value: 'above', label: 'Oben' },
  { value: 'above right', label: 'Oben rechts' },
  { value: 'right', label: 'Rechts' },
  { value: 'below right', label: 'Unten rechts' },
  { value: 'below', label: 'Unten' },
  { value: 'below left', label: 'Unten links' },
  { value: 'left', label: 'Links' },
  { value: 'above left', label: 'Oben links' },
]

export const DEFAULT_CONFIG: FlaschenzugConfig = {
  pulleys: [],
  anchors: [],
  ropes: [],
  masses: [],
  forces: [],
  manual_mounts: [],
  global_opts: {
    style_scale: 1.0,
    tikz_opts: "",
    preview_grid: false,
    coordinate_helpers_preview_only: false,
    show_labels: true,
    rope_style: "plain",
    rope_color: "black"
  },
  environment: {
    show_boden: false,
    boden_y: -1.0,
    boden_width: 6.0,
    show_decke: false,
    decke_y: 3.0,
    decke_width: 6.0
  }
}
