// SPDX-License-Identifier: AGPL-3.0-or-later

import { Box } from 'lucide-react'
import { Card, CodeSection, PreviewCard, FloatingToolbar } from '../../../components/ui'

interface Koord3DPreviewProps {
  latexCode: string | null
  compileData: { ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string } | null
  isCompiling: boolean
  previewDpi: number
  setPreviewDpi: (dpi: number) => void
}

export const Koord3DPreview = ({ latexCode, compileData, isCompiling, previewDpi, setPreviewDpi }: Koord3DPreviewProps) => {
  const downloadPng = () => {
    if (!compileData?.png_base64) return
    const link = document.createElement('a'); link.href = `data:image/png;base64,${compileData.png_base64}`; link.download = 'koordinatensystem3d.png'; link.click()
  }
  const downloadPdf = () => {
    if (!compileData?.pdf_base64) return
    const link = document.createElement('a'); link.href = `data:application/pdf;base64,${compileData.pdf_base64}`; link.download = 'koordinatensystem3d.pdf'; link.click()
  }
  const downloadSvg = () => {
    if (!compileData?.svg_base64) return
    const link = document.createElement('a'); link.href = `data:image/svg+xml;base64,${compileData.svg_base64}`; link.download = 'koordinatensystem3d.svg'; link.click()
  }
  const copyToClipboard = async () => {
    if (!compileData?.png_base64) return
    const blob = await (await fetch(`data:image/png;base64,${compileData.png_base64}`)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  }

  const copyLatexToClipboard = async () => {
    if (!latexCode) return
    await navigator.clipboard.writeText(latexCode)
  }

  return (
    <div className="w-[450px] flex flex-col gap-6">
      <Card className="flex-1 flex flex-col p-6 bg-panel border-line relative shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Box size={20} className="text-primary" /> Vorschau
          </h2>
          {isCompiling && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </div>

        <CodeSection
          code={latexCode ?? undefined}
          isLoading={isCompiling}
          onCopy={copyLatexToClipboard}
        />

        <div className="flex-1 mt-4">
          <PreviewCard
            isLoading={false}
            isCompiling={isCompiling}
            imgSrc={compileData?.png_base64 ? `data:image/png;base64,${compileData.png_base64}` : null}
            errorLog={compileData?.log || null}
            emptyIcon={<Box size={48} />}
          />
        </div>
        <FloatingToolbar
          dpi={previewDpi}
          setDpi={setPreviewDpi}
          isReady={!!(compileData?.ok && compileData.png_base64)}
          onDownloadPng={downloadPng}
          onDownloadPdf={compileData?.pdf_base64 ? downloadPdf : undefined}
          onDownloadSvg={compileData?.svg_base64 ? downloadSvg : undefined}
          onCopyPng={copyToClipboard}
        />
      </Card>
    </div>
  )
}
