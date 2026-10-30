// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { Layers, Sparkles } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { Button } from '../../../components/ui'
import { AiPromptDialog } from '../../../components/AiPromptDialog'
import { useAi } from '../../../context/AiContext'
import { COMPONENT_VERSIONS } from '../../versions'
import type { StellenwertConfig } from '../typesStellenwert'
import { DEFAULT_CONFIG } from '../constantsStellenwert'

interface StellenwertHeaderProps {
  config: StellenwertConfig
  setConfig: (config: StellenwertConfig | ((prev: StellenwertConfig) => StellenwertConfig)) => void
  onCompile: () => void
  isCompiling: boolean
  latexCode: string | null
}

const DEFAULT_STELLENWERT_EXAMPLES = [
  {
    label: '🪙 H-Z-E mit Plättchen (342)',
    text: 'Hunderter-, Zehner- und Einertafel mit Rechenplättchen für die Zahl 342'
  },
  {
    label: '💶 Dezimalzahlen (12,504)',
    text: 'Stellenwerttafel von Z, E bis z, h, t mit dickem Kommastrich nach den Einern für die Zahl 12,504'
  },
  {
    label: '🏛️ Große Zahlen bis Millionen',
    text: 'Tausenderbündel für Millionen, Tausender und Einer mit den Zahlen 1.250.000 und 405.012'
  },
  {
    label: '📏 Einheitentafel Längen',
    text: 'Einheitentafel für Längen mit km (3 Spalten), m (3 Spalten), dm, cm, mm'
  }
]

export const StellenwertHeader = ({ config, setConfig, onCompile, isCompiling, latexCode }: StellenwertHeaderProps) => {
  const [showAiModal, setShowAiModal] = useState(false)
  const { aiEnabled } = useAi()

  return (
    <>
      <GeneratorHeader
        title="Stellenwerttafel"
        icon={<Layers size={24} />}
        version={COMPONENT_VERSIONS.stellwerttafel}
        onReset={() => setConfig({ ...DEFAULT_CONFIG })}
        onCompile={onCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
        texFilename="stellenwerttafel.tex"
        actionsBefore={
          aiEnabled && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 whitespace-nowrap text-amber-500 hover:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              title="Stellenwerttafel per KI-Sprachbefehl konfigurieren"
            >
              <Sparkles size={16} /> KI-Assistent
            </Button>
          )
        }
      />

      {aiEnabled && (
        <AiPromptDialog<StellenwertConfig>
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          generator="stellenwerttafel"
          generatorTitle="Stellenwerttafel"
          onApplyConfig={(newCfg) => {
            setConfig(newCfg)
          }}
          currentConfig={config}
          promptExamples={DEFAULT_STELLENWERT_EXAMPLES}
        />
      )}
    </>
  )
}
