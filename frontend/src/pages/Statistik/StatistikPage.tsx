// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateStatistik, compileLatex } from '../../api/client'
import type { CompileResponse } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import { s } from '../../styles/tokens'
import { Folders, BarChart2, Settings } from 'lucide-react'

import type { StatistikAxisUpdater, StatistikConfig, StatistikDatasetUpdater, StatistikResult, StatistikSetter, DatasetConfig, AxisConfig } from './typesStatistik'
import { DEFAULT_CONFIG } from './constantsStatistik'
import { StatistikHeader } from './components/StatistikHeader'
import { StatistikPreview } from './components/StatistikPreview'
import { StatistikTabDaten } from './components/StatistikTabDaten'
import { StatistikTabStil } from './components/StatistikTabStil'

const StatistikPage = () => {
  const [rawConfig, setConfig] = useLocalStorage<StatistikConfig>('ks-statistik', DEFAULT_CONFIG)
  const legacyConfig = rawConfig as Partial<StatistikConfig> & {
    axis?: Partial<AxisConfig>
    datasets?: Partial<DatasetConfig>[]
  }
  const datasetDefaults: DatasetConfig = {
    name: '',
    data_mode: 'Raw',
    raw_data: [],
    raw_data_string: '',
    freq_data_string: '',
    bar_labels_string: '',
    color: 'black',
    show_outliers: true,
    enabled: true,
  }

  // Deep-merge with DEFAULT_CONFIG so old localStorage values missing new option
  // blocks don't crash the UI. This includes migrating the old 'axis' field
  // to 'x_axis' and 'y_axis'.
  const config: StatistikConfig = {
    ...DEFAULT_CONFIG,
    ...rawConfig,
    x_axis: { ...DEFAULT_CONFIG.x_axis, ...(rawConfig.x_axis ?? legacyConfig.axis ?? {}) },
    y_axis: { ...DEFAULT_CONFIG.y_axis, ...(rawConfig.y_axis ?? legacyConfig.axis ?? {}) },
    boxplot_opts: { ...DEFAULT_CONFIG.boxplot_opts, ...(rawConfig.boxplot_opts ?? {}) },
    histogram_opts: { ...DEFAULT_CONFIG.histogram_opts, ...(rawConfig.histogram_opts ?? {}) },
    barchart_opts: { ...DEFAULT_CONFIG.barchart_opts, ...(rawConfig.barchart_opts ?? {}) },
    summenkurve_opts: { ...DEFAULT_CONFIG.summenkurve_opts, ...(rawConfig.summenkurve_opts ?? {}) },
    violin_opts: { ...DEFAULT_CONFIG.violin_opts, ...(rawConfig.violin_opts ?? {}) },
    width_cm: rawConfig.width_cm ?? DEFAULT_CONFIG.width_cm,
    height_cm: rawConfig.height_cm ?? DEFAULT_CONFIG.height_cm,
    datasets: (legacyConfig.datasets ?? DEFAULT_CONFIG.datasets).map(ds => ({ ...datasetDefaults, ...ds })),
  }
  const [activeTab, setActiveTab] = useState('daten')
  const [previewDpi, setPreviewDpi] = useState(600)
  const [results, setResults] = useState<StatistikResult[]>([])

  // ---- API calls -----------------------------------------------------------
  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<CompileResponse | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    setCompileData(null)
    try {
      const activeConfig = { ...config, datasets: config.datasets.filter(ds => ds.enabled) }
      const gen = await generateStatistik(activeConfig)
      setLatexCode(gen.latex)
      setResults(gen.results)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } catch (err: unknown) {
      console.error('Generation failed:', err)
      const errorLog = err instanceof Error ? err.message : 'Generierung fehlgeschlagen'
      setCompileData({
        ok: false,
        log: errorLog
      })
    } finally {
      setIsCompiling(false)
    }
  }

  // ---- State helpers -------------------------------------------------------
  const set: StatistikSetter = (key, value) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const updateAxis: StatistikAxisUpdater = (axisKey, field, value) => {
    setConfig(prev => {
      const currentAxis = { ...DEFAULT_CONFIG[axisKey], ...(prev[axisKey] ?? {}) }
      return { ...prev, [axisKey]: { ...currentAxis, [field]: value } }
    })
  }

  const updateDataset: StatistikDatasetUpdater = (idx, field, value) => {
    setConfig(prev => {
      const prevDatasets = (prev.datasets ?? DEFAULT_CONFIG.datasets).map(ds => ({
        ...datasetDefaults,
        ...ds,
      }))
      const next = [...prevDatasets]

      if (!next[idx]) return prev

      next[idx] = { ...next[idx], [field]: value }
      return { ...prev, datasets: next }
    })
  }

  const addDataset = () => {
    const newDs: DatasetConfig = {
      name: `Datensatz ${config.datasets.length + 1}`,
      data_mode: 'Raw',
      raw_data: [],
      raw_data_string: '',
      freq_data_string: '',
      bar_labels_string: '',
      color: 'black',
      show_outliers: true,
      enabled: true,
    }
    set('datasets', [...config.datasets, newDs])
  }

  const removeDataset = (idx: number) => {
    set('datasets', config.datasets.filter((_, i) => i !== idx))
  }

  // ---- Tab definitions -----------------------------------------------------
  const tabs = [
    { id: 'daten', label: 'Daten', icon: <BarChart2 size={16} /> },
    { id: 'stil', label: 'Stil', icon: <Settings size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <StatistikHeader
        onCompile={handleCompile}
        onReset={() => setConfig(DEFAULT_CONFIG)}
        isCompiling={isCompiling}
        latexCode={latexCode}
      />

      {/* Body */}
      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        {/* ===== Left panel: settings tabs ===== */}
        <div className={s.editorPanel}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="daten" activeTab={activeTab}>
              <StatistikTabDaten
                config={config}
                set={set}
                updateDataset={updateDataset}
                addDataset={addDataset}
                removeDataset={removeDataset}
              />
            </TabContent>

            <TabContent id="stil" activeTab={activeTab}>
              <StatistikTabStil config={config} set={set} updateAxis={updateAxis} />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="statistik"
                currentConfig={config}
                onLoad={loaded => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        {/* ===== Right panel: preview ===== */}
        <StatistikPreview
          latexCode={latexCode}
          compileData={compileData}
          isCompiling={isCompiling}
          previewDpi={previewDpi}
          setPreviewDpi={setPreviewDpi}
          results={results}
        />
      </div>
    </div>
  )
}

export default StatistikPage
