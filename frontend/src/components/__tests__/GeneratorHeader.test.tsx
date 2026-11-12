// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeneratorHeader } from '../HeaderSection'
import type { HistoryActions } from '../../hooks/useGeneratorHistory'

describe('GeneratorHeader (Undo / Redo Historie-Aktionen)', () => {
  const defaultProps = {
    title: 'Test Generator',
    icon: <span data-testid="icon">icon</span>,
    version: '5.1.1',
    showPalette: false,
  }

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
