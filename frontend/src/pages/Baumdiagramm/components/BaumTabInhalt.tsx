// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { GitGraph, Layers, Star, Info, RotateCcw, CopyPlus, Table, Eye, EyeOff } from 'lucide-react'
import { Input, Label, NumberInput, Collapsible } from '../../../components/ui'
import type { BaumConfigUpdater, BaumHighlightUpdater, BaumNodeConfig, BaumNodeUpdater, Config } from '../typesBaum'
import { DEFAULT_CONFIG } from '../constantsBaum'
import { getNumChildren, parseLatexProb, getAllPaths, calcPathProb, formatProb } from '../utilsBaum'
import { SecHead, Chk } from './BaumControls'
import { BaumPfadTabelle } from './BaumPfadTabelle'

interface BaumTabInhaltProps {
  config: Config;
  updateConfig: BaumConfigUpdater;
  updateNode: BaumNodeUpdater;
  updateLevelLabelText: (level: number, text: string) => void;
  updateResult: (leafId: string, text: string) => void;
  updateHighlight: BaumHighlightUpdater;
  fillAllNodesWithBranchIndex: (branchK: number, field: keyof BaumNodeConfig, value: unknown) => void;
  fillAllLeafResultsAtBranch: (branchK: number, value: string) => void;
  setAllNodeLabelsHidden: (labelHidden: boolean) => void;
  setAllProbabilityLabelsHidden: (edgeLabelHidden: boolean) => void;
  showIndivStyles: boolean;
  setShowIndivStyles: (v: boolean) => void;
  autoComplement: boolean;
  setAutoComplement: (v: boolean) => void;
}

