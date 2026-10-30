// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { Ruler, Sparkles } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { Button } from '../../../components/ui'
import { AiPromptDialog } from '../../../components/AiPromptDialog'
import { useAi } from '../../../context/AiContext'
import { COMPONENT_VERSIONS } from '../../versions'
import type { ZahlenstrahlConfig } from '../typesZahlen'

interface ZahlenHeaderProps {
  config: ZahlenstrahlConfig
  onReset: () => void
  onCompile: () => void
  isCompiling: boolean
  latexCode: string | null
  onApplyConfig?: (config: ZahlenstrahlConfig) => void
}

const DEFAULT_ZAHLEN_EXAMPLES = [
  {
    label: '➖ Ganze Zahlen -10 bis 10',
    text: 'Zahlenstrahl von -10 bis 10 mit beidseitigem Pfeil, Hauptmarkierungen bei 1 und Teilschritten 0.5'
  },
  {
    label: '📐 Brüche 0 bis 2 (Viertel)',
    text: 'Zahlenstrahl von 0 bis 2 mit Teilschritten 0.25 (Viertel), als Bruch beschriftet und Punkt bei 3/4'
  },
  {
    label: '🦘 Rechnen mit Sprüngen',
    text: 'Zahlenstrahl von 0 bis 10 mit zwei Sprüngen: +3 von 0 nach 3 und +4 von 3 nach 7'
  },
  {
    label: '🎯 Intervall [2, 6]',
    text: 'Zahlenstrahl von 0 bis 8 mit einem geschlossenen blauen Intervall von 2 bis 6'
  }
]

export const ZahlenHeader = ({
  config,
  onReset,
  onCompile,
  isCompiling,
  latexCode,
  onApplyConfig
}: ZahlenHeaderProps) => {
  const [showAiModal, setShowAiModal] = useState(false)
  const { aiEnabled } = useAi()

  return (
    <>
      <GeneratorHeader
        title="Zahlenstrahl"
        icon={<Ruler size={24} />}
        version={COMPONENT_VERSIONS.zahlenstrahlgenerator}
        onReset={onReset}
        onCompile={onCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
        texFilename="zahlenstrahl.tex"
        actionsBefore={
          aiEnabled && onApplyConfig && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 whitespace-nowrap text-amber-500 hover:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              title="Zahlenstrahl per KI-Sprachbefehl konfigurieren"
            >
              <Sparkles size={16} /> KI-Assistent
            </Button>
          )
        }
      />

      {aiEnabled && onApplyConfig && (
        <AiPromptDialog<ZahlenstrahlConfig>
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          generator="zahlenstrahl"
          generatorTitle="Zahlenstrahl"
          onApplyConfig={(newCfg) => {
            onApplyConfig(newCfg)
          }}
          currentConfig={config}
          promptExamples={DEFAULT_ZAHLEN_EXAMPLES}
        />
      )}
    </>
  )
}
