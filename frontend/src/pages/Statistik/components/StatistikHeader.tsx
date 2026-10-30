// SPDX-License-Identifier: AGPL-3.0-or-later

import { BarChart2 } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'

interface StatistikHeaderProps {
  onCompile: () => void
  onReset: () => void
  isCompiling: boolean
  latexCode: string | null
}

export const StatistikHeader = ({
  onCompile,
  onReset,
  isCompiling,
  latexCode
}: StatistikHeaderProps) => {
  return (
    <GeneratorHeader
      title="Statistik"
      icon={<BarChart2 size={24} />}
      version={COMPONENT_VERSIONS.statistik}
      onReset={onReset}
      onCompile={onCompile}
      isCompiling={isCompiling}
      latexCode={latexCode}
      texFilename="statistik.tex"
    />
  )
}
