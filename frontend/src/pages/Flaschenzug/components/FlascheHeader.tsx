// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Wrench } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import type { HistoryActions } from '../../../hooks/useGeneratorHistory'

interface Props {
  onCompile: () => void
  onReset: () => void
  isCompiling: boolean
  latexCode: string | null
  version: string
  history?: HistoryActions
}

export const FlascheHeader: React.FC<Props> = ({
  onCompile, onReset, isCompiling, latexCode, version, history
}) => {
  return (
    <GeneratorHeader
      title="Flaschenzug"
      icon={<Wrench size={28} />}
      version={version}
      history={history}
      onReset={onReset}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="flaschenzug.tex"
    />
  )
}
