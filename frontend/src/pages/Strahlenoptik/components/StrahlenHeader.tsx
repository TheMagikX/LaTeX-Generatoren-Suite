// SPDX-License-Identifier: AGPL-3.0-or-later

import { Flashlight } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'
import { DEFAULT_CONFIG } from '../constantsStrahlen'
import type { StrahlenoptikConfig } from '../typesStrahlen'

interface StrahlenHeaderProps {
  config: StrahlenoptikConfig
  setConfig: (config: StrahlenoptikConfig) => void
  onCompile: () => void
  isCompiling: boolean
  latexCode: string | null
}

export const StrahlenHeader = ({
  setConfig,
  onCompile,
  isCompiling,
  latexCode
}: StrahlenHeaderProps) => {
  return (
    <GeneratorHeader
      title="Strahlenoptik"
      icon={<Flashlight size={24} />}
      version={COMPONENT_VERSIONS.strahlenoptik}
      onReset={() => setConfig({ ...DEFAULT_CONFIG })}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="strahlenoptik.tex"
    />
  )
}
