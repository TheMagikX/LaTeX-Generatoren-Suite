// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { PreviewCard, FloatingToolbar, CodeSection } from '../../../components/ui'
import { Code } from 'lucide-react'

interface Props {
  latexCode: string | null
  compileData: {
    ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string
  } | null
  isCompiling: boolean
  previewDpi: number
  setPreviewDpi: (dpi: number) => void
}

const LatexImagePreview: React.FC<Props> = ({
  latexCode,
  compileData,
  isCompiling,
  previewDpi,
  setPreviewDpi
}) => {
  const downloadPng = () => {
    if (!compileData?.png_base64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${compileData.png_base64}`
    link.download = 'lateximage.png'
    link.click()
  }

  const downloadPdf = () => {
    if (!compileData?.pdf_base64) return
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${compileData.pdf_base64}`
    link.download = 'lateximage.pdf'
    link.click()
  }

  const downloadSvg = () => {
    if (!compileData?.svg_base64) return
    const link = document.createElement('a')
    link.href = `data:image/svg+xml;base64,${compileData.svg_base64}`
    link.download = 'lateximage.svg'
    link.click()
  }

  const copyPngToClipboard = async () => {
    if (!compileData?.png_base64) return
    const response = await fetch(`data:image/png;base64,${compileData.png_base64}`)
    const blob = await response.blob()
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
  }

  const copyLatexToClipboard = async () => {
    if (!latexCode) return
    await navigator.clipboard.writeText(latexCode)
  }

  return (
    <div className="flex-1 flex flex-col gap-6 relative">
      <PreviewCard
        isLoading={false}
        isCompiling={isCompiling}
        imgSrc={compileData?.ok ? `data:image/png;base64,${compileData.png_base64}` : null}
        errorLog={compileData?.log || null}
        emptyIcon={<Code size={48} />}
      />

      <FloatingToolbar
        dpi={previewDpi}
        setDpi={setPreviewDpi}
        isReady={!!compileData?.ok}
        onDownloadPng={downloadPng}
        onDownloadPdf={downloadPdf}
        onCopyPng={copyPngToClipboard}
        onDownloadSvg={downloadSvg}
      />

      <CodeSection
        code={latexCode ?? undefined}
        isLoading={isCompiling}
        onCopy={copyLatexToClipboard}
      />
    </div>
  )
}

export default LatexImagePreview
