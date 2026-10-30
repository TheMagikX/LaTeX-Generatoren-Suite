// SPDX-License-Identifier: AGPL-3.0-or-later

import { useMemo } from 'react'
import { useTheme } from '../context/useTheme'
import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { stex } from '@codemirror/legacy-modes/mode/stex'
import { python } from '@codemirror/lang-python'
import {
  EditorView,
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type ViewUpdate,
  GutterMarker,
  gutter,
  keymap,
} from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import type { ErrorAnnotation } from '../utils/parseLatexLog'

export type { ErrorAnnotation }

const latexLanguage = StreamLanguage.define(stex)

const editorTheme = EditorView.theme({
  '&': { fontSize: '13px', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)' },
  '.cm-content': {
    padding: '12px 8px',
    fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-raised)',
    borderRight: '1px solid var(--color-line)',
    minWidth: '3em',
    color: 'var(--color-muted)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    color: 'var(--color-muted)',
    padding: '0 8px',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--color-overlay) 40%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'color-mix(in srgb, var(--color-overlay) 40%, transparent)' },
  '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--color-primary)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--color-raised)',
    border: '1px solid var(--color-line)',
    borderRadius: '3px',
    padding: '0 4px',
    color: 'var(--color-muted)',
  },
  '.cm-error-line': {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderLeft: '3px solid var(--color-error)',
  },
  '.cm-error-gutter': {
    width: '14px',
    borderRight: '1px solid var(--color-line)',
  },
})

/* ── Gutter marker: a red dot with the error message as a native tooltip ── */
class ErrorDot extends GutterMarker {
  readonly msg: string
  constructor(msg: string) {
    super()
    this.msg = msg
  }
  toDOM() {
    const el = document.createElement('span')
    el.textContent = '●'
    el.style.cssText = 'color:#ef4444;font-size:10px;cursor:default;display:block;text-align:center'
    el.title = this.msg
    return el
  }
}

/* ── Build error-highlighting extensions from an annotation array ── */
function buildErrorExtensions(annotations: ErrorAnnotation[]) {
  if (annotations.length === 0) return []

  const errorMap = new Map(annotations.map(a => [a.line, a.message]))
  const lineDeco = Decoration.line({ class: 'cm-error-line' })

  const highlightPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(view: EditorView) { this.decorations = this.build(view) }
      update(u: ViewUpdate) { if (u.docChanged) this.decorations = this.build(u.view) }
      build(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>()
        const sorted = [...errorMap.keys()].sort((a, b) => a - b)
        for (const ln of sorted) {
          if (ln >= 1 && ln <= view.state.doc.lines) {
            const pos = view.state.doc.line(ln).from
            builder.add(pos, pos, lineDeco)
          }
        }
        return builder.finish()
      }
    },
    { decorations: v => v.decorations },
  )

  const errorGutter = gutter({
    class: 'cm-error-gutter',
    lineMarker(view, line) {
      const ln = view.state.doc.lineAt(line.from).number
      const msg = errorMap.get(ln)
      return msg != null ? new ErrorDot(msg) : null
    },
    initialSpacer: () => new ErrorDot(''),
  })

  return [highlightPlugin, errorGutter]
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: string
  height?: string
  placeholder?: string
  annotations?: ErrorAnnotation[]
  onViewCreated?: (view: EditorView) => void
}

export const CodeEditor = ({
  value,
  onChange,
  language = 'latex',
  height = '400px',
  placeholder = '% Gib hier deinen Code ein...',
  annotations = [],
  onViewCreated,
}: CodeEditorProps) => {
  const { theme } = useTheme()
  const isDark = !['light', 'himmel', 'sepia', 'rose'].includes(theme)

  const lang = useMemo(() => {
    if (language === 'python') return python()
    return latexLanguage
  }, [language])

  const errorExts = useMemo(() => buildErrorExtensions(annotations), [annotations])

  const preventModEnterKeymap = useMemo(
    () =>
      keymap.of([
        {
          key: 'Mod-Enter',
          run: () => true,
        },
      ]),
    [],
  )

  const extensions = useMemo(
    () => [lang, editorTheme, EditorView.lineWrapping, preventModEnterKeymap, ...errorExts],
    [lang, preventModEnterKeymap, errorExts],
  )

  return (
    <div className="rounded-xl overflow-hidden border border-line focus-within:ring-2 focus-within:ring-primary transition-all">
      <CodeMirror
        value={value}
        onChange={onChange}
        onCreateEditor={onViewCreated}
        extensions={extensions}
        height={height}
        theme={isDark ? 'dark' : 'light'}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          bracketMatching: true,
          autocompletion: true,
          indentOnInput: true,
          dropCursor: false,
          allowMultipleSelections: false,
          searchKeymap: true,
        }}
      />
    </div>
  )
}
