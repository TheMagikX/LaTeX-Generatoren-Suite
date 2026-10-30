// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { PieChart, Sparkles } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { Button } from '../../../components/ui'
import { AiPromptDialog } from '../../../components/AiPromptDialog'
import { useAi } from '../../../context/AiContext'
import { COMPONENT_VERSIONS } from '../../versions'
import type { BruchConfig } from '../typesBruch'
import { DEFAULT_CONFIG } from '../constantsBruch'

interface BruchHeaderProps {
  onCompile: () => void
  isCompiling: boolean
  setConfig: (config: BruchConfig) => void
  currentConfig?: BruchConfig
  onApplyConfig?: (config: BruchConfig) => void
}

const DEFAULT_BRUCH_EXAMPLES = [
  {
    label: '🍰 3/4 Pizza (Kreis)',
    text: 'Drei Viertel als Kreisdiagramm in Orange mit Beschriftung'
  },
  {
    label: '🍫 5/8 Schokolade (Rechteck)',
    text: '5/8 als Rechteck mit 2 Zeilen und 4 Spalten, Farbe Braun'
  },
  {
    label: '🔄 Erweitern auf Zwölftel',
    text: 'Zeige 2/3 erweitert mit Faktor 4 auf 8/12 mit horizontaler Unterteilung'
  },
  {
    label: '📦 Unechter Bruch 7/4',
    text: 'Unechter Bruch 7/4 als gemischte Zahl visualisiert'
  }
]

export function BruchHeader({
  onCompile,
  isCompiling,
  setConfig,
  currentConfig,
  onApplyConfig
}: BruchHeaderProps) {
  const [showAiModal, setShowAiModal] = useState(false)
  const { aiEnabled } = useAi()

  const handleApply = onApplyConfig || setConfig

  return (
    <>
      <GeneratorHeader
        title="Bruch-Visualisierer"
        icon={<PieChart size={24} />}
        version={COMPONENT_VERSIONS.bruchgenerator}
        onReset={() => setConfig(DEFAULT_CONFIG)}
        resetConfirmation={{
          title: 'Konfiguration zurücksetzen?',
          message: 'Alle nicht gespeicherten Eingaben gehen verloren. Die Konfiguration wird auf die Standardwerte zurückgesetzt.',
        }}
        onCompile={onCompile}
        isCompiling={isCompiling}
        showCompileSpinner={false}
        actionsBefore={
          aiEnabled && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 whitespace-nowrap text-amber-500 hover:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              title="Bruch per KI-Sprachbefehl konfigurieren"
            >
              <Sparkles size={16} /> KI-Assistent
            </Button>
          )
        }
      />

      {aiEnabled && (
        <AiPromptDialog<BruchConfig>
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          generator="bruch"
          generatorTitle="Bruch-Visualisierer"
          onApplyConfig={(newCfg) => {
            handleApply(newCfg)
          }}
          currentConfig={currentConfig}
          promptExamples={DEFAULT_BRUCH_EXAMPLES}
        />
      )}
    </>
  )
}
