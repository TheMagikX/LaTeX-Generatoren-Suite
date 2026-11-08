// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlascheTabSeile, getSegmentKey } from './FlascheTabSeile'
import { DEFAULT_CONFIG } from '../constantsFlasche'
import type { FlaschenzugConfig, RopeSegmentConfig } from '../typesFlasche'

const createTestConfig = (): FlaschenzugConfig => ({
  ...DEFAULT_CONFIG,
  pulleys: [
    {
      id: 'p1',
      name: 'R1',
      x: 0,
      y: 2,
      radius: 0.5,
      label: 'Oben',
      label_pos: 'above',
      mount: 'Einseitig',
      mount_angle: 90,
      mount_length: 0.5,
    },
    {
      id: 'p2',
      name: 'R2',
      x: 0,
      y: 0,
      radius: 0.5,
      label: 'Unten',
      label_pos: 'below',
      mount: 'Keine',
      mount_angle: 270,
      mount_length: 0.5,
    },
  ],
  anchors: [
    {
      id: 'a1',
      name: 'A1',
      x: -0.5,
      y: 3,
      label: 'Decke',
      shape: 'Kreis',
      size: 2,
    },
  ],
  ropes: [
    {
      id: 'rope-1',
      name: 'Hauptseil',
      style: 'plain',
      color: 'black',
      width: 1.0,
      // Absichtlich ohne `id` wie in bestehenden JSON-Presets
      path: [
        { name: 'A1', side: 'none' },
        { name: 'R2', side: 'ccw' },
        { name: 'R1', side: 'cw' },
      ],
    },
  ],
})

const StatefulHarness: React.FC<{ initial: FlaschenzugConfig }> = ({ initial }) => {
  const [cfg, setCfg] = useState<FlaschenzugConfig>(initial)
  return (
    <div>
      <FlascheTabSeile cfg={cfg} setCfg={setCfg} />
      <output data-testid="path-order">
        {cfg.ropes[0]?.path.map(s => `${s.name}:${s.side}`).join(' -> ')}
      </output>
    </div>
  )
}

describe('FlascheTabSeile ReorderList Integration', () => {
  it('vergibt stabile Schlüssel für Segmente mit und ohne gespeicherte ID', () => {
    const segWithoutId: RopeSegmentConfig = { name: 'R1', side: 'cw' }
    const firstKey = getSegmentKey(segWithoutId)
    const secondKey = getSegmentKey(segWithoutId)
    expect(firstKey).toBeTruthy()
    expect(firstKey).toBe(secondKey)

    const segWithId: RopeSegmentConfig = { id: 'custom-id-1', name: 'R2', side: 'ccw' }
    expect(getSegmentKey(segWithId)).toBe('custom-id-1')
  })

  it('sortiert Pfadsegmente per Tastatur-Steuerung in ReorderList um', async () => {
    const user = userEvent.setup()
    render(<StatefulHarness initial={createTestConfig()} />)

    // Accordion "Seilführung" öffnen
    await user.click(screen.getByRole('button', { name: /Seilführung/i }))
    // Collapsible "Hauptseil" öffnen
    await user.click(screen.getByRole('button', { name: /Hauptseil/i }))

    expect(screen.getByTestId('path-order')).toHaveTextContent('A1:none -> R2:ccw -> R1:cw')

    const list = screen.getByRole('list', { name: /Seilpfad Hauptseil/i })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)

    // Erstes Segment (A1) per Tastatur greifen, eine Position nach unten schieben und ablegen
    items[0].focus()
    fireEvent.keyDown(items[0], { key: ' ' })
    fireEvent.keyDown(items[0], { key: 'ArrowDown' })
    fireEvent.keyDown(items[0], { key: ' ' })

    expect(screen.getByTestId('path-order')).toHaveTextContent('R2:ccw -> A1:none -> R1:cw')
  })

  it('aktualisiert, ergänzt und entfernt Pfadsegmente unveränderlich', async () => {
    const user = userEvent.setup()
    const initial = createTestConfig()
    const originalFirstSeg = initial.ropes[0].path[0]

    render(<StatefulHarness initial={initial} />)

    await user.click(screen.getByRole('button', { name: /Seilführung/i }))
    await user.click(screen.getByRole('button', { name: /Hauptseil/i }))

    // Richtung des ersten Segments ändern
    const sideSelect = screen.getByLabelText('Pfadpunkt 1 Richtung')
    await user.selectOptions(sideSelect, 'cw')

    expect(screen.getByTestId('path-order')).toHaveTextContent('A1:cw -> R2:ccw -> R1:cw')
    // Ursprungsobjekt darf nicht in-place mutiert worden sein
    expect(originalFirstSeg.side).toBe('none')

    // Neues Segment anhängen
    await user.click(screen.getByRole('button', { name: /\+ Segment anhängen/i }))
    expect(screen.getByTestId('path-order')).toHaveTextContent('A1:cw -> R2:ccw -> R1:cw -> :cw')

    // Letztes Segment wieder entfernen
    const removeButtons = screen.getAllByTitle('Segment entfernen')
    await user.click(removeButtons[removeButtons.length - 1])
    expect(screen.getByTestId('path-order')).toHaveTextContent('A1:cw -> R2:ccw -> R1:cw')
  })
})
