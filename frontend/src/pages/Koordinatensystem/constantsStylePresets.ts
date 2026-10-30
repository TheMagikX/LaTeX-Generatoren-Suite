// SPDX-License-Identifier: AGPL-3.0-or-later

export interface ColorPreset {
  id: string
  label: string
  color: string
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'black', label: 'Schwarz', color: '#1e293b' },
  { id: 'slate', label: 'Dunkelgrau', color: '#64748b' },
  { id: 'blue', label: 'Blau', color: '#2563eb' },
  { id: 'red', label: 'Rot', color: '#ef4444' },
  { id: 'green', label: 'Grün', color: '#10b981' },
  { id: 'violet', label: 'Violett', color: '#8b5cf6' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
  { id: 'teal', label: 'Türkis', color: '#06b6d4' },
]

export interface LineStylePreset {
  id: string
  label: string
  value: string
  dashArray?: string
}

export const LINE_STYLE_PRESETS: LineStylePreset[] = [
  { id: 'solid', label: 'Durchgezogen', value: 'solid' },
  { id: 'dashed', label: 'Gestrichelt', value: 'dashed', dashArray: '5 3' },
  { id: 'dotted', label: 'Gepunktet', value: 'dotted', dashArray: '2 3' },
  { id: 'densely_dashed', label: 'Dicht gestrichelt', value: 'densely dashed', dashArray: '3 2' },
  { id: 'loosely_dashed', label: 'Locker gestrichelt', value: 'loosely dashed', dashArray: '7 5' },
  { id: 'dashdotted', label: 'Strichpunktiert', value: 'dashdotted', dashArray: '6 2 2 2' },
]

export const LINE_WIDTH_OPTIONS = [
  { value: 'ultra thin', label: 'Sehr dünn (0.1 pt)' },
  { value: 'very thin', label: 'Dünn (0.2 pt)' },
  { value: 'thin', label: 'Fein (0.4 pt)' },
  { value: 'semithick', label: 'Mittel (0.6 pt)' },
  { value: 'thick', label: 'Dick (0.8 pt)' },
  { value: 'very thick', label: 'Sehr dick (1.2 pt)' },
  { value: 'ultra thick', label: 'Extra dick (1.6 pt)' },
]

