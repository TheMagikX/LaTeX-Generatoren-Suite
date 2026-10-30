// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Copy, Trash2, Check, Pipette } from 'lucide-react'
import { Card, Switch, Button, Field, Input, NumberInput } from '../../../../components/ui'
import { StyleCopyMenu } from '../StyleCopyMenu'
import { COLOR_PRESETS, LINE_STYLE_PRESETS, LINE_WIDTH_OPTIONS } from '../../constantsStylePresets'
import type { CSVPlot } from '../../typesKoord'

interface KoordCSVCardProps {
  csv: CSVPlot
  index: number
  expanded: boolean
  onToggleExpand: () => void
  onUpdate: (key: keyof CSVPlot, value: unknown) => void
  onDuplicate: () => void
  onRemove: () => void
  onCopyStyle?: () => void
  onPasteStyle?: () => void
  onApplyStyleToAll?: () => void
  hasCopiedStyle?: boolean
}

export const KoordCSVCard = ({
  csv,
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
}: KoordCSVCardProps) => {
  const currentColor = csv.color || '#1e293b'
  const currentLineWidth = csv.line_width || 'thick'
  const currentLineStyle = csv.line_style || 'solid'
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
            <span className="text-xs font-bold text-ink">CSV-Plot {index + 1}</span>
            {!expanded && (
              <div className="flex items-center gap-2">
                <span className="text-metadata truncate max-w-[150px]">{csv.path || '(kein Pfad)'}</span>
                {(csv.xcol || csv.ycol) && (
                  <span className="text-metadata">
                    x: {csv.xcol || '-'} / y: {csv.ycol || '-'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Switch checked={csv.show} onChange={(v: boolean) => onUpdate('show', v)} />
          {onCopyStyle && (
            <StyleCopyMenu
              onCopyStyle={onCopyStyle}
              onPasteStyle={onPasteStyle}
              onApplyToAll={onApplyStyleToAll}
              hasCopiedStyle={hasCopiedStyle}
              itemTypeName="CSV-Daten"
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
          {/* 1. Dateipfad */}
          <Field label="Dateipfad">
            <Input
              value={csv.path}
              onChange={e => onUpdate('path', e.target.value)}
              className="h-9 text-xs font-mono"
              placeholder="pfad/zu/daten.csv"
            />
          </Field>

          {/* 2. CSV-Trenner, Titel X-Spalte und Titel Y-Spalte in EINER Zeile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="CSV-Trenner">
              <select
                value={csv.sep}
                onChange={e => onUpdate('sep', e.target.value)}
                className="w-full h-9 px-2.5 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="semicolon">Semikolon (;)</option>
                <option value="comma">Komma (,)</option>
                <option value="tab">Tabulator (\t)</option>
                <option value="space">Leerzeichen ( )</option>
              </select>
            </Field>
            <Field label="Titel X-Spalte im Dokument">
              <Input
                value={csv.xcol}
                onChange={e => onUpdate('xcol', e.target.value)}
                className="h-9 text-xs font-mono"
                placeholder="z. B. x oder Zeit"
              />
            </Field>
            <Field label="Titel Y-Spalte im Dokument">
              <Input
                value={csv.ycol}
                onChange={e => onUpdate('ycol', e.target.value)}
                className="h-9 text-xs font-mono"
                placeholder="z. B. y oder Messwert"
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

          {/* 4. Optionen & Punkte-Darstellung */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <Switch checked={csv.read_comma} onChange={(v: boolean) => onUpdate('read_comma', v)} label="Dezimal-Komma" description="Komma als Dezimaltrenner interpretieren" />
              <Switch checked={csv.only_marks} onChange={(v: boolean) => onUpdate('only_marks', v)} label="Nur Punkte anzeigen" description="Keine Verbindungslinie zeichnen" />
            </div>

            {csv.only_marks && (
              <div className="grid grid-cols-3 gap-3 bg-raised/20 p-3 rounded-xl border border-line/40">
                <Field label="Marker-Symbol">
                  <select
                    value={csv.marker_symbol}
                    onChange={e => onUpdate('marker_symbol', e.target.value)}
                    className="w-full h-8 px-2 bg-panel border border-line rounded-md text-xs text-ink"
                  >
                    <option value="*">Stern / Punkt (*)</option>
                    <option value="x">Kreuz (x)</option>
                    <option value="+">Plus (+)</option>
                    <option value="o">Kreis (o)</option>
                    <option value="square">Quadrat</option>
                    <option value="triangle">Dreieck</option>
                  </select>
                </Field>
                <Field label="Marker-Größe">
                  <NumberInput
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={csv.marker_size}
                    onChange={e => onUpdate('marker_size', parseFloat(e.target.value) || 1.0)}
                    className="h-8 text-xs"
                  />
                </Field>
                <Field label="Zusätzliche Marker-Optionen">
                  <Input
                    value={csv.marker_options}
                    onChange={e => onUpdate('marker_options', e.target.value)}
                    placeholder="z. B. fill=white"
                    className="h-8 text-xs font-mono"
                  />
                </Field>
              </div>
            )}

            <Field label="Zusätzliche TikZ-Optionen (z. B. smooth)">
              <Input
                value={csv.custom_style ?? ''}
                onChange={e => onUpdate('custom_style', e.target.value)}
                placeholder="z. B. smooth, opacity=0.8"
                className="h-8 text-xs font-mono"
              />
            </Field>
          </div>
        </div>
      )}
    </Card>
  )
}
