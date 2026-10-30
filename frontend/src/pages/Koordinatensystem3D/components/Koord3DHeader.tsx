// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { Box, Sparkles } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { Button } from '../../../components/ui'
import { AiPromptDialog } from '../../../components/AiPromptDialog'
import { useAi } from '../../../context/AiContext'
import { COMPONENT_VERSIONS } from '../../versions'
import type { Config3D } from '../typesKoord3D'

interface Koord3DHeaderProps {
  latexCode: string | null
  isCompiling: boolean
  onCompile: () => void
  onReset: () => void
  config?: Config3D
  onApplyConfig?: (config: Config3D) => void
}

const DEFAULT_KOORD3D_EXAMPLES = [
  {
    label: '📍 Punkt mit Projektion',
    text: 'Punkt P(2|3|4) mit Hilfslinien und Projektion auf die xy-Grundebene'
  },
  {
    label: '↗️ Zwei Vektoren',
    text: 'Ortsvektor nach A(1|2|3) und Richtungsvektor nach B(3|4|1)'
  },
  {
    label: '🟦 Ebene durch 3 Punkte',
    text: 'Ebene aufgespannt durch A(2|0|0), B(0|3|0) und C(0|0|4) in transparenter blauer Farbe'
  },
  {
    label: '📏 Gerade im Raum',
    text: 'Gerade mit Stützpunkt P(1|1|2) und Richtungsvektor v(2|-1|3)'
  }
]

export const Koord3DHeader = ({
  latexCode,
  isCompiling,
  onCompile,
  onReset,
  config,
  onApplyConfig
}: Koord3DHeaderProps) => {
  const [showAiModal, setShowAiModal] = useState(false)
  const { aiEnabled } = useAi()

  return (
    <>
      <GeneratorHeader
        title="3D Koordinatensystem"
        icon={<Box size={24} />}
        version={COMPONENT_VERSIONS.koordinatensystem_3d}
        onReset={onReset}
        resetConfirmation={{
          title: 'Konfiguration zurücksetzen?',
          message: 'Alle nicht gespeicherten Eingaben gehen verloren. Die Konfiguration wird auf die Standardwerte zurückgesetzt.',
        }}
        onCompile={onCompile}
        isCompiling={isCompiling}
        showCompileSpinner={false}
        latexCode={latexCode}
        texFilename="plot3d.tex"
        actionsBefore={
          aiEnabled && onApplyConfig && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 whitespace-nowrap text-amber-500 hover:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              title="3D-Koordinatensystem per KI-Sprachbefehl konfigurieren"
            >
              <Sparkles size={16} /> KI-Assistent
            </Button>
          )
        }
      />

      {aiEnabled && onApplyConfig && (
        <AiPromptDialog<Config3D>
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          generator="koordinatensystem3d"
          generatorTitle="3D Koordinatensystem"
          onApplyConfig={(newCfg) => {
            onApplyConfig(newCfg)
          }}
          currentConfig={config}
          promptExamples={DEFAULT_KOORD3D_EXAMPLES}
        />
      )}
    </>
  )
}
