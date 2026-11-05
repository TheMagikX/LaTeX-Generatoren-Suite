// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LatexErrorPanel } from './ui'

describe('LatexErrorPanel (Log- & Fehleranzeige)', () => {
  it('rendert den Fehler-Titel und die erste Zeile der Fehlermeldung', () => {
    const log = '! Undefined control sequence.\nl.15 \\unknownCommand\nExiting...'
    render(<LatexErrorPanel log={log} />)

    expect(screen.getByText('LaTeX Kompilierfehler')).toBeInTheDocument()
    expect(screen.getByText('! Undefined control sequence.')).toBeInTheDocument()
  })

  it('kopiert die Fehlermeldung bei Klick auf den Kopier-Button in die Zwischenablage', async () => {
    const user = userEvent.setup()
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')
    const log = '! Package tikz Error: Cannot parse coordinate.'
    render(<LatexErrorPanel log={log} />)

    const copyBtn = screen.getByRole('button', { name: 'Fehlermeldung kopieren' })
    await user.click(copyBtn)

    expect(writeTextSpy).toHaveBeenCalledWith('! Package tikz Error: Cannot parse coordinate.')
  })

  it('zeigt keine Details-Schaltfläche an, wenn das Log nur eine Zeile enthält', () => {
    const log = 'Einzeiliger Fehler ohne Stacktrace'
    render(<LatexErrorPanel log={log} />)

    expect(screen.queryByText(/Details anzeigen/i)).not.toBeInTheDocument()
  })

  it('blendet bei Klick auf "Details anzeigen" den restlichen Logtext ein und wieder aus', async () => {
    const user = userEvent.setup()
    const log = '! Emergency stop.\nAdditional debug info line 1\nAdditional debug info line 2'
    render(<LatexErrorPanel log={log} />)

    expect(screen.queryByText(/Additional debug info line 1/)).not.toBeInTheDocument()

    const toggleBtn = screen.getByRole('button', { name: /Details anzeigen/i })
    await user.click(toggleBtn)

    expect(screen.getByText(/Additional debug info line 1/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Details ausblenden/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Details ausblenden/i }))
    expect(screen.queryByText(/Additional debug info line 1/)).not.toBeInTheDocument()
  })

  it('Verhalten bei leerem Log: Zeigt einen sauberen Leerzustand ("Keine Fehler gefunden") an', () => {
    render(<LatexErrorPanel log="" />)
    expect(screen.getByText(/Keine Fehler gefunden/i)).toBeInTheDocument()
    expect(screen.queryByText('LaTeX Kompilierfehler')).not.toBeInTheDocument()
  })

  it('Interaktion mit geparster Fehlerliste: Klick auf einen Fehler löst onSelectLine mit Zeilennummer aus', async () => {
    const user = userEvent.setup()
    const onSelectLine = vi.fn()
    const log = '! Undefined control sequence.\nl.42 \\unknownMacro'

    render(<LatexErrorPanel log={log} onSelectLine={onSelectLine} />)

    const lineBtn = screen.getByRole('button', { name: /Zeile 42/i })
    await user.click(lineBtn)
    expect(onSelectLine).toHaveBeenCalledWith(42)

    const codeElement = screen.getByText('! Undefined control sequence.')
    await user.click(codeElement)
    expect(onSelectLine).toHaveBeenCalledTimes(2)
    expect(onSelectLine).toHaveBeenLastCalledWith(42)
  })
})
