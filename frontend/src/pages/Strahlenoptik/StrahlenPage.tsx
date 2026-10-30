// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { Sun, Shield, Layers, Eye, Settings, Folders } from 'lucide-react'
import { s } from '../../styles/tokens'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateStrahlenoptik, compileLatex } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'

import { DEFAULT_CONFIG } from './constantsStrahlen'
import { LightZoneWarning } from './utilsStrahlen'
import type { StrahlenSetter, StrahlenoptikConfig } from './typesStrahlen'

import { StrahlenHeader } from './components/StrahlenHeader'
import { StrahlenPreview } from './components/StrahlenPreview'
import { StrahlenTabLicht } from './components/StrahlenTabLicht'
import { StrahlenTabHindernisse } from './components/StrahlenTabHindernisse'
import { StrahlenTabMedien } from './components/StrahlenTabMedien'
import { StrahlenTabSchatten } from './components/StrahlenTabSchatten'
import { StrahlenTabDarstellung } from './components/StrahlenTabDarstellung'

const StrahlenPage = () => {
  const [config, setConfig] = useLocalStorage<StrahlenoptikConfig>('ks-strahlenoptik', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('lichtquellen')
  const [previewDpi, setPreviewDpi] = useState(300)
  const [collapsedSources, setCollapsedSources] = useState<Set<number>>(new Set())
  const [collapsedBarriers, setCollapsedBarriers] = useState<Set<number>>(new Set())
  const [collapsedAreas, setCollapsedAreas] = useState<Set<number>>(new Set())
  
  // Drag and drop state for nodes
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragType, setDragType] = useState<string | null>(null)

  const toggleSource = (idx: number) =>
    setCollapsedSources(prev => {
      const s = new Set(prev)
      if (s.has(idx)) s.delete(idx)
      else s.add(idx)
      return s
    })
  const toggleBarrier = (bi: number) =>
    setCollapsedBarriers(prev => {
      const s = new Set(prev)
      if (s.has(bi)) s.delete(bi)
      else s.add(bi)
      return s
    })
  const toggleArea = (ai: number) =>
    setCollapsedAreas(prev => {
      const s = new Set(prev)
      if (s.has(ai)) s.delete(ai)
      else s.add(ai)
      return s
    })

  // ---- API -----------------------------------------------------------------
  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<{
    ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string
  } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    setCompileData(null)
    try {
      const gen = await generateStrahlenoptik(config)
      if (!gen || !gen.latex) {
        setCompileData({ ok: false, log: 'Fehler: Keine LaTeX-Antwort vom Server.' })
        return
      }
      setLatexCode(gen.latex)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } catch (err: unknown) {
      console.error('Generation failed:', err)
      const msg = err instanceof Error ? err.message : 'Serverfehler bei der Generierung'
      setCompileData({ ok: false, log: msg })
    } finally {
      setIsCompiling(false)
    }
  }

  // ---- State helpers -------------------------------------------------------
  const updateConfig: StrahlenSetter = (key, value) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const hasLightZones = config.light_sources.some(s => s.show_light_zone)
  const hasRefractionAreas = config.refraction_areas.length > 0
  const showLightZoneRefractionWarning = hasLightZones && hasRefractionAreas

  // ---- Tabs ----------------------------------------------------------------
  const tabs = [
    { id: 'lichtquellen', label: 'Lichtquellen', icon: <Sun size={16} /> },
    { id: 'hindernisse', label: 'Hindernisse', icon: <Shield size={16} /> },
    { id: 'medien', label: 'Medien', icon: <Layers size={16} /> },
    { id: 'schatten', label: 'Schatten', icon: <Eye size={16} /> },
    { id: 'darstellung', label: 'Darstellung', icon: <Settings size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <StrahlenHeader 
        config={config}
        setConfig={setConfig}
        onCompile={handleCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        <div className={s.editorPanel}>
          {showLightZoneRefractionWarning && (
            <div className="p-4 space-y-3 border-b border-line bg-panel/50">
              <LightZoneWarning />
            </div>
          )}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="lichtquellen" activeTab={activeTab}>
              <StrahlenTabLicht 
                config={config} 
                updateConfig={updateConfig}
                collapsedSources={collapsedSources}
                toggleSource={toggleSource}
              />
            </TabContent>

            <TabContent id="hindernisse" activeTab={activeTab}>
              <StrahlenTabHindernisse 
                config={config}
                updateConfig={updateConfig}
                collapsedBarriers={collapsedBarriers}
                toggleBarrier={toggleBarrier}
                draggedIdx={draggedIdx}
                setDraggedIdx={setDraggedIdx}
                dragType={dragType}
                setDragType={setDragType}
              />
            </TabContent>

            <TabContent id="medien" activeTab={activeTab}>
              <StrahlenTabMedien 
                config={config}
                updateConfig={updateConfig}
                collapsedAreas={collapsedAreas}
                toggleArea={toggleArea}
                draggedIdx={draggedIdx}
                setDraggedIdx={setDraggedIdx}
                dragType={dragType}
                setDragType={setDragType}
                hasRefractionAreas={hasRefractionAreas}
              />
            </TabContent>

            <TabContent id="schatten" activeTab={activeTab}>
              <StrahlenTabSchatten 
                config={config}
                updateConfig={updateConfig}
              />
            </TabContent>

            <TabContent id="darstellung" activeTab={activeTab}>
              <StrahlenTabDarstellung 
                config={config}
                updateConfig={updateConfig}
              />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="strahlenoptik"
                currentConfig={config}
                onLoad={loaded => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        <StrahlenPreview 
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

export default StrahlenPage
