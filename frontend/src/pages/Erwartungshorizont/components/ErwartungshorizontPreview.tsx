// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState, useEffect } from 'react'
import { Card, FloatingToolbar, CodeSection, LatexErrorPanel, Button } from '../../../components/ui'
import {
  ListChecks,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Check,
  Archive,
  Maximize2,
  X,
  RotateCw,
} from 'lucide-react'
import {
  downloadFileFromBase64,
  copyPngToClipboard,
  copySvgToClipboard,
  downloadZipArchive,
} from '../utilsErwartungshorizont'

interface Props {
  latexCode: string | null
  compileData: {
    ok: boolean
    png_base64?: string
    pdf_base64?: string
    svg_base64?: string
    pages_png_base64?: string[]
    pages_svg_base64?: string[]
    pages_pdf_base64?: string[]
    log?: string
  } | null
  isCompiling: boolean
  previewDpi: number
  setPreviewDpi: (dpi: number) => void
}

const ErwartungshorizontPreview: React.FC<Props> = ({
  latexCode,
  compileData,
  isCompiling,
  previewDpi,
  setPreviewDpi,
}) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [copiedPng, setCopiedPng] = useState(false)
  const [copiedSvg, setCopiedSvg] = useState(false)
  const [isZipping, setIsZipping] = useState(false)

  const pages = compileData?.pages_png_base64 && compileData.pages_png_base64.length > 0
    ? compileData.pages_png_base64
    : (compileData?.png_base64 ? [compileData.png_base64] : [])

  const totalPages = pages.length
  const activePage = Math.min(currentPage, Math.max(0, totalPages - 1))
  const currentLetter = String.fromCharCode(97 + activePage) // a, b, c, ...

  // Reset page when total pages change
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1)
    }
  }, [totalPages, currentPage])

  // Fullscreen escape key
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
      if (e.key === 'ArrowLeft') setCurrentPage(p => Math.max(0, p - 1))
      if (e.key === 'ArrowRight') setCurrentPage(p => Math.min(totalPages - 1, p + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, totalPages])

  const currentPng = pages[activePage] || null
  const svgs = compileData?.pages_svg_base64 ?? []
  const currentSvg = svgs[activePage] || compileData?.svg_base64 || null

  const handleCopyPng = async () => {
    if (!currentPng) return
    const success = await copyPngToClipboard(currentPng)
    if (success) {
      setCopiedPng(true)
      setTimeout(() => setCopiedPng(false), 2200)
    }
  }

  const handleCopySvg = async () => {
    if (!currentSvg) return
    const success = await copySvgToClipboard(currentSvg)
    if (success) {
      setCopiedSvg(true)
      setTimeout(() => setCopiedSvg(false), 2200)
    }
  }

  const handleDownloadActivePng = () => {
    if (!currentPng) return
    downloadFileFromBase64(currentPng, `Teilaufgabe_${currentLetter}.png`, 'image/png')
  }

  const handleDownloadActiveSvg = () => {
    if (!currentSvg) return
    downloadFileFromBase64(currentSvg, `Teilaufgabe_${currentLetter}.svg`, 'image/svg+xml')
  }

  const handleDownloadActivePdf = () => {
    const pdfs = compileData?.pages_pdf_base64 ?? []
    const pdfB64 = pdfs[activePage] || compileData?.pdf_base64
    if (!pdfB64) return
    downloadFileFromBase64(pdfB64, `Teilaufgabe_${currentLetter}.pdf`, 'application/pdf')
  }

  const handleDownloadZip = async () => {
    if (!compileData?.ok) return
    setIsZipping(true)
    try {
      await downloadZipArchive({
        pages_png_base64: compileData.pages_png_base64,
        pages_svg_base64: compileData.pages_svg_base64,
        pages_pdf_base64: compileData.pages_pdf_base64,
        pdf_base64: compileData.pdf_base64,
        latexCode: latexCode,
      }, 'erwartungshorizont')
    } finally {
      setIsZipping(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-6 relative">
      <Card className="flex-1 flex flex-col relative overflow-hidden border-rim/50 shadow-2xl rounded-2xl">
        {/* Background paper grid */}
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-secondary/4 pointer-events-none" />

        {/* Top Control Bar: Paginator & Copy Actions */}
        <div className="relative z-20 flex items-center justify-between p-3 border-b border-line/60 bg-panel/80 backdrop-blur-md gap-3 flex-wrap">
          {/* Paginator */}
          <div className="flex items-center gap-2">
            {totalPages > 1 ? (
              <div className="flex items-center gap-1.5 bg-raised border border-line rounded-xl px-2 py-1 shadow-sm">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={activePage === 0}
                  className="p-1 rounded-lg hover:bg-overlay disabled:opacity-30 transition-colors text-muted hover:text-ink"
                  title="Vorherige Teilaufgabe (Pfeiltaste links)"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold px-2 text-ink">
                  Teilaufgabe <span className="font-mono text-primary font-bold">{currentLetter})</span>
                  <span className="text-ghost font-normal ml-1">({activePage + 1} / {totalPages})</span>
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={activePage === totalPages - 1}
                  className="p-1 rounded-lg hover:bg-overlay disabled:opacity-30 transition-colors text-muted hover:text-ink"
                  title="Nächste Teilaufgabe (Pfeiltaste rechts)"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <span className="text-xs text-ghost font-medium px-2 py-1">
                {totalPages === 1 ? '1 Teilaufgabe' : 'Keine Teilaufgaben'}
              </span>
            )}
          </div>

          {/* Action Buttons: PNG kopieren, SVG kopieren, ZIP */}
          <div className="flex items-center gap-2">
            {/* PNG kopieren */}
            <Button
              variant="primary"
              className={`h-8 px-3 text-xs flex items-center gap-1.5 font-medium transition-all shadow-md ${
                copiedPng
                  ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                  : 'bg-primary hover:bg-amber-400 text-canvas'
              }`}
              onClick={handleCopyPng}
              disabled={!currentPng || isCompiling}
              title="Kopiert diese Teilaufgabe als PNG in die Zwischenablage für Word (Strg+V)"
            >
              {copiedPng ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <ClipboardCopy size={14} />
                  <span>PNG kopieren</span>
                </>
              )}
            </Button>

            {/* SVG kopieren */}
            <Button
              variant="secondary"
              className={`h-8 px-3 text-xs flex items-center gap-1.5 font-medium transition-all border border-line ${
                copiedSvg
                  ? 'bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600'
                  : 'bg-raised hover:bg-overlay text-muted hover:text-ink'
              }`}
              onClick={handleCopySvg}
              disabled={!currentSvg || isCompiling}
              title="Kopiert diese Teilaufgabe als Vektorgrafik (SVG) in die Zwischenablage für Word (Strg+V)"
            >
              {copiedSvg ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <ClipboardCopy size={14} className="text-primary" />
                  <span>SVG kopieren</span>
                </>
              )}
            </Button>

            {totalPages > 0 && (
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs flex items-center gap-1.5 bg-raised hover:bg-overlay text-muted hover:text-ink border border-line ml-1"
                onClick={handleDownloadZip}
                disabled={isZipping || isCompiling}
                title="Lädt alle Teilaufgaben als ZIP-Archiv herunter (PNG, SVG, Einzel-PDFs & Quellcode)"
              >
                <Archive size={14} className="text-primary" />
                <span>{isZipping ? 'Packe ZIP…' : 'Alle als ZIP'}</span>
              </Button>
            )}

            {currentPng && !isCompiling && (
              <button
                onClick={() => setFullscreen(true)}
                title="Vollbildansicht"
                className="p-1.5 rounded-lg bg-raised hover:bg-overlay border border-line text-ghost hover:text-ink transition-colors ml-1"
              >
                <Maximize2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center p-8 relative z-10 w-full h-full">
          {isCompiling ? (
            <div className="flex flex-col items-center gap-4 text-muted">
              <div className="animate-spin text-primary"><RotateCw size={28} /></div>
              <span className="text-sm font-medium tracking-wide animate-pulse font-display">
                Kompiliere Erwartungshorizont…
              </span>
            </div>
          ) : currentPng ? (
            <div className="flex flex-col items-center gap-3 max-w-full max-h-full">
              <img
                src={`data:image/png;base64,${currentPng}`}
                alt={`Teilaufgabe ${currentLetter})`}
                className="max-w-full max-h-full object-contain drop-shadow-xl hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          ) : compileData?.log ? (
            <LatexErrorPanel log={compileData.log} />
          ) : (
            <div className="flex flex-col items-center text-ghost gap-3">
              <div className="opacity-20"><ListChecks size={48} /></div>
              <span className="text-sm font-medium text-ghost">Noch kein Erwartungshorizont gerendert</span>
              <span className="text-xs text-ghost/70">Klicke oben auf „Kompilieren“ oder drücke Strg + Enter</span>
            </div>
          )}
        </div>
      </Card>

      {/* Floating Toolbar with DPI & Formats */}
      <FloatingToolbar
        dpi={previewDpi}
        setDpi={setPreviewDpi}
        isReady={!!compileData?.ok}
        onDownloadPng={handleDownloadActivePng}
        onDownloadPdf={handleDownloadActivePdf}
        onCopyPng={handleCopyPng}
        onDownloadSvg={handleDownloadActiveSvg}
      />

      {/* LaTeX Code Display */}
      <CodeSection
        code={latexCode ?? undefined}
        isLoading={isCompiling}
        onCopy={async () => {
          if (latexCode) await navigator.clipboard.writeText(latexCode)
        }}
      />

      {/* Fullscreen Modal */}
      {fullscreen && currentPng && (
        <div
          className="fixed inset-0 z-[9999] bg-canvas/95 backdrop-blur-md flex flex-col items-center justify-center p-8"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-raised border border-line hover:bg-overlay text-muted hover:text-ink transition-all"
            title="Schließen (Esc)"
          >
            <X size={20} />
          </button>

          <div
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-sm font-semibold text-ink bg-panel/80 px-4 py-1.5 rounded-full border border-line">
              Teilaufgabe {currentLetter}) ({activePage + 1} von {totalPages})
            </div>
            <img
              src={`data:image/png;base64,${currentPng}`}
              alt={`Teilaufgabe ${currentLetter})`}
              className="max-w-full max-h-[75vh] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ErwartungshorizontPreview
