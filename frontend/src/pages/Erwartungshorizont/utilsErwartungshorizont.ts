// SPDX-License-Identifier: AGPL-3.0-or-later

import JSZip from 'jszip'

export const b64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadFileFromBase64 = (base64: string, filename: string, mimeType: string): void => {
  const bytes = b64ToUint8Array(base64)
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType })
  downloadBlob(blob, filename)
}

export const copyPngToClipboard = async (base64: string): Promise<boolean> => {
  try {
    const bytes = b64ToUint8Array(base64)
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/png' })
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    return true
  } catch (err) {
    console.error('Failed to copy PNG to clipboard:', err)
    return false
  }
}

export const copySvgToClipboard = async (svgBase64: string): Promise<boolean> => {
  try {
    const bytes = b64ToUint8Array(svgBase64)
    const svgText = new TextDecoder('utf-8').decode(bytes)
    const svgBlob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/svg+xml' })
    const textBlob = new Blob([svgText], { type: 'text/plain' })

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/svg+xml': svgBlob,
          'text/plain': textBlob,
        })
      ])
      return true
    } catch {
      // Fallback: write text directly
      await navigator.clipboard.writeText(svgText)
      return true
    }
  } catch (err) {
    console.error('Failed to copy SVG to clipboard:', err)
    return false
  }
}

export interface ZipExportData {
  pages_png_base64?: string[]
  pages_svg_base64?: string[]
  pages_pdf_base64?: string[]
  pdf_base64?: string
  latexCode?: string | null
}

export const downloadZipArchive = async (data: ZipExportData, baseFilename: string = 'erwartungshorizont'): Promise<void> => {
  const zip = new JSZip()
  const pngPages = data.pages_png_base64 ?? []
  const svgPages = data.pages_svg_base64 ?? []
  const pdfPages = data.pages_pdf_base64 ?? []

  // Add individual PNGs
  pngPages.forEach((b64, index) => {
    const letter = String.fromCharCode(97 + index) // a, b, c, ...
    zip.file(`Teilaufgabe_${letter}.png`, b64ToUint8Array(b64))
  })

  // Add individual SVGs if available
  svgPages.forEach((b64, index) => {
    const letter = String.fromCharCode(97 + index)
    zip.file(`Teilaufgabe_${letter}.svg`, b64ToUint8Array(b64))
  })

  // Add individual single-page PDFs if available
  pdfPages.forEach((b64, index) => {
    const letter = String.fromCharCode(97 + index)
    zip.file(`Teilaufgabe_${letter}.pdf`, b64ToUint8Array(b64))
  })

  // Add complete document PDF if available
  if (data.pdf_base64) {
    zip.file(`${baseFilename}_gesamt.pdf`, b64ToUint8Array(data.pdf_base64))
  }

  // Add LaTeX source file
  if (data.latexCode) {
    zip.file(`${baseFilename}.tex`, data.latexCode)
  }

  const content = await zip.generateAsync({ type: 'blob' })
  downloadBlob(content, `${baseFilename}.zip`)
}
