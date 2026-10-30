// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { LineChart, Sparkles } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { Button } from '../../../components/ui'
import { AiPromptDialog } from '../../../components/AiPromptDialog'
import { useAi } from '../../../context/AiContext'
import { COMPONENT_VERSIONS } from '../../versions'
import { DEFAULT_CONFIG } from '../constantsKoord'
import type { Config } from '../typesKoord'

interface KoordHeaderProps {
  config: Config
  setConfig: (config: Config) => void
  onCompile: () => void
  isCompiling: boolean
  latexCode: string | null
}

const DEFAULT_KOORD_EXAMPLES = [
  {
    label: '📉 Parabel mit Scheitelpunkt',
    text: 'Normalparabel f(x) = (x-2)^2 - 1 im Bereich von -1 bis 5 mit markiertem Scheitelpunkt bei (2|-1)'
  },
  {
    label: '📐 Gerade & Steigungsdreieck',
    text: 'Lineare Funktion f(x) = 0.5*x + 1 von -2 bis 6 mit Steigungsdreieck bei x=1'
  },
  {
    label: '〰️ Sinusschwingung',
    text: 'Sinusfunktion sin(deg(x)) im Bereich von 0 bis 360 Grad mit Gitterlinien'
  },
  {
    label: '🟩 Integral-Fläche',
    text: 'Parabel f(x) = -x^2 + 4 von -2 bis 2 mit schattierter Fläche unter der Kurve'
  }
]

export const KoordHeader = ({ config, setConfig, onCompile, isCompiling, latexCode }: KoordHeaderProps) => {
  const [showAiModal, setShowAiModal] = useState(false)
  const { aiEnabled } = useAi()

  return (
    <>
      <GeneratorHeader
        title="Koordinatensystem"
        icon={<LineChart size={24} />}
        version={COMPONENT_VERSIONS.koordinatensystem}
        onReset={() => setConfig(DEFAULT_CONFIG)}
        resetConfirmation={{
          title: 'Konfiguration zurücksetzen?',
          message: 'Alle nicht gespeicherten Eingaben gehen verloren. Die Konfiguration wird auf die Standardwerte zurückgesetzt.',
        }}
        onCompile={onCompile}
        isCompiling={isCompiling}
        showCompileSpinner={false}
        latexCode={latexCode}
        texFilename="plot.tex"
        texLabel=".tex Export"
        actionsBefore={
          aiEnabled && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 whitespace-nowrap text-amber-500 hover:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              title="2D-Koordinatensystem per KI-Sprachbefehl konfigurieren"
            >
              <Sparkles size={16} /> KI-Assistent
            </Button>
          )
        }
      />

      {aiEnabled && (
        <AiPromptDialog<Config>
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          generator="koordinatensystem"
          generatorTitle="2D Koordinatensystem"
          onApplyConfig={(newCfg) => {
            setConfig(newCfg)
          }}
          currentConfig={config}
          promptExamples={DEFAULT_KOORD_EXAMPLES}
        />
      )}
    </>
  )
}
