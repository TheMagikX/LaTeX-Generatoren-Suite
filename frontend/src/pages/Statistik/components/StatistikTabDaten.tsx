import { Plus, BarChart2, Check, Pipette, Palette } from 'lucide-react'
import { Button, Label, Collapsible, SecHead, Input } from '../../../components/ui'
import { COLOR_PRESETS } from '../../Koordinatensystem/constantsStylePresets'
import type { StatistikConfig, StatistikDatasetUpdater, StatistikSetter } from '../typesStatistik'
import { parseRawData, extractBarchartCategories } from '../utilsStatistik'

interface StatistikTabDatenProps {
  config: StatistikConfig
  set: StatistikSetter
  updateDataset: StatistikDatasetUpdater
  addDataset: () => void
  removeDataset: (idx: number) => void
}

const isColorActive = (current?: string, preset?: string) => {
  if (!current || !preset) return false
  return current.toLowerCase() === preset.toLowerCase()
}

const ColorSelector = ({
  color,
  onChange,
  label,
}: {
  color?: string
  onChange: (color: string) => void
  label?: string
}) => {
  const currentColor = color || '#1e293b'
  const isCustom = !COLOR_PRESETS.some(cp => isColorActive(currentColor, cp.color))

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {label && <span className="text-caption text-muted">{label}:</span>}
      {COLOR_PRESETS.map(cp => {
        const active = isColorActive(currentColor, cp.color)
        return (
          <button
            key={cp.id}
            type="button"
            onClick={() => onChange(cp.color)}
            className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
              active
                ? 'ring-2 ring-primary ring-offset-1 ring-offset-panel scale-110 border-white/40 shadow-xs'
                : 'border-black/20 hover:scale-105 opacity-85 hover:opacity-100'
            }`}
            style={{ backgroundColor: cp.color }}
            title={cp.label}
          >
            {active && <Check size={10} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" strokeWidth={3} />}
          </button>
        )
      })}
      <label
        className={`h-5 px-1.5 rounded-md border flex items-center gap-1 cursor-pointer transition-all ml-0.5 ${
          isCustom
            ? 'border-primary bg-primary/20 ring-2 ring-primary/40 text-primary shadow-xs'
            : 'border-line hover:border-rim bg-panel/90 text-ghost hover:text-ink'
        }`}
        title={`Eigene Farbe wählen (Farbpipette, aktuell: ${currentColor})`}
      >
        <Pipette size={10} className={isCustom ? 'text-primary' : 'text-muted'} />
        <span
          className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
          style={{ backgroundColor: currentColor }}
        />
        <input
          type="color"
          value={currentColor.startsWith('#') ? currentColor : '#1e293b'}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
        />
      </label>
    </div>
  )
}

export const StatistikTabDaten = ({
  config,
  set,
  updateDataset,
  addDataset,
  removeDataset
}: StatistikTabDatenProps) => {

  const handleRawDataChange = (i: number, value: string) => {
    updateDataset(i, 'raw_data_string', value)
    updateDataset(i, 'raw_data', parseRawData(value))
  }

  return (
    <div className="space-y-6">
      {/* ===== 1. Diagramm-Typ Auswahl ===== */}
      <div className="space-y-3">
        <SecHead icon={<BarChart2 size={15} />}>Diagramm-Typ</SecHead>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(['Boxplot', 'Histogramm', 'Säulendiagramm', 'Summenkurve', 'Violin'] as const).map(t => (
            <Button
              key={t}
              variant={config.type === t ? 'primary' : 'secondary'}
              onClick={() => set('type', t)}
              className="text-xs sm:text-sm py-2 px-3"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div className="border-t border-line" />

      {/* ===== 2. Datensätze ===== */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <SecHead>Datensätze</SecHead>
          <Button onClick={addDataset} size="sm" className="h-7 px-2 text-xs"><Plus size={14} /></Button>
        </div>

        {config.datasets.map((ds, i) => {
          const categories = config.type === 'Säulendiagramm' ? extractBarchartCategories(ds) : []

          return (
            <Collapsible key={i} title={ds.name}
              enabled={ds.enabled}
              onToggleEnabled={() => updateDataset(i, 'enabled', !ds.enabled)}
              onRemove={config.datasets.length > 1 ? () => removeDataset(i) : undefined}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <Label>Name</Label>
                    <Input value={ds.name} onChange={e => updateDataset(i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Grundfarbe</Label>
                    <div className="pt-1">
                      <ColorSelector
                        color={ds.color}
                        onChange={col => updateDataset(i, 'color', col)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Eingabemodus</Label>
                  <div className="flex gap-2 mb-2">
                    {(['Raw', 'Frequency'] as const).map(mode => (
                      <Button
                        key={mode}
                        size="sm"
                        variant={ds.data_mode === mode ? 'primary' : 'secondary'}
                        onClick={() => updateDataset(i, 'data_mode', mode)}
                      >
                        {mode === 'Raw' ? 'Rohdaten' : 'Häufigkeitstabelle'}
                      </Button>
                    ))}
                  </div>

                  {ds.data_mode !== 'Frequency' ? (
                    <>
                      <Label>Daten (Komma/Leerzeichen getrennt)</Label>
                      <textarea
                        value={ds.raw_data_string}
                        onChange={e => handleRawDataChange(i, e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-rim bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        placeholder="1, 2, 5, 8.5, ... oder Mo, Di, Mi, ..."
                      />
                      <div className="text-metadata mt-1">{ds.raw_data.length} Werte erkannt</div>
                    </>
                  ) : (
                    <>
                      <Label>Häufigkeitstabelle (Kategorie:Anzahl pro Zeile)</Label>
                      <textarea
                        value={ds.freq_data_string}
                        onChange={e => updateDataset(i, 'freq_data_string', e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-rim bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        placeholder={"1: 5\n2: 10\n3: 7\noder\nMontag: 3\nDienstag: 5"}
                      />
                      <div className="text-metadata mt-1">Format: Kategorie:Anzahl (z.B. Note 1: 4 oder 3.5: 12)</div>
                    </>
                  )}

                  {/* ===== Kategorien-Farbauswahl bei Säulendiagramm ===== */}
                  {config.type === 'Säulendiagramm' && categories.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-line/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="mb-0 font-semibold text-xs text-ink flex items-center gap-1.5">
                          <Palette size={13} className="text-primary" />
                          Kategorien & Farben ({categories.length})
                        </Label>
                        {Object.keys(ds.category_colors || {}).length > 0 && (
                          <button
                            type="button"
                            onClick={() => updateDataset(i, 'category_colors', {})}
                            className="text-[11px] text-muted hover:text-ink transition-colors cursor-pointer"
                          >
                            Alle auf Grundfarbe zurücksetzen
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                        {categories.map(cat => {
                          const currentCatColor = ds.category_colors?.[cat] || ds.color || '#1e293b'
                          return (
                            <div
                              key={cat}
                              className="flex items-center justify-between gap-3 bg-raised/30 px-3 py-2 rounded-xl border border-line/50"
                            >
                              <span className="text-xs font-medium text-ink truncate max-w-[130px]" title={cat}>
                                {cat}
                              </span>
                              <ColorSelector
                                color={currentCatColor}
                                onChange={col => {
                                  const updated = { ...(ds.category_colors || {}), [cat]: col }
                                  updateDataset(i, 'category_colors', updated)
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
