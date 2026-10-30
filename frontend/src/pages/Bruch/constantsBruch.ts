// SPDX-License-Identifier: AGPL-3.0-or-later

import type { BruchConfig } from './typesBruch'

export const DEFAULT_CONFIG: BruchConfig = {
  zaehler: 3,
  nenner: 4,
  form: 'Rechteck',
  fill_color: '#4A90D9',
  border_color: '#1a1a2e',
  seed: 42,
  show_label: true,
  label_override: '',
  rect_mode: 'Automatisch',
  rect_rows: 0,
  erweiter_faktor: 2,
  split_mode: 'Horizontal',
  split_style: 'Hervorgehoben',
  border_width: 0.6,
  fill_pattern: 'solid',
  mixed_number: false,
  show_erweitern: false,
  show_kuerzen: false,
  font_family: 'Fira',
}
