// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { GitGraph, Sparkles } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { Button } from '../../../components/ui'
import { AiPromptDialog } from '../../../components/AiPromptDialog'
import { useAi } from '../../../context/AiContext'
import { COMPONENT_VERSIONS } from '../../versions'
import type { Config } from '../typesBaum'

interface BaumHeaderProps {
  latexCode: string | null;
  isCompiling: boolean;
  onCompile: () => void;
  onReset: () => void;
  onApplyConfig?: (config: Config) => void;
  currentConfig?: Config;
}

export const BaumHeader = ({
  latexCode,
  isCompiling,
  onCompile,
  onReset,
  onApplyConfig,
  currentConfig,
}: BaumHeaderProps) => {
  const [showAiModal, setShowAiModal] = useState(false)
  const { aiEnabled } = useAi()

  return (
    <>
      <GeneratorHeader
        title="Baumdiagramm"
        icon={<GitGraph size={24} />}
        version={COMPONENT_VERSIONS.baumdiagramm}
        onReset={onReset}
        resetConfirmation={{ confirmClass: 'bg-error hover:bg-error/80' }}
        onCompile={onCompile}
        isCompiling={isCompiling}
        latexCode={latexCode}
        texFilename="baumdiagramm.tex"
        actionsBefore={
          aiEnabled && onApplyConfig && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 whitespace-nowrap text-amber-500 hover:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              title="Baumdiagramm per KI-Sprachbefehl konfigurieren"
            >
              <Sparkles size={16} /> KI-Assistent
            </Button>
          )
        }
      />

      {aiEnabled && onApplyConfig && (
        <AiPromptDialog<Config>
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          generator="baumdiagramm"
          generatorTitle="Baumdiagramm"
          onApplyConfig={(newCfg) => {
            onApplyConfig(newCfg)
          }}
          currentConfig={currentConfig}
        />
      )}
    </>
  )
}
