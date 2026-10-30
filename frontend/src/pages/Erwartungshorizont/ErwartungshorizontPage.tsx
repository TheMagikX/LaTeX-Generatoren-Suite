// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateErwartungshorizont, compileLatex } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { Code, Settings, Folders } from 'lucide-react'

import { DEFAULT_CONFIG } from './constantsErwartungshorizont'
import type { ErwartungshorizontConfig } from './typesErwartungshorizont'

import ErwartungshorizontHeader from './components/ErwartungshorizontHeader'
import ErwartungshorizontPreview from './components/ErwartungshorizontPreview'
import ErwartungshorizontTabSnippet from './components/ErwartungshorizontTabSnippet'
import ErwartungshorizontTabDocument from './components/ErwartungshorizontTabDocument'

const ErwartungshorizontPage = () => {
  const [config, setConfig] = useLocalStorage<ErwartungshorizontConfig>(
    'ks-erwartungshorizont',
    DEFAULT_CONFIG
  )
  const [activeTab, setActiveTab] = useState('snippet')
  const [previewDpi, setPreviewDpi] = useState(600)

  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<{
    ok: boolean
    png_base64?: string
    pdf_base64?: string
    svg_base64?: string
    pages_png_base64?: string[]
    pages_svg_base64?: string[]
    pages_pdf_base64?: string[]
    log?: string
  } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateErwartungshorizont(config)
      setLatexCode(gen.latex)
      // allPages=true activates multi-page rendering for individual subtask images
      const result = await compileLatex(gen.latex, previewDpi, true)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  // Ctrl + Enter shortcut to compile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCompile()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config, previewDpi])

  const updateConfig = (key: keyof ErwartungshorizontConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const tabs = [
    { id: 'snippet', label: 'Lösungsschritte', icon: <Code size={16} /> },
    { id: 'dokument', label: 'Dokument', icon: <Settings size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <ErwartungshorizontHeader
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
              <ErwartungshorizontTabSnippet
                config={config}
                updateConfig={updateConfig}
                compileLog={compileData?.log ?? null}
                latexCode={latexCode}
              />
            </TabContent>

            <TabContent id="dokument" activeTab={activeTab}>
              <ErwartungshorizontTabDocument config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="erwartungshorizont"
                currentConfig={config}
                onLoad={(loaded) => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        {/* Right Side: Preview */}
        <ErwartungshorizontPreview
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

export default ErwartungshorizontPage
