// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateFlaschenzug, compileLatex } from '../../api/client'
import { Accordion } from '../../components/ui'
import { PresetManager } from '../../components/PresetManager'
import { COMPONENT_VERSIONS } from '../versions'
import { Settings } from 'lucide-react'

// Types & Constants
import type { FlaschenzugConfig, FlaschenzugGlobalConfig, FlaschenzugEnvironmentConfig } from './typesFlasche'
import { DEFAULT_CONFIG } from './constantsFlasche'
import { validateRopePaths } from './utilsFlasche'

// Components
import { FlascheHeader } from './components/FlascheHeader'
import { FlaschePreview } from './components/FlaschePreview'
import { FlascheTabRollen } from './components/FlascheTabRollen'
import { FlascheTabAnker } from './components/FlascheTabAnker'
import { FlascheTabSeile } from './components/FlascheTabSeile'
import { FlascheTabMassen } from './components/FlascheTabMassen'
import { FlascheTabGlobal } from './components/FlascheTabGlobal'
import { FlascheCanvasEditor } from './components/FlascheCanvasEditor'

const buildExportConfig = (cfg: FlaschenzugConfig): FlaschenzugConfig => {
  if (!cfg.global_opts.preview_grid || !cfg.global_opts.coordinate_helpers_preview_only) return cfg
  return {
    ...cfg,
    global_opts: {
      ...cfg.global_opts,
      preview_grid: false,
    },
  }
}

export default function FlaschenzugPage() {
  const [cfg, setCfg] = useLocalStorage<FlaschenzugConfig>('ks-flaschenzug', DEFAULT_CONFIG)
  const [dpi, setDpi] = useState(600)

  const updGlobal = (patch: Partial<FlaschenzugGlobalConfig>) =>
    setCfg(c => ({ ...c, global_opts: { ...c.global_opts, ...patch } }))

  const updEnv = (patch: Partial<FlaschenzugEnvironmentConfig>) =>
    setCfg(c => ({ ...c, environment: { ...c.environment, ...patch } }))

  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileResult, setCompileResult] = useState<{
    ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string
  } | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    const ropeDiagnostics = validateRopePaths(cfg).filter(d => d.severity === 'error')
    if (ropeDiagnostics.length > 0) {
      setLatexCode(null)
      setCompileResult({
        ok: false,
        log: `Seilpfad-Validierung fehlgeschlagen:\n${ropeDiagnostics.map(d => `- ${d.message}`).join('\n')}`,
      })
      return
    }

    setIsCompiling(true)
    try {
      const previewGen = await generateFlaschenzug(cfg)
      const exportGen = cfg.global_opts.preview_grid && cfg.global_opts.coordinate_helpers_preview_only
        ? await generateFlaschenzug(buildExportConfig(cfg))
        : previewGen
      setLatexCode(exportGen.latex)
      const result = await compileLatex(previewGen.latex, dpi)
      setCompileResult(result)
    } finally {
      setIsCompiling(false)
    }
  }

  const handleCopyCode = async () => {
    if (latexCode) {
      await navigator.clipboard.writeText(latexCode)
    }
  }

  const handleReset = () => {
    setCfg({ ...DEFAULT_CONFIG })
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <FlascheHeader
        onCompile={handleCompile}
        onReset={handleReset}
        isCompiling={isCompiling}
        latexCode={latexCode}
        version={COMPONENT_VERSIONS.flaschenzug}
      />

      <div className="flex gap-6 flex-1 overflow-hidden pb-4 relative">
        {/* Left Column: Config Panel */}
        <div className="w-[960px] flex-shrink-0 flex flex-col gap-5 overflow-y-auto pr-2 pb-24 text-ink">
          <FlascheCanvasEditor cfg={cfg} setCfg={setCfg} />
          <FlascheTabRollen cfg={cfg} setCfg={setCfg} />
          <FlascheTabAnker cfg={cfg} setCfg={setCfg} />
          <FlascheTabSeile cfg={cfg} setCfg={setCfg} />
          <FlascheTabMassen cfg={cfg} setCfg={setCfg} />
          <FlascheTabGlobal cfg={cfg} updGlobal={updGlobal} updEnv={updEnv} />

          <Accordion title="Presets Speichern / Laden" icon={<Settings size={18} />}>
            <PresetManager generator="flaschenzug" currentConfig={cfg} onLoad={setCfg} />
          </Accordion>
        </div>

        {/* Right Column: Preview Panel */}
        <FlaschePreview
          latexCode={latexCode}
          compileResult={compileResult}
          isCompiling={isCompiling}
          dpi={dpi}
          setDpi={setDpi}
          handleCopyCode={handleCopyCode}
        />
      </div>
    </div>
  )
}
