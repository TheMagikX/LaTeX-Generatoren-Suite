// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useMemo, useRef } from 'react'
import { Label, Button } from '../../../components/ui'
import { CodeEditor } from '../../../components/CodeEditor'
import { parseLatexLog } from '../../../utils/parseLatexLog'
import type { ErwartungshorizontConfig } from '../typesErwartungshorizont'
import { PlusCircle, Equal, AlignCenter } from 'lucide-react'
import type { EditorView } from '@codemirror/view'

interface Props {
  config: ErwartungshorizontConfig
  updateConfig: (key: keyof ErwartungshorizontConfig, value: unknown) => void
  compileLog: string | null
  latexCode: string | null
}

const ErwartungshorizontTabSnippet: React.FC<Props> = ({
  config,
  updateConfig,
  compileLog,
  latexCode,
}) => {
  const editorViewRef = useRef<EditorView | null>(null)

  const annotations = useMemo(
    () => parseLatexLog(compileLog ?? '', latexCode ?? '', 0),
    [compileLog, latexCode],
  )

  const insertSnippetAtCursor = (
    snippet: string,
    cursorOffsetInside?: number,
    options?: { spacing?: 'single' | 'double' },
  ) => {
    const spacing = options?.spacing ?? 'single'
    const view = editorViewRef.current
    if (view) {
      const { from, to } = view.state.selection.main
      const currentDoc = view.state.doc.toString()

      let prefix = ''
      let suffix = ''
      const beforeChar = from > 0 ? currentDoc[from - 1] : ''
      const afterChar = to < currentDoc.length ? currentDoc[to] : ''

      if (spacing === 'double') {
        if (beforeChar && beforeChar !== '\n') {
          prefix = '\n\n'
        } else if (beforeChar === '\n' && from > 1 && currentDoc[from - 2] !== '\n') {
          prefix = '\n'
        }

        if (afterChar && afterChar !== '\n') {
          suffix = '\n\n'
        }
      } else {
        // Single line spacing: start on a new line if not already at line start,
        // without inserting any blank line before or after.
        if (beforeChar && beforeChar !== '\n') {
          prefix = '\n'
        }
        if (afterChar && afterChar !== '\n') {
          suffix = '\n'
        }
      }

      const textToInsert = prefix + snippet + suffix
      const newCursorPos =
        cursorOffsetInside !== undefined
          ? from + prefix.length + cursorOffsetInside
          : from + textToInsert.length

      view.dispatch({
        changes: { from, to, insert: textToInsert },
        selection: { anchor: newCursorPos },
      })
      view.focus()
    } else {
      // Fallback if view not ready
      const current = config.code
      const separator =
        spacing === 'double'
          ? current.endsWith('\n\n')
            ? ''
            : current.endsWith('\n')
              ? '\n'
              : '\n\n'
          : current.length === 0 || current.endsWith('\n')
            ? ''
            : '\n'
      updateConfig('code', current + separator + snippet)
    }
  }

  const handleAddSubtask = () => {
    const snippet = `\\begin{subtask}\n\n\\end{subtask}`
    insertSnippetAtCursor(snippet, 16, { spacing: 'double' })
  }

  const handleAddAlign = () => {
    const snippet = `\\begin{align*}\n\n\\end{align*}`
    insertSnippetAtCursor(snippet, 15, { spacing: 'single' })
  }

  const handleAddFormula = () => {
    const snippet = `\\begin{equation*}\n\n\\end{equation*}`
    insertSnippetAtCursor(snippet, 18, { spacing: 'single' })
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <Label>Erwartungshorizont LaTeX-Code</Label>
          <p className="text-xs text-ghost">
            Jede <code className="text-primary font-mono">\begin&#123;subtask&#125;</code> Umgebung wird automatisch als eigenständiges Bild &amp; PDF ausgegeben.
          </p>
        </div>

        {/* Quick Insert Snippet Toolbar (insert at cursor) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="secondary"
            className="h-7 px-2 text-xs flex items-center gap-1 bg-raised hover:bg-overlay"
            onClick={handleAddSubtask}
            title="Neue Teilaufgabe (\begin{subtask} ... \end{subtask}) an Cursor-Position einfügen"
          >
            <PlusCircle size={13} className="text-primary" /> + Teilaufgabe
          </Button>

          <Button
            variant="secondary"
            className="h-7 px-2 text-xs flex items-center gap-1 bg-raised hover:bg-overlay"
            onClick={handleAddAlign}
            title="Gleichungskette (align*) an Cursor-Position einfügen"
          >
            <Equal size={13} className="text-blue-400" /> + Gleichung
          </Button>

          <Button
            variant="secondary"
            className="h-7 px-2 text-xs flex items-center gap-1 bg-raised hover:bg-overlay"
            onClick={handleAddFormula}
            title="Zentrierte Formel (\begin{equation*} ... \end{equation*}) an Cursor-Position einfügen"
          >
            <AlignCenter size={13} className="text-emerald-400" /> + Formel
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[420px]">
        <CodeEditor
          value={config.code}
          onChange={v => updateConfig('code', v)}
          height="520px"
          annotations={annotations}
          onViewCreated={(view) => {
            editorViewRef.current = view
          }}
        />
      </div>
    </div>
  )
}

export default ErwartungshorizontTabSnippet
