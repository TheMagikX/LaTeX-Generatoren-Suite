// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { useMutation } from '@tanstack/react-query'
import { generateArbeitsblatt, compileLatex, executeArbeitsblattCode } from '../../api/client'
import type { ArbeitsblattGenerateResponse, CompileResponse } from '../../api/client'
import { DEFAULT_CONFIG } from './constantsArbeitsblatt'
import type { ArbeitsblattConfig } from './typesArbeitsblatt'
import ArbeitsblattHeader from './components/ArbeitsblattHeader'
import ArbeitsblattTabs from './components/ArbeitsblattTabs'
import ArbeitsblattPreview from './components/ArbeitsblattPreview'

type GenerateMutationArgs = {
  vars?: Record<string, unknown>
  runConfig?: ArbeitsblattConfig
}

const createRandomSeed = () => Math.floor(Math.random() * 1_000_000_000).toString()

export default function ArbeitsblattPage() {
  const [config, setConfig] = useLocalStorage<ArbeitsblattConfig>('ks-arbeitsblatt', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('template')
  const [dpi, setDpi] = useState(300)
  const [pythonVars, setPythonVars] = useState<Record<string, unknown> | null>(null)
  const [pythonError, setPythonError] = useState<string | null>(null)
  const [genData, setGenData] = useState<ArbeitsblattGenerateResponse | null>(null)
  const [showCodeSuccess, setShowCodeSuccess] = useState(false)

  const [compileTasks, setCompileTasks] = useState<CompileResponse | null>(null)
  const [compileSols, setCompileSols] = useState<CompileResponse | null>(null)
  const [isCompilingTasks, setIsCompilingTasks] = useState(false)
  const [isCompilingSols, setIsCompilingSols] = useState(false)

  const getConfigForRun = (forceNewSeed = false) => {
    const trimmedSeed = config.random_seed?.trim() ?? ''
    if (trimmedSeed && !forceNewSeed) return { runConfig: { ...config, random_seed: trimmedSeed }, seed: trimmedSeed }

    const seed = createRandomSeed()
    const runConfig = { ...config, random_seed: seed }
    setConfig(runConfig)
    return { runConfig, seed }
  }

  // 1. Mutation for generating LaTeX
  const generateMutation = useMutation({
    mutationFn: ({ vars, runConfig = config }: GenerateMutationArgs) => generateArbeitsblatt({ ...runConfig, variables: vars }),
    onSuccess: async (data) => {
      setGenData(data)
      if (data.seed !== undefined && data.seed !== null) {
        updateConfig('random_seed', String(data.seed))
      }
      if (data.latex_tasks) {
        setIsCompilingTasks(true)
        compileLatex(data.latex_tasks, dpi, true).then(r => { setCompileTasks(r); setIsCompilingTasks(false) })
      }
      if (data.latex_solutions) {
        setIsCompilingSols(true)
        compileLatex(data.latex_solutions, dpi, true).then(r => { setCompileSols(r); setIsCompilingSols(false) })
      }
    }
  })

  // Mutation for executing code
  const executeMutation = useMutation({
    mutationFn: executeArbeitsblattCode,
    onSuccess: (data) => {
      setPythonVars(data.vars ?? null)
      setPythonError(data.error ?? null)
      if (data.seed !== undefined && data.seed !== null) {
        updateConfig('random_seed', String(data.seed))
      }
      if (!data.error) {
        setShowCodeSuccess(true)
        setTimeout(() => setShowCodeSuccess(false), 2500)
      }
    },
    onError: (err: unknown) => {
      setPythonError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.')
      setPythonVars(null)
    }
  })

  const updateConfig = <K extends keyof ArbeitsblattConfig>(key: K, value: ArbeitsblattConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleExecute = () => {
    const { seed } = getConfigForRun()
    executeMutation.mutate({ python_code: config.python_code, random_seed: seed })
  }

  const handleGenerate = (forceNewSeed = false) => {
    const { runConfig, seed } = getConfigForRun(forceNewSeed)
    executeMutation.mutate({ python_code: runConfig.python_code, random_seed: seed }, {
      onSuccess: (data) => {
        // Immediately generate LaTeX with the fresh variables
        generateMutation.mutate({ vars: data.vars, runConfig })
      }
    })
  }

  const isWorking = executeMutation.isPending || generateMutation.isPending

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <ArbeitsblattHeader
        onReset={() => setConfig(DEFAULT_CONFIG)}
        onExecute={handleExecute}
        onGenerate={() => handleGenerate(false)}
        onGenerateNewSeed={() => handleGenerate(true)}
        isPendingExecution={executeMutation.isPending}
        isWorking={isWorking}
        showCodeSuccess={showCodeSuccess}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row items-stretch gap-6 pb-4 min-w-0 overflow-y-auto lg:overflow-hidden">
        <ArbeitsblattTabs
          config={config}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          updateConfig={updateConfig}
          pythonError={pythonError}
          pythonVars={pythonVars}
          onConfigChange={(newConfig) => setConfig({ ...DEFAULT_CONFIG, ...newConfig })}
        />

        <ArbeitsblattPreview
          config={config}
          dpi={dpi}
          setDpi={setDpi}
          isGenerating={generateMutation.isPending}
          isCompilingTasks={isCompilingTasks}
          isCompilingSols={isCompilingSols}
          compileTasks={compileTasks}
          compileSols={compileSols}
          genData={genData}
        />
      </div>
    </div>
  )
}
