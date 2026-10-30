// SPDX-License-Identifier: AGPL-3.0-or-later

import { Image as ImageIcon, Copy, CheckCircle2, Download } from 'lucide-react'
import { Button, Card, Label } from '../../../components/ui'
import type { QRConfig, QRExportFormat } from '../typesQR'

interface QRPreviewProps {
  url: string
  label: string
  labelHref?: string
  backgroundColor: string
  labelColor: string
  qrSize: number
  qrRef: React.RefObject<HTMLDivElement | null>
  previewUrl: string | null
  copied: boolean
  exportFormat: QRExportFormat
  updateConfig: (updates: Partial<QRConfig>) => void
  onCopy: () => void
  onDownload: () => void
}

export default function QRPreview({
  url,
  label,
  labelHref,
  backgroundColor,
  labelColor,
  qrSize,
  qrRef,
  previewUrl,
  copied,
  exportFormat,
  updateConfig,
  onCopy,
  onDownload
}: QRPreviewProps) {
  const previewSize = Math.min(qrSize, 420)
  const previewScale = previewSize / qrSize

  return (
    <div className="flex flex-col gap-4 overflow-hidden xl:max-w-[520px] xl:justify-self-end xl:w-full">
      <div className="flex items-center gap-2 text-section-label px-2">
        <ImageIcon size={14} /> Vorschau
      </div>
      <Card className="flex-1 flex items-center justify-center bg-raised overflow-auto p-6 border-line relative custom-scrollbar">
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-lg shadow-xl overflow-hidden p-5 max-w-full"
          style={{ backgroundColor }}
        >
          <div
            className="overflow-hidden"
            style={{ width: previewSize, height: previewSize }}
          >
            <div
              ref={qrRef}
              style={{
                width: qrSize,
                height: qrSize,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left'
              }}
            />
          </div>
          {label && (
            labelHref ? (
              <a
                href={labelHref}
                target="_blank"
                rel="noreferrer"
                className="text-center text-sm font-medium underline break-all"
                style={{ color: labelColor, maxWidth: previewSize }}
              >
                {label}
              </a>
            ) : (
              <span
                className="text-center text-sm font-medium break-all"
                style={{ color: labelColor, maxWidth: previewSize }}
              >
                {label}
              </span>
            )
          )}
        </div>
        {!url && (
          <div className="absolute inset-0 flex items-center justify-center bg-panel/50 backdrop-blur-sm text-muted">
            Gib einen Link ein, um den QR-Code zu generieren
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2 pt-2">
        <div className="flex flex-col gap-1.5">
          <Label>Exportformat</Label>
          <select
            value={exportFormat}
            onChange={(e) => updateConfig({ exportFormat: e.target.value as QRExportFormat })}
            className="bg-panel border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="png">PNG</option>
          </select>
        </div>
        <Button
          className="w-full flex items-center justify-center gap-2 py-4"
          onClick={onCopy}
          disabled={!previewUrl}
          variant={copied ? 'secondary' : 'primary'}
        >
          {copied ? (
            <><CheckCircle2 size={18} className="text-emerald-500" /> In Zwischenablage kopiert</>
          ) : (
            <><Copy size={18} /> In Zwischenablage kopieren</>
          )}
        </Button>
        <Button
          variant="secondary"
          className="w-full flex items-center justify-center gap-2 py-4"
          onClick={onDownload}
          disabled={!previewUrl}
        >
          <Download size={18} /> Als PNG exportieren
        </Button>
      </div>
    </div>
  )
}
