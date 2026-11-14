// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AiProvider } from '../../context/AiContext'
import * as api from '../../api/client'
import GluckPage from './GluckPage'

function renderGluckPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AiProvider>
        <GluckPage />
      </AiProvider>
    </QueryClientProvider>
  )
}

describe('GluckPage NaN-Guard (P8C-34)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()

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

  it('verhindert Endlos-Render-Schleife beim Leeren eines Häufigkeitsfeldes (NaN)', async () => {
    const user = userEvent.setup()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = renderGluckPage()

    expect(screen.getByText('6 Sektoren werden generiert')).toBeInTheDocument()

    const numberInputs = container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]')
    expect(numberInputs.length).toBe(3)

    // Erstes Häufigkeitsfeld leeren -> parseFloat('') === NaN
    await user.clear(numberInputs[0])

    await waitFor(() => {
      expect(screen.getByText('4 Sektoren werden generiert')).toBeInTheDocument()
    })

    // Alle übrigen Häufigkeitsfelder ebenfalls leeren -> totalAssigned === 0
    await user.clear(numberInputs[1])
    await user.clear(numberInputs[2])

    await waitFor(() => {
      expect(screen.getByText('Mindestens ein Sektor erforderlich')).toBeInTheDocument()
    })

    const maxDepthErrors = errorSpy.mock.calls.filter((args) =>
      String(args[0]).includes('Maximum update depth exceeded')
    )
    expect(maxDepthErrors).toHaveLength(0)
  })
})
