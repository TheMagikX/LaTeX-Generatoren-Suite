// SPDX-License-Identifier: AGPL-3.0-or-later

import { Triangle } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'

interface GeoHeaderProps {
  onReset: () => void
  onCompile: () => void
  isCompiling: boolean
  latexCode?: string
}

export const GeoHeader = ({ onReset, onCompile, isCompiling, latexCode }: GeoHeaderProps) => {
  return (
    <GeneratorHeader
      title="Geometrie & Dreiecke"
      icon={<Triangle size={24} />}
      version={COMPONENT_VERSIONS.geometrie}
      onReset={onReset}
      resetConfirmation={false}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="geometrie.tex"
    />
  )
}
