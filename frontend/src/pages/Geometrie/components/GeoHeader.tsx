// SPDX-License-Identifier: AGPL-3.0-or-later

import { Triangle } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'
import type { HistoryActions } from '../../../hooks/useGeneratorHistory'

interface GeoHeaderProps {
  onReset: () => void
  onCompile: () => void
  isCompiling: boolean
  latexCode?: string
  history?: HistoryActions
}

export const GeoHeader = ({ onReset, onCompile, isCompiling, latexCode, history }: GeoHeaderProps) => {
  return (
    <GeneratorHeader
      title="Geometrie & Dreiecke"
      icon={<Triangle size={24} />}
      version={COMPONENT_VERSIONS.geometrie}
      history={history}
      onReset={onReset}
      resetConfirmation={false}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="geometrie.tex"
    />
  )
}
