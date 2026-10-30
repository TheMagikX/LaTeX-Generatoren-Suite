// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Wrench } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'

interface Props {
  onCompile: () => void
  onReset: () => void
  isCompiling: boolean
  latexCode: string | null
  version: string
}

export const FlascheHeader: React.FC<Props> = ({
  onCompile, onReset, isCompiling, latexCode, version
}) => {
  return (
    <GeneratorHeader
      title="Flaschenzug"
      icon={<Wrench size={28} />}
      version={version}
      onReset={onReset}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="flaschenzug.tex"
    />
  )
}
