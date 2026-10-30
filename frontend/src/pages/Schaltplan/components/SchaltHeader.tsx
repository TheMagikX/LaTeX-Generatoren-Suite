// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Zap } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'

interface SchaltHeaderProps {
  onReset: () => void
  onCompile: () => void
  isCompiling: boolean
  latexCode: string | null
}

export const SchaltHeader: React.FC<SchaltHeaderProps> = ({
  onReset,
  onCompile,
  isCompiling,
  latexCode
}) => {
  return (
    <GeneratorHeader
      title="Schaltplan"
      icon={<Zap size={24} />}
      version={COMPONENT_VERSIONS.schaltplan}
      onReset={onReset}
      resetConfirmation={{
        title: 'Konfiguration zurücksetzen?',
        message: 'Alle nicht gespeicherten Eingaben gehen verloren. Der Schaltplan wird geleert.',
      }}
      onCompile={onCompile}
      isCompiling={isCompiling}
      showCompileSpinner={false}
      latexCode={latexCode}
      texFilename="schaltplan.tex"
    />
  )
}
