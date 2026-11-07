// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Wrench } from 'lucide-react'
import { PreviewCard, FloatingToolbar, CodeSection } from '../../../components/ui'
import { triggerFileDownload } from '../../../api/client'

interface Props {
  latexCode: string | null
  compileResult: {
    ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string
  } | null
  isCompiling: boolean
  dpi: number
  setDpi: (v: number) => void
  handleCopyCode: () => void
}

export const FlaschePreview: React.FC<Props> = ({
  latexCode, compileResult, isCompiling, dpi, setDpi, handleCopyCode
}) => {
  const imgSrc = compileResult?.png_base64
    ? `data:image/png;base64,${compileResult.png_base64}`
    : null

  return (
    <div className="flex-1 w-full max-w-full h-full min-w-0 min-h-0 flex flex-col gap-4 pb-24 pr-2 overflow-y-auto overflow-x-hidden relative">
      <div className="shrink-0 min-h-[620px] mt-4 flex flex-col">
        <PreviewCard
          isLoading={false}
          isCompiling={isCompiling}
          imgSrc={imgSrc}
          errorLog={compileResult?.ok === false ? (compileResult.log ?? null) : null}
          emptyIcon={<Wrench size={48} />}
        />

      </div>

      <CodeSection
        code={latexCode ?? undefined}
        isLoading={isCompiling}
        onCopy={handleCopyCode}
      />

      <FloatingToolbar
        dpi={dpi}
        setDpi={setDpi}
        isReady={!!(compileResult?.ok && compileResult.png_base64)}
        onDownloadPng={() => {
          if (!compileResult?.png_base64) return
          triggerFileDownload(`data:image/png;base64,${compileResult.png_base64}`, 'flaschenzug.png')
        }}
        onDownloadPdf={compileResult?.pdf_base64 ? () => {
          triggerFileDownload(`data:application/pdf;base64,${compileResult.pdf_base64}`, 'flaschenzug.pdf')
        } : undefined}
        onDownloadSvg={compileResult?.svg_base64 ? () => {
          triggerFileDownload(`data:image/svg+xml;base64,${compileResult.svg_base64}`, 'flaschenzug.svg')
        } : undefined}
        onCopyPng={async () => {
          if (compileResult?.png_base64) {
            const blob = await (await fetch(`data:image/png;base64,${compileResult.png_base64}`)).blob()
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          }
        }}
      />
    </div>
  )
}
