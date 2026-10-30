// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { FileText, CheckCircle2, Printer, X } from 'lucide-react'
import { Button, FloatingToolbar, CodeSection } from '../../../components/ui'
import { downloadFile, downloadPdf, handlePrint, handleCopy } from '../utilsArbeitsblatt'
import type { ArbeitsblattConfig } from '../typesArbeitsblatt'
import MultiPageViewer from './MultiPageViewer'

interface CompileResult {
  ok: boolean
  png_base64?: string
  pdf_base64?: string
  svg_base64?: string
  pages_png_base64?: string[]
  log?: string
}

interface GeneratedLatex {
  latex_tasks?: string
  latex_solutions?: string
}

interface Props {
  config: ArbeitsblattConfig
  dpi: number
  setDpi: (dpi: number) => void
  isGenerating: boolean
  isCompilingTasks: boolean
  isCompilingSols: boolean
  compileTasks: CompileResult | null
  compileSols: CompileResult | null
  genData: GeneratedLatex | null
}

export default function ArbeitsblattPreview({
  config,
  dpi,
  setDpi,
  isGenerating,
  isCompilingTasks,
  isCompilingSols,
  compileTasks,
  compileSols,
  genData
}: Props) {
  const [fullscreenPages, setFullscreenPages] = useState<string[] | null>(null)

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col gap-4 min-w-0">
      <div className="flex flex-col md:flex-row min-h-0 flex-1 gap-4 min-w-0">
        {/* Assignment Preview */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 gap-2 flex-wrap min-w-0">
            <div className="flex items-center gap-2 text-section-label shrink-0">
              <FileText size={14} /> Aufgabenblatt
            </div>
            {compileTasks?.pdf_base64 && (
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="primary"
                  className="h-7 px-2.5 text-mono-xs flex items-center justify-center gap-1"
                  onClick={() => downloadPdf(compileTasks.pdf_base64!, `Arbeitsblatt - ${config.header_title}.pdf`)}
                >
                  <FileText size={12} /> PDF
                </Button>
                <Button
                  variant="primary"
                  className="h-7 px-2.5 text-mono-xs flex items-center justify-center gap-1"
                  onClick={() => handlePrint(compileTasks.pdf_base64!)}
                >
                  <Printer size={12} /> Drucken
                </Button>
              </div>
            )}
          </div>
          <MultiPageViewer
            pages={compileTasks?.pages_png_base64 ?? (compileTasks?.png_base64 ? [compileTasks.png_base64] : [])}
            isLoading={isCompilingTasks || isGenerating}
            errorLog={(!isCompilingTasks && !isGenerating && compileTasks && !compileTasks.ok) ? compileTasks.log : null}
            onFullscreen={compileTasks?.png_base64 || compileTasks?.pages_png_base64?.length
              ? () => setFullscreenPages(compileTasks.pages_png_base64 ?? (compileTasks.png_base64 ? [compileTasks.png_base64] : []))
              : undefined}
          />
        </div>

        {/* Solutions Preview */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 gap-2 flex-wrap min-w-0">
            <div className="flex items-center gap-2 text-section-label text-emerald-500 shrink-0">
              <CheckCircle2 size={14} /> Lösungen
            </div>
            {compileSols?.pdf_base64 && (
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="primary"
                  className="h-7 px-2.5 text-mono-xs flex items-center justify-center gap-1"
                  onClick={() => downloadPdf(compileSols.pdf_base64!, `Arbeitsblatt - ${config.header_title} - Lösungen.pdf`)}
                >
                  <FileText size={12} /> PDF
                </Button>
                <Button
                  variant="primary"
                  className="h-7 px-2.5 text-mono-xs flex items-center justify-center gap-1"
                  onClick={() => handlePrint(compileSols.pdf_base64!)}
                >
                  <Printer size={12} /> Drucken
                </Button>
              </div>
            )}
          </div>
          <MultiPageViewer
            pages={compileSols?.pages_png_base64 ?? (compileSols?.png_base64 ? [compileSols.png_base64] : [])}
            isLoading={isCompilingSols || isGenerating}
            errorLog={(!isCompilingSols && !isGenerating && compileSols && !compileSols.ok) ? compileSols.log : null}
            onFullscreen={compileSols?.png_base64 || compileSols?.pages_png_base64?.length
              ? () => setFullscreenPages(compileSols.pages_png_base64 ?? (compileSols.png_base64 ? [compileSols.png_base64] : []))
              : undefined}
          />
        </div>
      </div>

      <FloatingToolbar
        dpi={dpi}
        setDpi={setDpi}
        isReady={!!compileTasks?.png_base64}
        onDownloadPng={() => {
          if (compileTasks?.png_base64) downloadFile(compileTasks.png_base64, 'arbeitsblatt.png', 'image/png')
        }}
        onDownloadPdf={() => {
          if (compileTasks?.pdf_base64) downloadPdf(compileTasks.pdf_base64, `Arbeitsblatt - ${config.header_title}.pdf`)
        }}
        onDownloadSvg={compileTasks?.svg_base64 ? () => {
          downloadFile(compileTasks!.svg_base64!, 'arbeitsblatt.svg', 'image/svg+xml')
        } : undefined}
        onCopyPng={async () => {
          if (!compileTasks?.png_base64) return
          const blob = await (await fetch(`data:image/png;base64,${compileTasks.png_base64}`)).blob()
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        }}
      />

      <div className="grid shrink-0 grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        <CodeSection
          code={genData?.latex_tasks}
          isLoading={isGenerating}
          onCopy={() => handleCopy(genData?.latex_tasks || '')}
        />
        <CodeSection
          code={genData?.latex_solutions}
          isLoading={isGenerating}
          onCopy={() => handleCopy(genData?.latex_solutions || '')}
        />
      </div>

      {fullscreenPages && (
        <div className="fixed inset-0 z-50 bg-canvas/95 backdrop-blur flex flex-col p-6 items-center justify-center">
          <button
            onClick={() => setFullscreenPages(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-panel border border-line text-ghost hover:text-ink hover:bg-raised transition-colors shadow-xl z-10"
          >
            <X size={24} />
          </button>
          <div className="w-full h-full max-w-5xl flex flex-col bg-panel border border-line rounded-2xl shadow-2xl p-4 min-h-0">
            <MultiPageViewer pages={fullscreenPages} scrollable />
          </div>
        </div>
      )}
    </div>
  )
}
