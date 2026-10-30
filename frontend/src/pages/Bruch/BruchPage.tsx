// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateBruch, compileLatex } from '../../api/client'
import { Accordion, FontSelector } from '../../components/ui'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { Settings2 } from 'lucide-react'

import { DEFAULT_CONFIG } from './constantsBruch'
import type { BruchConfig, CompileResult } from './typesBruch'
import { getBruchTabs } from './utilsBruch'

import { BruchHeader } from './components/BruchHeader'
import { BruchPreview } from './components/BruchPreview'
import { BruchTabBasis } from './components/BruchTabBasis'
import { BruchTabForm } from './components/BruchTabForm'
import { BruchTabErweitern } from './components/BruchTabErweitern'

export default function BruchPage() {
  const [config, setConfig] = useLocalStorage<BruchConfig>('ks-bruch', DEFAULT_CONFIG)
  const [dpi, setDpi] = useState(600)
  const [activeTab, setActiveTab] = useState('bruch')

  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [mainPreview, setMainPreview] = useState<CompileResult | null>(null)
  const [erweiternPreview, setErweiternPreview] = useState<CompileResult | null>(null)
  const [kuerzenPreview, setKuerzenPreview] = useState<CompileResult | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateBruch(config)
      setLatexCode(gen.latex)
      const main = await compileLatex(gen.latex, dpi)
      setMainPreview(main)
      if (gen.erweitern_latex && config.show_erweitern) {
        const erw = await compileLatex(gen.erweitern_latex, dpi)
        setErweiternPreview(erw)
      }
      if (gen.kuerzen_latex && config.show_kuerzen) {
        const ku = await compileLatex(gen.kuerzen_latex, dpi)
        setKuerzenPreview(ku)
      }
    } finally {
      setIsCompiling(false)
    }
  }

  const updateConfig = (patch: Partial<BruchConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch }
      return next
    })
  }

  const tabs = getBruchTabs()

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <BruchHeader
        onCompile={handleCompile}
        isCompiling={isCompiling}
        setConfig={setConfig}
        currentConfig={config}
        onApplyConfig={setConfig}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        {/* Left Panel: Settings */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-2">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="bruch" activeTab={activeTab}>
              <BruchTabBasis config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="form" activeTab={activeTab}>
              <BruchTabForm config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="erweitern" activeTab={activeTab}>
              <BruchTabErweitern config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="bruch"
                currentConfig={config}
                onLoad={(loaded) => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>

          <div className="mt-8 space-y-4">
            <Accordion title="Erweiterte LaTeX-Optionen" icon={<Settings2 size={18} />}>
              <FontSelector
                value={config.font_family}
                onChange={(v: string) => updateConfig({ font_family: v })}
              />
            </Accordion>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <BruchPreview
          config={config}
          isCompiling={isCompiling}
          latexCode={latexCode}
          mainPreview={mainPreview}
          erweiternPreview={erweiternPreview}
          kuerzenPreview={kuerzenPreview}
          dpi={dpi}
          setDpi={setDpi}
        />
      </div>
    </div>
  )
}
