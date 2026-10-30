// SPDX-License-Identifier: AGPL-3.0-or-later

import { BarChart2, Layers, Hash } from 'lucide-react'
import { Card, CodeSection, PreviewCard, FloatingToolbar } from '../../../components/ui'
import type { CompileResponse } from '../../../api/client'
import type { StatistikResult } from '../typesStatistik'

interface StatistikPreviewProps {
  latexCode: string | null
  compileData: CompileResponse | null
  isCompiling: boolean
  previewDpi: number
  setPreviewDpi: (dpi: number) => void
  results: StatistikResult[]
}

export const StatistikPreview = ({
  latexCode,
  compileData,
  isCompiling,
  previewDpi,
  setPreviewDpi,
  results
}: StatistikPreviewProps) => {

  const downloadPng = () => {
    if (!compileData?.png_base64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${compileData.png_base64}`
    link.download = 'statistik.png'
    link.click()
  }

  const downloadPdf = () => {
    if (!compileData?.pdf_base64) return
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${compileData.pdf_base64}`
    link.download = 'statistik.pdf'
    link.click()
  }

  const downloadSvg = () => {
    if (!compileData?.svg_base64) return
    const link = document.createElement('a')
    link.href = `data:image/svg+xml;base64,${compileData.svg_base64}`
    link.download = 'statistik.svg'
    link.click()
  }

  const onCopyPng = async () => {
    if (!compileData?.png_base64) return
    const blob = await (await fetch(`data:image/png;base64,${compileData.png_base64}`)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  }

  const copyLatexToClipboard = async () => {
    if (!latexCode) return
    await navigator.clipboard.writeText(latexCode)
  }

  return (
    <div className="w-[450px] flex flex-col gap-6 overflow-y-auto pr-2">
      <Card className="flex-none flex flex-col p-6 bg-panel border-line relative shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers size={20} className="text-primary" /> Vorschau
          </h2>
          {isCompiling && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* LaTeX code preview */}
        <CodeSection
          code={latexCode ?? undefined}
          isLoading={isCompiling}
          onCopy={copyLatexToClipboard}
        />

        {/* Image preview */}
        <div className="flex-1 mt-4">
          <PreviewCard
            isLoading={false}
            isCompiling={isCompiling}
            imgSrc={compileData?.png_base64 ? `data:image/png;base64,${compileData.png_base64}` : null}
            errorLog={compileData?.log || null}
            emptyIcon={<BarChart2 size={48} />}
          />
        </div>

        <FloatingToolbar
          dpi={previewDpi}
          setDpi={setPreviewDpi}
          isReady={!!(compileData?.ok && compileData.png_base64)}
          onDownloadPng={downloadPng}
          onDownloadPdf={downloadPdf}
          onDownloadSvg={downloadSvg}
          onCopyPng={onCopyPng}
        />
      </Card>

      {results.length > 0 && (
        <Card className="p-6 bg-panel border-line shadow-2xl">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Hash size={20} className="text-primary" /> Kennwerte
          </h2>
          <div className="space-y-4">
            {results.map((res, i) => (
              <div key={i} className="space-y-2">
                <div className="text-sm font-medium text-ink border-b border-line pb-1">{res.name}</div>
                {res.params && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="text-ghost">Min: <span className="text-ink">{res.params.min.toFixed(2)}</span></div>
                    <div className="text-ghost">Max: <span className="text-ink">{res.params.max.toFixed(2)}</span></div>
                    <div className="text-ghost">Q1: <span className="text-ink">{res.params.q1.toFixed(2)}</span></div>
                    <div className="text-ghost">Q3: <span className="text-ink">{res.params.q3.toFixed(2)}</span></div>
                    <div className="text-ghost font-bold">Med: <span className="text-ink">{res.params.median.toFixed(2)}</span></div>
                    <div className="text-ghost">Mean: <span className="text-ink">{res.params.mean?.toFixed(2) ?? '–'}</span></div>
                    {res.params.std_dev !== undefined && (
                      <div className="text-ghost">s: <span className="text-ink">{res.params.std_dev.toFixed(4)}</span></div>
                    )}
                    {res.params.variance !== undefined && (
                      <div className="text-ghost">s²: <span className="text-ink">{res.params.variance.toFixed(4)}</span></div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
