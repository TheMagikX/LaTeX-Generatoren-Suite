// SPDX-License-Identifier: AGPL-3.0-or-later

import { useContext } from 'react'
import { ThemeContext } from './theme'

export { type Theme } from './theme'

export function useTheme() {
  return useContext(ThemeContext)
}
