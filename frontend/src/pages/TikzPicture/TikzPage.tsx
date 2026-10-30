// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useMemo } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateTikzPicture, compileLatex } from '../../api/client'
import { Input, Label, Switch, FontSelector } from '../../components/ui'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { CodeEditor } from '../../components/CodeEditor'
import { Settings, Folders, Code } from 'lucide-react'
import { DEFAULT_CONFIG } from './constantsTikz'
import { TikzHeader } from './components/TikzHeader'
import { TikzPreview } from './components/TikzPreview'
import { parseLatexLog } from '../../utils/parseLatexLog'
import type { TikzConfig } from './typesTikz'

const TikzPage = () => {
  const [config, setConfig] = useLocalStorage<TikzConfig>('ks-tikzpicture', DEFAULT_CONFIG)
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
      const gen = await generateTikzPicture(config)
      setLatexCode(gen.latex)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  const updateConfig = (key: keyof TikzConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  // TikZ code sits one line below \begin{document} (\begin{tikzpicture} is in between)
  const errorAnnotations = useMemo(
    () => parseLatexLog(compileData?.log ?? '', latexCode ?? '', 1),
    [compileData, latexCode],
  )

  const tabs = [
    { id: 'snippet', label: 'TikZ-Code', icon: <Code size={16} /> },
    { id: 'optionen', label: 'Optionen', icon: <Settings size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <TikzHeader
        setConfig={setConfig}
        isCompiling={isCompiling}
        onCompile={handleCompile}
        latexCode={latexCode}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        {/* Left Side: Editor */}
        <div className="w-[1000px] flex flex-col bg-panel border border-line rounded-2xl overflow-hidden shadow-2xl">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="snippet" activeTab={activeTab}>
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex-1 min-h-[400px]">
                  <Label>Inhalt der tikzpicture-Umgebung</Label>
                  <CodeEditor
                    value={config.code}
                    onChange={v => updateConfig('code', v)}
                    height="500px"
                    annotations={errorAnnotations}
                  />
                </div>
              </div>
            </TabContent>

            <TabContent id="optionen" activeTab={activeTab}>
              <div className="space-y-6">
                <div>
                  <Label>Umgebungs-Optionen (\begin{"{tikzpicture}"} […])</Label>
                  <Input
                    value={config.options}
                    onChange={e => updateConfig('options', e.target.value)}
                    placeholder="line join=round"
                  />
                  <p className="mt-2 text-xs text-ghost">
                    Beispiel für 3D: x={"{(-0.5cm,-0.5cm)}"}, y={"{(1cm,0cm)}"}, z={"{(0cm,1cm)}"}
                  </p>
                </div>
                <hr className="border-line" />
                <div className="space-y-4">
                  <Switch
                    label="Alle Pakete laden"
                    description="Lädt Standardpakete und TikZ-Libraries."
                    checked={config.pakete_laden}
                    onChange={(v: boolean) => updateConfig('pakete_laden', v)}
                  />
                  <Switch
                    label="Alle Commands laden"
                    description="Lädt benutzerdefinierte Makros."
                    checked={config.command_laden}
                    onChange={(v: boolean) => updateConfig('command_laden', v)}
                  />
                  <FontSelector value={config.font_family} onChange={v => updateConfig('font_family', v)} />
                </div>
              </div>
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="tikz"
                currentConfig={config}
                onLoad={(loaded) => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        {/* Right Side: Preview */}
        <TikzPreview
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

export default TikzPage
