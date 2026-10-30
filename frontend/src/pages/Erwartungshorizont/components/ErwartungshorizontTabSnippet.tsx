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

const getNextSubtaskLetter = (code: string): string => {
  const matches = Array.from(code.matchAll(/\\textbf\{([a-zA-Z])\)\}/g))
  if (matches.length === 0) {
    const subtaskCount = (code.match(/\\begin\{subtask\}/g) || []).length
    return String.fromCharCode(97 + subtaskCount)
  }
  const lastChar = matches[matches.length - 1][1].toLowerCase()
  return String.fromCharCode(lastChar.charCodeAt(0) + 1)
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

  const insertSnippetAtCursor = (snippet: string, cursorOffsetInside?: number) => {
    const view = editorViewRef.current
    if (view) {
      const { from, to } = view.state.selection.main
      const currentDoc = view.state.doc.toString()

      // Ensure neat spacing around block environments if inserting on a line with content
      let textToInsert = snippet
      const beforeChar = from > 0 ? currentDoc[from - 1] : ''
      const afterChar = to < currentDoc.length ? currentDoc[to] : ''

      if (beforeChar && beforeChar !== '\n') {
        textToInsert = '\n\n' + textToInsert
      } else if (beforeChar === '\n' && from > 1 && currentDoc[from - 2] !== '\n') {
        textToInsert = '\n' + textToInsert
      }

      if (afterChar && afterChar !== '\n') {
        textToInsert = textToInsert + '\n\n'
      }

      const newCursorPos = cursorOffsetInside !== undefined
        ? from + (textToInsert.length - snippet.length) + cursorOffsetInside
        : from + textToInsert.length

      view.dispatch({
        changes: { from, to, insert: textToInsert },
        selection: { anchor: newCursorPos },
      })
      view.focus()
    } else {
      // Fallback if view not ready
      const current = config.code
      const separator = current.endsWith('\n\n') ? '' : current.endsWith('\n') ? '\n' : '\n\n'
      updateConfig('code', current + separator + snippet)
    }
  }

  const handleAddSubtask = () => {
    const nextLetter = getNextSubtaskLetter(config.code)
    const snippet = `\\begin{subtask}\n\\textbf{${nextLetter})} \n\\end{subtask}`
    insertSnippetAtCursor(snippet, 16 + nextLetter.length + 4)
  }

  const handleAddAlign = () => {
    const snippet = `\\begin{align*}\n\n\\end{align*}`
    insertSnippetAtCursor(snippet, 15)
  }

  const handleAddFormula = () => {
    const snippet = `\\begin{equation*}\n\n\\end{equation*}`
    // place cursor on the empty line inside \[ ... \]
    insertSnippetAtCursor(snippet, 18)
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
            title="Neue Teilaufgabe (mit automatischer Fortzählung der Buchstaben a, b, c...) an Cursor-Position einfügen"
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
