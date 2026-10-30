import { Plus, Check, Pipette } from 'lucide-react'
import { Button, Switch, Label, NumberInput, Slider, SecHead, Collapsible, Input, Select } from '../../../components/ui'
import { COLOR_PRESETS } from '../../Koordinatensystem/constantsStylePresets'
import type { ZahlenSetter, ZahlenUpdateItem, ZahlenZoomCollection, ZahlenstrahlConfig } from '../typesZahlen'

const isColorActive = (currentColor: string, presetColor: string) => {
  const c = currentColor.toLowerCase()
  const pc = presetColor.toLowerCase()
  if (c === pc) return true
  if ((c === 'black' || c === '#000000') && (pc === '#1e293b' || pc === '#000000')) return true
  return false
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
    <div className="flex items-center gap-2 flex-wrap text-caption">
      {label && <span className="text-muted min-w-[78px]">{label}:</span>}
      <div className="flex items-center gap-1.5 flex-wrap">
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
          <Pipette size={11} className={isCustom ? 'text-primary' : 'text-muted'} />
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
            style={{ backgroundColor: currentColor.startsWith('#') ? currentColor : '#1e293b' }}
          />
          <input
            type="color"
            value={currentColor.startsWith('#') ? currentColor : '#1e293b'}
            onChange={e => onChange(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  )
}

interface ZahlenTabZoomProps {
  config: ZahlenstrahlConfig
  set: ZahlenSetter
  addItem: (collection: ZahlenZoomCollection) => void
  removeItem: (collection: ZahlenZoomCollection, idx: number) => void
  updateItem: ZahlenUpdateItem
}

export const ZahlenTabZoom = ({ config, set, addItem, removeItem, updateItem }: ZahlenTabZoomProps) => {
  return (
    <div className="space-y-8">
      <Switch
        label="Zoom-Lupe aktivieren"
        description="Zeigt einen vergrößerten Ausschnitt unter der Hauptachse"
        checked={config.zoom_active}
        onChange={(v: boolean) => set('zoom_active', v)}
      />

      {config.zoom_active && (
        <div className="space-y-6">
          {/* Bereich & Ticks */}
          <div className="space-y-4">
            <SecHead>Bereich des Ausschnitts</SecHead>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ausschnitt Start (Hauptachse)</Label>
                <NumberInput
                  value={config.zoom_min}
                  onChange={e => set('zoom_min', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Ausschnitt Ende (Hauptachse)</Label>
                <NumberInput
                  value={config.zoom_max}
                  onChange={e => set('zoom_max', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <Slider
              label="Vergrößerungsfaktor"
              min={1} max={10} step={0.5}
              value={config.zoom_scale}
              onChange={v => set('zoom_scale', v)}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-line">
            <SecHead>Unterteilungsmodus</SecHead>
            <Switch
              label="Relative Unterteilung nutzen"
              description="Teilt den Zoombereich in N Hauptabschnitte und M Unterabschnitte"
              checked={config.zoom_use_divisions}
              onChange={(v: boolean) => set('zoom_use_divisions', v)}
            />

            {config.zoom_use_divisions ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hauptunterteilungen</Label>
                  <NumberInput
                    value={config.zoom_divisions_main}
                    min={1} max={50} step={1}
                    onChange={e => set('zoom_divisions_main', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Feinunterteilungen (je Intervall)</Label>
                  <NumberInput
                    value={config.zoom_divisions_sub}
                    min={1} max={20} step={1}
                    onChange={e => set('zoom_divisions_sub', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Haupt-Ticks</Label>
                  <NumberInput
                    value={config.zoom_step_main ?? 0.1}
                    onChange={e => set('zoom_step_main', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Mittel-Ticks (0=aus)</Label>
                  <NumberInput
                    value={config.zoom_step_mid || 0}
                    min={0}
                    onChange={e => {
                      const v = parseFloat(e.target.value)
                      set('zoom_step_mid', v > 0 ? v : null)
                    }}
                  />
                </div>
                <div>
                  <Label>Sub-Ticks (0=aus)</Label>
                  <NumberInput
                    value={config.zoom_step_sub ?? 0.05}
                    min={0}
                    onChange={e => {
                      const v = parseFloat(e.target.value)
                      set('zoom_step_sub', v > 0 ? v : null)
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-line">
            <SecHead>Sichtbarkeit auf Lupe</SecHead>
            <div className="grid grid-cols-2 gap-3">
              <Switch
                label="Beschriftungen"
                checked={config.zoom_show_labels}
                onChange={(v: boolean) => set('zoom_show_labels', v)}
              />
              <Switch
                label="Punkte"
                checked={config.zoom_show_points}
                onChange={(v: boolean) => set('zoom_show_points', v)}
              />
              <Switch
                label="Zeiger"
                checked={config.zoom_show_pointers}
                onChange={(v: boolean) => set('zoom_show_pointers', v)}
              />
              <Switch
                label="Sprünge"
                checked={config.zoom_show_jumps}
                onChange={(v: boolean) => set('zoom_show_jumps', v)}
              />
              <Switch
                label="Intervalle"
                checked={config.zoom_show_intervals}
                onChange={(v: boolean) => set('zoom_show_intervals', v)}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-line">
            <div className="flex justify-between items-center">
              <SecHead>Zoom-Punkte</SecHead>
              <Button onClick={() => addItem('zoom_points')} size="sm" className="h-7 px-2 text-caption"><Plus size={14} /></Button>
            </div>
            {config.zoom_points.map((p, i) => (
              <Collapsible key={i} title={`Punkt ${p.value}`} onRemove={() => removeItem('zoom_points', i)}>
                <div className="space-y-3">
                  <Switch
                    label="Anzeigen"
                    checked={p.visible !== false}
                    onChange={(v: boolean) => updateItem('zoom_points', i, 'visible', v)}
                  />
                  <div className="flex gap-2 items-start">
                    <div className="w-[20%] min-w-[65px]">
                      <Label>Wert</Label>
                      <NumberInput value={p.value} onChange={e => updateItem('zoom_points', i, 'value', parseFloat(e.target.value))} />
                    </div>
                    <div className="w-[25%] min-w-[90px]">
                      <Label>Typ</Label>
                      <Select
                        value={p.type || 'kreuz'}
                        onChange={e => updateItem('zoom_points', i, 'type', e.target.value)}
                      >
                        <option value="kreuz">Kreuz</option>
                        <option value="gefüllt">Gefüllt</option>
                        <option value="offen">Offen</option>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label>Beschriftung</Label>
                      <Input value={p.label} onChange={e => updateItem('zoom_points', i, 'label', e.target.value)} />
                    </div>
                  </div>

                  {/* Stil-Optionen: Farben */}
                  <div className="space-y-2 pt-2 border-t border-line/40">
                    <ColorSelector
                      label="Markierung"
                      color={p.color || config.color_point || '#1e293b'}
                      onChange={(c) => updateItem('zoom_points', i, 'color', c)}
                    />
                    <ColorSelector
                      label="Beschriftung"
                      color={p.label_color || config.color_label || '#1e293b'}
                      onChange={(c) => updateItem('zoom_points', i, 'label_color', c)}
                    />
                  </div>
                </div>
              </Collapsible>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-line">
            <div className="flex justify-between items-center">
              <SecHead>Zoom-Zeiger</SecHead>
              <Button onClick={() => addItem('zoom_pointers')} size="sm" className="h-7 px-2 text-caption"><Plus size={14} /></Button>
            </div>
            {config.zoom_pointers.map((ptr, i) => (
              <Collapsible key={i} title={`Zeiger ${ptr.value}`} onRemove={() => removeItem('zoom_pointers', i)}>
                <div className="space-y-3">
                  <Switch
                    label="Anzeigen"
                    checked={ptr.visible !== false}
                    onChange={(v: boolean) => updateItem('zoom_pointers', i, 'visible', v)}
                  />
                  <div className="flex gap-2 items-start">
                    <div className="w-[30%] min-w-[80px]">
                      <Label>Wert</Label>
                      <NumberInput value={ptr.value} onChange={e => updateItem('zoom_pointers', i, 'value', parseFloat(e.target.value))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label>Beschriftung</Label>
                      <Input value={ptr.label} onChange={e => updateItem('zoom_pointers', i, 'label', e.target.value)} />
                    </div>
                  </div>

                  {/* Stil-Optionen: Farben */}
                  <div className="space-y-2 pt-2 border-t border-line/40">
                    <ColorSelector
                      label="Zeiger"
                      color={ptr.color || config.color_point || '#1e293b'}
                      onChange={(c) => updateItem('zoom_pointers', i, 'color', c)}
                    />
                    <ColorSelector
                      label="Beschriftung"
                      color={ptr.label_color || ptr.color || config.color_label || '#1e293b'}
                      onChange={(c) => updateItem('zoom_pointers', i, 'label_color', c)}
                    />
                  </div>
                </div>
              </Collapsible>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-line">
            <div className="flex justify-between items-center">
              <SecHead>Zoom-Intervalle</SecHead>
              <Button onClick={() => addItem('zoom_intervals')} size="sm" className="h-7 px-2 text-caption"><Plus size={14} /></Button>
            </div>
            {config.zoom_intervals.map((iv, i) => (
              <Collapsible key={i} title={`Intervall [${iv.von}, ${iv.bis}]`} onRemove={() => removeItem('zoom_intervals', i)}>
                <div className="space-y-3">
                  <Switch
                    label="Anzeigen"
                    checked={iv.visible !== false}
                    onChange={(v: boolean) => updateItem('zoom_intervals', i, 'visible', v)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Von</Label>
                      <NumberInput value={iv.von} onChange={e => updateItem('zoom_intervals', i, 'von', parseFloat(e.target.value))} />
                    </div>
                    <div>
                      <Label>Bis</Label>
                      <NumberInput value={iv.bis} onChange={e => updateItem('zoom_intervals', i, 'bis', parseFloat(e.target.value))} />
                    </div>
                    <div>
                      <Label>Links</Label>
                      <Select
                        value={iv.left_type}
                        onChange={e => updateItem('zoom_intervals', i, 'left_type', e.target.value)}
                      >
                        <option value="offen">Offen</option>
                        <option value="geschlossen">Geschlossen</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Rechts</Label>
                      <Select
                        value={iv.right_type}
                        onChange={e => updateItem('zoom_intervals', i, 'right_type', e.target.value)}
                      >
                        <option value="offen">Offen</option>
                        <option value="geschlossen">Geschlossen</option>
                      </Select>
                    </div>
                  </div>

                  {/* Stil-Optionen: Farbe */}
                  <div className="space-y-2 pt-2 border-t border-line/40">
                    <ColorSelector
                      label="Farbe"
                      color={iv.color || '#2563eb'}
                      onChange={(c) => updateItem('zoom_intervals', i, 'color', c)}
                    />
                  </div>
                </div>
              </Collapsible>
            ))}
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 leading-relaxed">
            <strong>Hinweis:</strong> Der Zoom-Ausschnitt nutzt eigene Punkte, Zeiger und Intervalle. Sprünge werden weiterhin aus den Hauptelementen übernommen.
          </div>
        </div>
      )}
    </div>
  )
}
