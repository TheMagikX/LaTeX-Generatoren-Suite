// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  buildFlaschenzugTemplate,
  type FlaschenzugTemplateId,
  type FlaschenzugTemplateOptions,
} from './templatesFlasche'
import { validateRopePaths } from './utilsFlasche'
import type { FlaschenzugConfig } from './typesFlasche'
import { FlascheQuickBuilder } from './components/FlascheQuickBuilder'

const TEMPLATE_CASES: {
  label: string
  id: FlaschenzugTemplateId
  options?: FlaschenzugTemplateOptions
  expectedRopes: number
  expectedDeckeWidth: number
}[] = [
  { label: 'feste_rolle', id: 'feste_rolle', expectedRopes: 1, expectedDeckeWidth: 5.0 },
  { label: 'lose_rolle', id: 'lose_rolle', expectedRopes: 1, expectedDeckeWidth: 5.0 },
  {
    label: 'flaschenzug_n (default=4)',
    id: 'flaschenzug_n',
    expectedRopes: 1,
    expectedDeckeWidth: 5.0,
  },
  {
    label: 'flaschenzug_n (n=2)',
    id: 'flaschenzug_n',
    options: { tragendeSeile: 2 },
    expectedRopes: 1,
    expectedDeckeWidth: 5.0,
  },
  {
    label: 'flaschenzug_n (n=3)',
    id: 'flaschenzug_n',
    options: { tragendeSeile: 3 },
    expectedRopes: 1,
    expectedDeckeWidth: 5.0,
  },
  {
    label: 'flaschenzug_n (n=4)',
    id: 'flaschenzug_n',
    options: { tragendeSeile: 4 },
    expectedRopes: 1,
    expectedDeckeWidth: 5.0,
  },
  {
    label: 'flaschenzug_n (n=6)',
    id: 'flaschenzug_n',
    options: { tragendeSeile: 6 },
    expectedRopes: 1,
    expectedDeckeWidth: 6.0,
  },
  {
    label: 'potenzflaschenzug (default=3)',
    id: 'potenzflaschenzug',
    expectedRopes: 3,
    expectedDeckeWidth: 5.0,
  },
  {
    label: 'potenzflaschenzug (k=2)',
    id: 'potenzflaschenzug',
    options: { potenzStufen: 2 },
    expectedRopes: 2,
    expectedDeckeWidth: 5.0,
  },
  {
    label: 'potenzflaschenzug (k=3)',
    id: 'potenzflaschenzug',
    options: { potenzStufen: 3 },
    expectedRopes: 3,
    expectedDeckeWidth: 5.0,
  },
]

const collectIds = (cfg: FlaschenzugConfig): string[] => [
  ...cfg.pulleys.map((p) => p.id),
  ...cfg.anchors.map((a) => a.id),
  ...cfg.ropes.map((r) => r.id),
  ...cfg.masses.map((m) => m.id),
  ...cfg.manual_mounts.map((mm) => mm.id),
]

const isOn005Grid = (v: number): boolean => Math.abs(v * 20 - Math.round(v * 20)) < 1e-9

