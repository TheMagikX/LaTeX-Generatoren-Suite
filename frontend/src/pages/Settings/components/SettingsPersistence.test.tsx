// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../../../context/ThemeContext'
import { DebugProvider } from '../../../context/DebugContext'
import { AppearanceSection } from './AppearanceSection'
import { PerformanceSection } from './PerformanceSection'

describe('Settings & Persistenz (Erscheinungsbild & Performance)', () => {
  describe('AppearanceSection (Theme / Dark Mode Persistenz)', () => {
    it('initialisiert mit Standard-Theme "dark" und speichert geändertes Theme im localStorage', async () => {
      const user = userEvent.setup()

      render(
        <ThemeProvider>
          <AppearanceSection />
        </ThemeProvider>
      )

      // Initial ist dark aktiv
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

      // Wähle das "Nord"-Theme per Klick
      const nordButton = screen.getByRole('button', { name: /Nord/i })
      await user.click(nordButton)

      // Prüfe, dass Zustand im DOM und im localStorage synchronisiert wurden
      expect(localStorage.getItem('app-theme')).toBe('nord')
      expect(document.documentElement.getAttribute('data-theme')).toBe('nord')
    })

    it('liest vorab gespeichertes Theme aus dem localStorage ein und markiert es als aktiv', () => {
      localStorage.setItem('app-theme', 'sepia')

      render(
        <ThemeProvider>
          <AppearanceSection />
        </ThemeProvider>
      )

      expect(document.documentElement.getAttribute('data-theme')).toBe('sepia')

      const sepiaButton = screen.getByRole('button', { name: /Sepia/i })
      // Aktives Theme enthält das Häkchen (Check-Icon)
      expect(within(sepiaButton).getByText('Sepia')).toHaveClass('text-primary')
    })
  })

  describe('PerformanceSection (Debug-Modus & Engine Persistenz)', () => {
    it('schaltet Debug-Modus per Switch um und persistiert den Zustand im localStorage', async () => {
      const user = userEvent.setup()

      render(
        <DebugProvider>
          <PerformanceSection />
        </DebugProvider>
      )

      const toggleSwitch = screen.getByRole('switch', { name: /Debug-Modus/i })
      expect(toggleSwitch).toHaveAttribute('aria-checked', 'false')
      expect(screen.queryByText('Standard LaTeX-Compiler-Engine')).not.toBeInTheDocument()

      // Einschalten
      await user.click(toggleSwitch)
      expect(toggleSwitch).toHaveAttribute('aria-checked', 'true')
      expect(localStorage.getItem('generator_debug_mode')).toBe('true')
      expect(screen.getByText('Standard LaTeX-Compiler-Engine')).toBeInTheDocument()

      // Ausschalten
      await user.click(toggleSwitch)
      expect(toggleSwitch).toHaveAttribute('aria-checked', 'false')
      expect(localStorage.getItem('generator_debug_mode')).toBe('false')
      expect(screen.queryByText('Standard LaTeX-Compiler-Engine')).not.toBeInTheDocument()
    })

    it('wechselt die Compiler-Engine und speichert die Auswahl im localStorage', async () => {
      const user = userEvent.setup()
      // Debug-Modus vorab aktivieren, damit Engine-Switcher sichtbar ist
      localStorage.setItem('generator_debug_mode', 'true')

      render(
        <DebugProvider>
          <PerformanceSection />
        </DebugProvider>
      )

      // pdfLaTeX wählen
      const pdflatexBtn = screen.getByRole('button', { name: 'pdfLaTeX' })
      await user.click(pdflatexBtn)

      expect(localStorage.getItem('generator_compiler_engine')).toBe('pdflatex')

      // Zurück zu XeLaTeX wechseln
      const xelatexBtn = screen.getByRole('button', { name: 'XeLaTeX' })
      await user.click(xelatexBtn)

      expect(localStorage.getItem('generator_compiler_engine')).toBe('xelatex')
    })
  })
})
