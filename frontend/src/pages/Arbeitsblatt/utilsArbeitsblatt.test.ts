// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi, afterEach } from 'vitest'
import { sanitizeWorksheetFilename, base64ToBlob, downloadFile, downloadPdf } from './utilsArbeitsblatt'

describe('sanitizeWorksheetFilename', () => {
  it('erzeugt Standard-Dateinamen ohne starres Arbeitsblatt-Präfix', () => {
    expect(sanitizeWorksheetFilename('Lineare Funktionen')).toBe('Lineare Funktionen.pdf')
    expect(sanitizeWorksheetFilename('Lineare Funktionen', true)).toBe('Lineare Funktionen - Lösungen.pdf')
    expect(sanitizeWorksheetFilename('Arbeitsblatt - Vektoren')).toBe('Arbeitsblatt - Vektoren.pdf')
  })

  it('liefert Fallback "Arbeitsblatt.pdf" bzw. "Arbeitsblatt - Lösungen.pdf" bei leerer Eingabe', () => {
    expect(sanitizeWorksheetFilename('')).toBe('Arbeitsblatt.pdf')
    expect(sanitizeWorksheetFilename('   ')).toBe('Arbeitsblatt.pdf')
    expect(sanitizeWorksheetFilename(null)).toBe('Arbeitsblatt.pdf')
    expect(sanitizeWorksheetFilename(undefined)).toBe('Arbeitsblatt.pdf')
    expect(sanitizeWorksheetFilename('   ...   ')).toBe('Arbeitsblatt.pdf')

    expect(sanitizeWorksheetFilename('', true)).toBe('Arbeitsblatt - Lösungen.pdf')
    expect(sanitizeWorksheetFilename(null, true)).toBe('Arbeitsblatt - Lösungen.pdf')
    expect(sanitizeWorksheetFilename(undefined, true)).toBe('Arbeitsblatt - Lösungen.pdf')
  })

  it('ersetzt verbotene Dateisystem-Sonderzeichen und normalisiert Whitespace/Steuerzeichen', () => {
    expect(sanitizeWorksheetFilename('Thema: Bruchrechnung / Teil 1 *neu*')).toBe(
      'Thema - Bruchrechnung - Teil 1 - neu.pdf',
    )
    expect(sanitizeWorksheetFilename('Mathe\\Physik|"<>')).toBe('Mathe - Physik.pdf')
    expect(sanitizeWorksheetFilename('Titel.\r\nMit\t  Zeilenumbruch.')).toBe('Titel. Mit Zeilenumbruch.pdf')
  })

  it('entfernt führende und nachlaufende Randzeichen (Punkte, Bindestriche, Unterstriche)', () => {
    expect(sanitizeWorksheetFilename('--- ... _Mein Titel_ ... ---')).toBe('Mein Titel.pdf')
    expect(sanitizeWorksheetFilename('Quadratische Gleichungen...')).toBe('Quadratische Gleichungen.pdf')
  })

  it('kürzt überlange Namen (> 100 Zeichen) wortschonend und erhält Lösungs-Suffix sowie .pdf', () => {
    const longTitle =
      'Mathematik Leistungskurs Jahrgangsstufe 12 Analysis Differenzialrechnung Kurvendiskussion ganzrationaler Funktionen mit Parametern und Extremwertaufgaben'

    const taskFilename = sanitizeWorksheetFilename(longTitle, false)
    expect(taskFilename.endsWith('.pdf')).toBe(true)
    expect(taskFilename.slice(0, -4).length).toBeLessThanOrEqual(100)
    expect(taskFilename).not.toMatch(/[-_\s.]\.pdf$/)

    const solFilename = sanitizeWorksheetFilename(longTitle, true)
    expect(solFilename.endsWith(' - Lösungen.pdf')).toBe(true)
    expect(solFilename.slice(0, -4).length).toBeLessThanOrEqual(100)
    expect(solFilename.slice(0, -' - Lösungen.pdf'.length)).not.toMatch(/[-_\s.]$/)
  })

  it('kürzt lange Wörter ohne Leerzeichen hart auf maxAllowedBase', () => {
    const singleLongWord = 'A'.repeat(130)
    const taskFilename = sanitizeWorksheetFilename(singleLongWord, false)
    expect(taskFilename).toBe(`${'A'.repeat(100)}.pdf`)

    const solFilename = sanitizeWorksheetFilename(singleLongWord, true)
    expect(solFilename).toBe(`${'A'.repeat(89)} - Lösungen.pdf`)
  })
})

describe('Blob-Download (base64ToBlob, downloadFile, downloadPdf)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('konvertiert Base64 in ein Blob mit korrektem MIME-Typ', async () => {
    const blob = base64ToBlob('SGVsbG8=', 'application/pdf')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBe(5)
  })

  it('löst downloadPdf über Object-URL und DOM-Link aus und gibt die URL wieder frei', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-pdf')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadPdf('SGVsbG8=', 'Testdatei.pdf')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(appendChildSpy).toHaveBeenCalledTimes(1)
    const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement
    expect(link.href).toBe('blob:http://localhost/test-pdf')
    expect(link.download).toBe('Testdatei.pdf')
    expect(link.style.display).toBe('none')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(removeChildSpy).toHaveBeenCalledWith(link)

    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-pdf')
  })

  it('übergibt benutzerdefinierten MIME-Typ in downloadFile', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-png')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadFile('SGVsbG8=', 'bild.png', 'image/png')

    const passedBlob = createObjectURL.mock.calls[0][0] as Blob
    expect(passedBlob.type).toBe('image/png')
  })
})
