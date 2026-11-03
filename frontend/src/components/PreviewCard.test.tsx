// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewCard } from './ui'

describe('PreviewCard (TikZ/Vorschau-Container)', () => {
  const dummyIcon = <span data-testid="empty-icon">Leer</span>
  const mockPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  it('zeigt den leeren Zustand an, wenn weder Bild noch Fehler oder Ladezustand vorliegen', () => {
    render(
      <PreviewCard
        isLoading={false}
        isCompiling={false}
        imgSrc={null}
        errorLog={null}
        emptyIcon={dummyIcon}
      />
    )

    expect(screen.getByText('Keine Vorschau verfügbar')).toBeInTheDocument()
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument()
    expect(screen.queryByAltText('LaTeX Vorschau')).not.toBeInTheDocument()
  })

  it('zeigt einen Ladeindikator / Spinner während des Renderns (isLoading/isCompiling === true)', () => {
    render(
      <PreviewCard
        isLoading={false}
        isCompiling={true}
        imgSrc={null}
        errorLog={null}
        emptyIcon={dummyIcon}
      />
    )

    expect(screen.getByText('Rendere LaTeX…')).toBeInTheDocument()
    expect(screen.queryByText('Keine Vorschau verfügbar')).not.toBeInTheDocument()
    expect(screen.queryByAltText('LaTeX Vorschau')).not.toBeInTheDocument()
  })

  it('rendert das generierte Bild bei erfolgreicher Kompilierung', () => {
    render(
      <PreviewCard
        isLoading={false}
        isCompiling={false}
        imgSrc={mockPng}
        errorLog={null}
        emptyIcon={dummyIcon}
      />
    )

    const img = screen.getByAltText('LaTeX Vorschau')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', mockPng)
    expect(screen.queryByText('Keine Vorschau verfügbar')).not.toBeInTheDocument()
    expect(screen.queryByText('Rendere LaTeX…')).not.toBeInTheDocument()
  })

  it('blendet während der Neukompilierung das bestehende Bild mit einem Lade-Overlay ein', () => {
    render(
      <PreviewCard
        isLoading={true}
        isCompiling={false}
        imgSrc={mockPng}
        errorLog={null}
        emptyIcon={dummyIcon}
      />
    )

    // Sowohl das bisherige Bild als auch das Lade-Overlay sind sichtbar
    expect(screen.getByAltText('LaTeX Vorschau')).toBeInTheDocument()
    expect(screen.getByText('Rendere LaTeX…')).toBeInTheDocument()
  })

  it('zeigt ein Error-Banner (LatexErrorPanel) an, wenn die Kompilierung fehlschlägt', () => {
    const errorText = '! Package tikz Error: Giving up on coordinate parsing.'
    render(
      <PreviewCard
        isLoading={false}
        isCompiling={false}
        imgSrc={null}
        errorLog={errorText}
        emptyIcon={dummyIcon}
      />
    )

    expect(screen.getByText('LaTeX Kompilierfehler')).toBeInTheDocument()
    expect(screen.getByText(errorText)).toBeInTheDocument()
    expect(screen.queryByAltText('LaTeX Vorschau')).not.toBeInTheDocument()
    expect(screen.queryByText('Keine Vorschau verfügbar')).not.toBeInTheDocument()
  })

  it('öffnet und schließt die Lightbox bei Klick auf den Vollbild-Button', async () => {
    const user = userEvent.setup()
    render(
      <PreviewCard
        isLoading={false}
        isCompiling={false}
        imgSrc={mockPng}
        errorLog={null}
        emptyIcon={dummyIcon}
      />
    )

    const zoomBtn = screen.getByRole('button', { name: 'Vollbild & Zoom (Lightbox)' })
    await user.click(zoomBtn)

    // Lightbox Dialog öffnet sich
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()

    // Schließen via Schließen-Button
    const closeBtn = screen.getByRole('button', { name: 'Schließen (Esc)' })
    await user.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
