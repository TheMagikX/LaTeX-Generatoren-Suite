import { describe, it, expect } from 'vitest'
import { parseRawData, extractBarchartCategories, computeAutoYRange } from './utilsStatistik'
import type { StatistikConfig, AxisConfig, DatasetConfig } from './typesStatistik'

const makeAxis = (overrides: Partial<AxisConfig> = {}): AxisConfig => ({
  min: null,
  max: null,
  step: 1,
  label: '',
  show_grid: true,
  tick_mode: 'Automatisch',
  tick_list: '',
  majorticklabels: true,
  ticks_show: true,
  ...overrides,
})

const makeDataset = (overrides: Partial<DatasetConfig> = {}): DatasetConfig => ({
  name: 'Test',
  data_mode: 'Raw',
  raw_data: [],
  raw_data_string: '',
  freq_data_string: '',
  bar_labels_string: '',
  color: '#2563eb',
  show_outliers: true,
  enabled: true,
  ...overrides,
})

const makeConfig = (overrides: Partial<StatistikConfig> = {}): StatistikConfig => ({
  type: 'Boxplot',
  datasets: [makeDataset()],
  x_axis: makeAxis(),
  y_axis: makeAxis(),
  boxplot_opts: { orientation: 'vertical', box_width: 0.5, draw_mean: false },
  histogram_opts: { bin_width: 1, density: false },
  barchart_opts: { orientation: 'vertical', bar_width: 0.6, show_values: false },
  summenkurve_opts: { smooth: false, as_percent: false },
  violin_opts: { orientation: 'vertical', violin_width: 0.6, bandwidth: 0.5, show_inner_box: false },
  title_opts: { show: false, text: '', color: '#1e293b', font_size: '\\large', font_weight: 'bold', align: 'center' },
  font_family: 'sans',
  font_size: '\\normalsize',
  width_cm: 12,
  height_cm: 8,
  ...overrides,
})

describe('parseRawData (P8D-14)', () => {
  it('parst Semikolon-getrennte Zahlen mit Dezimalkomma korrekt', () => {
    expect(parseRawData('1,5; 2,3; 4,1')).toEqual([1.5, 2.3, 4.1])
    expect(parseRawData('1,5;2,3;-0,5')).toEqual([1.5, 2.3, -0.5])
  })

  it('unterstützt Komma-, Leerzeichen- und Zeilenumbruch-Trennung', () => {
    expect(parseRawData('1, 2, 3')).toEqual([1, 2, 3])
    expect(parseRawData('1.5, 2.3\n4.1 5')).toEqual([1.5, 2.3, 4.1, 5])
  })

  it('verwirft Teilstrings, leere Tokens, NaN und Infinity', () => {
    expect(parseRawData('12abc; Infinity; -Infinity; NaN; ; 7,5')).toEqual([7.5])
    expect(parseRawData('   ; ,  ')).toEqual([])
  })
})

describe('extractBarchartCategories (P8D-14 / P8D-15)', () => {
  it('behält Dezimalkommas bei Semikolon-getrennten Rohdaten und sortiert numerisch', () => {
    expect(extractBarchartCategories({
      data_mode: 'Raw',
      raw_data_string: '2,3; 1,5; 2,3',
    })).toEqual(['1,5', '2,3'])
  })

  it('behandelt Infinity nicht als gültige Zahl', () => {
    expect(extractBarchartCategories({
      data_mode: 'Raw',
      raw_data_string: '1,5; Infinity',
    })).toEqual(['1,5', 'Infinity'])
  })

  it('trennt Textkategorien sowohl bei Semikolon als auch bei Komma ohne Ziffer', () => {
    expect(extractBarchartCategories({
      data_mode: 'Raw',
      raw_data_string: 'Apfel,Birne; Apfel',
    })).toEqual(['Apfel', 'Birne'])
  })
})

describe('computeAutoYRange (P8D-15)', () => {
  it('liefert endliche Werte bei NaN/Infinity in y_axis.min und y_axis.step (Säulendiagramm)', () => {
    const cfg = makeConfig({
      type: 'Säulendiagramm',
      y_axis: makeAxis({ min: Number.NaN, step: Number.POSITIVE_INFINITY }),
      datasets: [makeDataset({ data_mode: 'Frequency', freq_data_string: 'A: 3; B: Infinity; C: 12abc' })],
    })
    const range = computeAutoYRange(cfg)
    expect(Number.isFinite(range.min)).toBe(true)
    expect(Number.isFinite(range.max)).toBe(true)
    expect(range).toEqual({ min: 0, max: 4 })
  })

  it('liefert endliche Werte bei NaN/Infinity in x_axis/bin_width/raw_data (Histogramm)', () => {
    const cfg = makeConfig({
      type: 'Histogramm',
      x_axis: makeAxis({ min: Number.NaN, max: Number.POSITIVE_INFINITY }),
      histogram_opts: { bin_width: Number.POSITIVE_INFINITY, density: false },
      datasets: [makeDataset({ raw_data: [1, Number.NaN, Number.POSITIVE_INFINITY, 2] })],
    })
    const range = computeAutoYRange(cfg)
    expect(Number.isFinite(range.min)).toBe(true)
    expect(Number.isFinite(range.max)).toBe(true)
    expect(range).toEqual({ min: 0, max: 2 })
  })

  it('filtert NaN/Infinity aus raw_data bei Boxplot und Violin', () => {
    const cfg = makeConfig({
      type: 'Boxplot',
      datasets: [makeDataset({ raw_data: [Number.NaN, Number.POSITIVE_INFINITY], raw_data_string: '2,5; 7,5' })],
    })
    const range = computeAutoYRange(cfg)
    expect(Number.isFinite(range.min)).toBe(true)
    expect(Number.isFinite(range.max)).toBe(true)
    expect(range.min).toBeLessThan(2.5)
    expect(range.max).toBeGreaterThan(7.5)
  })
})
