// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'
import { ListChecks } from 'lucide-react'

interface Props {
  latexCode: string | null
  isCompiling: boolean
  onCompile: () => void
  onReset: () => void
}

const ErwartungshorizontHeader: React.FC<Props> = ({
  latexCode,
  isCompiling,
  onCompile,
  onReset,
}) => {
  return (
    <GeneratorHeader
      title="Erwartungshorizont / Musterlösung"
      icon={<ListChecks size={24} />}
      version={COMPONENT_VERSIONS.erwartungshorizont}
      onReset={onReset}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="erwartungshorizont.tex"
    />
  )
}

export default ErwartungshorizontHeader
