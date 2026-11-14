// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useGeneratorHistory from '../../hooks/useGeneratorHistory'
import { generateStellenwerttafel, compileLatex, extractApiErrorMessage } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { s } from '../../styles/tokens'
import { Grid, Settings, Palette, Folders, Hash } from 'lucide-react'

import { DEFAULT_CONFIG } from './constantsStellenwert'
import type { StellenwertConfig } from './typesStellenwert'
import { deepMergeConfig } from '../../utils/deepMergeConfig'

import { StellenwertHeader } from './components/StellenwertHeader'
import { StellenwertPreview } from './components/StellenwertPreview'
import { StellenwertTabSpalten } from './components/StellenwertTabSpalten'
import { StellenwertTabWerte } from './components/StellenwertTabWerte'
import { StellenwertTabDarstellung } from './components/StellenwertTabDarstellung'
import { StellenwertTabErweitert } from './components/StellenwertTabErweitert'

function normalizeStellenwertConfig(raw: unknown): StellenwertConfig {
  const legacy = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<StellenwertConfig> & {
    use_fira?: boolean
  }
  const { use_fira, ...rest } = legacy
  const merged = deepMergeConfig(DEFAULT_CONFIG, {
    ...rest,
    font_family: rest.font_family ?? (use_fira === false ? 'Standard' : DEFAULT_CONFIG.font_family),
  })

  return {
    ...merged,
    rows: merged.rows.map((row, idx) => ({
      id: row?.id || `row_${idx + 1}`,
      label: row?.label ?? '',
      active: row?.active ?? true,
      is_placeholder: row?.is_placeholder ?? false,
      // WICHTIG: values ist ein dynamischer Record und darf niemals mit DEFAULT_ROWS[0].values gemergt werden!
      values:
        row?.values && typeof row.values === 'object' && !Array.isArray(row.values)
          ? { ...row.values }
          : {},
    })),
  }
}

const StellenwertPage = () => {
  const [config, setConfig, history] = useGeneratorHistory<StellenwertConfig>('ks-stellenwerttafel-v2', DEFAULT_CONFIG)
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
    } catch (err: unknown) {
      const msg = extractApiErrorMessage(err, 'Fehler bei der Code-Generierung')
      setCompileData({ ok: false, log: msg })
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
        setConfig={history.commitImmediate}
        onCompile={handleCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
        history={history}
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
                thumbnailSource={compileData?.png_base64}
                onLoad={loaded => history.commitImmediate(normalizeStellenwertConfig(loaded))}
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
