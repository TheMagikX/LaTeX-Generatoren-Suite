// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { s } from '../../styles/tokens'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateOptik, compileLatex } from '../../api/client'
import { Ruler, Folders, Settings, Sun, ScanEye, Microscope } from 'lucide-react'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'

import type { OptikConfig, ImageMetric, OptikSetter } from './typesOptik'
import { DEFAULT_CONFIG } from './constantsOptik'
import { SecHead } from './utilsOptik'

import { OptikHeader } from './components/OptikHeader'
import { OptikPreview } from './components/OptikPreview'
import { MetricsPanel } from './components/OptikMetrics'
import { OptikTabObjekte } from './components/OptikTabObjekte'
import { OptikTabLichtquellen } from './components/OptikTabLichtquellen'
import { OptikTabLinsen } from './components/OptikTabLinsen'
import { OptikTabDarstellung } from './components/OptikTabDarstellung'

const OptikPage = () => {
  const [config, setConfig] = useLocalStorage<OptikConfig>('ks-optik-v5', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('objekte')
  const [previewDpi, setPreviewDpi] = useState(300)

  const [optikData, setOptikData] = useState<{ latex: string; metrics: ImageMetric[] } | null>(null)
  const [compileData, setCompileData] = useState<{
    ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string
  } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateOptik(config)
      setOptikData(gen)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  const set: OptikSetter = (key, value) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const tabs = [
    { id: 'objekte',    label: 'Objekte',    icon: <ScanEye size={16} /> },
    { id: 'lichtquellen', label: 'Lichtquellen', icon: <Sun size={16} /> },
    { id: 'linsen',     label: 'Linsen',     icon: <Microscope size={16} /> },
    { id: 'darstellung',label: 'Darstellung',icon: <Settings size={16} /> },
    { id: 'ergebnis',   label: 'Ergebnis',   icon: <Ruler size={16} /> },
    { id: 'presets',    label: 'Presets',    icon: <Folders size={16} /> },
  ]

  const copyLatexToClipboard = async () => {
    if (!optikData?.latex) return
    await navigator.clipboard.writeText(optikData.latex)
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <OptikHeader 
        config={config} 
        setConfig={setConfig} 
        isCompiling={isCompiling} 
        handleCompile={handleCompile} 
        latexCode={optikData?.latex} 
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        <div className={s.editorPanel}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="objekte" activeTab={activeTab}>
              <OptikTabObjekte config={config} set={set} />
            </TabContent>

            <TabContent id="lichtquellen" activeTab={activeTab}>
              <OptikTabLichtquellen config={config} set={set} />
            </TabContent>

            <TabContent id="linsen" activeTab={activeTab}>
              <OptikTabLinsen config={config} set={set} />
            </TabContent>

            <TabContent id="darstellung" activeTab={activeTab}>
              <OptikTabDarstellung config={config} set={set} />
            </TabContent>

            <TabContent id="ergebnis" activeTab={activeTab}>
              <div className="space-y-4">
                <SecHead>Berechnete Bildwerte (1. Objekt)</SecHead>
                {optikData?.metrics && optikData.metrics.length > 0 ? (
                  <MetricsPanel metrics={optikData.metrics} />
                ) : (
                  <p className="text-sm text-ghost">
                    Bitte füge mindestens eine Linse im Tab „Linsen" hinzu.
                  </p>
                )}
              </div>
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="optik"
                currentConfig={config}
                onLoad={loaded => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        <OptikPreview 
          latexCode={optikData?.latex} 
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

export default OptikPage
