// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as api from '../api/client'
import type { DetailedPresetMap } from '../api/client'
import { PresetManager, parsePresetPath } from './PresetManager'

interface DummyConfig {
  xmin: number
  xmax: number
}

const createMockPresets = (): DetailedPresetMap<DummyConfig> => ({
  'MEYER / Mathematik / 10 / Normalparabel': {
    config: { xmin: -5, xmax: 5 },
    has_thumbnail: false,
    updated_at: 1730456000,
  },
  'SCHMIDT / Physik / 11 / Wurfbewegung': {
    config: { xmin: 0, xmax: 20 },
    has_thumbnail: true,
    updated_at: 1730556000,
  },
})

function renderPresetManager(
  props?: Partial<React.ComponentProps<typeof PresetManager<DummyConfig>>>
) {
  localStorage.setItem('preset-manager:selected-user', 'Alle Nutzer')
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  const onLoad = vi.fn()
  const defaultProps = {
    generator: 'koord',
    currentConfig: { xmin: -10, xmax: 10 },
    onLoad,
    ...props,
  }

  return {
    queryClient,
    onLoad: defaultProps.onLoad,
    ...render(
      <QueryClientProvider client={queryClient}>
        <PresetManager<DummyConfig> {...defaultProps} />
      </QueryClientProvider>
    ),
  }
}

describe('PresetManager Integration & Pfad-Logik', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('parsePresetPath', () => {
    it('zerlegt verschachtelte Preset-Namen in Nutzer, Fach, Jahrgang und Basisnamen', () => {
      expect(parsePresetPath('MEYER / Mathematik / 10 / Normalparabel')).toEqual({
        folder: 'MEYER / Mathematik / 10',
        name: 'Normalparabel',
        user: 'MEYER',
        subject: 'Mathematik',
        year: '10',
        extraFolders: [],
      })
    })
  })

  describe('Laden, Filtern & Suchen', () => {
    it('lädt Presets via listPresetsDetailed und filtert nach Nutzer, Fach und Suchbegriff', async () => {
      const user = userEvent.setup()
      vi.spyOn(api, 'listPresetsDetailed').mockResolvedValue(createMockPresets())

      renderPresetManager()

      // Warten, bis beide Presets gerendert sind
      expect(await screen.findByText('Normalparabel')).toBeInTheDocument()
      expect(screen.getByText('Wurfbewegung')).toBeInTheDocument()

      // 1. Volltextsuche nach "Wurf"
      const searchInput = screen.getByPlaceholderText('Suchen...')
      await user.type(searchInput, 'Wurf')
      expect(screen.queryByText('Normalparabel')).not.toBeInTheDocument()
      expect(screen.getByText('Wurfbewegung')).toBeInTheDocument()

      // Filter zurücksetzen
      await user.click(screen.getByRole('button', { name: /Filter zurücksetzen/i }))
      expect(screen.getByText('Normalparabel')).toBeInTheDocument()
      expect(screen.getByText('Wurfbewegung')).toBeInTheDocument()

      // 2. Dropdown-Filter nach Nutzer "MEYER"
      const listSection = document.getElementById('preset-list-section') as HTMLElement
      const userFilterSelect = within(listSection).getByLabelText(/Nutzer/i)
      await user.selectOptions(userFilterSelect, 'MEYER')

      expect(screen.getByText('Normalparabel')).toBeInTheDocument()
      expect(screen.queryByText('Wurfbewegung')).not.toBeInTheDocument()
    })

    it('öffnet beim Klick auf "Laden & Anwenden" den Bestätigungsdialog und übergibt die Config an onLoad', async () => {
      const user = userEvent.setup()
      vi.spyOn(api, 'listPresetsDetailed').mockResolvedValue(createMockPresets())

      const { onLoad } = renderPresetManager()
      await screen.findByText('Normalparabel')

      const loadButtons = screen.getAllByRole('button', { name: /Laden & Anwenden/i })
      await user.click(loadButtons[0])

      // ConfirmDialog "Preset laden?" muss erscheinen
      const dialog = screen.getByRole('dialog', { name: 'Preset laden?' })
      expect(dialog).toBeInTheDocument()

      await user.click(within(dialog).getByRole('button', { name: 'Laden' }))
      expect(onLoad).toHaveBeenCalledTimes(1)
      expect(onLoad).toHaveBeenCalledWith({ xmin: -5, xmax: 5 })
    })
  })

  describe('Speichern, Überschreiben, Löschen & Cache-Invalidierung', () => {
    it('speichert ein neues Preset und invalidiert den TanStack-Query-Cache', async () => {
      const user = userEvent.setup()
      const listSpy = vi.spyOn(api, 'listPresetsDetailed').mockResolvedValue(createMockPresets())
      const saveSpy = vi.spyOn(api, 'savePreset').mockResolvedValue({ ok: true })

      const { queryClient } = renderPresetManager({
        currentConfig: { xmin: -8, xmax: 8 },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await screen.findByText('Normalparabel')

      // Sektion "Preset speichern" aufklappen
      await user.click(screen.getByRole('button', { name: /Preset speichern/i }))

      const nameInput = screen.getByPlaceholderText('Preset-Name')
      await user.type(nameInput, 'Parabel-Übung{Enter}')

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith('koord', 'USER / Parabel-Übung', {
          xmin: -8,
          xmax: 8,
        })
      })

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['presets', 'koord'] })
      expect(listSpy).toHaveBeenCalledTimes(2)
    })

    it('verlangt eine Bestätigung beim Überschreiben eines bestehenden Presets über die PresetCard', async () => {
      const user = userEvent.setup()
      vi.spyOn(api, 'listPresetsDetailed').mockResolvedValue(createMockPresets())
      const saveSpy = vi.spyOn(api, 'savePreset').mockResolvedValue({ ok: true })

      renderPresetManager({ currentConfig: { xmin: -2, xmax: 2 } })
      await screen.findByText('Normalparabel')

      const overwriteButtons = screen.getAllByRole('button', {
        name: 'Aktuelle Konfiguration hierauf speichern',
      })
      await user.click(overwriteButtons[0])

      // ConfirmDialog "Preset überschreiben?" muss erscheinen
      const dialog = screen.getByRole('dialog', { name: 'Preset überschreiben?' })
      expect(dialog).toBeInTheDocument()
      expect(saveSpy).not.toHaveBeenCalled()

      await user.click(within(dialog).getByRole('button', { name: 'Überschreiben' }))

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith(
          'koord',
          'MEYER / Mathematik / 10 / Normalparabel',
          { xmin: -2, xmax: 2 }
        )
      })
    })

    it('löscht ein Preset nach positiver window.confirm-Abfrage und invalidiert den Cache', async () => {
      const user = userEvent.setup()
      vi.spyOn(api, 'listPresetsDetailed').mockResolvedValue(createMockPresets())
      const deleteSpy = vi.spyOn(api, 'deletePreset').mockResolvedValue({ ok: true })
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      const { queryClient } = renderPresetManager()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await screen.findByText('Normalparabel')

      const deleteButtons = screen.getAllByRole('button', { name: 'Löschen' })
      await user.click(deleteButtons[0])

      expect(confirmSpy).toHaveBeenCalledWith(
        'Preset "MEYER / Mathematik / 10 / Normalparabel" wirklich löschen?'
      )
      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith(
          'koord',
          'MEYER / Mathematik / 10 / Normalparabel'
        )
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['presets', 'koord'] })
    })
  })
})
