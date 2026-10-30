// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2, Check, Pipette } from 'lucide-react'
import { Card, Switch, Button, Field, Input, NumberInput, Collapsible } from '../../../../components/ui'
import { StyleCopyMenu } from '../StyleCopyMenu'
import { COLOR_PRESETS, LINE_STYLE_PRESETS, LINE_WIDTH_OPTIONS } from '../../constantsStylePresets'
import type { ParametricPlot } from '../../typesKoord'

interface KoordParamCardProps {
  param: ParametricPlot
  index: number
  expanded: boolean
  onToggleExpand: () => void
  onUpdate: (key: keyof ParametricPlot, value: unknown) => void
  onDuplicate: () => void
  onRemove: () => void
  onCopyStyle?: () => void
  onPasteStyle?: () => void
  onApplyStyleToAll?: () => void
  hasCopiedStyle?: boolean
}

export const KoordParamCard = ({
  param,
  index,
  expanded,
  onToggleExpand,
  onUpdate,
  onDuplicate,
  onRemove,
  onCopyStyle,
  onPasteStyle,
  onApplyStyleToAll,
  hasCopiedStyle
}: KoordParamCardProps) => {
  const currentColor = param.color || '#1e293b'
  const currentLineWidth = param.line_width || 'very thick'
  const currentLineStyle = param.line_style || 'solid'
  const isCustomColor = !COLOR_PRESETS.some(cp => cp.color.toLowerCase() === currentColor.toLowerCase())

  return (
    <Card className="border-line bg-canvas/40 overflow-hidden transition-all hover:border-rim">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggleExpand()}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-raised/20 transition-colors cursor-pointer"
      >
        {expanded ? <ChevronDown size={14} className="text-primary shrink-0" /> : <ChevronRight size={14} className="text-ghost shrink-0" />}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-xs"
            style={{ backgroundColor: currentColor }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-ink">Parametrisch {index + 1}</span>
            {!expanded && (
              <span className="text-metadata truncate max-w-[220px]">
                x: {param.x_t || '-'}, y: {param.y_t || '-'}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Switch checked={param.show} onChange={(v: boolean) => onUpdate('show', v)} />
          {onCopyStyle && (
            <StyleCopyMenu
              onCopyStyle={onCopyStyle}
              onPasteStyle={onPasteStyle}
              onApplyToAll={onApplyStyleToAll}
              hasCopiedStyle={hasCopiedStyle}
              itemTypeName="Parametrisch"
            />
          )}
          <Button onClick={onDuplicate} className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2" title="Duplizieren">
            <Copy size={15} />
          </Button>
          <Button onClick={onRemove} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2" title="Löschen">
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-line/50 space-y-4 pt-4">
          {/* 1. Funktionen x(t) und y(t) in 2 Spalten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="x(t)">
              <Input
                value={param.x_t}
                onChange={e => onUpdate('x_t', e.target.value)}
                className="h-9 font-mono text-xs"
                placeholder="z. B. cos(deg(t))"
              />
            </Field>
            <Field label="y(t)">
              <Input
                value={param.y_t}
                onChange={e => onUpdate('y_t', e.target.value)}
                className="h-9 font-mono text-xs"
                placeholder="z. B. sin(deg(t))"
              />
            </Field>
          </div>

          {/* 2. Parameterbereich tmin / tmax in 2 Spalten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="t-min">
              <NumberInput
                step="0.1"
                value={param.tmin}
                onChange={e => onUpdate('tmin', parseFloat(e.target.value))}
                className="h-9"
              />
            </Field>
            <Field label="t-max">
              <NumberInput
                step="0.1"
                value={param.tmax}
                onChange={e => onUpdate('tmax', parseFloat(e.target.value))}
                className="h-9"
              />
            </Field>
          </div>

          {/* 3. Stil-Leiste: Farbe, Linienstärke & Linienstil in einer Zeile */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
            {/* Farbe */}
            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.map(cp => {
                const isActive = currentColor.toLowerCase() === cp.color.toLowerCase()
                return (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => onUpdate('color', cp.color)}
                    className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-panel scale-110 border-white/40 shadow-xs'
                        : 'border-black/20 hover:scale-105 opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: cp.color }}
                    title={cp.label}
                  >
                    {isActive && <Check size={11} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" strokeWidth={3} />}
                  </button>
                )
              })}
              <label
                className={`h-6 px-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ml-0.5 ${
                  isCustomColor
                    ? 'border-primary bg-primary/20 ring-2 ring-primary/40 text-primary shadow-xs'
                    : 'border-line hover:border-rim bg-panel/90 text-ghost hover:text-ink'
                }`}
                title={`Eigene Farbe wählen (Farbpipette, aktuell: ${currentColor})`}
              >
                <Pipette size={12} className={isCustomColor ? 'text-primary' : 'text-muted'} />
                <span
                  className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs"
                  style={{ backgroundColor: currentColor }}
                />
                <input
                  type="color"
                  value={currentColor.startsWith('#') ? currentColor : '#1e293b'}
                  onChange={e => onUpdate('color', e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="h-4 w-px bg-line/60 hidden sm:block" />

            {/* Linienstärke */}
            <div>
              <select
                value={currentLineWidth}
                onChange={e => onUpdate('line_width', e.target.value)}
                className="px-2.5 py-1 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer h-7"
                title="Linienstärke"
              >
                {LINE_WIDTH_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-line/60 hidden sm:block" />

            {/* Linienstil */}
            <div className="flex items-center gap-1">
              {LINE_STYLE_PRESETS.map(lsp => {
                const isActive = currentLineStyle === lsp.value
                return (
                  <button
                    key={lsp.id}
                    type="button"
                    onClick={() => onUpdate('line_style', lsp.value)}
                    className={`h-7 px-2.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary ring-2 ring-primary/40 bg-primary/20 text-primary shadow-xs'
                        : 'border-line/70 hover:border-rim bg-panel/70 text-muted hover:text-ink'
                    }`}
                    title={lsp.label}
                  >
                    <svg width="26" height="6" viewBox="0 0 26 6" className="overflow-visible">
                      <line
                        x1="1"
                        y1="3"
                        x2="25"
                        y2="3"
                        stroke="currentColor"
                        strokeWidth={isActive ? '2.5' : '1.8'}
                        strokeDasharray={lsp.dashArray}
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Weitere Optionen (Beschriftung & TikZ-Zusatzoptionen) */}
          <Collapsible title="Weitere Optionen (Beschriftung & TikZ)">
            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <Switch
                  checked={param.label_show}
                  onChange={(v: boolean) => onUpdate('label_show', v)}
                  label="Beschriftung anzeigen"
                  description="Zeigt eine mathematische Beschriftung entlang der Kurve an"
                />
                {param.label_show && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-raised/20 p-3 rounded-xl border border-line/40">
                    <Field label="Beschriftungstext">
                      <Input
                        value={param.label_text}
                        onChange={e => onUpdate('label_text', e.target.value)}
                        className="h-8 text-xs font-mono"
                        placeholder="z. B. \gamma(t)"
                      />
                    </Field>
                    <Field label="Position (0.0 - 1.0)">
                      <NumberInput
                        step="0.05"
                        min="0"
                        max="1"
                        value={param.label_pos}
                        onChange={e => onUpdate('label_pos', parseFloat(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </Field>
                    <Field label="Label-Stil (TikZ)">
                      <Input
                        value={param.label_style}
                        onChange={e => onUpdate('label_style', e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </Field>
                  </div>
                )}
              </div>

              <Field label="Zusätzliche TikZ-Optionen (optional)">
                <Input
                  value={param.custom_style || ''}
                  onChange={e => onUpdate('custom_style', e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="z. B. opacity=0.8, double"
                />
              </Field>
            </div>
          </Collapsible>
        </div>
      )}
    </Card>
  )
}
