// SPDX-License-Identifier: AGPL-3.0-or-later

import { createContext } from 'react'

export type Theme =
  | 'dark'
  | 'light'
  | 'himmel'
  | 'blue'
  | 'wald'
  | 'nord'
  | 'solarized'
  | 'sepia'
  | 'tafel'
  | 'space'
  | 'rose'
  | 'onyx'

export type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
})
