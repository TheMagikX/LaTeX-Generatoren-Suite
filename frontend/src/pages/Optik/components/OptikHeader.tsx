// SPDX-License-Identifier: AGPL-3.0-or-later

import { Microscope } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'
import type { OptikConfig } from '../typesOptik'
import { DEFAULT_CONFIG } from '../constantsOptik'

interface OptikHeaderProps {
  config: OptikConfig
  setConfig: (config: OptikConfig) => void
  isCompiling: boolean
  handleCompile: () => void
  latexCode?: string
}

export const OptikHeader = ({
  setConfig,
  isCompiling,
  handleCompile,
  latexCode
}: OptikHeaderProps) => {
  return (
    <GeneratorHeader
      title="Optik"
      icon={<Microscope size={24} />}
      version={COMPONENT_VERSIONS.optikgenerator}
      onReset={() => setConfig({ ...DEFAULT_CONFIG })}
      onCompile={handleCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="optik_linse.tex"
    />
  )
}
