// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { AiProvider } from '../../context/AiContext'
import * as api from '../../api/client'
import KoordPage from './KoordPage'

const MOCK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

function renderKoordPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AiProvider>
        <KoordPage />
      </AiProvider>
    </QueryClientProvider>
  )
}

describe('KoordPage Integration Flow (Archetyp Generator-Page)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()

    // Hintergrund-Abfragen des AiProvider stummschalten
    vi.spyOn(api, 'getAiConfig').mockResolvedValue({
      active_provider: 'gemini',
      has_gemini_key: false,
      masked_gemini_key: null,
      gemini_default_model: 'gemini-2.5-flash',
      gemini_models: [],
    })
    vi.spyOn(api, 'getAiStatus').mockResolvedValue({
      available: false,
      models: [],
    })
  })

  it('übernimmt Parameteränderungen über Tabs hinweg und rendert nach Kompilierung das Vorschaubild', async () => {
    const user = userEvent.setup()
    const genSpy = vi.spyOn(api, 'generateKoordinatensystem').mockResolvedValue({
      latex: '\\documentclass{standalone}\\begin{document}\\begin{tikzpicture}\\end{tikzpicture}\\end{document}',
    })
    const compileSpy = vi.spyOn(api, 'compileLatex').mockResolvedValue({
      ok: true,
      png_base64: MOCK_PNG_BASE64,
      compile_time: 0.15,
      convert_time: 0.04,
    })

    renderKoordPage()

    // 1. Im Schnellstart-Tab den Koordinatenbereich per Schnellwahl-Button auf [-5, 5] × [-5, 5] ändern
    const quickRangeBtn = screen.getByRole('button', { name: '[-5, 5] × [-5, 5]' })
    await user.click(quickRangeBtn)

    // 2. Zum Tab "Erweitert" wechseln und manuellen TikZ-Code eintragen
    await user.click(screen.getByRole('button', { name: /Erweitert/i }))
    await user.click(screen.getByRole('button', { name: /Manueller TikZ-Code/i }))
    const manualTextarea = screen.getByPlaceholderText('% TikZ-Code hier einfügen...')
    await user.type(manualTextarea, '\\node at (0,0) {{Ursprung};')

    // 3. Kompilierung starten
    const compileBtn = screen.getByRole('button', { name: /Kompilieren/i })
    await user.click(compileBtn)

    await waitFor(() => {
      expect(genSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          xmin: -5.25,
          xmax: 5.25,
          ymin: -5.25,
          ymax: 5.25,
          manual_code: '\\node at (0,0) {Ursprung};',
        })
      )
    })

    expect(compileSpy).toHaveBeenCalledWith(
      expect.stringContaining('\\begin{tikzpicture}'),
      300
    )

    // 4. Vorschaubild ist sichtbar
    const previewImg = await screen.findByAltText('LaTeX Vorschau')
    expect(previewImg).toHaveAttribute('src', `data:image/png;base64,${MOCK_PNG_BASE64}`)
  })

  it('fängt API-Generierungsfehler (HTTP 422 / 500) sicher ab, setzt den Ladezustand zurück und zeigt die Fehlermeldung', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'generateKoordinatensystem').mockRejectedValue(
      new AxiosError(
        'Request failed with status code 422',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as never,
          data: { detail: 'Ungültiger Achsenbereich: xmin muss kleiner als xmax sein' },
        }
      )
    )

    renderKoordPage()

    const compileBtn = screen.getByRole('button', { name: /Kompilieren/i })
    await user.click(compileBtn)

    // Button darf nicht im Ladezustand hängen bleiben
    await waitFor(() => {
      expect(compileBtn).not.toBeDisabled()
      expect(compileBtn).not.toHaveAttribute('aria-busy', 'true')
    })

    // Fehlermeldung aus dem Backend-Detail wird im LatexErrorPanel angezeigt
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    expect(
      screen.getByText(/Ungültiger Achsenbereich: xmin muss kleiner als xmax sein/i)
    ).toBeInTheDocument()
  })

  it('zeigt bei einem LaTeX-Kompilierfehler (compileLatex ok: false) das Fehler-Panel in der Vorschau', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'generateKoordinatensystem').mockResolvedValue({
      latex: '\\begin{document}\\fehler\\end{document}',
    })
    vi.spyOn(api, 'compileLatex').mockResolvedValue({
      ok: false,
      log: '! Undefined control sequence.\nl.1 \\fehler',
    })

    renderKoordPage()

    await user.click(screen.getByRole('button', { name: /Kompilieren/i }))

    expect(await screen.findByText('LaTeX Kompilierfehler')).toBeInTheDocument()
    expect(screen.getByText('! Undefined control sequence.')).toBeInTheDocument()
  })
})
