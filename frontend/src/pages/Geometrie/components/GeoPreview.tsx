// SPDX-License-Identifier: AGPL-3.0-or-later

import { Triangle } from 'lucide-react'
import { CodeSection, PreviewCard, FloatingToolbar } from '../../../components/ui'

interface GeoPreviewProps {
  latexCode?: string
  isCompiling: boolean
  compileResult: {
    ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string
  } | null
  dpi: number
  setDpi: (dpi: number) => void
  onDownloadPng: () => void
  onDownloadPdf: () => void
  onDownloadSvg: () => void
  onCopyPng: () => void
}

export const GeoPreview = ({
  latexCode,
  isCompiling,
  compileResult,
  dpi,
  setDpi,
  onDownloadPng,
  onDownloadPdf,
  onDownloadSvg,
  onCopyPng
}: GeoPreviewProps) => {
  return (
    <div className="flex-1 w-full max-w-full h-full min-w-0 min-h-0 flex flex-col gap-4 pb-24 pr-2 overflow-y-auto overflow-x-hidden relative">
      <div className="shrink-0 min-h-[620px] mt-4 flex flex-col">
        <PreviewCard
          isLoading={false}
          isCompiling={isCompiling}
          imgSrc={compileResult?.png_base64 ? `data:image/png;base64,${compileResult.png_base64}` : null}
          errorLog={compileResult?.log || null}
          emptyIcon={<Triangle size={48} />}
        />
      </div>

      <CodeSection
        code={latexCode}
        isLoading={isCompiling}
        onCopy={async () => {
          if (latexCode) await navigator.clipboard.writeText(latexCode)
        }}
      />

      <FloatingToolbar
        dpi={dpi}
        setDpi={setDpi}
        isReady={!!(compileResult?.ok && compileResult.png_base64)}
        onDownloadPng={onDownloadPng}
        onDownloadPdf={onDownloadPdf}
        onDownloadSvg={onDownloadSvg}
        onCopyPng={onCopyPng}
      />
    </div>
  )
}
