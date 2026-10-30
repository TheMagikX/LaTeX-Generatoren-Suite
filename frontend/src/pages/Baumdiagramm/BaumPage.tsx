// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { s } from '../../styles/tokens'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateBaumdiagramm, compileLatex } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import {
  GitGraph, Sliders, Type, Folders, Cpu
} from 'lucide-react'

import type { BaumConfigUpdater, BaumHighlightUpdater, BaumNodeUpdater, BaumStyleUpdater, Config, BaumNodeConfig } from './typesBaum'
import { DEFAULT_CONFIG } from './constantsBaum'
import { buildBernoulliNodes, buildBinomialNodes, getAllNodesWithBranchIndex, getAllPaths, getNumChildren, computeLatexComplement } from './utilsBaum'
import { BaumHeader } from './components/BaumHeader'
import { BaumPreview } from './components/BaumPreview'
import { BaumTabStruktur } from './components/BaumTabStruktur'
import { BaumTabInhalt } from './components/BaumTabInhalt'
import { BaumTabStil } from './components/BaumTabStil'
import { BaumTabErweitert } from './components/BaumTabErweitert'

const BaumPage = () => {
  const [config, setConfig] = useLocalStorage<Config>('ks-baumdiagramm', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('struktur')
  const [previewDpi, setPreviewDpi] = useState(300)
  const [showIndivStyles, setShowIndivStyles] = useState(false)

  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<{
    ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string
  } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [autoComplement, setAutoComplement] = useState(false)

  // Wizard state
  const [bernoulliN, setBernoulliN] = useState(2)
  const [binomialN, setBinomialN] = useState(2)
  const [binomialP, setBinomialP] = useState(0.5)
  const [binomialAnnotate, setBinomialAnnotate] = useState(true)

  const applyBernoulliPreset = (n: number) => {
    const { nodes, results } = buildBernoulliNodes(n)
    setConfig({ ...DEFAULT_CONFIG, mode: 'Symmetrisch (Standard)', max_depth: n, branches_global: 2, nodes, results })
  }

  const applyBinomialPreset = (n: number, p: number, annotate: boolean) => {
    const { nodes, results } = buildBinomialNodes(n, p, annotate)
    setConfig({ ...DEFAULT_CONFIG, mode: 'Symmetrisch (Standard)', max_depth: n, branches_global: 2, use_numeric_probs: true, nodes, results })
  }

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateBaumdiagramm(config)
      setLatexCode(gen.latex)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  const updateConfig: BaumConfigUpdater = (key, value) => setConfig(prev => ({ ...prev, [key]: value }))

  const updateStyle: BaumStyleUpdater = (key, value) =>
    setConfig(prev => ({ ...prev, style: { ...prev.style, [key]: value } }))

  const defaultNode: BaumNodeConfig = {
    label: '',
    labelHidden: false,
    edge_label: '',
    edgeLabelHidden: false,
    prob_value: null,
    node_style: null,
    edge_style: null,
    num_children: 2
  }

  const updateNode: BaumNodeUpdater = (nodeId, key, value) => {
    if (nodeId === 'root') {
      setConfig(prev => ({ ...prev, root_node: { ...prev.root_node, [key]: value } }))
      return
    }
    setConfig(prev => {
      const updatedNodes: typeof prev.nodes = {
        ...prev.nodes,
        [nodeId]: { ...(prev.nodes[nodeId] || defaultNode), [key]: value }
      }

      if (autoComplement && (key === 'prob_value' || key === 'edge_label')) {
        const parts = nodeId.split('_')
        const k = parseInt(parts[parts.length - 1])
        if (!isNaN(k)) {
          const parentId = parts.length === 1 ? 'root' : parts.slice(0, -1).join('_')
          const parentLevel = parts.length - 1
          const numSibs = getNumChildren(prev, parentId, parentLevel)
          if (numSibs === 2) {
            const siblingId = parts.length === 1
              ? `${1 - k}`
              : [...parts.slice(0, -1), 1 - k].join('_')
            if (key === 'prob_value' && typeof value === 'number' && !isNaN(value)) {
              const sibProb = Math.round(Math.max(0, Math.min(1, 1 - value)) * 1e4) / 1e4
              updatedNodes[siblingId] = { ...(updatedNodes[siblingId] || defaultNode), prob_value: sibProb }
            } else if (key === 'edge_label' && typeof value === 'string') {
              const complement = computeLatexComplement(value)
              if (complement !== null) {
                updatedNodes[siblingId] = { ...(updatedNodes[siblingId] || defaultNode), edge_label: complement }
              }
            }
          }
        }
      }

      return { ...prev, nodes: updatedNodes }
    })
  }

  const updateLevelLabelText = (level: number, text: string) => {
    setConfig(prev => ({
      ...prev,
      level_labels: {
        ...prev.level_labels,
        texts: { ...prev.level_labels.texts, [level]: text }
      }
    }))
  }

  const updateResult = (leafId: string, text: string) => {
    setConfig(prev => ({ ...prev, results: { ...prev.results, [leafId]: text } }))
  }

  const updateHighlight: BaumHighlightUpdater = (leafId, key, value) => {
    setConfig(prev => ({
      ...prev,
      highlights: {
        ...prev.highlights,
        [leafId]: { ...(prev.highlights[leafId] || { enabled: false, style: null }), [key]: value }
      }
    }))
  }

  const setAllNodeLabelsHidden = (labelHidden: boolean) => {
    setConfig(prev => {
      const nodeIds = new Set<string>()
      for (const path of getAllPaths(prev, 'root', 0)) {
        for (const nodeId of path) {
          if (nodeId !== 'root') nodeIds.add(nodeId)
        }
      }

      const newNodes = { ...prev.nodes }
      for (const id of nodeIds) {
        newNodes[id] = {
          ...(newNodes[id] || defaultNode),
          labelHidden
        }
      }

      return {
        ...prev,
        root_node: { ...prev.root_node, labelHidden },
        nodes: newNodes
      }
    })
  }

  const setAllProbabilityLabelsHidden = (edgeLabelHidden: boolean) => {
    setConfig(prev => {
      const nodeIds = new Set<string>()
      for (const path of getAllPaths(prev, 'root', 0)) {
        for (const nodeId of path) {
          if (nodeId !== 'root') nodeIds.add(nodeId)
        }
      }

      const newNodes = { ...prev.nodes }
      for (const id of nodeIds) {
        newNodes[id] = {
          ...(newNodes[id] || defaultNode),
          edgeLabelHidden
        }
      }

      return { ...prev, nodes: newNodes }
    })
  }

  const fillAllNodesWithBranchIndex = (branchK: number, field: keyof BaumNodeConfig, value: unknown) => {
    setConfig(prev => {
      const nodeIds = getAllNodesWithBranchIndex(prev, branchK)
      const newNodes = { ...prev.nodes }
      for (const id of nodeIds) {
        newNodes[id] = {
          ...(newNodes[id] || defaultNode),
          [field]: value
        }
      }
      return { ...prev, nodes: newNodes }
    })
  }

  const fillAllLeafResultsAtBranch = (branchK: number, value: string) => {
    setConfig(prev => {
      const paths = getAllPaths(prev, 'root', 0)
      const newResults = { ...prev.results }
      for (const path of paths) {
        const leafId = path[path.length - 1]
        const parts = leafId.split('_')
        if (parseInt(parts[parts.length - 1]) === branchK) {
          newResults[leafId] = value
        }
      }
      return { ...prev, results: newResults }
    })
  }

  const tabs = [
    { id: 'struktur', label: 'Struktur', icon: <GitGraph size={16} /> },
    { id: 'inhalt', label: 'Inhalt', icon: <Type size={16} /> },
    { id: 'stil', label: 'Stil', icon: <Sliders size={16} /> },
    { id: 'erweitert', label: 'Erweitert', icon: <Cpu size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  const copyLatexToClipboard = async () => {
    if (!latexCode) return
    await navigator.clipboard.writeText(latexCode)
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <BaumHeader
        latexCode={latexCode}
        isCompiling={isCompiling}
        onCompile={handleCompile}
        onReset={() => setConfig({ ...DEFAULT_CONFIG })}
        onApplyConfig={setConfig}
        currentConfig={config}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        <div className={s.editorPanel}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="struktur" activeTab={activeTab}>
              <BaumTabStruktur
                config={config}
                updateConfig={updateConfig}
                bernoulliN={bernoulliN}
                setBernoulliN={setBernoulliN}
                binomialN={binomialN}
                setBinomialN={setBinomialN}
                binomialP={binomialP}
                setBinomialP={setBinomialP}
                binomialAnnotate={binomialAnnotate}
                setBinomialAnnotate={setBinomialAnnotate}
                onApplyBernoulli={applyBernoulliPreset}
                onApplyBinomial={applyBinomialPreset}
              />
            </TabContent>

            <TabContent id="inhalt" activeTab={activeTab}>
              <BaumTabInhalt
                config={config}
                updateConfig={updateConfig}
                updateNode={updateNode}
                updateLevelLabelText={updateLevelLabelText}
                updateResult={updateResult}
                updateHighlight={updateHighlight}
                fillAllNodesWithBranchIndex={fillAllNodesWithBranchIndex}
                fillAllLeafResultsAtBranch={fillAllLeafResultsAtBranch}
                setAllNodeLabelsHidden={setAllNodeLabelsHidden}
                setAllProbabilityLabelsHidden={setAllProbabilityLabelsHidden}
                showIndivStyles={showIndivStyles}
                setShowIndivStyles={setShowIndivStyles}
                autoComplement={autoComplement}
                setAutoComplement={setAutoComplement}
              />
            </TabContent>

            <TabContent id="stil" activeTab={activeTab}>
              <BaumTabStil
                config={config}
                updateStyle={updateStyle}
                setConfig={setConfig}
              />
            </TabContent>

            <TabContent id="erweitert" activeTab={activeTab}>
              <BaumTabErweitert
                config={config}
                updateConfig={updateConfig}
              />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="baum"
                currentConfig={config}
                onLoad={(loaded) => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        <BaumPreview
          latexCode={latexCode}
          compileData={compileData}
          isCompiling={isCompiling}
          previewDpi={previewDpi}
          setPreviewDpi={setPreviewDpi}
          onCopyLatex={copyLatexToClipboard}
        />
      </div>
    </div>
  )
}

export default BaumPage
