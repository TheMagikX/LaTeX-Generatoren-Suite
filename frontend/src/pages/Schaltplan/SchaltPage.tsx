// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateSchaltplan, compileLatex } from '../../api/client'
import { Card } from '../../components/ui'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { CircuitBoard, MapPin, Cpu, Palette, Settings } from 'lucide-react'

import type { SchaltplanConfig } from './typesSchalt'
import { DEFAULT_CONFIG } from './constantsSchalt'
import { SchaltHeader } from './components/SchaltHeader'
import { SchaltPreview } from './components/SchaltPreview'
import { SchaltCanvasEditor } from './components/SchaltCanvasEditor'
import { SchaltTabNodes } from './components/SchaltTabNodes'
import { SchaltTabComponents } from './components/SchaltTabComponents'
import { SchaltTabStyle } from './components/SchaltTabStyle'

export default function SchaltPage() {
  const [config, setConfig] = useLocalStorage<SchaltplanConfig>('ks-schaltplan', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('editor')
  const [dpi, setDpi] = useState(600)

  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<{ ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateSchaltplan(config)
      setLatexCode(gen.latex)
      const result = await compileLatex(gen.latex, dpi)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <SchaltHeader
        onReset={() => setConfig(DEFAULT_CONFIG)}
        onCompile={handleCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        <div className="w-[750px] flex flex-col gap-4 overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <Tabs
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: 'editor', label: 'Editor', icon: <CircuitBoard size={16} /> },
                { id: 'nodes', label: 'Knoten', icon: <MapPin size={16} /> },
                { id: 'comps', label: 'Bauteile', icon: <Cpu size={16} /> },
                { id: 'style', label: 'Stil', icon: <Palette size={16} /> },
                { id: 'presets', label: 'Presets', icon: <Settings size={16} /> },
              ]}
            >
              <TabContent id="editor" activeTab={activeTab}>
                <SchaltCanvasEditor config={config} setConfig={setConfig} />
              </TabContent>

              <TabContent id="nodes" activeTab={activeTab}>
                <SchaltTabNodes config={config} setConfig={setConfig} />
              </TabContent>

              <TabContent id="comps" activeTab={activeTab}>
                <SchaltTabComponents config={config} setConfig={setConfig} />
              </TabContent>

              <TabContent id="style" activeTab={activeTab}>
                <SchaltTabStyle config={config} setConfig={setConfig} />
              </TabContent>

              <TabContent id="presets" activeTab={activeTab}>
                <PresetManager
                  generator="schaltplan"
                  currentConfig={config}
                  onLoad={(c) => setConfig({ ...DEFAULT_CONFIG, ...c })}
                />
              </TabContent>
            </Tabs>
          </Card>
        </div>

        <SchaltPreview
          config={config}
          setConfig={setConfig}
          isCompiling={isCompiling}
          compileData={compileData}
          latexCode={latexCode}
          dpi={dpi}
          setDpi={setDpi}
        />
      </div>
    </div>
  )
}
