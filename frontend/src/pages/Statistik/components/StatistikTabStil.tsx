import { useState } from 'react'
import { Settings, RotateCcw, ChevronDown, ChevronRight, Check, Pipette } from 'lucide-react'
import { Card, Label, Slider, Switch, SecHead, Collapsible, Field, NumberInput, Input, FontSelector } from '../../../components/ui'
import { COLOR_PRESETS } from '../../Koordinatensystem/constantsStylePresets'
import type { StatistikAxisUpdater, StatistikConfig, StatistikSetter, TitleConfig } from '../typesStatistik'
import { computeAutoYRange } from '../utilsStatistik'

const TITLE_FONT_SIZES = [
  { value: '\\tiny', label: 'Sehr klein (\\tiny)' },
  { value: '\\scriptsize', label: 'Skript (\\scriptsize)' },
  { value: '\\footnotesize', label: 'Fußnote (\\footnotesize)' },
  { value: '\\small', label: 'Klein (\\small)' },
  { value: '\\normalsize', label: 'Normal (\\normalsize)' },
  { value: '\\large', label: 'Groß (\\large)' },
  { value: '\\Large', label: 'Sehr groß (\\Large)' },
  { value: '\\LARGE', label: 'Riesig (\\LARGE)' },
  { value: '\\huge', label: 'Gigantisch (\\huge)' },
]

interface StatistikTabStilProps {
  config: StatistikConfig
  set: StatistikSetter
  updateAxis: StatistikAxisUpdater
}

