// SPDX-License-Identifier: AGPL-3.0-or-later

import { Triangle } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'
import { DEFAULT_CONFIG } from '../constantsTikz'
import type { TikzConfig } from '../typesTikz'

interface Props {
  setConfig: (config: TikzConfig) => void
  isCompiling: boolean
  onCompile: () => void
  latexCode: string | null
}

export const TikzHeader = ({ setConfig, isCompiling, onCompile, latexCode }: Props) => {
  return (
    <GeneratorHeader
      title="TikZ Picture"
      icon={<Triangle size={24} />}
      version={COMPONENT_VERSIONS.tikz}
      onReset={() => setConfig({ ...DEFAULT_CONFIG })}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="tikzpicture.tex"
    />
  )
}