export const BaumTabInhalt = ({
  config,
  updateConfig,
  updateNode,
  updateLevelLabelText,
  updateResult,
  updateHighlight,
  fillAllNodesWithBranchIndex,
  fillAllLeafResultsAtBranch,
  setAllNodeLabelsHidden,
  setAllProbabilityLabelsHidden,
  showIndivStyles,
  setShowIndivStyles,
  autoComplement,
  setAutoComplement
}: BaumTabInhaltProps) => {
  const [inhaltTab, setInhaltTab] = useState('knoten')
  const [resultSearch, setResultSearch] = useState('')

  const renderNodeInputs = () => {
    let currentLevelNodes = ['root']
    const result = []

    for (let l = 1; l <= config.max_depth; l++) {
      const nextLevelNodes: string[] = []
      const levelInputs = []

      for (const parentId of currentLevelNodes) {
        const numKids = getNumChildren(config, parentId, l - 1)
        if (numKids === 0) continue

        const parentLabel = parentId === 'root' ? config.root_node.label : (config.nodes[parentId]?.label || parentId)

        // Calculate sum of probabilities
        let sum = 0
        for (let k = 0; k < numKids; k++) {
          const childId = parentId === 'root' ? `${k}` : `${parentId}_${k}`
          const nodeCfg = config.nodes[childId]
          let val = 1 / numKids
          if (nodeCfg) {
            const p = config.use_numeric_probs ? nodeCfg.prob_value : parseLatexProb(nodeCfg.edge_label)
            if (p !== null) val = p
          }
          sum += val
        }
        const sumError = Math.abs(sum - 1.0) > 0.001

        levelInputs.push(
          <div key={parentId} className="mb-8 last:mb-0 relative group">
            {/* Indentation Spacer & Line */}
            <div
              className="absolute left-0 top-0 bottom-0 border-l-2 border-line group-hover:border-primary/30 transition-colors"
              style={{ marginLeft: `${(l - 1) * 1.5}rem` }}
            />

            <div style={{ marginLeft: `${(l - 1) * 1.5 + 0.75}rem` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-primary/40" />
                <p className="text-sm font-semibold text-ink">
                  Von Knoten: <span className="text-primary italic">„{parentLabel}“</span> ({numKids} Äste)
                </p>
                {sumError && (
                  <span className="flex items-center gap-1 text-metadata bg-warning/10 text-warning px-2 py-0.5 rounded border border-warning/20 animate-pulse" title={`Summe: ${sum.toFixed(4)}`}>
                    <Info size={10} /> Summe ≠ 1 ({sum.toFixed(2)})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: numKids }).map((_, k) => {
                  const childId = parentId === 'root' ? `${k}` : `${parentId}_${k}`
                  nextLevelNodes.push(childId)

                  const nodeCfg = config.nodes[childId] || { label: '', labelHidden: false, edge_label: '', edgeLabelHidden: false, prob_value: null, node_style: null, edge_style: null, num_children: 2 }
                  const defaultLbl = numKids === 2 ? ['K', 'Z'][k % 2] : `A${k + 1}`
                  const labelHidden = nodeCfg.labelHidden ?? false
                  const labelToggleText = labelHidden ? 'Beschriftung anzeigen' : 'Beschriftung ausblenden'
                  const edgeLabelHidden = nodeCfg.edgeLabelHidden ?? false
                  const edgeLabelToggleText = edgeLabelHidden ? 'Wahrscheinlichkeit anzeigen' : 'Wahrscheinlichkeit ausblenden'

                  return (
                    <div key={childId} className={`bg-raised/${l % 2 === 0 ? '40' : '20'} border border-line/60 rounded-xl p-4 space-y-4 hover:border-rim transition-all`}>
                      <div className="flex justify-between items-center border-b border-line/50 pb-2">
                        <span className="text-caption tracking-widest text-ghost uppercase text-[10px]">Ebene {l} · Ast {k + 1}</span>
                        {config.mode === 'Flexibel (Individuell)' && l < config.max_depth && (
                          <span className="text-[10px] text-muted font-mono bg-panel px-1.5 py-0.5 rounded border border-line">
                            ID: {childId}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-muted">Knoten-Text</Label>
                          <div className="flex gap-1">
                            <Input
                              value={nodeCfg.label}
                              onChange={e => updateNode(childId, 'label', e.target.value)}
                              placeholder={defaultLbl}
                              className="bg-panel/50 border-line/50 h-9 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => updateNode(childId, 'labelHidden', !labelHidden)}
                              aria-label={labelToggleText}
                              title={labelToggleText}
                              className={`shrink-0 h-9 px-1.5 rounded-lg transition-all border ${labelHidden ? 'text-primary bg-primary/10 border-primary/20' : 'text-ghost border-transparent hover:text-primary hover:bg-primary/10 hover:border-primary/20'}`}
                            >
                              {labelHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              onClick={() => fillAllNodesWithBranchIndex(k, 'label', nodeCfg.label)}
                              title={`Text auf alle Ast ${k + 1} in allen Ebenen übertragen`}
                              className="shrink-0 h-9 px-1.5 text-ghost hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20"
                            >
                              <CopyPlus size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-muted">{config.use_numeric_probs ? 'P (0-1)' : 'P (LaTeX)'}</Label>
                          <div className="flex gap-1">
                            {config.use_numeric_probs ? (
                              <NumberInput step="0.01" min="0" max="1"
                                value={nodeCfg.prob_value ?? (1 / numKids).toFixed(4)}
                                onChange={e => updateNode(childId, 'prob_value', parseFloat(e.target.value))}
                                className="bg-panel/50 border-line/50 h-9 text-sm"
                              />
                            ) : (
                              <Input
                                value={nodeCfg.edge_label}
                                onChange={e => updateNode(childId, 'edge_label', e.target.value)}
                                placeholder={`1/${numKids}`}
                                className="bg-panel/50 border-line/50 h-9 text-sm"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => updateNode(childId, 'edgeLabelHidden', !edgeLabelHidden)}
                              aria-label={edgeLabelToggleText}
                              title={edgeLabelToggleText}
                              className={`shrink-0 h-9 px-1.5 rounded-lg transition-all border ${edgeLabelHidden ? 'text-primary bg-primary/10 border-primary/20' : 'text-ghost border-transparent hover:text-primary hover:bg-primary/10 hover:border-primary/20'}`}
                            >
                              {edgeLabelHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              onClick={() => fillAllNodesWithBranchIndex(k, config.use_numeric_probs ? 'prob_value' : 'edge_label', config.use_numeric_probs ? nodeCfg.prob_value : nodeCfg.edge_label)}
                              title={`P auf alle Ast ${k + 1} in allen Ebenen übertragen`}
                              className="shrink-0 h-9 px-1.5 text-ghost hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20"
                            >
                              <CopyPlus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {showIndivStyles && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line/30">
                          <div><Label className="text-[10px] uppercase text-muted">Node-Stil</Label><Input value={nodeCfg.node_style || ''} onChange={e => updateNode(childId, 'node_style', e.target.value)} placeholder="fill=red!20" className="text-[10px] h-7 px-2" /></div>
                          <div><Label className="text-[10px] uppercase text-muted">Edge-Stil</Label><Input value={nodeCfg.edge_style || ''} onChange={e => updateNode(childId, 'edge_style', e.target.value)} placeholder="text=blue" className="text-[10px] h-7 px-2" /></div>
                        </div>
                      )}

                      {config.mode === 'Flexibel (Individuell)' && l < config.max_depth && (
                        <div className="pt-2 border-t border-line/30 flex items-center justify-between gap-3">
                          <Label className="text-[10px] uppercase text-muted whitespace-nowrap">Äste darunter</Label>
                          <div className="w-20">
                            <NumberInput min={0} max={10}
                              value={nodeCfg.num_children}
                              onChange={e => updateNode(childId, 'num_children', parseInt(e.target.value))}
                              className="bg-panel/50 border-line/50 h-7 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      }

      if (levelInputs.length > 0) {
        result.push(
          <Collapsible
            key={`level-${l}`}
            title={`Ebene ${l}`}
            defaultOpen={l <= 2}
            className="mb-4"
          >
            <div className="pt-4 space-y-4">
              {levelInputs}
            </div>
          </Collapsible>
        )
      }
      currentLevelNodes = nextLevelNodes
    }
    return result
  }

  const allPaths = getAllPaths(config, 'root', 0)
  const filteredPaths = allPaths.filter(path => {
    if (!resultSearch) return true
    const pathStr = path.map(pid => pid === 'root' ? config.root_node.label : (config.nodes[pid]?.label || pid)).join(' ')
    const leafId = path[path.length - 1]
    const resText = config.results[leafId] || ''
    return pathStr.toLowerCase().includes(resultSearch.toLowerCase()) || resText.toLowerCase().includes(resultSearch.toLowerCase())
  })

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Sub-Navigation for Inhalt */}
      <div className="flex p-1 bg-raised rounded-xl border border-line shrink-0">
        {[
          { id: 'knoten', label: 'Knoten & Äste', icon: <GitGraph size={14} /> },
          { id: 'ergebnisse', label: 'Ergebnis-Labels', icon: <Star size={14} /> },
          { id: 'stufen', label: 'Stufen-Labels', icon: <Layers size={14} /> },
          { id: 'tabelle', label: 'Pfad-Tabelle', icon: <Table size={14} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setInhaltTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-all ${inhaltTab === t.id ? 'bg-panel text-primary shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink hover:bg-overlay/50'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
        {inhaltTab === 'knoten' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-raised/30 rounded-2xl p-5 border border-line space-y-4">
              <div className="flex items-center justify-between">
                <SecHead>Wurzel (Start)</SecHead>
                <div className="flex items-center justify-end gap-3 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => setAllNodeLabelsHidden(false)}
                      className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted hover:text-ink bg-panel/50 hover:bg-overlay border border-line rounded-lg transition-all"
                      title="Alle Nodes anzeigen"
                    >
                      <Eye size={12} />
                      Alle Nodes anzeigen
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllNodeLabelsHidden(true)}
                      className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted hover:text-ink bg-panel/50 hover:bg-overlay border border-line rounded-lg transition-all"
                      title="Alle Nodes ausblenden"
                    >
                      <EyeOff size={12} />
                      Alle Nodes ausblenden
                    </button>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => setAllProbabilityLabelsHidden(false)}
                      className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted hover:text-ink bg-panel/50 hover:bg-overlay border border-line rounded-lg transition-all"
                      title="Alle Wahrscheinlichkeiten anzeigen"
                    >
                      <Eye size={12} />
                      Alle Wahrscheinlichkeiten anzeigen
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllProbabilityLabelsHidden(true)}
                      className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted hover:text-ink bg-panel/50 hover:bg-overlay border border-line rounded-lg transition-all"
                      title="Alle Wahrscheinlichkeiten ausblenden"
                    >
                      <EyeOff size={12} />
                      Alle Wahrscheinlichkeiten ausblenden
                    </button>
                  </div>
                  <Chk checked={autoComplement} onChange={setAutoComplement} label="Auto-1-p" help="Bei 2 Ästen: füllt den Komplementwert (1−p) im Geschwisterast automatisch aus" />
                  <Chk checked={showIndivStyles} onChange={setShowIndivStyles} label="Indiv. Styles" />
                  <Chk checked={config.use_numeric_probs} onChange={v => updateConfig('use_numeric_probs', v)} label="Numerisch" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted">Start-Knoten Text</Label>
                  <div className="flex gap-1">
                    <Input value={config.root_node.label} onChange={e => updateConfig('root_node', { ...config.root_node, label: e.target.value })} className="h-9" />
                    <button
                      type="button"
                      onClick={() => updateConfig('root_node', { ...config.root_node, labelHidden: !(config.root_node.labelHidden ?? false) })}
                      aria-label={(config.root_node.labelHidden ?? false) ? 'Beschriftung anzeigen' : 'Beschriftung ausblenden'}
                      title={(config.root_node.labelHidden ?? false) ? 'Beschriftung anzeigen' : 'Beschriftung ausblenden'}
                      className={`shrink-0 h-9 px-2 rounded-lg transition-all border ${(config.root_node.labelHidden ?? false) ? 'text-primary bg-primary/10 border-primary/20' : 'text-ghost border-transparent hover:text-primary hover:bg-primary/10 hover:border-primary/20'}`}
                    >
                      {(config.root_node.labelHidden ?? false) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                {config.mode === 'Flexibel (Individuell)' && (
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted">Äste ab Wurzel</Label>
                    <NumberInput min={1} max={10} value={config.root_node.num_children} onChange={e => updateConfig('root_node', { ...config.root_node, num_children: parseInt(e.target.value) })} className="h-9" />
                  </div>
                )}
              </div>
            </div>

            {renderNodeInputs()}
          </div>
        )}

        {inhaltTab === 'stufen' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between bg-raised/30 p-4 rounded-xl border border-line">
              <div className="space-y-0.5">
                <SecHead>Stufen-Beschriftungen</SecHead>
                <p className="text-[10px] text-muted">Beschrifte die Ebenen deines Baumes oberhalb oder unterhalb.</p>
              </div>
              <Chk checked={config.level_labels.enabled} onChange={v => updateConfig('level_labels', { ...config.level_labels, enabled: v })} label="Aktivieren" />
            </div>

            {config.level_labels.enabled && (
              <div className="space-y-4 bg-raised/30 rounded-2xl p-5 border border-line">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted">Abstand (cm)</Label>
                    <NumberInput step="0.5" value={config.level_labels.offset} onChange={e => updateConfig('level_labels', { ...config.level_labels, offset: parseFloat(e.target.value) })} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted">TikZ Stil</Label>
                    <Input value={config.level_labels.style} onChange={e => updateConfig('level_labels', { ...config.level_labels, style: e.target.value })} className="h-9 font-mono text-[10px]" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted">Start (Ebene 0)</Label>
                    <Input value={config.level_labels.texts[0] || ''} onChange={e => updateLevelLabelText(0, e.target.value)} className="h-9" />
                  </div>
                  {Array.from({ length: config.max_depth }).map((_, i) => (
                    <div key={i + 1} className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted">Ebene {i + 1}</Label>
                      <Input value={config.level_labels.texts[i + 1] || ''} onChange={e => updateLevelLabelText(i + 1, e.target.value)} className="h-9" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {inhaltTab === 'ergebnisse' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-raised/30 p-5 rounded-2xl border border-line space-y-4">
              <SecHead>Ergebnisse & Pfade</SecHead>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted">TikZ Stil (Global)</Label>
                  <Input value={config.style_results ?? DEFAULT_CONFIG.style_results} onChange={e => updateConfig('style_results', e.target.value)} className="h-9 font-mono text-[10px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted">Abstand (cm)</Label>
                  <NumberInput step="0.1" value={config.style_result_dist} onChange={e => updateConfig('style_result_dist', parseFloat(e.target.value))} className="h-9" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <Chk checked={config.show_path_prob_display} onChange={v => updateConfig('show_path_prob_display', v)} label="Wahrsch. anzeigen" />
                <Chk checked={config.show_path_prob_in_result} onChange={v => updateConfig('show_path_prob_in_result', v)} label="Im Text anzeigen" />
              </div>
            </div>

            {/* Path Search */}
            <div className="relative">
              <Input
                value={resultSearch}
                onChange={e => setResultSearch(e.target.value)}
                placeholder="Nach Pfad oder Ergebnis suchen..."
                className="pl-9 bg-raised/20 border-line/50 focus:bg-raised/40 transition-all rounded-xl"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <GitGraph size={14} />
              </div>
              {resultSearch && (
                <button onClick={() => setResultSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {filteredPaths.length > 0 ? filteredPaths.map((path) => {
                const leafId = path[path.length - 1]
                const pathStr = path.map((pid, i) => {
                  if (pid === 'root') return config.root_node.label
                  return config.nodes[pid]?.label || (i === 0 ? '' : `Ast ${parseInt(pid.split('_').pop()!) + 1}`)
                }).join(' → ')

                const hl = config.highlights[leafId] || { enabled: false, style: null }
                const effectiveHighlightStyle = hl.style ?? config.style.highlight_style_default ?? DEFAULT_CONFIG.style.highlight_style_default
                const pVal = calcPathProb(config, path)

                return (
                  <div key={leafId} className={`group border rounded-xl p-3 flex flex-col md:flex-row gap-3 items-center transition-all ${hl.enabled ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20 shadow-md shadow-primary/10' : 'bg-raised/20 border-line hover:border-rim'}`}>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] uppercase font-bold text-muted bg-panel px-1.5 rounded border border-line">Pfad {allPaths.indexOf(path) + 1}</span>
                        {config.show_path_prob_display && pVal !== null && (
                          <span className="text-[9px] font-mono text-primary font-bold">
                            P = {formatProb(pVal)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink truncate font-medium" title={pathStr}>{pathStr}</p>
                    </div>
                    {hl.enabled && (
                      <Input
                        className="w-full md:w-[28rem] text-[10px] h-8 font-mono shrink-0"
                        value={effectiveHighlightStyle}
                        onChange={e => updateHighlight(leafId, 'style', e.target.value)}
                        title="Aktuell verwendeter Highlight-Stil"
                      />
                    )}
                    <div className="w-full md:w-48 flex gap-1">
                      <Input
                        value={config.results[leafId] || ''}
                        onChange={e => updateResult(leafId, e.target.value)}
                        placeholder="Ergebnis..."
                        className="h-8 text-xs bg-panel/50"
                      />
                      <button
                        onClick={() => {
                          const parts = leafId.split('_')
                          const k = parseInt(parts[parts.length - 1])
                          fillAllLeafResultsAtBranch(k, config.results[leafId] || '')
                        }}
                        title={`Ergebnis auf alle Ast-${parseInt(leafId.split('_').pop()!) + 1}-Pfade übertragen`}
                        className="shrink-0 h-8 px-1.5 text-ghost hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20"
                      >
                        <CopyPlus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateHighlight(leafId, 'enabled', !hl.enabled)}
                        className={`p-1.5 rounded-lg transition-all ${hl.enabled ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-panel text-ghost border border-line hover:border-rim'}`}
                        title="Hervorheben"
                      >
                        <Star size={14} fill={hl.enabled ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                )
              }) : (
                <div className="py-12 flex flex-col items-center justify-center text-muted bg-raised/10 rounded-2xl border border-dashed border-line">
                  <Info size={24} className="mb-2 opacity-20" />
                  <p className="text-sm">Keine Pfade gefunden.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {inhaltTab === 'tabelle' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <BaumPfadTabelle config={config} />
          </div>
        )}
      </div>
    </div>
  )
}
