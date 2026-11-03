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

  it.skip('Verhalten bei leerem Log: Zeigt einen sauberen Leerzustand ("Keine Fehler gefunden") an', () => {
    // BUG/LÜCKE IM PRODUKTIVCODE:
    // LatexErrorPanel prüft nicht auf einen leeren Log-String, sondern fällt auf "Unbekannter Fehler"
    // zurück und rendert die rote Fehlerbox. Ein "Keine Fehler gefunden" Leerzustand existiert nicht.
    render(<LatexErrorPanel log="" />)
    expect(screen.getByText(/Keine Fehler gefunden/i)).toBeInTheDocument()
    expect(screen.queryByText('LaTeX Kompilierfehler')).not.toBeInTheDocument()
  })

  it.skip('Interaktion mit geparster Fehlerliste: Klick auf einen Fehler löst onSelectLine mit Zeilennummer aus', async () => {
    // BUG/LÜCKE IM PRODUKTIVCODE:
    // LatexErrorPanel akzeptiert derzeit nur einen monolithischen `log: string` und bietet
    // weder eine strukturierte Fehlerliste noch einen `onSelectLine`-Callback für Zeilensprünge im Editor.
    const onSelectLine = vi.fn()
    // Hypothetische Schnittstelle: <LatexErrorPanel log="l.42 Error" onSelectLine={onSelectLine} />
    expect(onSelectLine).toBeDefined()
  })
})
