// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { Eye, EyeOff, Info, ChartSpline, Plus, ChartScatter, TrendingUp, MapPin, Pin, Sparkles } from 'lucide-react'
import { Accordion, Button } from '../../../components/ui'
import { KoordPlotCard } from './items/KoordPlotCard'
import { KoordCSVCard } from './items/KoordCSVCard'
import { KoordParamCard } from './items/KoordParamCard'
import { KoordPointCard } from './items/KoordPointCard'
import { KoordNodeCard } from './items/KoordNodeCard'
import type { Config, Plot, CSVPlot, ParametricPlot, PointItem, NodeItem } from '../typesKoord'

interface KoordTabLayersProps {
  config: Config
  updateConfig: (key: keyof Config, value: unknown) => void
  isExpanded: (key: string) => boolean
  toggleExpand: (key: string) => void
  setAllExpanded: (prefix: string, count: number, value: boolean) => void
  plotSubTabs: Record<number, string>
  setPlotSubTabs: (prev: (old: Record<number, string>) => Record<number, string>) => void
}

export const KoordTabLayers = ({
  config, updateConfig, isExpanded, toggleExpand, setAllExpanded, plotSubTabs, setPlotSubTabs
}: KoordTabLayersProps) => {

  const [copiedStyles, setCopiedStyles] = useState<{
    plots?: Partial<Plot>
    csv?: Partial<CSVPlot>
    param?: Partial<ParametricPlot>
    points?: Partial<PointItem>
    nodes?: Partial<NodeItem>
  }>({})

  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(prev => (prev === msg ? null : prev)), 2500)
  }

  const setTabVisible = (key: 'plots' | 'csv_plots' | 'nodes' | 'points' | 'parametric_plots', value: boolean) =>
    updateConfig(key, (config[key] as { show: boolean }[]).map(p => ({ ...p, show: value })))

  // --- Plot Handlers & Style Copy ---
  const addPlot = (customPlot?: Plot) => {
    const newPlot = customPlot || {
      show: true,
      func: 'x^2',
      color: copiedStyles.plots?.color || '#1e293b',
      line_width: copiedStyles.plots?.line_width || 'thick',
      line_style: copiedStyles.plots?.line_style || 'solid',
      custom_style: copiedStyles.plots?.custom_style || '',
      xmin: null,
      xmax: null,
      label_text: '',
      label_pos: 0.6,
      label_style: 'above, sloped, font=\\small, fill=white, inner sep=1pt',
      shades: [],
      betweens: [],
      slopes: [],
      tangents: [],
    }
    updateConfig('plots', [...config.plots, newPlot])
  }

  const updatePlot = (i: number, key: keyof Plot, value: unknown) => {
    const arr = [...config.plots]; arr[i] = { ...arr[i], [key]: value }; updateConfig('plots', arr)
  }

  const copyPlotStyle = (plot: Plot) => {
    setCopiedStyles(prev => ({
      ...prev,
      plots: {
        color: plot.color,
        line_width: plot.line_width,
        line_style: plot.line_style,
        custom_style: plot.custom_style,
      }
    }))
    showToast('Stil der Funktion kopiert')
  }
  const pastePlotStyle = (i: number) => {
    if (!copiedStyles.plots) return
    const arr = [...config.plots]
    arr[i] = {
      ...arr[i],
      color: copiedStyles.plots.color ?? arr[i].color,
      line_width: copiedStyles.plots.line_width ?? arr[i].line_width,
      line_style: copiedStyles.plots.line_style ?? arr[i].line_style,
      custom_style: copiedStyles.plots.custom_style ?? arr[i].custom_style,
    }
    updateConfig('plots', arr)
    showToast(`Stil auf Funktion ${i + 1} angewendet`)
  }
  const applyPlotStyleToAll = (sourcePlot: Plot) => {
    updateConfig('plots', config.plots.map(p => ({
      ...p,
      color: sourcePlot.color,
      line_width: sourcePlot.line_width,
      line_style: sourcePlot.line_style,
      custom_style: sourcePlot.custom_style,
    })))
    showToast('Stil auf alle Funktionen übertragen')
  }

  // --- CSV Handlers & Style Copy ---
  const addCSV = () => updateConfig('csv_plots', [...config.csv_plots, {
    show: true,
    path: '',
    color: copiedStyles.csv?.color || '#1e293b',
    line_width: copiedStyles.csv?.line_width || 'thick',
    line_style: copiedStyles.csv?.line_style || 'solid',
    custom_style: copiedStyles.csv?.custom_style || '',
    xcol: '',
    ycol: '',
    sep: 'semicolon',
    read_comma: true,
    only_marks: copiedStyles.csv?.only_marks ?? false,
    marker_symbol: '*',
    marker_size: 1.0,
    marker_options: ''
  }])
  const updateCSV = (i: number, key: keyof CSVPlot, value: unknown) => {
    const arr = [...config.csv_plots]; arr[i] = { ...arr[i], [key]: value }; updateConfig('csv_plots', arr)
  }

  const copyCSVStyle = (csv: CSVPlot) => {
    setCopiedStyles(prev => ({
      ...prev,
      csv: {
        color: csv.color,
        line_width: csv.line_width,
        line_style: csv.line_style,
        custom_style: csv.custom_style,
        only_marks: csv.only_marks,
      }
    }))
    showToast('Stil der CSV-Daten kopiert')
  }
  const pasteCSVStyle = (i: number) => {
    if (!copiedStyles.csv) return
    const arr = [...config.csv_plots]
    arr[i] = {
      ...arr[i],
      color: copiedStyles.csv.color ?? arr[i].color,
      line_width: copiedStyles.csv.line_width ?? arr[i].line_width,
      line_style: copiedStyles.csv.line_style ?? arr[i].line_style,
      custom_style: copiedStyles.csv.custom_style ?? arr[i].custom_style,
      only_marks: copiedStyles.csv.only_marks ?? arr[i].only_marks,
    }
    updateConfig('csv_plots', arr)
    showToast(`Stil auf CSV-Plot ${i + 1} angewendet`)
  }
  const applyCSVStyleToAll = (sourceCSV: CSVPlot) => {
    updateConfig('csv_plots', config.csv_plots.map(c => ({
      ...c,
      color: sourceCSV.color,
      line_width: sourceCSV.line_width,
      line_style: sourceCSV.line_style,
      custom_style: sourceCSV.custom_style,
      only_marks: sourceCSV.only_marks,
    })))
    showToast('Stil auf alle CSV-Daten übertragen')
  }

  // --- Parametric Handlers & Style Copy ---
  const addParam = () => updateConfig('parametric_plots', [...config.parametric_plots, {
    show: true,
    x_t: 'cos(deg(t))',
    y_t: 'sin(deg(t))',
    color: copiedStyles.param?.color || '#1e293b',
    line_width: copiedStyles.param?.line_width || 'very thick',
    line_style: copiedStyles.param?.line_style || 'solid',
    custom_style: copiedStyles.param?.custom_style || '',
    tmin: config.xmin,
    tmax: config.xmax,
    ymin: config.ymin,
    ymax: config.ymax,
    label_show: false,
    label_text: '\\large $x$',
    label_pos: 0.6,
    label_style: 'above, sloped, font=\\small, fill=white, inner sep=1pt'
  }])
  const updateParam = (i: number, key: keyof ParametricPlot, value: unknown) => {
    const arr = [...config.parametric_plots]; arr[i] = { ...arr[i], [key]: value }; updateConfig('parametric_plots', arr)
  }

  const copyParamStyle = (par: ParametricPlot) => {
    setCopiedStyles(prev => ({
      ...prev,
      param: {
        color: par.color,
        line_width: par.line_width,
        line_style: par.line_style,
        custom_style: par.custom_style,
      }
    }))
    showToast('Stil der Parametrik kopiert')
  }
  const pasteParamStyle = (i: number) => {
    if (!copiedStyles.param) return
    const arr = [...config.parametric_plots]
    arr[i] = { ...arr[i], ...copiedStyles.param }
    updateConfig('parametric_plots', arr)
    showToast(`Stil auf Parametrik ${i + 1} angewendet`)
  }
  const applyParamStyleToAll = (sourceParam: ParametricPlot) => {
    const style = {
      color: sourceParam.color,
      line_width: sourceParam.line_width,
      line_style: sourceParam.line_style,
      custom_style: sourceParam.custom_style,
    }
    updateConfig('parametric_plots', config.parametric_plots.map(p => ({ ...p, ...style })))
    showToast('Stil auf alle Parametrik-Kurven übertragen')
  }

  // --- Point Handlers & Style Copy ---
  const addPoint = () => updateConfig('points', [...config.points, {
    show: true,
    x: 2.0,
    y: 1.0,
    label: `P_{${config.points.length + 1}}`,
    color: copiedStyles.points?.color || '#1e293b',
    anchor: copiedStyles.points?.anchor || 'west',
    custom_label_style: copiedStyles.points?.custom_label_style || '',
    mark: copiedStyles.points?.mark || 'x',
    size: copiedStyles.points?.size ?? 3.0,
    mark_style: 'very thick'
  }])
  const updatePoint = (i: number, key: keyof PointItem, value: unknown) => {
    const arr = [...config.points]; arr[i] = { ...arr[i], [key]: value }; updateConfig('points', arr)
  }

  const copyPointStyle = (pt: PointItem) => {
    setCopiedStyles(prev => ({
      ...prev,
      points: {
        color: pt.color,
        anchor: pt.anchor || 'west',
        custom_label_style: pt.custom_label_style || '',
        mark: pt.mark,
        size: pt.size,
        mark_style: pt.mark_style || 'very thick'
      }
    }))
    showToast('Stil des Punktes kopiert')
  }
  const pastePointStyle = (i: number) => {
    if (!copiedStyles.points) return
    const arr = [...config.points]
    arr[i] = { ...arr[i], ...copiedStyles.points }
    updateConfig('points', arr)
    showToast(`Stil auf Punkt ${i + 1} angewendet`)
  }
  const applyPointStyleToAll = (sourcePt: PointItem) => {
    const style = {
      color: sourcePt.color,
      anchor: sourcePt.anchor || 'west',
      custom_label_style: sourcePt.custom_label_style || '',
      mark: sourcePt.mark,
      size: sourcePt.size,
      mark_style: sourcePt.mark_style || 'very thick'
    }
    updateConfig('points', config.points.map(p => ({ ...p, ...style })))
    showToast('Stil auf alle Punkte übertragen')
  }

  // --- Node Handlers & Style Copy ---
  const addNode = () => updateConfig('nodes', [...config.nodes, {
    show: true,
    x: config.xmin + 0.5,
    y: config.ymin + 0.5,
    text: 'Hinweis',
    color: copiedStyles.nodes?.color || '#1e293b',
    font_size: copiedStyles.nodes?.font_size || '\\small',
    anchor: copiedStyles.nodes?.anchor || 'center',
    custom_opts: copiedStyles.nodes?.custom_opts || '',
    bg_white: copiedStyles.nodes?.bg_white ?? false,
    marker: copiedStyles.nodes?.marker ?? false,
    mark_style: copiedStyles.nodes?.mark_style || 'only marks, mark=*, color=black',
    mark_size: copiedStyles.nodes?.mark_size ?? 1.6,
    arrow: copiedStyles.nodes?.arrow ?? false,
    arrow_style: copiedStyles.nodes?.arrow_style || '->, thick',
    dx: 0,
    dy: 0
  }])
  const updateNode = (i: number, key: keyof NodeItem, value: unknown) => {
    const arr = [...config.nodes]; arr[i] = { ...arr[i], [key]: value }; updateConfig('nodes', arr)
  }

  const copyNodeStyle = (node: NodeItem) => {
    setCopiedStyles(prev => ({
      ...prev,
      nodes: {
        color: node.color,
        font_size: node.font_size,
        anchor: node.anchor,
        custom_opts: node.custom_opts,
        bg_white: node.bg_white,
        marker: node.marker,
        mark_style: node.mark_style,
        mark_size: node.mark_size,
        arrow: node.arrow,
        arrow_style: node.arrow_style,
      }
    }))
    showToast('Stil der Anmerkung kopiert')
  }
  const pasteNodeStyle = (i: number) => {
    if (!copiedStyles.nodes) return
    const arr = [...config.nodes]
    arr[i] = { ...arr[i], ...copiedStyles.nodes }
    updateConfig('nodes', arr)
    showToast(`Stil auf Anmerkung ${i + 1} angewendet`)
  }
  const applyNodeStyleToAll = (sourceNode: NodeItem) => {
    const style = {
      color: sourceNode.color,
      font_size: sourceNode.font_size,
      anchor: sourceNode.anchor,
      custom_opts: sourceNode.custom_opts,
      bg_white: sourceNode.bg_white,
      marker: sourceNode.marker,
      mark_style: sourceNode.mark_style,
      mark_size: sourceNode.mark_size,
      arrow: sourceNode.arrow,
      arrow_style: sourceNode.arrow_style,
    }
    updateConfig('nodes', config.nodes.map(n => ({ ...n, ...style })))
    showToast('Stil auf alle Anmerkungen übertragen')
  }

  return (
    <div className="space-y-4 relative">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-panel border border-primary/40 text-ink px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles size={15} className="text-primary shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Layer Control Toolbar */}
      <div className="flex items-center justify-between bg-raised/20 p-3 rounded-xl border border-line/50 mb-2">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-primary" />
          <span className="text-caption">Layer-Steuerung</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => {
            setTabVisible('plots', true); setTabVisible('csv_plots', true); setTabVisible('nodes', true);
            setTabVisible('points', true); setTabVisible('parametric_plots', true);
          }} className="text-caption text-muted hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
            <Eye size={12} /> Alle Ein
          </button>
          <button onClick={() => {
            setTabVisible('plots', false); setTabVisible('csv_plots', false); setTabVisible('nodes', false);
            setTabVisible('points', false); setTabVisible('parametric_plots', false);
          }} className="text-caption text-muted hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
            <EyeOff size={12} /> Alle Aus
          </button>
        </div>
      </div>

      {/* --- FUNKTIONEN --- */}
      <Accordion title={`Funktionen (${config.plots.length})`} icon={<ChartSpline size={18} />} defaultOpen={config.plots.length > 0}>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <Button onClick={() => addPlot()} className="flex items-center justify-center gap-2 bg-raised border border-rim hover:bg-overlay h-9 text-xs font-bold uppercase tracking-widest text-ink px-5">
                <Plus size={16} /> Neu
              </Button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAllExpanded('plots', config.plots.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
              <span className="text-slate-800">|</span>
              <button onClick={() => setAllExpanded('plots', config.plots.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
            </div>
          </div>
          <div className="space-y-3">
            {config.plots.map((plot, i) => (
              <KoordPlotCard
                key={i}
                plot={plot}
                index={i}
                config={config}
                expanded={isExpanded(`plots-${i}`)}
                onToggleExpand={() => toggleExpand(`plots-${i}`)}
                onUpdate={(key, val) => updatePlot(i, key, val)}
                onDuplicate={() => updateConfig('plots', [...config.plots, JSON.parse(JSON.stringify(plot))])}
                onRemove={() => updateConfig('plots', config.plots.filter((_, idx) => idx !== i))}
                onAddPlot={addPlot}
                subTab={plotSubTabs[i] ?? 'label'}
                onSetSubTab={(tab) => setPlotSubTabs(prev => ({ ...prev, [i]: tab }))}
                onCopyStyle={() => copyPlotStyle(plot)}
                onPasteStyle={() => pastePlotStyle(i)}
                onApplyStyleToAll={() => applyPlotStyleToAll(plot)}
                hasCopiedStyle={!!copiedStyles.plots}
              />
            ))}
          </div>
        </div>
      </Accordion>

      {/* --- CSV DATEN --- */}
      <Accordion title={`CSV-Daten (${config.csv_plots.length})`} icon={<ChartScatter size={18} />} defaultOpen={config.csv_plots.length > 0}>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <Button onClick={addCSV} className="flex items-center justify-center gap-2 bg-raised border border-rim hover:bg-overlay h-9 text-xs font-bold uppercase tracking-widest text-ink px-5">
                <Plus size={16} /> Neu
              </Button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAllExpanded('csv', config.csv_plots.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
              <span className="text-slate-800">|</span>
              <button onClick={() => setAllExpanded('csv', config.csv_plots.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
            </div>
          </div>
          <div className="space-y-3">
            {config.csv_plots.map((csv, i) => (
              <KoordCSVCard
                key={i}
                csv={csv}
                index={i}
                expanded={isExpanded(`csv-${i}`)}
                onToggleExpand={() => toggleExpand(`csv-${i}`)}
                onUpdate={(key, val) => updateCSV(i, key, val)}
                onDuplicate={() => updateConfig('csv_plots', [...config.csv_plots, JSON.parse(JSON.stringify(csv))])}
                onRemove={() => updateConfig('csv_plots', config.csv_plots.filter((_, idx) => idx !== i))}
                onCopyStyle={() => copyCSVStyle(csv)}
                onPasteStyle={() => pasteCSVStyle(i)}
                onApplyStyleToAll={() => applyCSVStyleToAll(csv)}
                hasCopiedStyle={!!copiedStyles.csv}
              />
            ))}
          </div>
        </div>
      </Accordion>

      {/* --- PARAMETRISCH --- */}
      <Accordion title={`Parametrisch (${config.parametric_plots.length})`} icon={<TrendingUp size={18} />} defaultOpen={config.parametric_plots.length > 0}>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <Button onClick={addParam} className="flex items-center justify-center gap-2 bg-raised border border-rim hover:bg-overlay h-9 text-xs font-bold uppercase tracking-widest text-ink px-5">
                <Plus size={16} /> Neu
              </Button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAllExpanded('param', config.parametric_plots.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
              <span className="text-slate-800">|</span>
              <button onClick={() => setAllExpanded('param', config.parametric_plots.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
            </div>
          </div>
          <div className="space-y-3">
            {config.parametric_plots.map((par, i) => (
              <KoordParamCard
                key={i}
                param={par}
                index={i}
                expanded={isExpanded(`param-${i}`)}
                onToggleExpand={() => toggleExpand(`param-${i}`)}
                onUpdate={(key, val) => updateParam(i, key, val)}
                onDuplicate={() => updateConfig('parametric_plots', [...config.parametric_plots, JSON.parse(JSON.stringify(par))])}
                onRemove={() => updateConfig('parametric_plots', config.parametric_plots.filter((_, idx) => idx !== i))}
                onCopyStyle={() => copyParamStyle(par)}
                onPasteStyle={() => pasteParamStyle(i)}
                onApplyStyleToAll={() => applyParamStyleToAll(par)}
                hasCopiedStyle={!!copiedStyles.param}
              />
            ))}
          </div>
        </div>
      </Accordion>

      {/* --- PUNKTE --- */}
      <Accordion title={`Punkte (${config.points.length})`} icon={<MapPin size={18} />} defaultOpen={config.points.length > 0}>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <Button onClick={addPoint} className="flex items-center justify-center gap-2 bg-raised border border-rim hover:bg-overlay h-9 text-caption tracking-widest text-ink px-5">
                <Plus size={16} /> Neu
              </Button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAllExpanded('point', config.points.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
              <span className="text-slate-800">|</span>
              <button onClick={() => setAllExpanded('point', config.points.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
            </div>
          </div>

          <div className="space-y-3">
            {config.points.map((pt, i) => (
              <KoordPointCard
                key={`pt-${i}`}
                point={pt}
                index={i}
                expanded={isExpanded(`point-${i}`)}
                onToggleExpand={() => toggleExpand(`point-${i}`)}
                onUpdate={(key, val) => updatePoint(i, key, val)}
                onDuplicate={() => updateConfig('points', [...config.points, JSON.parse(JSON.stringify(pt))])}
                onRemove={() => updateConfig('points', config.points.filter((_, idx) => idx !== i))}
                onCopyStyle={() => copyPointStyle(pt)}
                onPasteStyle={() => pastePointStyle(i)}
                onApplyStyleToAll={() => applyPointStyleToAll(pt)}
                hasCopiedStyle={!!copiedStyles.points}
              />
            ))}
          </div>
        </div>
      </Accordion>

      {/* --- ANMERKUNGEN --- */}
      <Accordion title={`Anmerkungen (${config.nodes.length})`} icon={<Pin size={18} />} defaultOpen={config.nodes.length > 0}>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <Button onClick={addNode} className="flex items-center justify-center gap-2 bg-raised border border-rim hover:bg-overlay h-9 text-caption tracking-widest text-ink px-5">
                <Plus size={16} /> Neu
              </Button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAllExpanded('node', config.nodes.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
              <span className="text-slate-800">|</span>
              <button onClick={() => setAllExpanded('node', config.nodes.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
            </div>
          </div>

          <div className="space-y-3">
            {config.nodes.map((node, i) => (
              <KoordNodeCard
                key={`node-${i}`}
                node={node}
                index={i}
                expanded={isExpanded(`node-${i}`)}
                onToggleExpand={() => toggleExpand(`node-${i}`)}
                onUpdate={(key, val) => updateNode(i, key, val)}
                onDuplicate={() => updateConfig('nodes', [...config.nodes, JSON.parse(JSON.stringify(node))])}
                onRemove={() => updateConfig('nodes', config.nodes.filter((_, idx) => idx !== i))}
                onCopyStyle={() => copyNodeStyle(node)}
                onPasteStyle={() => pasteNodeStyle(i)}
                onApplyStyleToAll={() => applyNodeStyleToAll(node)}
                hasCopiedStyle={!!copiedStyles.nodes}
              />
            ))}
          </div>
        </div>
      </Accordion>
    </div>
  )
}
