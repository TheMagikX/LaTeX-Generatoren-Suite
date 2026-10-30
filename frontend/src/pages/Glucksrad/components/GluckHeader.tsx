// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { RotateCw, Sparkles } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { Button } from '../../../components/ui'
import { AiPromptDialog } from '../../../components/AiPromptDialog'
import { useAi } from '../../../context/AiContext'
import { COMPONENT_VERSIONS } from '../../versions'
import type { GluckConfig } from '../typesGluck'
import { DEFAULT_CONFIG } from '../constantsGluck'

interface GluckHeaderProps {
  config: GluckConfig
  setConfig: (config: GluckConfig) => void
  onCompile: () => void
  isCompiling: boolean
  latexCode: string | null
}

const DEFAULT_GLUCK_EXAMPLES = [
  {
    label: '🚦 Ampel (6 Felder)',
    text: '6 gleich große Felder: 3x Grün, 2x Gelb, 1x Rot mit Zeiger oben'
  },
  {
    label: '🎰 Gewinnspiel (8 Felder)',
    text: '8 Felder: 1x Goldener Hauptgewinn, 3x Blau für Trostpreis, 4x Grau für Niete mit Stiften am Rand'
  },
  {
    label: '🔢 Zahlen 1 bis 5',
    text: '5 gleich große Sektoren durchnummeriert von 1 bis 5 in bunten Farben mit TikZ-Pfeil oben'
  },
  {
    label: '⚖️ 50:50 Rot & Blau',
    text: 'Glücksrad mit 4 roten und 4 blauen Sektoren abwechselnd angeordnet'
  }
]

export const GluckHeader = ({ config, setConfig, onCompile, isCompiling, latexCode }: GluckHeaderProps) => {
  const [showAiModal, setShowAiModal] = useState(false)
  const { aiEnabled } = useAi()

  return (
    <>
      <GeneratorHeader
        title="Glücksrad"
        icon={<RotateCw size={24} />}
        version={COMPONENT_VERSIONS.glucksradgenerator}
        onReset={() => setConfig({ ...DEFAULT_CONFIG })}
        onCompile={onCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
        texFilename="glucksrad.tex"
        texLabel=".tex Export"
        actionsBefore={
          aiEnabled && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 whitespace-nowrap text-amber-500 hover:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              title="Glücksrad per KI-Sprachbefehl konfigurieren"
            >
              <Sparkles size={16} /> KI-Assistent
            </Button>
          )
        }
      />

      {aiEnabled && (
        <AiPromptDialog<GluckConfig>
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          generator="glucksrad"
          generatorTitle="Glücksrad"
          onApplyConfig={(newCfg) => {
            setConfig(newCfg)
          }}
          currentConfig={config}
          promptExamples={DEFAULT_GLUCK_EXAMPLES}
        />
      )}
    </>
  )
}
