// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Copy, Trash2, Check, Upload, AlertCircle, Loader2 } from 'lucide-react'
import { Card, Switch, Button, Field, Input, NumberInput } from '../../../../components/ui'
import { StyleCopyMenu } from '../StyleCopyMenu'
import { DatasetCombobox } from '../DatasetCombobox'
import { COLOR_PRESETS, LINE_STYLE_PRESETS, LINE_WIDTH_OPTIONS } from '../../constantsStylePresets'
import type { CSVPlot } from '../../typesKoord'
import { getDatasets, uploadDataset, type DatasetItem } from '../../../../api/client'

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

  const [datasets, setDatasets] = useState<DatasetItem[]>([])
  const [loadingDatasets, setLoadingDatasets] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentFilename = csv.path ? csv.path.replace(/\\/g, '/').split('/').pop() || '' : ''

  const refreshDatasets = async () => {
    try {
      setLoadingDatasets(true)
      const list = await getDatasets()
      setDatasets(list)
    } catch (err) {
      console.error('Fehler beim Laden der Datensätze:', err)
    } finally {
      setLoadingDatasets(false)
    }
  }

  useEffect(() => {
    let active = true
    getDatasets()
      .then(list => {
        if (active) setDatasets(list)
      })
      .catch(err => {
        console.error('Fehler beim Laden der Datensätze:', err)
      })
    return () => {
      active = false
    }
  }, [])

  const selectedDataset = datasets.find(d => d.filename.toLowerCase() === currentFilename.toLowerCase())
  const hasPath = Boolean(currentFilename)
  const isMissingFile = hasPath && !selectedDataset && !loadingDatasets
  const detectedColumns = selectedDataset?.columns ?? []

  const renderColumnField = (field: 'xcol' | 'ycol', value: string, placeholder: string) => {
    if (detectedColumns.length === 0) {
      return (
        <Input
          value={value}
          onChange={e => onUpdate(field, e.target.value)}
          className="h-9 text-xs font-mono"
          placeholder={placeholder}
        />
      )
    }

    const hasUnknownValue = Boolean(value) && !detectedColumns.includes(value)

    return (
      <select
        value={value}
        onChange={e => onUpdate(field, e.target.value)}
        className="w-full h-9 px-2.5 bg-panel border border-line rounded-lg text-xs font-mono text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      >
        {!value && <option value="" disabled>Spalte wählen…</option>}
        {hasUnknownValue && (
          <option value={value}>{value} (nicht erkannt)</option>
        )}
        {detectedColumns.map(col => (
          <option key={col} value={col}>{col}</option>
        ))}
      </select>
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMessage(null)
    setUploading(true)
    try {
      const res = await uploadDataset(file)
      await refreshDatasets()
      onUpdate('path', res.dataset.filename)
      if (!csv.xcol && res.dataset.columns.length > 0) {
        onUpdate('xcol', res.dataset.columns[0])
      }
      if (!csv.ycol && res.dataset.columns.length > 1) {
        onUpdate('ycol', res.dataset.columns[1])
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload fehlgeschlagen.'
      setErrorMessage(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSelectDataset = (val: string) => {
    onUpdate('path', val)
    setErrorMessage(null)
    const match = datasets.find(d => d.filename.toLowerCase() === val.toLowerCase())
    if (match) {
      if (!csv.xcol && match.columns.length > 0) {
        onUpdate('xcol', match.columns[0])
      }
      if (!csv.ycol && match.columns.length > 1) {
        onUpdate('ycol', match.columns[1])
      }
    }
  }

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
                <span className="text-metadata truncate max-w-[150px]">{currentFilename || '(keine CSV)'}</span>
                {isMissingFile && <span title="Datei fehlt im System"><AlertCircle size={12} className="text-amber-500 shrink-0" /></span>}
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
          {/* 1. Dateiauswahl & In-Place Upload */}
          <Field label="CSV-Datensatz">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <DatasetCombobox
                  value={currentFilename}
                  datasets={datasets}
                  loading={loadingDatasets}
                  uploading={uploading}
                  isMissingFile={isMissingFile}
                  onSelect={handleSelectDataset}
                  onUploadClick={() => fileInputRef.current?.click()}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-9 px-3 bg-primary text-white hover:bg-primary-hover flex items-center gap-1.5 text-xs shrink-0 rounded-lg shadow-xs"
                  title="Neue CSV-Datei hochladen"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>{uploading ? 'Lädt...' : 'Upload'}</span>
                </Button>
              </div>

              {/* Warnung bei fehlender Datei aus Preset */}
              {isMissingFile && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Die Datei <strong>{currentFilename}</strong> wurde noch nicht hochgeladen. Bitte per Upload hinzufügen.</span>
                </div>
              )}

              {/* Fehlermeldung bei ungültigem Upload */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
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
              {renderColumnField('xcol', csv.xcol, 'z. B. x oder Zeit')}
            </Field>
            <Field label="Titel Y-Spalte im Dokument">
              {renderColumnField('ycol', csv.ycol, 'z. B. y oder Messwert')}
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
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-line hover:border-rim bg-panel text-ghost'
                }`}
                title="Eigene Farbe wählen"
              >
                <input
                  type="color"
                  value={currentColor}
                  onChange={e => onUpdate('color', e.target.value)}
                  className="sr-only"
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                  style={{ backgroundColor: currentColor }}
                />
                <span className="text-[10px] font-mono font-medium uppercase">
                  {currentColor}
                </span>
              </label>
            </div>

            {/* Linienstärke */}
            <div className="flex items-center gap-1 bg-panel p-1 rounded-lg border border-line">
              {LINE_WIDTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('line_width', opt.value)}
                  className={`px-2 py-0.5 text-xs rounded transition-all cursor-pointer ${
                    currentLineWidth === opt.value
                      ? 'bg-raised text-ink font-semibold shadow-2xs'
                      : 'text-ghost hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Linienstil */}
            <div className="flex items-center gap-1 bg-panel p-1 rounded-lg border border-line">
              {LINE_STYLE_PRESETS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('line_style', opt.value)}
                  className={`px-2 py-0.5 text-xs rounded transition-all cursor-pointer ${
                    currentLineStyle === opt.value
                      ? 'bg-raised text-ink font-semibold shadow-2xs'
                      : 'text-ghost hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Punkte/Marker & Optionen */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Nur Datenpunkte zeichnen (Scatter Plot / keine Linie)</span>
              <Switch checked={csv.only_marks} onChange={(v: boolean) => onUpdate('only_marks', v)} />
            </div>

            {csv.only_marks && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-raised/20 rounded-xl border border-line/40">
                <Field label="Marker-Symbol">
                  <select
                    value={csv.marker_symbol}
                    onChange={e => onUpdate('marker_symbol', e.target.value)}
                    className="w-full h-8 px-2 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="*">Stern (*)</option>
                    <option value="o">Kreis (o)</option>
                    <option value="x">Kreuz (x)</option>
                    <option value="+">Plus (+)</option>
                    <option value="square">Quadrat</option>
                    <option value="triangle">Dreieck</option>
                  </select>
                </Field>
                <Field label="Marker-Größe (pt)">
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
