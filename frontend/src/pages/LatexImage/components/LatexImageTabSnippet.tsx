// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useMemo } from 'react'
import { Label } from '../../../components/ui'
import { CodeEditor } from '../../../components/CodeEditor'
import { parseLatexLog } from '../../../utils/parseLatexLog'
import type { LatexImageConfig } from '../typesLatexImage'

interface Props {
  config: LatexImageConfig
  updateConfig: (key: keyof LatexImageConfig, value: unknown) => void
  compileLog: string | null
  latexCode: string | null
}

const LatexImageTabSnippet: React.FC<Props> = ({
  config,
  updateConfig,
  compileLog,
  latexCode,
}) => {
  const annotations = useMemo(
    () => parseLatexLog(compileLog ?? '', latexCode ?? '', 0),
    [compileLog, latexCode],
  )

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex-1 min-h-[400px]">
        <Label>LaTeX/TikZ Code</Label>
        <CodeEditor
          value={config.code}
          onChange={v => updateConfig('code', v)}
          height="500px"
          annotations={annotations}
        />
      </div>
    </div>
  )
}

export default LatexImageTabSnippet
