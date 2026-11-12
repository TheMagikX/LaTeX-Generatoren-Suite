// SPDX-License-Identifier: AGPL-3.0-or-later

import { BarChart2 } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'
import type { HistoryActions } from '../../../hooks/useGeneratorHistory'

interface StatistikHeaderProps {
  onCompile: () => void
  onReset: () => void
  isCompiling: boolean
  latexCode: string | null
  history?: HistoryActions
}

export const StatistikHeader = ({
  onCompile,
  onReset,
  isCompiling,
  latexCode,
  history,
}: StatistikHeaderProps) => {
  return (
    <GeneratorHeader
      title="Statistik"
      icon={<BarChart2 size={24} />}
      version={COMPONENT_VERSIONS.statistik}
      history={history}
      onReset={onReset}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="statistik.tex"
    />
  )
}
