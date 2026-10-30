// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'
import { Code } from 'lucide-react'

interface Props {
  latexCode: string | null
  isCompiling: boolean
  onCompile: () => void
  onReset: () => void
}

const LatexImageHeader: React.FC<Props> = ({
  latexCode,
  isCompiling,
  onCompile,
  onReset
}) => {
  return (
    <GeneratorHeader
      title="LaTeX Image"
      icon={<Code size={24} />}
      version={COMPONENT_VERSIONS.latex}
      onReset={onReset}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="lateximage.tex"
    />
  )
}

export default LatexImageHeader
