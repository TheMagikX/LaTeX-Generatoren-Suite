// SPDX-License-Identifier: AGPL-3.0-or-later

import type { TikzConfig } from './typesTikz'

export const DEFAULT_CONFIG: TikzConfig = {
  code: "\\draw[black,thick] (0,0) -- (5,0);",
  options: "line join=round",
  pakete_laden: true,
  command_laden: true,
  font_family: 'Fira',
}
