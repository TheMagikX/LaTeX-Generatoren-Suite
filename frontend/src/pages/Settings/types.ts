// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Theme } from '../../context/useTheme'

export type ThemeColors = {
  canvas: string
  panel: string
  raised: string
  border: string
  ink: string
  muted: string
  primary: string
}

export interface ThemeItem {
  id: Theme
  label: string
  desc: string
  colors: ThemeColors
}

export interface CommandsStatus {
  custom_path: string | null
  custom_path_resolved: string | null
  is_custom: boolean
  file_exists: boolean
  active_file: string
  default_file: string
  suggested_local_path: string | null
}

export interface AdditionalItemStatus {
  path: string
  exists: boolean
  resolved: string | null
}

export interface SuggestedAdditional {
  name: string
  path: string
}

export interface LatexFeedbackMessage {
  section: 'commands' | 'packages' | 'additionals' | 'sty'
  type: 'success' | 'error' | 'info'
  text: string
}