describe('buildFlaschenzugTemplate', () => {
  it.each(TEMPLATE_CASES)(
    'erzeugt gültige Konfiguration für $label ohne Seilpfad-Fehler oder Warnungen',
    ({ id, options, expectedRopes, expectedDeckeWidth }) => {
      const cfg = buildFlaschenzugTemplate(id, options)

      // Keine Seilpfad-Fehler oder Warnungen
      const diagnostics = validateRopePaths(cfg)
      expect(diagnostics).toEqual([])
      expect(cfg.ropes).toHaveLength(expectedRopes)

      // Umgebungseinstellungen
      expect(cfg.environment.show_decke).toBe(true)
      expect(cfg.environment.decke_y).toBe(3.5)
      expect(cfg.environment.show_boden).toBe(false)
      expect(cfg.environment.decke_width).toBe(expectedDeckeWidth)

      // Eindeutige, nicht-leere IDs
      const ids = collectIds(cfg)
      expect(ids.every((entry) => entry.trim().length > 0)).toBe(true)
      expect(new Set(ids).size).toBe(ids.length)

      // Eindeutige, nicht-leere Namen für Rollen, Anker und Seile
      const pulleyNames = cfg.pulleys.map((p) => p.name)
      const anchorNames = cfg.anchors.map((a) => a.name)
      const ropeNames = cfg.ropes.map((r) => r.name)
      expect([...pulleyNames, ...anchorNames, ...ropeNames].every((n) => n.trim().length > 0)).toBe(
        true,
      )
      // Rollen und Anker teilen sich den Namensraum in Seilpfaden
      const elementNames = [...pulleyNames, ...anchorNames]
      expect(new Set(elementNames).size).toBe(elementNames.length)
      expect(new Set(ropeNames).size).toBe(ropeNames.length)

      // Mindestens 1 MassConfig mit gültiger Referenz auf Rolle oder Anker
      expect(cfg.masses.length).toBeGreaterThanOrEqual(1)
      const elementSet = new Set(elementNames)
      cfg.masses.forEach((m) => {
        expect(elementSet.has(m.ref)).toBe(true)
      })

      // Alle Koordinaten auf 0.05-Raster
      cfg.pulleys.forEach((p) => {
        expect(isOn005Grid(p.x)).toBe(true)
        expect(isOn005Grid(p.y)).toBe(true)
      })
      cfg.anchors.forEach((a) => {
        expect(isOn005Grid(a.x)).toBe(true)
        expect(isOn005Grid(a.y)).toBe(true)
      })
      cfg.manual_mounts.forEach((mm) => {
        expect(isOn005Grid(mm.x1)).toBe(true)
        expect(isOn005Grid(mm.y1)).toBe(true)
        expect(isOn005Grid(mm.x2)).toBe(true)
        expect(isOn005Grid(mm.y2)).toBe(true)
      })
    },
  )

  it('erzeugt bei mehrfachen Aufrufen unterschiedliche IDs', () => {
    const first = buildFlaschenzugTemplate('flaschenzug_n', { tragendeSeile: 4 })
    const second = buildFlaschenzugTemplate('flaschenzug_n', { tragendeSeile: 4 })

    const firstIds = new Set(collectIds(first))
    const secondIds = collectIds(second)
    secondIds.forEach((id) => {
      expect(firstIds.has(id)).toBe(false)
    })
  })
})

describe('FlascheQuickBuilder', () => {
  it('wendet Vorlagen erst bei Button-Klick an und nicht beim Ändern der Dropdowns', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(React.createElement(FlascheQuickBuilder, { onApply }))

    const seileSelect = screen.getByLabelText('Anzahl tragender Seile') as HTMLSelectElement
    const stufenSelect = screen.getByLabelText('Anzahl loser Rollen') as HTMLSelectElement
    expect(seileSelect.value).toBe('4')
    expect(stufenSelect.value).toBe('3')

    // Umstellen der Dropdowns darf onApply nicht auslösen
    await user.selectOptions(seileSelect, '6')
    await user.selectOptions(stufenSelect, '2')
    expect(onApply).not.toHaveBeenCalled()

    // Klick auf Feste Rolle
    await user.click(screen.getByRole('button', { name: 'Feste Rolle' }))
    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply.mock.calls[0][0].pulleys).toHaveLength(1)

    // Klick auf Lose Rolle
    await user.click(screen.getByRole('button', { name: 'Lose Rolle' }))
    expect(onApply).toHaveBeenCalledTimes(2)
    expect(onApply.mock.calls[1][0].pulleys[0].mount).toBe('Keine')

    // Klick auf Flaschenzug mit gewählten 6 Seilen
    await user.click(screen.getByRole('button', { name: 'Flaschenzug' }))
    expect(onApply).toHaveBeenCalledTimes(3)
    expect(onApply.mock.calls[2][0].pulleys).toHaveLength(6)
    expect(onApply.mock.calls[2][0].environment.decke_width).toBe(6.0)

    // Klick auf Potenzflaschenzug mit gewählten 2 losen Rollen (2 lose + 1 feste = 3 Rollen, 2 Seile)
    await user.click(screen.getByRole('button', { name: 'Potenzflaschenzug' }))
    expect(onApply).toHaveBeenCalledTimes(4)
    expect(onApply.mock.calls[3][0].pulleys).toHaveLength(3)
    expect(onApply.mock.calls[3][0].ropes).toHaveLength(2)
  })
})
