// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeneratorHeader } from './HeaderSection'
import type { HistoryActions } from '../hooks/useGeneratorHistory'

describe('GeneratorHeader (Aktionsleiste, Compile-Trigger & Historie)', () => {
  const defaultProps = {
    title: 'Test Generator',
    icon: <span data-testid="icon">icon</span>,
    version: '5.1.1',
    showPalette: false,
  }

  describe('Compile-Trigger & Reset-Dialog', () => {
    it('ruft beim Klick auf "Kompilieren" den onCompile-Handler genau einmal auf', async () => {
      const user = userEvent.setup()
      const handleCompile = vi.fn()

      render(
        <GeneratorHeader
          {...defaultProps}
          onCompile={handleCompile}
          isCompiling={false}
        />
      )

      const compileBtn = screen.getByRole('button', { name: /Kompilieren/i })
      expect(compileBtn).toBeEnabled()
      expect(compileBtn).not.toHaveAttribute('aria-busy', 'true')

      await user.click(compileBtn)
      expect(handleCompile).toHaveBeenCalledTimes(1)
    })

    it('deaktiviert den Compile-Button und zeigt Ladezustand an, wenn isCompiling true ist', async () => {
      const user = userEvent.setup()
      const handleCompile = vi.fn()

      render(
        <GeneratorHeader
          {...defaultProps}
          onCompile={handleCompile}
          isCompiling={true}
        />
      )

      const compileBtn = screen.getByRole('button', { name: /Wird ausgeführt…|Kompilieren/i })
      expect(compileBtn).toBeDisabled()
      expect(compileBtn).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByText('Kompiliere…')).toBeInTheDocument()

      await user.click(compileBtn)
      expect(handleCompile).not.toHaveBeenCalled()
    })

    it('löst onCompile via Tastenkürzel Strg+Enter aus, wenn nicht kompiliert wird', async () => {
      const user = userEvent.setup()
      const handleCompile = vi.fn()

      render(
        <GeneratorHeader
          {...defaultProps}
          onCompile={handleCompile}
          isCompiling={false}
        />
      )

      await user.keyboard('{Control>}{Enter}{/Control}')
      expect(handleCompile).toHaveBeenCalledTimes(1)
    })

    it('ignoriert Tastenkürzel Strg+Enter / Cmd+Enter, während isCompiling true ist', async () => {
      const user = userEvent.setup()
      const handleCompile = vi.fn()

      render(
        <GeneratorHeader
          {...defaultProps}
          onCompile={handleCompile}
          isCompiling={true}
        />
      )

      await user.keyboard('{Control>}{Enter}{/Control}')
      await user.keyboard('{Meta>}{Enter}{/Meta}')
      expect(handleCompile).not.toHaveBeenCalled()
    })

    it('öffnet bei Klick auf "Zurücksetzen" den Bestätigungsdialog', async () => {
      const user = userEvent.setup()
      const handleReset = vi.fn()

      render(
        <GeneratorHeader
          {...defaultProps}
          onReset={handleReset}
        />
      )

      const resetHeaderBtn = screen.getByRole('button', { name: /Zurücksetzen/i })
      await user.click(resetHeaderBtn)

      const dialogHeading = screen.getByRole('heading', { name: 'Konfiguration zurücksetzen' })
      expect(dialogHeading).toBeInTheDocument()
      expect(screen.getByText(/Alle Einstellungen werden auf die Standardwerte zurückgesetzt/i)).toBeInTheDocument()

      const dialogContainer = dialogHeading.closest('div.bg-panel') as HTMLElement
      expect(dialogContainer).toBeInTheDocument()

      const confirmBtn = within(dialogContainer).getByRole('button', { name: /Zurücksetzen/i })
      await user.click(confirmBtn)

      expect(handleReset).toHaveBeenCalledTimes(1)
    })
  })

  describe('Undo / Redo Historie-Aktionen', () => {
    it('rendert keine Undo-/Redo-Buttons, wenn history nicht übergeben wird', () => {
      render(<GeneratorHeader {...defaultProps} />)

      expect(screen.queryByRole('button', { name: 'Rückgängig' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Wiederholen' })).not.toBeInTheDocument()
    })

    it('deaktiviert Undo- und Redo-Buttons, wenn canUndo und canRedo false sind', () => {
      const history: HistoryActions = {
        undo: vi.fn(),
        redo: vi.fn(),
        canUndo: false,
        canRedo: false,
      }

      render(<GeneratorHeader {...defaultProps} history={history} />)

      const undoBtn = screen.getByRole('button', { name: 'Rückgängig' })
      const redoBtn = screen.getByRole('button', { name: 'Wiederholen' })

      expect(undoBtn).toBeDisabled()
      expect(redoBtn).toBeDisabled()
    })

    it('aktiviert Buttons und ruft undo/redo bei Klick auf, wenn canUndo und canRedo true sind', async () => {
      const user = userEvent.setup()
      const handleUndo = vi.fn()
      const handleRedo = vi.fn()

      const history: HistoryActions = {
        undo: handleUndo,
        redo: handleRedo,
        canUndo: true,
        canRedo: true,
      }

      render(<GeneratorHeader {...defaultProps} history={history} />)

      const undoBtn = screen.getByRole('button', { name: 'Rückgängig' })
      const redoBtn = screen.getByRole('button', { name: 'Wiederholen' })

      expect(undoBtn).toBeEnabled()
      expect(redoBtn).toBeEnabled()

      await user.click(undoBtn)
      expect(handleUndo).toHaveBeenCalledTimes(1)
      expect(handleRedo).not.toHaveBeenCalled()

      await user.click(redoBtn)
      expect(handleRedo).toHaveBeenCalledTimes(1)
    })
  })
})