export const StatistikTabStil = ({
  config,
  set,
  updateAxis
}: StatistikTabStilProps) => {

  const autoY = computeAutoYRange(config)
  const [titleExpanded, setTitleExpanded] = useState(() => config.title_opts?.show ?? false)

  const updateTitleOpts = <K extends keyof TitleConfig>(field: K, value: TitleConfig[K]) =>
    set('title_opts', { ...config.title_opts, [field]: value })

  const isColorActive = (presetColor: string) => {
    const c = (config.title_opts?.color || '#1e293b').toLowerCase()
    const pc = presetColor.toLowerCase()
    if (c === pc) return true
    if (c === 'black' && pc === '#1e293b') return true
    if (c === 'blue' && pc === '#2563eb') return true
    if (c === 'red' && pc === '#ef4444') return true
    if (c === 'green' && pc === '#10b981') return true
    if (c === 'purple' && pc === '#8b5cf6') return true
    if (c === 'orange' && pc === '#f97316') return true
    if (c === 'teal' && pc === '#06b6d4') return true
    return false
  }
  const isCustomColor = !COLOR_PRESETS.some(cp => isColorActive(cp.color))

  const updateBoxplotOpts = <K extends keyof StatistikConfig['boxplot_opts']>(field: K, value: StatistikConfig['boxplot_opts'][K]) =>
    set('boxplot_opts', { ...config.boxplot_opts, [field]: value })

  const updateHistogramOpts = <K extends keyof StatistikConfig['histogram_opts']>(field: K, value: StatistikConfig['histogram_opts'][K]) =>
    set('histogram_opts', { ...config.histogram_opts, [field]: value })

  const updateBarChartOpts = <K extends keyof StatistikConfig['barchart_opts']>(field: K, value: StatistikConfig['barchart_opts'][K]) =>
    set('barchart_opts', { ...config.barchart_opts, [field]: value })

  const updateSummenkurveOpts = <K extends keyof StatistikConfig['summenkurve_opts']>(field: K, value: StatistikConfig['summenkurve_opts'][K]) =>
    set('summenkurve_opts', { ...config.summenkurve_opts, [field]: value })

  const updateViolinOpts = <K extends keyof StatistikConfig['violin_opts']>(field: K, value: StatistikConfig['violin_opts'][K]) =>
    set('violin_opts', { ...config.violin_opts, [field]: value })

  return (
    <div className="space-y-6">
      {/* ===== Diagramm-Titel ===== */}
      <Card className="border-line bg-panel/40 overflow-hidden transition-all hover:border-rim">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTitleExpanded(!titleExpanded)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setTitleExpanded(!titleExpanded)}
          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-raised/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {titleExpanded ? <ChevronDown size={15} className="text-primary shrink-0" /> : <ChevronRight size={15} className="text-ghost shrink-0" />}
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-xs"
                style={{ backgroundColor: config.title_opts?.color?.startsWith('#') ? config.title_opts.color : '#1e293b' }}
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-ink">Diagramm-Titel</span>
                {!titleExpanded && (
                  <span className="text-xs text-metadata truncate max-w-[280px]">
                    {config.title_opts?.show ? (config.title_opts.text || '(kein Text)') : 'Deaktiviert'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <Switch
              checked={config.title_opts?.show ?? false}
              onChange={(v: boolean) => {
                updateTitleOpts('show', v)
                if (v && !titleExpanded) setTitleExpanded(true)
              }}
            />
          </div>
        </div>

        {titleExpanded && (
          <div className="px-4 pb-4 border-t border-line/50 space-y-4 pt-4">
            <Field label="Titel-Text (LaTeX)">
              <Input
                value={config.title_opts?.text ?? ''}
                onChange={e => updateTitleOpts('text', e.target.value)}
                placeholder="z. B. Häufigkeitsverteilung der Noten"
                className="h-9 font-medium"
              />
            </Field>

            {/* Stil-Leiste: Farbe, Schriftgröße, Ausrichtung & Schriftschnitt */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-raised/20 p-2.5 rounded-xl border border-line/40">
              {/* Farbpalette */}
              <div className="flex items-center gap-1.5">
                {COLOR_PRESETS.map(cp => {
                  const isActive = isColorActive(cp.color)
                  return (
                    <button
                      key={cp.id}
                      type="button"
                      onClick={() => updateTitleOpts('color', cp.color)}
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
                  title={`Eigene Farbe wählen (Farbpipette, aktuell: ${config.title_opts?.color || '#1e293b'})`}
                >
                  <Pipette size={12} className={isCustomColor ? 'text-primary' : 'text-muted'} />
                  <span
                    className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs"
                    style={{ backgroundColor: config.title_opts?.color?.startsWith('#') ? config.title_opts.color : '#1e293b' }}
                  />
                  <input
                    type="color"
                    value={config.title_opts?.color?.startsWith('#') ? config.title_opts.color : '#1e293b'}
                    onChange={e => updateTitleOpts('color', e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="h-4 w-px bg-line/60 hidden sm:block" />

              {/* Schriftgröße */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[140px] max-w-[200px]">
                <span className="text-caption text-muted whitespace-nowrap">Größe:</span>
                <select
                  value={config.title_opts?.font_size || '\\large'}
                  onChange={e => updateTitleOpts('font_size', e.target.value)}
                  className="w-full h-7 px-2 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  title="Schriftgröße"
                >
                  {TITLE_FONT_SIZES.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-4 w-px bg-line/60 hidden sm:block" />

              {/* Ausrichtung */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[130px] max-w-[180px]">
                <span className="text-caption text-muted whitespace-nowrap">Position:</span>
                <select
                  value={config.title_opts?.align || 'center'}
                  onChange={e => updateTitleOpts('align', e.target.value as 'center' | 'left' | 'right')}
                  className="w-full h-7 px-2 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  title="Ausrichtung"
                >
                  <option value="center">Zentriert</option>
                  <option value="left">Links</option>
                  <option value="right">Rechts</option>
                </select>
              </div>

              <div className="h-4 w-px bg-line/60 hidden sm:block" />

              {/* Schnitt / Stil */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[130px] max-w-[180px]">
                <span className="text-caption text-muted whitespace-nowrap">Stil:</span>
                <select
                  value={config.title_opts?.font_weight || 'bold'}
                  onChange={e => updateTitleOpts('font_weight', e.target.value as 'bold' | 'normal' | 'italic')}
                  className="w-full h-7 px-2 bg-panel border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  title="Schriftschnitt"
                >
                  <option value="bold">Fett</option>
                  <option value="normal">Normal</option>
                  <option value="italic">Kursiv</option>
                </select>
              </div>
            </div>

            {/* Weitere Optionen */}
            <Collapsible title="Weitere Optionen (LaTeX)">
              <div className="space-y-3 pt-2">
                <Field label="Zusätzliche LaTeX-Optionen (optional)">
                  <Input
                    value={config.title_opts?.custom_style || ''}
                    onChange={e => updateTitleOpts('custom_style', e.target.value)}
                    className="h-8 text-xs font-mono"
                    placeholder="z. B. yshift=8pt, inner sep=2pt"
                  />
                </Field>
              </div>
            </Collapsible>
          </div>
        )}
      </Card>
      {/* ===== Typ-spezifische Optionen ===== */}
      {config.type === 'Boxplot' && (
        <Collapsible title="Boxplot Optionen" defaultOpen={true}>
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Ausrichtung</Label>
                <select
                  value={config.boxplot_opts.orientation}
                  onChange={e => updateBoxplotOpts('orientation', e.target.value as StatistikConfig['boxplot_opts']['orientation'])}
                  className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertikal</option>
                </select>
              </div>
              <Slider label="Box Breite" min={0.1} max={2.0} step={0.1} value={config.boxplot_opts.box_width} onChange={v => updateBoxplotOpts('box_width', v)} />
            </div>
            <Switch label="Mittelwert einzeichnen" checked={config.boxplot_opts.draw_mean} onChange={v => updateBoxplotOpts('draw_mean', v)} />
          </div>
        </Collapsible>
      )}

      {config.type === 'Histogramm' && (
        <Collapsible title="Histogramm Optionen" defaultOpen={true}>
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-6">
              <Slider label="Klassenbreite (Bin Width)" min={0.1} max={10} step={0.1} value={config.histogram_opts.bin_width} onChange={v => updateHistogramOpts('bin_width', v)} />
              <div className="flex flex-col justify-end pb-1">
                <Switch label="Relative Häufigkeit (Dichte)" checked={config.histogram_opts.density} onChange={v => updateHistogramOpts('density', v)} />
              </div>
            </div>
          </div>
        </Collapsible>
      )}

      {config.type === 'Säulendiagramm' && (
        <Collapsible title="Säulendiagramm Optionen" defaultOpen={true}>
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Ausrichtung</Label>
                <select
                  value={config.barchart_opts.orientation}
                  onChange={e => updateBarChartOpts('orientation', e.target.value as StatistikConfig['barchart_opts']['orientation'])}
                  className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="vertical">Säulen (vertikal)</option>
                  <option value="horizontal">Balken (horizontal)</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label>Breitenmodus</Label>
                <div className="flex gap-1 p-1 bg-panel rounded-lg border border-line">
                  <button
                    type="button"
                    onClick={() => updateBarChartOpts('width_mode', 'boxes')}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      (config.barchart_opts.width_mode ?? 'boxes') === 'boxes'
                        ? 'bg-primary text-canvas shadow-sm font-semibold'
                        : 'text-muted hover:text-ink hover:bg-raised'
                    }`}
                  >
                    Kästchen
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBarChartOpts('width_mode', 'cm')}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      config.barchart_opts.width_mode === 'cm'
                        ? 'bg-primary text-canvas shadow-sm font-semibold'
                        : 'text-muted hover:text-ink hover:bg-raised'
                    }`}
                  >
                    cm (absolut)
                  </button>
                </div>
              </div>
            </div>

            {(config.barchart_opts.width_mode ?? 'boxes') === 'boxes' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-6">
                  <Slider
                    label="Balkenbreite (in Kästchen)"
                    min={0.5}
                    max={6}
                    step={0.5}
                    value={config.barchart_opts.bar_width_boxes ?? 2}
                    onChange={v => updateBarChartOpts('bar_width_boxes', v)}
                  />
                  <Slider
                    label="Balkenabstand (in Kästchen)"
                    min={0}
                    max={4}
                    step={0.5}
                    value={config.barchart_opts.bar_gap_boxes ?? 1}
                    onChange={v => updateBarChartOpts('bar_gap_boxes', v)}
                  />
                </div>
                {(() => {
                  const isVert = config.barchart_opts.orientation === 'vertical'
                  const ymin = config.y_axis.min ?? autoY.min
                  const ymax = config.y_axis.max ?? autoY.max
                  const yRange = Math.max(ymax - ymin, 0.001)
                  const yStep = config.y_axis.step > 0 ? config.y_axis.step : 1.0
                  const xmin = config.x_axis.min ?? 0
                  const xmax = config.x_axis.max ?? 10
                  const xRange = Math.max(xmax - xmin, 0.001)
                  const xStep = config.x_axis.step > 0 ? config.x_axis.step : 1.0
                  const deltaBox = isVert ? yStep / 2.0 : xStep / 2.0
                  const nBoxes = isVert
                    ? Math.max(1, Math.ceil(yRange / deltaBox))
                    : Math.max(1, Math.ceil(xRange / deltaBox))
                  const boxSize = isVert
                    ? config.height_cm / nBoxes
                    : config.width_cm / nBoxes
                  const numBoxes = config.barchart_opts.bar_width_boxes ?? 2
                  const gapBoxes = config.barchart_opts.bar_gap_boxes ?? 1
                  const totalWidth = numBoxes * boxSize
                  const totalGap = gapBoxes * boxSize

                  return (
                    <p className="text-[11px] text-muted leading-relaxed">
                      1 Kästchen = <span className="font-semibold text-ink">{boxSize.toFixed(2).replace('.', ',')} cm</span> &bull; Balkenbreite = <span className="font-semibold text-primary">{totalWidth.toFixed(2).replace('.', ',')} cm</span> &bull; Abstand = <span className="font-semibold text-ink">{totalGap.toFixed(2).replace('.', ',')} cm</span> (1 Schritt = 2 Kästchen)
                    </p>
                  )
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <Slider
                  label="Balkenbreite (cm)"
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  value={config.barchart_opts.bar_width}
                  onChange={v => updateBarChartOpts('bar_width', v)}
                />
                <Slider
                  label="Balkenabstand (cm)"
                  min={0}
                  max={3.0}
                  step={0.1}
                  value={config.barchart_opts.bar_gap ?? 0.5}
                  onChange={v => updateBarChartOpts('bar_gap', v)}
                />
              </div>
            )}

            <div className="pt-1">
              <Slider
                label={`Deckkraft / Opacity (${config.barchart_opts.opacity ?? 75} %)`}
                min={0}
                max={100}
                step={5}
                value={config.barchart_opts.opacity ?? 75}
                onChange={v => updateBarChartOpts('opacity', v)}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-line/40">
              <Switch
                label="Kästchengitter anzeigen"
                description="Quadratisches Gitter im Hintergrund (1 Schritt = 2 Kästchen)"
                checked={config.barchart_opts.show_grid ?? true}
                onChange={v => updateBarChartOpts('show_grid', v)}
              />
              <Switch
                label="Kategorien vertikal beschriften"
                description="Dreht die Beschriftungen der Säulen/Balken um 90°"
                checked={config.barchart_opts.vertical_labels ?? false}
                onChange={v => updateBarChartOpts('vertical_labels', v)}
              />
              <Switch
                label="Werte über Säulen beschriften"
                checked={config.barchart_opts.show_values}
                onChange={v => updateBarChartOpts('show_values', v)}
              />
            </div>
          </div>
        </Collapsible>
      )}

      {config.type === 'Summenkurve' && (
        <Collapsible title="Summenkurve Optionen" defaultOpen={true}>
          <div className="space-y-4 p-1">
            <Switch label="Glatte Kurve (smooth)" checked={config.summenkurve_opts.smooth} onChange={v => updateSummenkurveOpts('smooth', v)} />
            <Switch label="In Prozent (0–100 %)" checked={config.summenkurve_opts.as_percent} onChange={v => updateSummenkurveOpts('as_percent', v)} />
          </div>
        </Collapsible>
      )}

      {config.type === 'Violin' && (
        <Collapsible title="Violin Plot Optionen" defaultOpen={true}>
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Ausrichtung</Label>
                <select
                  value={config.violin_opts.orientation}
                  onChange={e => updateViolinOpts('orientation', e.target.value as StatistikConfig['violin_opts']['orientation'])}
                  className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertikal</option>
                </select>
              </div>
              <Slider label="Violin Breite" min={0.2} max={2.0} step={0.1} value={config.violin_opts.violin_width} onChange={v => updateViolinOpts('violin_width', v)} />
            </div>
            <Slider label="KDE Bandbreite" min={0.05} max={2.0} step={0.05} value={config.violin_opts.bandwidth} onChange={v => updateViolinOpts('bandwidth', v)} />
            <Switch label="Boxplot einblenden" checked={config.violin_opts.show_inner_box} onChange={v => updateViolinOpts('show_inner_box', v)} />
          </div>
        </Collapsible>
      )}

      {/* ===== Globale Diagramm-Größe ===== */}
      <div className="bg-raised/20 p-4 rounded-xl border border-line/50 space-y-4">
        <SecHead icon={<Settings size={14} />}>Diagramm-Größe</SecHead>
        <div className="grid grid-cols-2 gap-8">
          <Slider label="Breite (cm)" min={5} max={25} step={0.5} value={config.width_cm} onChange={v => set('width_cm', v)} />
          <Slider label="Höhe (cm)" min={3} max={20} step={0.5} value={config.height_cm} onChange={v => set('height_cm', v)} />
        </div>
      </div>

      <Collapsible title="X-Achse" defaultOpen={false}>
        <div className="space-y-6 p-1">
          <div className="space-y-4">
            <Field label="Achsenbeschriftung">
              <Input
                placeholder="z.B. Note, x, etc."
                value={config.x_axis.label}
                onChange={e => updateAxis('x_axis', 'label', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="X-Minimum (optional)">
                <NumberInput
                  placeholder="Auto"
                  value={config.x_axis.min ?? ''}
                  onChange={e => updateAxis('x_axis', 'min', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                  className="w-full"
                />
              </Field>
              <Field label="X-Maximum (optional)">
                <NumberInput
                  placeholder="Auto"
                  value={config.x_axis.max ?? ''}
                  onChange={e => updateAxis('x_axis', 'max', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                  className="w-full"
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-8 bg-raised/20 p-4 rounded-xl border border-line/50">
            <Field label="Tick-Modus" className="flex-1">
              <div className="flex gap-1 p-1 bg-panel rounded-lg border border-line">
                {(['Automatisch', 'Manuell'] as const).map(m => (
                  <button key={m} onClick={() => updateAxis('x_axis', 'tick_mode', m)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${config.x_axis.tick_mode === m ? 'bg-primary text-canvas shadow-sm font-semibold' : 'text-muted hover:text-ink hover:bg-raised'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex flex-col gap-2 pt-4">
              <Switch label="Werte" checked={config.x_axis.majorticklabels} onChange={(v: boolean) => updateAxis('x_axis', 'majorticklabels', v)} />
              <Switch label="Striche" checked={config.x_axis.ticks_show} onChange={(v: boolean) => updateAxis('x_axis', 'ticks_show', v)} />
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Schrittweite / Skalierung">
              <NumberInput step="1" min="0.1" value={config.x_axis.step} onChange={e => updateAxis('x_axis', 'step', parseFloat(e.target.value))} />
            </Field>
            {config.x_axis.tick_mode === 'Manuell' && (
              <div className="space-y-2">
                <Field label="Ticks (z.B. 0,2,4,6)">
                  <Input value={config.x_axis.tick_list} onChange={e => updateAxis('x_axis', 'tick_list', e.target.value)} />
                </Field>
              </div>
            )}
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Y-Achse" defaultOpen={false}>
        <div className="space-y-6 p-1">
          <div className="space-y-4">
            <Field label="Achsenbeschriftung">
              <Input
                placeholder="z.B. Häufigkeit, y, etc."
                value={config.y_axis.label}
                onChange={e => updateAxis('y_axis', 'label', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Y-Minimum (Auto)">
                <div className="flex items-center gap-1.5">
                  <NumberInput
                    value={config.y_axis.min ?? ''}
                    placeholder={String(autoY.min).replace('.', ',')}
                    onChange={e => updateAxis('y_axis', 'min', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                    className="flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => updateAxis('y_axis', 'min', null)}
                    disabled={config.y_axis.min === null || config.y_axis.min === undefined}
                    title="Auf Automatik zurücksetzen"
                    className="h-[38px] w-9 rounded-lg bg-raised border border-line text-ghost hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </Field>

              <Field label="Y-Maximum (Auto)">
                <div className="flex items-center gap-1.5">
                  <NumberInput
                    value={config.y_axis.max ?? ''}
                    placeholder={String(autoY.max).replace('.', ',')}
                    onChange={e => updateAxis('y_axis', 'max', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                    className="flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => updateAxis('y_axis', 'max', null)}
                    disabled={config.y_axis.max === null || config.y_axis.max === undefined}
                    title="Auf Automatik zurücksetzen"
                    className="h-[38px] w-9 rounded-lg bg-raised border border-line text-ghost hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-8 bg-raised/20 p-4 rounded-xl border border-line/50">
            <Field label="Tick-Modus" className="flex-1">
              <div className="flex gap-1 p-1 bg-panel rounded-lg border border-line">
                {(['Automatisch', 'Manuell'] as const).map(m => (
                  <button key={m} onClick={() => updateAxis('y_axis', 'tick_mode', m)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${config.y_axis.tick_mode === m ? 'bg-primary text-canvas shadow-sm font-semibold' : 'text-muted hover:text-ink hover:bg-raised'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex flex-col gap-2 pt-4">
              <Switch label="Werte" checked={config.y_axis.majorticklabels} onChange={(v: boolean) => updateAxis('y_axis', 'majorticklabels', v)} />
              <Switch label="Striche" checked={config.y_axis.ticks_show} onChange={(v: boolean) => updateAxis('y_axis', 'ticks_show', v)} />
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Schrittweite / Skalierung">
              <NumberInput step="1" min="0.1" value={config.y_axis.step} onChange={e => updateAxis('y_axis', 'step', parseFloat(e.target.value))} />
            </Field>
            {config.y_axis.tick_mode === 'Manuell' && (
              <div className="space-y-2">
                <Field label="Ticks (z.B. 0,2,4,6)">
                  <Input value={config.y_axis.tick_list} onChange={e => updateAxis('y_axis', 'tick_list', e.target.value)} />
                </Field>
                <p className="text-[10px] text-muted leading-tight">
                  Hinweis: Alle Ticks müssen einzeln eingegeben werden. Die TikZ-Spanne (z.B. <code className="text-primary">0,2,...,10</code>) funktioniert in diesem Modus nicht.
                </p>
              </div>
            )}
          </div>
        </div>
      </Collapsible>

      <div className="space-y-4 pt-4 border-t border-line">
        <SecHead>Text & Schrift</SecHead>
        <div className="grid grid-cols-2 gap-6">
          <FontSelector
            value={config.font_family}
            onChange={(v: string) => set('font_family', v)}
          />
          <div className="space-y-3">
            <Label>Schriftgröße</Label>
            <select
              value={config.font_size}
              onChange={e => set('font_size', e.target.value)}
              className="w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="tiny">Sehr klein</option>
              <option value="small">Klein</option>
              <option value="normalsize">Normal</option>
              <option value="large">Groß</option>
              <option value="Large">Sehr groß</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
