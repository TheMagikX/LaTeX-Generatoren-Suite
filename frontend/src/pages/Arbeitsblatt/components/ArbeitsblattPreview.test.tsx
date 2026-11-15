// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ArbeitsblattPreview from './ArbeitsblattPreview'
import * as utilsArbeitsblatt from '../utilsArbeitsblatt'
import type { ArbeitsblattConfig } from '../typesArbeitsblatt'

describe('ArbeitsblattPreview PDF-Dateinamen', () => {
  const baseConfig: ArbeitsblattConfig = {
    template_text: '',
    python_code: '',
    random_seed: '42',
    header_title: 'Mathe 10a: / Test*?',
    header_title_spacing: '0.5',
    header_title_visible: true,
    header_class: '10a',
    header_dozent: 'Meyer',
    header_subject: 'Mathematik',
    add_qrcode: false,
    pakete_laden: true,
    command_laden: true,
    font_family: 'default',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('verwendet bereinigten header_title für Aufgabenblatt- und Lösungs-PDF-Downloads', async () => {
    const user = userEvent.setup()
    const downloadPdfSpy = vi.spyOn(utilsArbeitsblatt, 'downloadPdf').mockImplementation(() => {})

    render(
      <ArbeitsblattPreview
        config={baseConfig}
        dpi={150}
        setDpi={vi.fn()}
        isGenerating={false}
        isCompilingTasks={false}
        isCompilingSols={false}
        compileTasks={{ ok: true, pdf_base64: 'dGFza3M=', png_base64: 'cG5n' }}
        compileSols={{ ok: true, pdf_base64: 'c29scw==', png_base64: 'cG5n' }}
        genData={null}
      />,
    )

    const pdfButtons = screen.getAllByRole('button', { name: /^PDF$/i })
    await user.click(pdfButtons[0])
    expect(downloadPdfSpy).toHaveBeenCalledWith('dGFza3M=', 'Mathe 10a - Test.pdf')

    await user.click(pdfButtons[1])
    expect(downloadPdfSpy).toHaveBeenCalledWith('c29scw==', 'Mathe 10a - Test - Lösungen.pdf')

    // FloatingToolbar PDF button (dritter PDF-Button)
    await user.click(pdfButtons[2])
    expect(downloadPdfSpy).toHaveBeenLastCalledWith('dGFza3M=', 'Mathe 10a - Test.pdf')
  })

  it('nutzt Fallback "Arbeitsblatt.pdf" bei leerem header_title', async () => {
    const user = userEvent.setup()
    const downloadPdfSpy = vi.spyOn(utilsArbeitsblatt, 'downloadPdf').mockImplementation(() => {})

    render(
      <ArbeitsblattPreview
        config={{ ...baseConfig, header_title: '   ' }}
        dpi={150}
        setDpi={vi.fn()}
        isGenerating={false}
        isCompilingTasks={false}
        isCompilingSols={false}
        compileTasks={{ ok: true, pdf_base64: 'dGFza3M=', png_base64: 'cG5n' }}
        compileSols={null}
        genData={null}
      />,
    )

    const pdfButtons = screen.getAllByRole('button', { name: /^PDF$/i })
    await user.click(pdfButtons[0])
    expect(downloadPdfSpy).toHaveBeenCalledWith('dGFza3M=', 'Arbeitsblatt.pdf')
  })
})
