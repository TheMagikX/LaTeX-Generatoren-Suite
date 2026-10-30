// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { Plus, Check, Pipette } from 'lucide-react'
import { Button, SecHead, Collapsible, Switch, Label, NumberInput, Input, Select, Slider } from '../../../components/ui'
import { COLOR_PRESETS } from '../../Koordinatensystem/constantsStylePresets'
import type { ZahlenCollection, ZahlenSetter, ZahlenUpdateItem, ZahlenstrahlConfig } from '../typesZahlen'

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

interface ZahlenTabElementeProps {
  config: ZahlenstrahlConfig
  set: ZahlenSetter
  addItem: (collection: ZahlenCollection) => void
  removeItem: (collection: ZahlenCollection, idx: number) => void
  updateItem: ZahlenUpdateItem
}

export const ZahlenTabElemente = ({ config, set, addItem, removeItem, updateItem }: ZahlenTabElementeProps) => {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})

  const toggleExpand = (key: string) =>
    setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }))

  const isExpanded = (key: string) => expandedMap[key] ?? false

  const setAllExpanded = (category: string, count: number, value: boolean) =>
    setExpandedMap(prev => {
      const next = { ...prev }
      for (let i = 0; i < count; i++) {
        next[`${category}-${i}`] = value
      }
      return next
    })

  const handleAddItem = (collection: ZahlenCollection) => {
    const currentCount = config[collection].length
    setExpandedMap(prev => ({ ...prev, [`${collection}-${currentCount}`]: true }))
    addItem(collection)
  }

  return (
    <div className="space-y-6">

      {/* Markierte Punkte */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <SecHead>Punkte</SecHead>
          <div className="flex items-center gap-2">
            {config.points.length > 0 && (
              <div className="flex items-center gap-1.5 text-caption text-ghost">
                <button
                  type="button"
                  onClick={() => setAllExpanded('points', config.points.length, true)}
                  className="hover:text-ink tracking-tighter cursor-pointer transition-colors"
                >
                  Aufklappen
                </button>
                <span className="text-line">|</span>
                <button
                  type="button"
                  onClick={() => setAllExpanded('points', config.points.length, false)}
                  className="hover:text-ink tracking-tighter cursor-pointer transition-colors"
                >
                  Zuklappen
                </button>
              </div>
            )}
            <Button onClick={() => handleAddItem('points')} size="sm" className="h-7 px-2 text-caption">
              <Plus size={14} />
            </Button>
          </div>
        </div>
        {config.points.map((p, i) => (
          <Collapsible
            key={i}
            title={`Punkt ${p.value}`}
            open={isExpanded(`points-${i}`)}
            onToggle={() => toggleExpand(`points-${i}`)}
            onRemove={() => removeItem('points', i)}
          >
            <div className="space-y-3">
              <Switch
                label="Anzeigen"
                checked={p.visible !== false}
                onChange={(v: boolean) => updateItem('points', i, 'visible', v)}
              />
              <div className="flex gap-2 items-start">
                <div className="w-[20%] min-w-[65px]">
                  <Label>Wert</Label>
                  <NumberInput value={p.value} onChange={e => updateItem('points', i, 'value', parseFloat(e.target.value))} />
                </div>
                <div className="w-[25%] min-w-[90px]">
                  <Label>Typ</Label>
                  <Select
                    value={p.type || 'kreuz'}
                    onChange={e => updateItem('points', i, 'type', e.target.value)}
                  >
                    <option value="kreuz">Kreuz</option>
                    <option value="gefüllt">Gefüllt</option>
                    <option value="offen">Offen</option>
                  </Select>
                </div>
                <div className="flex-1 min-w-0">
                  <Label>Beschriftung</Label>
                  <Input value={p.label} onChange={e => updateItem('points', i, 'label', e.target.value)} />
                </div>
              </div>

              {/* Stil-Optionen: Farben */}
              <div className="space-y-2 pt-2 border-t border-line/40">
                <ColorSelector
                  label="Markierung"
                  color={p.color || config.color_point || '#1e293b'}
                  onChange={(c) => updateItem('points', i, 'color', c)}
                />
                <ColorSelector
                  label="Beschriftung"
                  color={p.label_color || config.color_label || '#1e293b'}
                  onChange={(c) => updateItem('points', i, 'label_color', c)}
                />
              </div>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Zeiger (Pointers) */}
      <div className="space-y-3 pt-4 border-t border-line">
        <div className="flex justify-between items-center">
          <SecHead>Zeiger (Pointers)</SecHead>
          <div className="flex items-center gap-2">
            {config.pointers.length > 0 && (
              <div className="flex items-center gap-1.5 text-caption text-ghost">
                <button
                  type="button"
                  onClick={() => setAllExpanded('pointers', config.pointers.length, true)}
                  className="hover:text-ink tracking-tighter cursor-pointer transition-colors"
                >
                  Aufklappen
                </button>
                <span className="text-line">|</span>
                <button
                  type="button"
                  onClick={() => setAllExpanded('pointers', config.pointers.length, false)}
                  className="hover:text-ink tracking-tighter cursor-pointer transition-colors"
                >
                  Zuklappen
                </button>
              </div>
            )}
            <Button onClick={() => handleAddItem('pointers')} size="sm" className="h-7 px-2 text-caption">
              <Plus size={14} />
            </Button>
          </div>
        </div>
        {config.pointers.map((ptr, i) => (
          <Collapsible
            key={i}
            title={`Zeiger ${ptr.value}`}
            open={isExpanded(`pointers-${i}`)}
            onToggle={() => toggleExpand(`pointers-${i}`)}
            onRemove={() => removeItem('pointers', i)}
          >
            <div className="space-y-3">
              <Switch
                label="Anzeigen"
                checked={ptr.visible !== false}
                onChange={(v: boolean) => updateItem('pointers', i, 'visible', v)}
              />
              <div className="flex gap-2 items-start">
                <div className="w-[30%] min-w-[80px]">
                  <Label>Wert</Label>
                  <NumberInput value={ptr.value} onChange={e => updateItem('pointers', i, 'value', parseFloat(e.target.value))} />
                </div>
                <div className="flex-1 min-w-0">
                  <Label>Beschriftung</Label>
                  <Input value={ptr.label} onChange={e => updateItem('pointers', i, 'label', e.target.value)} />
                </div>
              </div>

              {/* Stil-Optionen: Farben */}
              <div className="space-y-2 pt-2 border-t border-line/40">
                <ColorSelector
                  label="Zeiger"
                  color={ptr.color || config.color_point || '#1e293b'}
                  onChange={(c) => updateItem('pointers', i, 'color', c)}
                />
                <ColorSelector
                  label="Beschriftung"
                  color={ptr.label_color || ptr.color || config.color_label || '#1e293b'}
                  onChange={(c) => updateItem('pointers', i, 'label_color', c)}
                />
              </div>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Sprünge */}
      <div className="space-y-3 pt-4 border-t border-line">
        <div className="flex justify-between items-center">
          <SecHead>Sprünge</SecHead>
          <div className="flex items-center gap-2">
            {config.jumps.length > 0 && (
              <div className="flex items-center gap-1.5 text-caption text-ghost">
                <button
                  type="button"
                  onClick={() => setAllExpanded('jumps', config.jumps.length, true)}
                  className="hover:text-ink tracking-tighter cursor-pointer transition-colors"
                >
                  Aufklappen
                </button>
                <span className="text-line">|</span>
                <button
                  type="button"
                  onClick={() => setAllExpanded('jumps', config.jumps.length, false)}
                  className="hover:text-ink tracking-tighter cursor-pointer transition-colors"
                >
                  Zuklappen
                </button>
              </div>
            )}
            <Button onClick={() => handleAddItem('jumps')} size="sm" className="h-7 px-2 text-caption">
              <Plus size={14} />
            </Button>
          </div>
        </div>
        <Slider
          label="Ausgangswinkel (°)"
          min={90} max={179} step={1}
          value={config.jump_out_angle}
          onChange={v => set('jump_out_angle', v)}
        />
        {config.jumps.map((j, i) => (
          <Collapsible
            key={i}
            title={`Sprung ${j.start} → ${j.end}`}
            open={isExpanded(`jumps-${i}`)}
            onToggle={() => toggleExpand(`jumps-${i}`)}
            onRemove={() => removeItem('jumps', i)}
          >
            <div className="space-y-3">
              <Switch
                label="Anzeigen"
                checked={j.visible !== false}
                onChange={(v: boolean) => updateItem('jumps', i, 'visible', v)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start</Label>
                  <NumberInput value={j.start} onChange={e => updateItem('jumps', i, 'start', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Ende</Label>
                  <NumberInput value={j.end} onChange={e => updateItem('jumps', i, 'end', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Stil</Label>
                  <Select
                    value={j.style || 'arc'}
                    onChange={e => updateItem('jumps', i, 'style', e.target.value)}
                  >
                    <option value="arc">Bogen</option>
                    <option value="square">Eckig</option>
                    <option value="straight">Gerade (Bezier)</option>
                  </Select>
                </div>
                <div>
                  <Label>Pfeil</Label>
                  <Select
                    value={j.arrow || '->'}
                    onChange={e => updateItem('jumps', i, 'arrow', e.target.value)}
                  >
                    <option value="->">Standard (→)</option>
                    <option value="-{Stealth}">Stealth (→)</option>
                    <option value="-">Kein Pfeil</option>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Beschriftung</Label>
                  <Input value={j.label} onChange={e => updateItem('jumps', i, 'label', e.target.value)} />
                </div>
              </div>

              {/* Stil-Optionen: Farben */}
              <div className="space-y-2 pt-2 border-t border-line/40">
                <ColorSelector
                  label="Linie"
                  color={j.color || config.color_jump || '#1e293b'}
                  onChange={(c) => updateItem('jumps', i, 'color', c)}
                />
                <ColorSelector
                  label="Beschriftung"
                  color={j.label_color || config.color_label || '#1e293b'}
                  onChange={(c) => updateItem('jumps', i, 'label_color', c)}
                />
              </div>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Intervalle */}
      <div className="space-y-3 pt-4 border-t border-line">
        <div className="flex justify-between items-center">
          <SecHead>Intervalle</SecHead>
          <div className="flex items-center gap-2">
            {config.intervals.length > 0 && (
              <div className="flex items-center gap-1.5 text-caption text-ghost">
                <button
                  type="button"
                  onClick={() => setAllExpanded('intervals', config.intervals.length, true)}
                  className="hover:text-ink tracking-tighter cursor-pointer transition-colors"
                >
                  Aufklappen
                </button>
                <span className="text-line">|</span>
                <button
                  type="button"
                  onClick={() => setAllExpanded('intervals', config.intervals.length, false)}
                  className="hover:text-ink tracking-tighter cursor-pointer transition-colors"
                >
                  Zuklappen
                </button>
              </div>
            )}
            <Button onClick={() => handleAddItem('intervals')} size="sm" className="h-7 px-2 text-caption">
              <Plus size={14} />
            </Button>
          </div>
        </div>
        {config.intervals.map((iv, i) => (
          <Collapsible
            key={i}
            title={`Intervall [${iv.von}, ${iv.bis}]`}
            open={isExpanded(`intervals-${i}`)}
            onToggle={() => toggleExpand(`intervals-${i}`)}
            onRemove={() => removeItem('intervals', i)}
          >
            <div className="space-y-3">
              <Switch
                label="Anzeigen"
                checked={iv.visible !== false}
                onChange={(v: boolean) => updateItem('intervals', i, 'visible', v)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Von</Label>
                  <NumberInput value={iv.von} onChange={e => updateItem('intervals', i, 'von', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Bis</Label>
                  <NumberInput value={iv.bis} onChange={e => updateItem('intervals', i, 'bis', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Links</Label>
                  <Select
                    value={iv.left_type}
                    onChange={e => updateItem('intervals', i, 'left_type', e.target.value)}
                  >
                    <option value="offen">Offen</option>
                    <option value="geschlossen">Geschlossen</option>
                  </Select>
                </div>
                <div>
                  <Label>Rechts</Label>
                  <Select
                    value={iv.right_type}
                    onChange={e => updateItem('intervals', i, 'right_type', e.target.value)}
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
                  onChange={(c) => updateItem('intervals', i, 'color', c)}
                />
              </div>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}

