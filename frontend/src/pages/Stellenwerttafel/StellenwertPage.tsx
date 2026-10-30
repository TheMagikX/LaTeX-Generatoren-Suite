// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateStellenwerttafel, compileLatex } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { s } from '../../styles/tokens'
import { Grid, Settings, Palette, Folders, Hash } from 'lucide-react'

import { DEFAULT_CONFIG } from './constantsStellenwert'
import type { StellenwertConfig } from './typesStellenwert'

import { StellenwertHeader } from './components/StellenwertHeader'
import { StellenwertPreview } from './components/StellenwertPreview'
import { StellenwertTabSpalten } from './components/StellenwertTabSpalten'
import { StellenwertTabWerte } from './components/StellenwertTabWerte'
import { StellenwertTabDarstellung } from './components/StellenwertTabDarstellung'
import { StellenwertTabErweitert } from './components/StellenwertTabErweitert'

const StellenwertPage = () => {
  const [config, setConfig] = useLocalStorage<StellenwertConfig>('ks-stellenwerttafel-v2', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('spalten')
  const [previewDpi, setPreviewDpi] = useState(600)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  // ---- API calls -----------------------------------------------------------
  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<{
    ok: boolean; png_base64?: string; svg_base64?: string; pdf_base64?: string; log?: string
  } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateStellenwerttafel(config)
      setLatexCode(gen.latex)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  const copyLatexToClipboard = async () => {
    if (!latexCode) return
    await navigator.clipboard.writeText(latexCode)
  }

  const updateConfig = (key: keyof StellenwertConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  // ---- Tab definitions -----------------------------------------------------
  const tabs = [
    { id: 'spalten', label: 'Spalten', icon: <Grid size={16} /> },
    { id: 'werte', label: 'Werte', icon: <Hash size={16} /> },
    { id: 'darstellung', label: 'Darstellung', icon: <Palette size={16} /> },
    { id: 'erweitert', label: 'Erweitert', icon: <Settings size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <StellenwertHeader
        config={config}
        setConfig={setConfig}
        onCompile={handleCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        <div className={s.editorPanel}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="spalten" activeTab={activeTab}>
              <StellenwertTabSpalten
                config={config}
                updateConfig={updateConfig}
                draggedIdx={draggedIdx}
                setDraggedIdx={setDraggedIdx}
              />
            </TabContent>

            <TabContent id="werte" activeTab={activeTab}>
              <StellenwertTabWerte
                config={config}
                updateConfig={updateConfig}
              />
            </TabContent>

            <TabContent id="darstellung" activeTab={activeTab}>
              <StellenwertTabDarstellung
                config={config}
                updateConfig={updateConfig}
              />
            </TabContent>

            <TabContent id="erweitert" activeTab={activeTab}>
              <StellenwertTabErweitert
                config={config}
                updateConfig={updateConfig}
              />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="stellenwerttafel"
                currentConfig={config}
                onLoad={loaded => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        <StellenwertPreview
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

export default StellenwertPage
