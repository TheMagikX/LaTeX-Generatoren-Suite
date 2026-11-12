// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import {
  apiClient,
  compileLatex,
  extractApiErrorMessage,
  generateKoordinatensystem,
  getPresetThumbnailUrl,
  listPresetsDetailed,
  savePreset,
  deletePreset,
  recordGeneratorDuration,
  type CompileResponse,
} from './client'
import { DEFAULT_CONFIG as DEFAULT_KOORD_CONFIG } from '../pages/Koordinatensystem/constantsKoord'

describe('api/client – Netzwerk-Resilienz, Fehlerextraktion & Endpunkte', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('extractApiErrorMessage', () => {
    it('extrahiert einfache String-Details aus FastAPI HTTPExceptions (z. B. 400 / 500)', () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Sicherheitsverstoß: Unerlaubter Befehl \\write18',
          },
        },
      }
      expect(extractApiErrorMessage(error, 'Fallback')).toBe(
        'Sicherheitsverstoß: Unerlaubter Befehl \\write18'
      )
    })

    it('formatiert Pydantic v2 Validierungsfehler-Arrays (HTTP 422) zu einer kommagetrennten Meldung', () => {
      const error = {
        response: {
          status: 422,
          data: {
            detail: [
              { loc: ['body', 'xmin'], msg: 'xmin muss kleiner als xmax sein' },
              { loc: ['body', 'dpi'], msg: 'Input should be less than or equal to 1200' },
            ],
          },
        },
      }
      expect(extractApiErrorMessage(error, 'Fallback')).toBe(
        'xmin muss kleiner als xmax sein, Input should be less than or equal to 1200'
      )
    })

    it('behandelt gemischte detail-Arrays und verschachtelte detail-Objekte', () => {
      const mixedArrayError = {
        response: {
          data: {
            detail: ['Ungültiges Feld', { code: 422, field: 'samples' }],
          },
        },
      }
      expect(extractApiErrorMessage(mixedArrayError, 'Fallback')).toBe(
        'Ungültiges Feld, {"code":422,"field":"samples"}'
      )

      const nestedObjectError = {
        response: {
          data: {
            detail: { message: 'Zeitüberschreitung im Solver' },
          },
        },
      }
      expect(extractApiErrorMessage(nestedObjectError, 'Fallback')).toBe(
        'Zeitüberschreitung im Solver'
      )
    })

    it('nutzt err.message bei Verbindungsabbrüchen / Timeouts ohne Server-Response', () => {
      const networkError = new AxiosError('Network Error: connect ECONNREFUSED 127.0.0.1:9000', 'ERR_NETWORK')
      expect(extractApiErrorMessage(networkError, 'Standardfehler')).toBe(
        'Network Error: connect ECONNREFUSED 127.0.0.1:9000'
      )
    })

    it('fällt bei leeren oder unbekannten Fehlerwerten sicher auf den Fallback-String zurück', () => {
      expect(extractApiErrorMessage(null, 'Verbindungsfehler zur API')).toBe('Verbindungsfehler zur API')
      expect(extractApiErrorMessage(undefined, 'Verbindungsfehler zur API')).toBe('Verbindungsfehler zur API')
      expect(extractApiErrorMessage({}, 'Verbindungsfehler zur API')).toBe('Verbindungsfehler zur API')
    })
  })

  describe('compileLatex', () => {
    it('sendet Compile-Request mit gewählter Engine und gibt bei Erfolg die Server-Antwort zurück', async () => {
      const mockResponse: CompileResponse = {
        ok: true,
        engine: 'xelatex',
        png_base64: 'iVBORw0KGgoAAAANSUhEUg==',
        compile_time: 0.18,
        convert_time: 0.04,
        total_backend_time: 0.22,
      }

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: mockResponse,
      })

      recordGeneratorDuration('koordinatensystem', 35)
      const result = await compileLatex('\\begin{document}Test\\end{document}', 300, false, 'xelatex')

      expect(postSpy).toHaveBeenCalledWith('compile/', {
        latex: '\\begin{document}Test\\end{document}',
        dpi: 300,
        all_pages: false,
        engine: 'xelatex',
      })
      expect(result).toEqual(mockResponse)
    })

    it('fängt Verbindungsabbrüche (ECONNREFUSED) und Timeouts ab und liefert { ok: false, log }', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(
        new Error('Network Error: Connection refused')
      )

      const result = await compileLatex('\\begin{tikzpicture}\\end{tikzpicture}', 300)

      expect(result.ok).toBe(false)
      expect(result.log).toMatch(/Verbindungsfehler zur API|Connection refused/i)
      expect(consoleSpy).toHaveBeenCalledTimes(1)
    })

    it('extrahiert bei HTTP 500 / 422 im Compile-Endpunkt die detail-Fehlermeldung in result.log', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
        response: {
          status: 500,
          data: {
            detail: '! Emergency stop.\nl.12 \\draw (0,0)',
          },
        },
      })

      const result = await compileLatex('\\draw (0,0)', 600, false, 'pdflatex')

      expect(result.ok).toBe(false)
      expect(result.log).toBe('! Emergency stop.\nl.12 \\draw (0,0)')
    })
  })

  describe('Generator- & Preset-Endpunkte', () => {
    it('reicht HTTP-422-Fehler bei generateKoordinatensystem an den Aufrufer weiter', async () => {
      const axios422 = new AxiosError(
        'Request failed with status code 422',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as never,
          data: { detail: 'Ungültiger Achsenbereich: xmin >= xmax' },
        }
      )
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(axios422)

      await expect(generateKoordinatensystem(DEFAULT_KOORD_CONFIG)).rejects.toThrow(
        'Request failed with status code 422'
      )
    })

    it('ruft listPresetsDetailed, savePreset und deletePreset mit korrekten Pfaden auf', async () => {
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { 'USER / Test': { config: DEFAULT_KOORD_CONFIG, has_thumbnail: false } },
      })
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { ok: true } })
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: { ok: true } })

      const listed = await listPresetsDetailed('koord')
      expect(getSpy).toHaveBeenCalledWith('presets/koord/detailed')
      expect(listed).toHaveProperty('USER / Test')

      const saved = await savePreset('koord', 'USER / Neu', DEFAULT_KOORD_CONFIG)
      expect(postSpy).toHaveBeenCalledWith('presets/koord/USER / Neu', DEFAULT_KOORD_CONFIG)
      expect(saved.ok).toBe(true)

      const deleted = await deletePreset('koord', 'USER / Neu')
      expect(deleteSpy).toHaveBeenCalledWith('presets/koord/USER / Neu')
      expect(deleted.ok).toBe(true)
    })

    it('erzeugt URL-codierte Thumbnail-Pfade inklusive optionalem Cache-Busting-Parameter v', () => {
      expect(
        getPresetThumbnailUrl('koord', 'MEYER / Mathe / 10 / Parabel & Gerade', 1730456000)
      ).toBe(
        '/api/presets/koord/thumbnail?name=MEYER+%2F+Mathe+%2F+10+%2F+Parabel+%26+Gerade&v=1730456000'
      )
    })
  })
})
