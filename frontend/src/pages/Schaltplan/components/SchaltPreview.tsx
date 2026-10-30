// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Play, MapPin, Grid3X3, Zap } from 'lucide-react'
import { PreviewCard, FloatingToolbar, CodeSection, Card } from '../../../components/ui'
import type { SchaltplanConfig } from '../typesSchalt'

interface SchaltPreviewProps {
  config: SchaltplanConfig
  setConfig: React.Dispatch<React.SetStateAction<SchaltplanConfig>>
  isCompiling: boolean
  compileData: { ok: boolean; png_base64?: string; pdf_base64?: string; svg_base64?: string; log?: string } | null
  latexCode: string | null
  dpi: number
  setDpi: (dpi: number) => void
}

export const SchaltPreview: React.FC<SchaltPreviewProps> = ({
  config,
  setConfig,
  isCompiling,
  compileData,
  latexCode,
  dpi,
  setDpi
}) => {
  const downloadPng = () => {
    if (!compileData?.png_base64) return
    const link = document.createElement('a'); link.href = `data:image/png;base64,${compileData.png_base64}`; link.download = 'schaltplan.png'; link.click()
  }
  const downloadSvg = () => {
    if (!compileData?.svg_base64) return
    const link = document.createElement('a'); link.href = `data:image/svg+xml;base64,${compileData.svg_base64}`; link.download = 'schaltplan.svg'; link.click()
  }
  const downloadPdf = () => {
    if (!compileData?.pdf_base64) return
    const link = document.createElement('a'); link.href = `data:application/pdf;base64,${compileData.pdf_base64}`; link.download = 'schaltplan.pdf'; link.click()
  }
  const copyToClipboard = async () => {
    if (!compileData?.png_base64) return
    try {
      const blob = await (await fetch(`data:image/png;base64,${compileData.png_base64}`)).blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } catch (e) { console.error(e) }
  }

  return (
    <div className="flex-1 flex flex-col gap-4 min-w-0 relative">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          <Play size={14} className="text-primary" /> Vorschau
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setConfig(p => ({ ...p, show_nodes: !p.show_nodes }))}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-caption transition-all border ${config.show_nodes
                ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                : 'bg-raised/50 border-rim/50 text-ghost hover:text-ink'
              }`}
          >
            <MapPin size={12} /> Knotenpunkte
          </button>
          <button
            onClick={() => setConfig(p => ({ ...p, show_node_labels: !p.show_node_labels }))}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-caption transition-all border ${config.show_node_labels
                ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                : 'bg-raised/50 border-rim/50 text-ghost hover:text-ink'
              }`}
          >
            <Grid3X3 size={12} /> Beschriftungen
          </button>
        </div>
      </div>

      <PreviewCard
        isLoading={false}
        isCompiling={isCompiling}
        imgSrc={compileData?.ok ? `data:image/png;base64,${compileData.png_base64}` : null}
        errorLog={compileData?.ok === false ? (compileData.log || null) : null}
        emptyIcon={<Zap size={64} />}
      />

      <FloatingToolbar
        dpi={dpi}
        setDpi={setDpi}
        isReady={!!(compileData?.ok && compileData.png_base64)}
        onDownloadPng={downloadPng}
        onDownloadPdf={downloadPdf}
        onCopyPng={copyToClipboard}
        onDownloadSvg={compileData?.svg_base64 ? downloadSvg : undefined}
      />

      <Card className="p-4 bg-panel/80 backdrop-blur-sm border-line">
        <CodeSection
          code={latexCode ?? undefined}
          isLoading={isCompiling}
          onCopy={() => navigator.clipboard.writeText(latexCode || '')}
        />
      </Card>
    </div>
  )
}
