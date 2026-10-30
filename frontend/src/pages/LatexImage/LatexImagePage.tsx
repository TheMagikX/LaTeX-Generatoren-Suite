// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateLatexImage, compileLatex } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { Code, Settings, Folders } from 'lucide-react'

import { DEFAULT_CONFIG } from './constantsLatexImage'
import type { LatexImageConfig } from './typesLatexImage'

import LatexImageHeader from './components/LatexImageHeader'
import LatexImagePreview from './components/LatexImagePreview'
import LatexImageTabSnippet from './components/LatexImageTabSnippet'
import LatexImageTabDocument from './components/LatexImageTabDocument'

const LatexImagePage = () => {
  const [config, setConfig] = useLocalStorage<LatexImageConfig>('ks-lateximage', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('snippet')
  const [previewDpi, setPreviewDpi] = useState(600)

  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<{
    ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string
  } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateLatexImage(config)
      setLatexCode(gen.latex)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  const updateConfig = (key: keyof LatexImageConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const tabs = [
    { id: 'snippet', label: 'Snippet', icon: <Code size={16} /> },
    { id: 'dokument', label: 'Dokument', icon: <Settings size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <LatexImageHeader
        latexCode={latexCode}
        isCompiling={isCompiling}
        onCompile={handleCompile}
        onReset={() => setConfig({ ...DEFAULT_CONFIG })}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        {/* Left Side: Editor */}
        <div className="w-[1000px] flex flex-col bg-panel border border-line rounded-2xl overflow-hidden shadow-2xl">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="snippet" activeTab={activeTab}>
              <LatexImageTabSnippet
                config={config}
                updateConfig={updateConfig}
                compileLog={compileData?.log ?? null}
                latexCode={latexCode}
              />
            </TabContent>

            <TabContent id="dokument" activeTab={activeTab}>
              <LatexImageTabDocument config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="latex"
                currentConfig={config}
                onLoad={(loaded) => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        {/* Right Side: Preview */}
        <LatexImagePreview
          latexCode={latexCode}
          compileData={compileData}
          isCompiling={isCompiling}
          previewDpi={previewDpi}
          setPreviewDpi={setPreviewDpi}
        />
      </div>
    </div>
  )
}

export default LatexImagePage
