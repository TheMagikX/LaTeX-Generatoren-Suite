// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label, Switch, FontSelector } from '../../../components/ui'
import type { StellenwertConfig, SeparatorLineStyle, StellenwertLayoutUpdater } from '../typesStellenwert'

interface StellenwertTabErweitertProps {
  config: StellenwertConfig
  updateConfig: (key: keyof StellenwertConfig, value: unknown) => void
}

export const StellenwertTabErweitert = ({ config, updateConfig }: StellenwertTabErweitertProps) => {
  const setLayout: StellenwertLayoutUpdater = (key, value) => updateConfig('layout', { ...config.layout, [key]: value })
  const activeCols = config.columns.filter(c => c.active)

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label>Dezimaltrenner (Kommalinie)</Label>
        <select
          value={config.decimal_separator_pos !== null && config.decimal_separator_pos > 0 && config.decimal_separator_pos < activeCols.length ? String(config.decimal_separator_pos) : ''}
          onChange={e => updateConfig('decimal_separator_pos', e.target.value === '' ? null : parseInt(e.target.value, 10))}
          className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink"
        >
          <option value="">Keiner</option>
          {activeCols.slice(0, -1).map((col, idx) => (
            <option key={col.id} value={idx + 1}>
              Nach Spalte „{col.label}“ ({idx + 1})
            </option>
          ))}
        </select>

        {config.decimal_separator_pos !== null && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Trenner-Stil</Label>
                <select
                  value={config.layout.decimal_separator_style ?? 'ultra_thick'}
                  onChange={e => setLayout('decimal_separator_style', e.target.value as SeparatorLineStyle)}
                  className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink"
                >
                  <option value="ultra_thick">Extra dick (Standard)</option>
                  <option value="thick">Dick</option>
                  <option value="dashed">Gestrichelt</option>
                  <option value="double">Doppellinie</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Trenner-Farbe</Label>
                <input
                  type="color"
                  value={config.layout.decimal_separator_color ?? '#000000'}
                  onChange={e => setLayout('decimal_separator_color', e.target.value)}
                  className="w-full h-9 rounded-lg border border-rim cursor-pointer bg-panel px-1"
                />
              </div>
            </div>
            <Switch
              label="Komma-Symbol (,) auf Trennlinie anzeigen"
              checked={config.layout.show_decimal_comma ?? false}
              onChange={v => setLayout('show_decimal_comma', v)}
            />
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-line">
        <Label>Gruppen-Trennlinien (Bündelungsstriche)</Label>
        <p className="text-xs text-ghost italic">
          Hebt die vertikalen Linien zwischen definierten Spaltengruppen (Ober-Headern) im gesamten Gitter hervor.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Linienstil</Label>
            <select
              value={config.layout.group_separator_style ?? ''}
              onChange={e => setLayout('group_separator_style', (e.target.value === '' ? null : e.target.value) as SeparatorLineStyle | null)}
              className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink"
            >
              <option value="">Standard (wie Gitter)</option>
              <option value="thick">Dick</option>
              <option value="ultra_thick">Extra dick</option>
              <option value="dashed">Gestrichelt</option>
              <option value="double">Doppellinie</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Linienfarbe</Label>
            <input
              type="color"
              disabled={!config.layout.group_separator_style}
              value={config.layout.group_separator_color ?? '#000000'}
              onChange={e => setLayout('group_separator_color', e.target.value)}
              className="w-full h-9 rounded-lg border border-rim cursor-pointer bg-panel px-1 disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-line">
        <Label>Schriftgröße (LaTeX)</Label>
        <select
          value={config.font_size}
          onChange={e => updateConfig('font_size', e.target.value)}
          className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink"
        >
          <option value="small">Klein</option>
          <option value="normalsize">Normal</option>
          <option value="large">Groß</option>
          <option value="Large">Sehr groß</option>
          <option value="huge">Riesig</option>
        </select>
      </div>

      <div className="space-y-4 pt-4 border-t border-line">
        <FontSelector value={config.font_family} onChange={v => updateConfig('font_family', v)} />
      </div>
    </div>
  )
}
