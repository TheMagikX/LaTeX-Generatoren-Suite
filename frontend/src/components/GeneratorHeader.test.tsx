// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeneratorHeader } from './HeaderSection'

describe('GeneratorHeader (Aktionsleiste & Compile-Trigger)', () => {
  const defaultProps = {
    title: 'Test Generator',
    icon: <span data-testid="icon">icon</span>,
    version: '5.1.1',
    showPalette: false,
  }

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

    // Button ist disabled, trägt aria-busy="true" und zeigt visuellen/screen-reader Ladeindikator
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

    // Dialog-Container für gezielte Button-Selektion isolieren
    const dialogContainer = dialogHeading.closest('div.bg-panel') as HTMLElement
    expect(dialogContainer).toBeInTheDocument()

    const confirmBtn = within(dialogContainer).getByRole('button', { name: /Zurücksetzen/i })
    await user.click(confirmBtn)

    expect(handleReset).toHaveBeenCalledTimes(1)
  })
})
