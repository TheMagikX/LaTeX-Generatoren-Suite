// SPDX-License-Identifier: AGPL-3.0-or-later

import { PieChart, Plus } from 'lucide-react'
import { Card, PreviewCard, FloatingToolbar, CodeSection } from '../../../components/ui'
import type { BruchConfig, CompileResult } from '../typesBruch'

interface BruchPreviewProps {
  config: BruchConfig
  isCompiling: boolean
  latexCode: string | null
  mainPreview: CompileResult | null
  erweiternPreview: CompileResult | null
  kuerzenPreview: CompileResult | null
  dpi: number
  setDpi: (dpi: number) => void
}

export function BruchPreview({
  config,
  isCompiling,
  latexCode,
  mainPreview,
  erweiternPreview,
  kuerzenPreview,
  dpi,
  setDpi,
}: BruchPreviewProps) {
  const downloadPng = () => {
    if (!mainPreview?.png_base64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${mainPreview.png_base64}`
    link.download = `bruch_${config.zaehler}_${config.nenner}.png`
    link.click()
  }

  const downloadPdf = () => {
    if (!mainPreview?.pdf_base64) return
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${mainPreview.pdf_base64}`
    link.download = `bruch_${config.zaehler}_${config.nenner}.pdf`
    link.click()
  }

  const downloadSvg = () => {
    if (!mainPreview?.svg_base64) return
    const link = document.createElement('a')
    link.href = `data:image/svg+xml;base64,${mainPreview.svg_base64}`
    link.download = `bruch_${config.zaehler}_${config.nenner}.svg`
    link.click()
  }

  const onCopyPng = async () => {
    if (!mainPreview?.png_base64) return
    const response = await fetch(`data:image/png;base64,${mainPreview.png_base64}`)
    const blob = await response.blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  }

  return (
    <div className="w-[500px] flex flex-col gap-4 sticky top-0 h-full overflow-y-auto pb-20">
      <Card className="flex-1 flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-line flex justify-between items-center bg-panel/50">
          <span className="text-sm font-bold text-ink flex items-center gap-2">🔍 Hauptansicht</span>
        </div>
        <PreviewCard
          isLoading={false}
          isCompiling={isCompiling}
          imgSrc={mainPreview?.ok ? `data:image/png;base64,${mainPreview.png_base64}` : null}
          errorLog={mainPreview?.ok ? null : (mainPreview?.log ?? null)}
          emptyIcon={<PieChart size={48} />}
        />
      </Card>

      {config.show_erweitern && (
        <Card className="flex-1 flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-line flex justify-between items-center bg-panel/50">
            <span className="text-sm font-bold text-ink flex items-center gap-2">
              ✖️ Erweitern: {config.zaehler}/{config.nenner} &rarr; {config.zaehler * config.erweiter_faktor}/
              {config.nenner * config.erweiter_faktor}
            </span>
          </div>
          <PreviewCard
            isLoading={false}
            isCompiling={isCompiling}
            imgSrc={erweiternPreview?.ok ? `data:image/png;base64,${erweiternPreview.png_base64}` : null}
            errorLog={erweiternPreview?.ok ? null : (erweiternPreview?.log ?? null)}
            emptyIcon={<Plus size={48} />}
          />
        </Card>
      )}

      {config.show_kuerzen && (
        <Card className="flex-1 flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-line flex justify-between items-center bg-panel/50">
            <span className="text-sm font-bold text-ink flex items-center gap-2">➗ Kürzen</span>
          </div>
          <PreviewCard
            isLoading={false}
            isCompiling={isCompiling}
            imgSrc={kuerzenPreview?.ok ? `data:image/png;base64,${kuerzenPreview.png_base64}` : null}
            errorLog={kuerzenPreview?.ok ? null : (kuerzenPreview?.log ?? null)}
            emptyIcon={<PieChart size={48} />}
          />
        </Card>
      )}

      <CodeSection
        isLoading={isCompiling}
        code={latexCode ?? undefined}
        onCopy={() => navigator.clipboard.writeText(latexCode || '')}
      />

      <FloatingToolbar
        dpi={dpi}
        setDpi={setDpi}
        isReady={!!(mainPreview?.ok && mainPreview.png_base64)}
        onDownloadPng={downloadPng}
        onDownloadPdf={downloadPdf}
        onDownloadSvg={downloadSvg}
        onCopyPng={onCopyPng}
      />
    </div>
  )
}
