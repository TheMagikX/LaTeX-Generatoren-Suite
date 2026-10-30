// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useMemo, useEffect } from 'react'
import { s } from '../../styles/tokens'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateGlucksrad, compileLatex } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { RotateCw, Type, MousePointer2, Folders } from 'lucide-react'

import type { ColorSectorUpdater, GluckConfig, GluckSetter } from './typesGluck'
import { DEFAULT_CONFIG, PALETTES } from './constantsGluck'
import { GluckHeader } from './components/GluckHeader'
import { GluckPreview } from './components/GluckPreview'
import { GluckTabSektoren } from './components/GluckTabSektoren'
import { GluckTabBeschriftung } from './components/GluckTabBeschriftung'
import { GluckTabPfeil } from './components/GluckTabPfeil'

const GluckPage = () => {
  const [config, setConfig] = useLocalStorage<GluckConfig>('ks-glucksrad', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('sektoren')
  const [previewDpi, setPreviewDpi] = useState(300)

  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<{
    ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string
  } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateGlucksrad(config)
      setLatexCode(gen.latex)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  const updateConfig: GluckSetter = (key, value) => setConfig(prev => ({ ...prev, [key]: value }))

  const updateSector: ColorSectorUpdater = (idx, key, value) => {
    const newSectors = [...config.sectors]
    newSectors[idx] = { ...newSectors[idx], [key]: value }
    setConfig(prev => ({ ...prev, sectors: newSectors }))
  }

  const addSector = () => {
    setConfig(prev => ({
      ...prev,
      sectors: [...prev.sectors, { farbe: "#9B59B6", haeufigkeit: 1, label: "Neu" }]
    }))
  }

  const removeSector = (idx: number) => {
    if (config.sectors.length <= 1) return
    const newSectors = config.sectors.filter((_, i) => i !== idx)
    setConfig(prev => ({ ...prev, sectors: newSectors }))
  }

  const applyPalette = (paletteName: string) => {
    if (paletteName === "—") return
    const p = PALETTES[paletteName]
    const newSectors = config.sectors.map((s, i) => ({
      ...s,
      farbe: p.colors[i % p.colors.length],
      label: p.labels[i % p.labels.length]
    }))
    setConfig(prev => ({ ...prev, sectors: newSectors }))
  }

  const totalAssigned = useMemo(() => {
    return config.sectors.reduce((sum, s) => sum + s.haeufigkeit, 0)
  }, [config.sectors])

  useEffect(() => {
    if (config.mode === 'standard' && config.anzahl !== Math.round(totalAssigned)) {
      setConfig(prev => ({ ...prev, anzahl: Math.round(totalAssigned) }))
    }
  }, [totalAssigned, config.mode, config.anzahl, setConfig])

  const validation = useMemo(() => {
    if (config.mode === 'variable') {
      return totalAssigned > 0 ? { ok: true, msg: `Gesamtgewicht: ${totalAssigned}` } : { ok: false, msg: "Mindestens eine Gewichtung > 0 erforderlich" }
    } else {
      return totalAssigned > 0 ? { ok: true, msg: `${totalAssigned} Sektoren werden generiert` } : { ok: false, msg: "Mindestens ein Sektor erforderlich" }
    }
  }, [config.mode, totalAssigned])

  const tabs = [
    { id: 'sektoren', label: 'Sektoren & Farben', icon: <RotateCw size={16} /> },
    { id: 'beschriftung', label: 'Labels', icon: <Type size={16} /> },
    { id: 'pfeil', label: 'Pfeil & Rand', icon: <MousePointer2 size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <GluckHeader
        config={config}
        setConfig={setConfig}
        onCompile={handleCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        <div className={s.editorPanel}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="sektoren" activeTab={activeTab}>
              <GluckTabSektoren
                config={config}
                updateConfig={updateConfig}
                updateSector={updateSector}
                addSector={addSector}
                removeSector={removeSector}
                applyPalette={applyPalette}
                validation={validation}
              />
            </TabContent>

            <TabContent id="beschriftung" activeTab={activeTab}>
              <GluckTabBeschriftung
                config={config}
                updateConfig={updateConfig}
              />
            </TabContent>

            <TabContent id="pfeil" activeTab={activeTab}>
              <GluckTabPfeil
                config={config}
                updateConfig={updateConfig}
              />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="glucksrad"
                currentConfig={config}
                onLoad={(loaded) => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        <GluckPreview
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

export default GluckPage
