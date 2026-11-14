// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErwartungshorizontPreview from './ErwartungshorizontPreview'
import * as utilsErwartungshorizont from '../utilsErwartungshorizont'

describe('ErwartungshorizontPreview (P6B-10 & P6B-11)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('verwendet indexToSubtaskLetter (aa statt {) bei >= 27 Teilaufgaben für Anzeige und Downloads (P6B-10)', async () => {
    const user = userEvent.setup()
    const downloadSpy = vi
      .spyOn(utilsErwartungshorizont, 'downloadFileFromBase64')
      .mockImplementation(() => {})

    const pagesPng = Array.from({ length: 27 }, (_, i) => `png_${i}`)
    const pagesSvg = Array.from({ length: 27 }, (_, i) => `svg_${i}`)
    const pagesPdf = Array.from({ length: 27 }, (_, i) => `pdf_${i}`)

    render(
      <ErwartungshorizontPreview
        latexCode="\\begin{subtask}\\end{subtask}"
        compileData={{
          ok: true,
          pages_png_base64: pagesPng,
          pages_svg_base64: pagesSvg,
          pages_pdf_base64: pagesPdf,
        }}
        isCompiling={false}
        previewDpi={150}
        setPreviewDpi={vi.fn()}
      />,
    )

    const nextBtn = screen.getByTitle('Nächste Teilaufgabe (Pfeiltaste rechts)')
    for (let i = 0; i < 26; i += 1) {
      await user.click(nextBtn)
    }

    expect(screen.getByText('aa)')).toBeInTheDocument()
    expect(screen.getByAltText('Teilaufgabe aa)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^PNG$/i }))
    expect(downloadSpy).toHaveBeenCalledWith('png_26', 'Teilaufgabe_aa.png', 'image/png')

    await user.click(screen.getByRole('button', { name: /^SVG$/i }))
    expect(downloadSpy).toHaveBeenCalledWith('svg_26', 'Teilaufgabe_aa.svg', 'image/svg+xml')

    await user.click(screen.getByRole('button', { name: /^PDF$/i }))
    expect(downloadSpy).toHaveBeenCalledWith('pdf_26', 'Teilaufgabe_aa.pdf', 'application/pdf')
  })

  it('zeigt LatexErrorPanel mit Fallback-Meldung bei ok=false ohne Log (P6B-11)', () => {
    render(
      <ErwartungshorizontPreview
        latexCode="\\invalid"
        compileData={{ ok: false, log: '' }}
        isCompiling={false}
        previewDpi={150}
        setPreviewDpi={vi.fn()}
      />,
    )

    expect(screen.getByText('Unbekannter LaTeX-Kompilierungsfehler.')).toBeInTheDocument()
    expect(screen.queryByText('Noch kein Erwartungshorizont gerendert')).not.toBeInTheDocument()
  })

  it('zeigt LatexErrorPanel mit konkretem Log bei ok=false (P6B-11)', () => {
    render(
      <ErwartungshorizontPreview
        latexCode="\\foo"
        compileData={{ ok: false, log: '! Undefined control sequence.' }}
        isCompiling={false}
        previewDpi={150}
        setPreviewDpi={vi.fn()}
      />,
    )

    expect(screen.getByText('! Undefined control sequence.')).toBeInTheDocument()
  })
})
