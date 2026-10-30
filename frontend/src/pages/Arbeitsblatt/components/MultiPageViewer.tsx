// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, Maximize } from 'lucide-react'

interface Props {
  pages: string[]
  isLoading?: boolean
  errorLog?: string | null
  onFullscreen?: () => void
  scrollable?: boolean
}

export default function MultiPageViewer({ pages, isLoading, errorLog, onFullscreen, scrollable = false }: Props) {
  const [currentPage, setCurrentPage] = useState(0)

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-panel border border-line rounded-2xl min-h-[220px] md:min-h-[280px] min-w-0">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-ghost">Wird kompiliert…</span>
      </div>
    )
  }

  if (errorLog) {
    return (
      <div className="flex-1 flex flex-col bg-panel border border-line rounded-2xl overflow-hidden min-h-[220px] md:min-h-[280px] min-w-0">
        <div className="p-3 bg-red-950/40 border-b border-red-900/50 text-red-300 text-xs font-semibold">
          LaTeX Fehler
        </div>
        <pre className="p-3 text-[11px] text-red-200/80 overflow-auto flex-1 whitespace-pre-wrap">{errorLog}</pre>
      </div>
    )
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-panel border border-line rounded-2xl min-h-[220px] md:min-h-[280px] min-w-0 text-ghost">
        <Eye size={40} className="opacity-30" />
        <span className="text-sm">Noch keine Vorschau</span>
      </div>
    )
  }

  const page = Math.min(currentPage, pages.length - 1)
  const totalPages = pages.length

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-0 w-full">
      <div className="h-8 flex items-center justify-center">
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded-lg hover:bg-raised disabled:opacity-30 transition-colors text-muted hover:text-ink"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-ghost font-mono">
              Seite {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1 rounded-lg hover:bg-raised disabled:opacity-30 transition-colors text-muted hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div
        className={`flex-1 bg-panel border border-line rounded-2xl flex justify-center p-3 min-h-[220px] md:min-h-[280px] min-w-0 ${
          scrollable ? 'overflow-auto items-start' : 'overflow-hidden items-center'
        }`}
      >
        <div
          className={`relative min-w-0 ${scrollable ? 'w-full flex justify-center' : 'max-w-full max-h-full'}`}
          style={scrollable ? undefined : { maxHeight: '100%' }}
        >
          <img
            src={`data:image/png;base64,${pages[page]}`}
            alt={`Seite ${page + 1}`}
            className={`max-w-full rounded-lg shadow-lg ${
              scrollable ? 'h-auto object-contain' : 'max-h-full object-contain'
            }`}
            style={scrollable ? undefined : { maxHeight: '100%' }}
          />
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              title="Vollbild"
              className="absolute top-2 right-2 h-8 w-8 inline-flex items-center justify-center rounded-lg bg-panel/90 hover:bg-overlay border border-line text-ghost hover:text-ink transition-colors shadow-lg backdrop-blur"
            >
              <Maximize size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-7 flex items-center justify-center">
        {totalPages > 1 && (
          <div className="flex gap-1.5 justify-center flex-wrap">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-6 h-6 text-[10px] rounded-md font-mono transition-colors ${
                  i === page
                    ? 'bg-primary text-canvas font-bold'
                    : 'bg-raised text-ghost hover:text-ink hover:bg-overlay'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
