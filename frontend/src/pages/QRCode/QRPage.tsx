// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useRef, useEffect, useCallback } from 'react'
import QRCodeStyling from 'qr-code-styling'
import type {
  DrawType,
  TypeNumber,
  Mode
} from 'qr-code-styling'
import { QrCode } from 'lucide-react'
import { PageHeader } from '../../components/HeaderSection'
import { COMPONENT_VERSIONS } from "../versions"
import type { QRConfig } from './typesQR'
import { DEFAULT_QR_CONFIG } from './constantsQR'
import QRSettings from './components/QRSettings'
import QRPreview from './components/QRPreview'

const getLabelText = (config: QRConfig) => {
  if (config.labelMode === 'url') return config.url.trim()
  if (config.labelMode === 'manual') return config.manualLabel.trim()
  return ''
}

const getUrlHref = (url: string) => {
  const trimmed = url.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined
}

const wrapCanvasText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  const lines: string[] = []
  let line = ''

  text.split(/\s+/).forEach(word => {
    const next = line ? `${line} ${word}` : word
    if (context.measureText(next).width <= maxWidth) {
      line = next
      return
    }

    if (line) lines.push(line)
    line = ''

    let chunk = ''
    Array.from(word).forEach(char => {
      const nextChunk = chunk + char
      if (context.measureText(nextChunk).width > maxWidth && chunk) {
        lines.push(chunk)
        chunk = char
      } else {
        chunk = nextChunk
      }
    })
    line = chunk
  })

  if (line) lines.push(line)
  return lines
}

export default function QRPage() {
  const [config, setConfig] = useState<QRConfig>(DEFAULT_QR_CONFIG)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const qrRef = useRef<HTMLDivElement>(null)
  const [qrCode] = useState<QRCodeStyling>(new QRCodeStyling({
    width: config.qrSize,
    height: config.qrSize,
    type: 'canvas' as DrawType,
    data: config.url,
    image: '',
    dotsOptions: {
      color: config.dotColor,
      type: config.dotType
    },
    backgroundOptions: {
      color: config.backgroundColor,
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 5
    },
    cornersSquareOptions: {
      color: config.eyeColor,
      type: config.cornerSquareType
    },
    cornersDotOptions: {
      color: config.eyeColor,
      type: config.cornerDotType
    },
    qrOptions: {
      typeNumber: 0 as TypeNumber,
      mode: 'Byte' as Mode,
      errorCorrectionLevel: config.errorCorrectionLevel
    }
  }))

  const updateConfig = (updates: Partial<QRConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateQR = useCallback(async () => {
    let logoData: string | undefined = undefined
    if (logoFile) {
      logoData = URL.createObjectURL(logoFile)
    } else if (config.logoUrl) {
      logoData = config.logoUrl
    }

    qrCode.update({
      data: config.url || 'https://',
      width: config.qrSize,
      height: config.qrSize,
      margin: config.margin,
      image: logoData,
      dotsOptions: {
        color: config.dotColor,
        type: config.dotType
      },
      cornersSquareOptions: {
        color: config.eyeColor,
        type: config.cornerSquareType
      },
      cornersDotOptions: {
        color: config.eyeColor,
        type: config.cornerDotType
      },
      backgroundOptions: {
        color: config.backgroundColor,
      },
      imageOptions: {
        hideBackgroundDots: (logoFile || config.logoUrl) ? true : false,
        imageSize: 0.4,
        margin: 5
      },
      qrOptions: {
        typeNumber: 0 as TypeNumber,
        mode: 'Byte' as Mode,
        errorCorrectionLevel: config.errorCorrectionLevel
      }
    })

    // Give it a tiny bit of time to render before capturing the data URL for preview/copy
    setTimeout(async () => {
      const rawRaw = await qrCode.getRawData('png')
      if (rawRaw) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(rawRaw as Blob)
      }
      if (logoFile && logoData) URL.revokeObjectURL(logoData)
    }, 100)
  }, [config, logoFile, qrCode])

  useEffect(() => {
    if (qrRef.current) {
      qrCode.append(qrRef.current)
    }
  }, [qrCode])

  useEffect(() => {
    updateQR()
  }, [updateQR])

  const handleDownload = async () => {
    const label = getLabelText(config)
    if (!label || !previewUrl) {
      qrCode.download({ name: 'qrcode', extension: config.exportFormat })
      return
    }

    const image = new Image()
    image.src = previewUrl
    await image.decode()

    const padding = Math.max(32, Math.round(config.qrSize * 0.06))
    const lineHeight = Math.max(22, Math.round(config.qrSize * 0.045))
    const fontSize = Math.max(16, Math.round(config.qrSize * 0.035))
    const maxTextWidth = config.qrSize - padding * 2
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return

    context.font = `600 ${fontSize}px sans-serif`
    const lines = wrapCanvasText(context, label, maxTextWidth)

    canvas.width = config.qrSize
    canvas.height = config.qrSize + padding + lines.length * lineHeight
    context.fillStyle = config.backgroundColor
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, config.qrSize, config.qrSize)
    context.fillStyle = config.dotColor
    context.textAlign = 'center'
    context.textBaseline = 'top'
    context.font = `600 ${fontSize}px sans-serif`
    lines.forEach((text, index) => {
      context.fillText(text, canvas.width / 2, config.qrSize + padding / 2 + index * lineHeight)
    })

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'qrcode.png'
    link.click()
  }

  const handleCopy = async () => {
    if (!previewUrl) return
    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy to clipboard failed:', err)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 h-full overflow-hidden">
      <PageHeader
        title="QR-Code Generator Pro"
        icon={<QrCode size={24} />}
        version={COMPONENT_VERSIONS.qrcode}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(560px,1fr)_minmax(360px,520px)] gap-8 flex-1 overflow-hidden">
        <QRSettings 
          config={config} 
          logoFile={logoFile} 
          updateConfig={updateConfig} 
          setLogoFile={setLogoFile} 
        />
        <QRPreview 
          url={config.url}
          label={getLabelText(config)}
          labelHref={config.labelMode === 'url' ? getUrlHref(config.url) : undefined}
          backgroundColor={config.backgroundColor}
          labelColor={config.dotColor}
          qrSize={config.qrSize}
          qrRef={qrRef}
          previewUrl={previewUrl}
          copied={copied}
          exportFormat={config.exportFormat}
          updateConfig={updateConfig}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
      </div>
    </div>
  )
}
