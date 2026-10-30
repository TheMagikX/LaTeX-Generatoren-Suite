// SPDX-License-Identifier: AGPL-3.0-or-later

import { Label, NumberInput, Slider, Switch } from '../../../components/ui'
import type { StellenwertConfig, StellenwertLayoutUpdater } from '../typesStellenwert'

interface StellenwertTabDarstellungProps {
  config: StellenwertConfig
  updateConfig: (key: keyof StellenwertConfig, value: unknown) => void
}

export const StellenwertTabDarstellung = ({ config, updateConfig }: StellenwertTabDarstellungProps) => {

  const setLayout: StellenwertLayoutUpdater = (key, value) =>
    updateConfig('layout', { ...config.layout, [key]: value })

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label>Anzeigemodus</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['Ziffern', 'Plättchen', 'Beides', 'Leer'] as const).map(m => (
            <button
              key={m}
              onClick={() => updateConfig('mode', m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${config.mode === m
                ? 'bg-primary text-white shadow-lg'
                : 'bg-raised text-muted hover:bg-overlay'
                }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-line">
        <div className="space-y-3">
          <Label>Plättchen-Stil</Label>
          <select
            value={config.layout.token_style}
            onChange={e => setLayout('token_style', e.target.value as typeof config.layout.token_style)}
            className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink"
          >
            <option value="filled">Gefüllt</option>
            <option value="outline">Umrandung</option>
            <option value="cross">Kreuz</option>
          </select>
        </div>
        <div className="space-y-3">
          <Label>Max. Plättchen pro Zeile</Label>
          <NumberInput
            value={config.layout.max_tokens_per_row}
            min={1} max={10}
            onChange={e => setLayout('max_tokens_per_row', parseInt(e.target.value) || 5)}
          />
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-line">
        <div className="grid grid-cols-3 gap-4">
          <Slider
            label="Plättchen-Größe (Radius)"
            min={0.05} max={0.3} step={0.01}
            value={config.layout.token_size}
            onChange={v => setLayout('token_size', v)}
          />
          <Slider
            label="Zeilenhöhe (cm)"
            min={0.5} max={5} step={0.1}
            value={config.layout.row_height}
            onChange={v => setLayout('row_height', v)}
          />
          <Slider
            label="Spaltenbreite (cm)"
            min={0.5} max={5} step={0.1}
            value={config.layout.col_width}
            onChange={v => setLayout('col_width', v)}
          />
        </div>

        {config.layout.show_header && (
          <div className="space-y-4 pt-2 border-t border-line/50">
            <Slider
              label="Header-Deckkraft (Opacity)"
              min={0.05} max={1.0} step={0.05}
              value={config.layout.header_bg_opacity ?? 0.85}
              onChange={v => setLayout('header_bg_opacity', v)}
            />
            <div className="grid grid-cols-[7fr_3fr] gap-6 items-end">
              <Slider
                label="Header-Höhe (cm)"
                min={0.5} max={6} step={0.1}
                disabled={config.layout.auto_header_height ?? true}
                value={config.layout.header_height ?? 1.0}
                onChange={v => setLayout('header_height', v)}
              />
              <div className="pb-1">
                <Switch
                  label="Auto Header-Höhe"
                  checked={config.layout.auto_header_height ?? true}
                  onChange={v => setLayout('auto_header_height', v)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-line/50">
          <div className="grid grid-cols-[7fr_3fr] gap-6 items-end">
            <Slider
              label="Zeilen-Deckkraft (Anteil am Header)"
              min={0.05} max={1.0} step={0.05}
              disabled={!(config.layout.color_column_rows ?? false)}
              value={config.layout.column_bg_opacity_ratio ?? 0.80}
              onChange={v => setLayout('column_bg_opacity_ratio', v)}
            />
            <div className="pb-1">
              <Switch
                label="Spaltenhintergrund einfärben"
                checked={config.layout.color_column_rows ?? false}
                onChange={v => setLayout('color_column_rows', v)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line">
        <Switch
          label="Header anzeigen"
          checked={config.layout.show_header}
          onChange={v => setLayout('show_header', v)}
        />
        <Switch
          label="Header vertikal"
          checked={config.layout.header_vertical ?? false}
          onChange={v => setLayout('header_vertical', v)}
        />
        <Switch
          label="Zeilen-Labels anzeigen"
          checked={config.layout.show_row_labels}
          onChange={v => setLayout('show_row_labels', v)}
        />
        <Switch
          label="Gitter anzeigen"
          checked={config.layout.show_grid}
          onChange={v => setLayout('show_grid', v)}
        />
      </div>
    </div>
  )
}
