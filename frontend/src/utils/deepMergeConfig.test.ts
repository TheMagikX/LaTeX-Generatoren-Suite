// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest'
import { deepMergeConfig } from './deepMergeConfig'
import { DEFAULT_CONFIG as GEO_DEFAULT } from '../pages/Geometrie/constantsGeo'
import { DEFAULT_CONFIG as BAUM_DEFAULT } from '../pages/Baumdiagramm/constantsBaum'
import { DEFAULT_CONFIG as GLUCK_DEFAULT } from '../pages/Glucksrad/constantsGluck'
import { DEFAULT_CONFIG as STELLENWERT_DEFAULT } from '../pages/Stellenwerttafel/constantsStellenwert'
import { DEFAULT_CONFIG as STATISTIK_DEFAULT } from '../pages/Statistik/constantsStatistik'
import { normalizeKoordConfig } from '../pages/Koordinatensystem/utilsKoord'

describe('deepMergeConfig & Preset-Normalisierung (Pattern #4)', () => {
  it('behält fehlende Sub-Objekte in GeoConfig (P8-20) bei partiellem Preset bei und klont Referenzen', () => {
    const partialPreset = {
      shape: 'Quadrilateral',
      elements: {
        points: { show: false },
      },
    }
    const merged = deepMergeConfig(GEO_DEFAULT, partialPreset)
    expect(merged.shape).toBe('Quadrilateral')
    expect(merged.elements.points.show).toBe(false)
    expect(merged.elements.points.labels.A).toBe(GEO_DEFAULT.elements.points.labels.A)
    expect(merged.elements.others).toEqual(GEO_DEFAULT.elements.others)
    expect(merged.elements.others).not.toBe(GEO_DEFAULT.elements.others)
    expect(merged.quad_construction).toEqual(GEO_DEFAULT.quad_construction)
    expect(merged.quad_construction).not.toBe(GEO_DEFAULT.quad_construction)
  })

  it('normalisiert fehlende Felder und Legacy-Aliase in verschachtelten Koord-Arrays (P8C-03)', () => {
    const legacyKoord = {
      xmin: -5,
      plots: [{ func: 'sin(x)', settings: 'dashed, red' }],
      csv_plots: [{ path: 'data.csv', style: 'thick, blue' }],
      points: [{ x: 1, y: 2, label: 'A', label_style: 'above' }],
      nodes: [{ text: 'Notiz', opts: 'draw' }],
      parametric_plots: [{ x_t: 't', y_t: 't^2', settings: 'dotted' }],
    }
    const normalized = normalizeKoordConfig(legacyKoord)
    expect(normalized.xmin).toBe(-5)
    expect(normalized.plots[0].func).toBe('sin(x)')
    expect(normalized.plots[0].custom_style).toBe('dashed, red')
    expect(normalized.plots[0].shades).toEqual([])
    expect(normalized.plots[0].tangents).toEqual([])
    expect(normalized.csv_plots[0].custom_style).toBe('thick, blue')
    expect(normalized.points[0].mark).toBe('x')
    expect(normalized.points[0].custom_label_style).toBe('above')
    expect(normalized.nodes[0].arrow_style).toBe('->, thick')
    expect(normalized.nodes[0].custom_opts).toBe('draw')
    expect(normalized.parametric_plots[0].custom_style).toBe('dotted')
  })

  it('ergänzt fehlende Sub-Objekte in BaumConfig, GluckConfig, StellenwertConfig und StatistikConfig ohne Map-/Array-Verschmutzung', () => {
    const baum = deepMergeConfig(BAUM_DEFAULT, {
      style: { grow_direction: 'right' },
      nodes: { '0_0': { label: 'A' } },
    })
    expect(baum.style.grow_direction).toBe('right')
    expect(baum.style.level_distance).toBe(BAUM_DEFAULT.style.level_distance)
    expect(baum.level_labels).toEqual(BAUM_DEFAULT.level_labels)
    expect(baum.root_node).toEqual(BAUM_DEFAULT.root_node)
    expect(Object.keys(baum.nodes)).toEqual(['0_0'])

    const gluck = deepMergeConfig(GLUCK_DEFAULT, {
      arrow_params: { color: '#000000' },
      sectors: [{ farbe: '#111111', haeufigkeit: 2, label: 'Neu' }],
    })
    expect(gluck.arrow_params.color).toBe('#000000')
    expect(gluck.arrow_params.length).toBe(GLUCK_DEFAULT.arrow_params.length)
    expect(gluck.sectors).toHaveLength(1)
    expect(gluck.sectors[0].label).toBe('Neu')

    const stellenwert = deepMergeConfig(STELLENWERT_DEFAULT, {
      layout: { show_header: false },
      rows: [{ id: 'r1', label: '', values: { z: 9 } }],
    })
    expect(stellenwert.layout.show_header).toBe(false)
    expect(stellenwert.layout.row_height).toBe(STELLENWERT_DEFAULT.layout.row_height)
    expect(stellenwert.rows).toHaveLength(1)
    expect(stellenwert.rows[0].values).toEqual({ z: 9 })

    const statistik = deepMergeConfig(STATISTIK_DEFAULT, { title_opts: { show: true, text: 'Test' } })
    expect(statistik.title_opts.show).toBe(true)
    expect(statistik.title_opts.font_size).toBe(STATISTIK_DEFAULT.title_opts.font_size)
  })

  it('schützt vor null/korrupten Sub-Objekten und ungültigen Array-Werten', () => {
    const corrupted = {
      layout: null,
      columns: 'invalid',
    }
    const merged = deepMergeConfig(STELLENWERT_DEFAULT, corrupted)
    expect(merged.layout).toEqual(STELLENWERT_DEFAULT.layout)
    expect(merged.columns).toEqual(STELLENWERT_DEFAULT.columns)
  })
})
