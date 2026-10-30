// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { s } from '../../styles/tokens'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateKoordinatensystem, compileLatex } from '../../api/client'
import { TabContent, Tabs } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { Accordion } from '../../components/ui'
import { Zap, Settings, Sliders, Layers, Terminal, Folders } from 'lucide-react'

import type { Config } from './typesKoord'
import { DEFAULT_CONFIG } from './constantsKoord'
import { KoordHeader } from './components/KoordHeader'
import { KoordPreview } from './components/KoordPreview'
import { KoordTabQuick } from './components/KoordTabQuick'
import { KoordTabBasis } from './components/KoordTabBasis'
import { KoordTabAchsen } from './components/KoordTabAchsen'
import { KoordTabLayers } from './components/KoordTabLayers'

const KoordPage = () => {
  const [config, setConfig] = useLocalStorage<Config>('ks-koordinatensystem', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('quick')
  const [previewDpi, setPreviewDpi] = useState(300)
  const [plotSubTabs, setPlotSubTabs] = useState<Record<number, string>>({})
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})

  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<{ ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  // --- Handlers ---
  const toggleExpand = (key: string) => setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }))
  const isExpanded = (key: string) => expandedMap[key] ?? false
  const setAllExpanded = (prefix: string, count: number, value: boolean) =>
    setExpandedMap(prev => {
      const next = { ...prev }
      for (let i = 0; i < count; i++) next[`${prefix}-${i}`] = value
      return next
    })

  const updateConfig = (key: keyof Config, value: unknown) => setConfig(prev => ({ ...prev, [key]: value }))

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateKoordinatensystem(config)
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

  const tabs = [
    { id: 'quick', label: 'Schnellstart', icon: <Zap size={16} /> },
    { id: 'basis', label: 'Basis & System', icon: <Settings size={16} /> },
    { id: 'achsen', label: 'Achsen & Gitter', icon: <Sliders size={16} /> },
    { id: 'layers', label: 'Inhalte (Layers)', icon: <Layers size={16} /> },
    { id: 'erweitert', label: 'Erweitert', icon: <Terminal size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden" >
      <KoordHeader
        config={config}
        setConfig={setConfig}
        onCompile={handleCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        {/* Editor Panel */}
        <div className={s.editorPanel}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>

            <TabContent id="quick" activeTab={activeTab}>
              <KoordTabQuick config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="basis" activeTab={activeTab}>
              <KoordTabBasis config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="achsen" activeTab={activeTab}>
              <KoordTabAchsen config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="layers" activeTab={activeTab}>
              <KoordTabLayers
                config={config}
                updateConfig={updateConfig}
                isExpanded={isExpanded}
                toggleExpand={toggleExpand}
                setAllExpanded={setAllExpanded}
                plotSubTabs={plotSubTabs}
                setPlotSubTabs={setPlotSubTabs}
              />
            </TabContent>

            <TabContent id="erweitert" activeTab={activeTab}>
              <div className="space-y-6">
                <Accordion title="Manueller TikZ-Code" icon={<Terminal size={18} />} defaultOpen={config.manual_code.length > 0}>
                  <div className="space-y-3">
                    <p className="text-caption tracking-tight">
                      Eigene Befehle innerhalb der <code className="bg-raised px-1 rounded text-primary">axis</code>-Umgebung
                    </p>
                    <textarea
                      value={config.manual_code}
                      onChange={e => updateConfig('manual_code', e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 bg-canvas border border-line rounded-xl font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                      placeholder="% TikZ-Code hier einfügen..."
                    />
                  </div>
                </Accordion>
              </div>
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <div className="space-y-6">
                <PresetManager
                  generator="koord"
                  currentConfig={config}
                  onLoad={(loaded) => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
                />
              </div>
            </TabContent>

          </Tabs>
        </div>

        {/* Preview Panel */}
        <KoordPreview
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

export default KoordPage
