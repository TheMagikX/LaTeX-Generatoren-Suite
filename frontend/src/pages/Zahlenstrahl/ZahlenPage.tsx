// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateZahlenstrahl, compileLatex } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { s } from '../../styles/tokens'
import {
  ArrowRight, Palette, Plus, Folders, Hash, Maximize2
} from 'lucide-react'

import type { ZahlenBatchSetter, ZahlenCollection, ZahlenItem, ZahlenSetter, ZahlenUpdateItem, ZahlenstrahlConfig } from './typesZahlen'
import { DEFAULT_CONFIG } from './constantsZahlen'
import { ZahlenHeader } from './components/ZahlenHeader'
import { ZahlenPreview } from './components/ZahlenPreview'
import { ZahlenTabAchse } from './components/ZahlenTabAchse'
import { ZahlenTabTicks } from './components/ZahlenTabTicks'
import { ZahlenTabElemente } from './components/ZahlenTabElemente'
import { ZahlenTabZoom } from './components/ZahlenTabZoom'
import { ZahlenTabFarben } from './components/ZahlenTabFarben'

const normalizeConfig = (raw: Partial<ZahlenstrahlConfig>): ZahlenstrahlConfig => {
  let width_cm = raw.width_cm
  if (width_cm == null && raw.x_scale != null) {
    const minV = raw.min_val ?? DEFAULT_CONFIG.min_val
    const maxV = raw.max_val ?? DEFAULT_CONFIG.max_val
    const span = Math.abs(maxV - minV) || 1
    width_cm = Number((span * raw.x_scale).toFixed(2))
  }
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    width_cm: width_cm ?? DEFAULT_CONFIG.width_cm,
  }
}

const ZahlenPage = () => {
  const [config, setConfig] = useLocalStorage<ZahlenstrahlConfig>('ks-zahlenstrahl', DEFAULT_CONFIG)

  // Ensure legacy localStorage configs without width_cm get normalized
  if (config.width_cm == null) {
    config.width_cm = DEFAULT_CONFIG.width_cm
  }

  const [activeTab, setActiveTab] = useState('achse')
  const [previewDpi, setPreviewDpi] = useState(600)

  // ---- API calls -----------------------------------------------------------
  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<{
    ok: boolean; png_base64?: string; svg_base64?: string; pdf_base64?: string; log?: string
  } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateZahlenstrahl(config)
      setLatexCode(gen.latex)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  // ---- State helpers -------------------------------------------------------
  const set: ZahlenSetter = (key, value) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const batchSet: ZahlenBatchSetter = (updates) =>
    setConfig(prev => ({ ...prev, ...updates }))

  const updateItem: ZahlenUpdateItem = (collection, idx, field, value) => {
    const next = [...config[collection]]
    next[idx] = { ...next[idx], [field]: value } as typeof next[number]
    setConfig(prev => ({ ...prev, [collection]: next }))
  }

  const addItem = (collection: ZahlenCollection) => {
    let newItem: ZahlenItem
    if (collection === 'points' || collection === 'zoom_points') newItem = { value: 0, type: 'kreuz', label: '', visible: true, color: '#1e293b', label_color: '#1e293b' }
    else if (collection === 'jumps') newItem = { start: 0, end: 1, label: '', style: 'arc', arrow: '->', visible: true, color: '#1e293b', label_color: '#1e293b' }
    else if (collection === 'intervals' || collection === 'zoom_intervals') newItem = { von: 0, bis: 1, color: '#2563eb', left_type: 'offen', right_type: 'offen', visible: true }
    else newItem = { value: 0, label: '', color: '#1e293b', label_color: '#1e293b', visible: true }
    setConfig(prev => ({ ...prev, [collection]: [...prev[collection], newItem] }))
  }

  const removeItem = (collection: ZahlenCollection, idx: number) => {
    setConfig(prev => ({ ...prev, [collection]: prev[collection].filter((_, i) => i !== idx) }))
  }

  const copyLatexToClipboard = async () => {
    if (!latexCode) return
    await navigator.clipboard.writeText(latexCode)
  }

  // ---- Tab definitions -----------------------------------------------------
  const tabs = [
    { id: 'achse', label: 'Achse', icon: <ArrowRight size={16} /> },
    { id: 'ticks', label: 'Ticks', icon: <Hash size={16} /> },
    { id: 'elemente', label: 'Elemente', icon: <Plus size={16} /> },
    { id: 'zoom', label: 'Zoom', icon: <Maximize2 size={16} /> },
    { id: 'farben', label: 'Farben', icon: <Palette size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <ZahlenHeader
        config={config}
        onReset={() => setConfig({ ...DEFAULT_CONFIG })}
        onCompile={handleCompile}
        onApplyConfig={setConfig}
        isCompiling={isCompiling}
        latexCode={latexCode}
      />

      {/* Body */}
      <div className="flex-1 flex gap-6 overflow-hidden pb-4">

        {/* ===== Left panel: settings tabs ===== */}
        <div className={s.editorPanel}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>

            <TabContent id="achse" activeTab={activeTab}>
              <ZahlenTabAchse config={config} set={set} />
            </TabContent>

            <TabContent id="ticks" activeTab={activeTab}>
              <ZahlenTabTicks config={config} set={set} batchSet={batchSet} />
            </TabContent>

            <TabContent id="elemente" activeTab={activeTab}>
              <ZahlenTabElemente
                config={config}
                set={set}
                addItem={addItem}
                removeItem={removeItem}
                updateItem={updateItem}
              />
            </TabContent>

            <TabContent id="zoom" activeTab={activeTab}>
              <ZahlenTabZoom
                config={config}
                set={set}
                addItem={addItem}
                removeItem={removeItem}
                updateItem={updateItem}
              />
            </TabContent>

            <TabContent id="farben" activeTab={activeTab}>
              <ZahlenTabFarben config={config} set={set} />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="zahlenstrahl"
                currentConfig={config}
                onLoad={loaded => setConfig(normalizeConfig(loaded))}
              />
            </TabContent>

          </Tabs>
        </div>

        {/* ===== Right panel: preview ===== */}
        <ZahlenPreview
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

export default ZahlenPage
