// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ArbeitsblattPreview from './ArbeitsblattPreview'
import { sanitizeFilename } from '../utilsArbeitsblatt'
import * as utilsArbeitsblatt from '../utilsArbeitsblatt'
import type { ArbeitsblattConfig } from '../typesArbeitsblatt'

describe('sanitizeFilename (P6B-06)', () => {
  it('bereinigt verbotene Dateisystemzeichen, Steuerzeichen und nachlaufende Punkte', () => {
    expect(sanitizeFilename('Klasse 10a / Test: 1*?')).toBe('Klasse 10a _ Test_ 1_')
    expect(sanitizeFilename('Mathe\\Physik|"<>')).toBe('Mathe_Physik_')
    expect(sanitizeFilename('Titel.\nMit   Zeilenumbruch.')).toBe('Titel. Mit Zeilenumbruch')
  })

  it('liefert Fallback "Unbenannt" bei leerem oder rein aus Punkten/Leerzeichen bestehendem Titel', () => {
    expect(sanitizeFilename('')).toBe('Unbenannt')
    expect(sanitizeFilename('   ...   ')).toBe('Unbenannt')
    expect(sanitizeFilename(undefined)).toBe('Unbenannt')
    expect(sanitizeFilename(null)).toBe('Unbenannt')
  })
})

describe('ArbeitsblattPreview PDF-Dateinamen (P6B-06)', () => {
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
    expect(downloadPdfSpy).toHaveBeenCalledWith('dGFza3M=', 'Arbeitsblatt - Mathe 10a_ _ Test_.pdf')

    await user.click(pdfButtons[1])
    expect(downloadPdfSpy).toHaveBeenCalledWith('c29scw==', 'Arbeitsblatt - Mathe 10a_ _ Test_ - Lösungen.pdf')

    // FloatingToolbar PDF button (dritter PDF-Button)
    await user.click(pdfButtons[2])
    expect(downloadPdfSpy).toHaveBeenLastCalledWith('dGFza3M=', 'Arbeitsblatt - Mathe 10a_ _ Test_.pdf')
  })

  it('nutzt Fallback "Unbenannt" bei leerem header_title', async () => {
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
    expect(downloadPdfSpy).toHaveBeenCalledWith('dGFza3M=', 'Arbeitsblatt - Unbenannt.pdf')
  })
})
