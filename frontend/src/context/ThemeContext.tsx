// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './theme'

const STORAGE_KEY = 'app-theme'

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const valid: Theme[] = [
      'dark',
      'light',
      'himmel',
      'blue',
      'wald',
      'nord',
      'solarized',
      'sepia',
      'tafel',
      'space',
      'rose',
      'onyx',
    ]
    if (valid.includes(stored as Theme)) return stored as Theme
  } catch { /* ignore */ }
  return 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = readStoredTheme()
    document.documentElement.setAttribute('data-theme', t)
    return t
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}
