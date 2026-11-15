// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Erzeugt einen sauberen, betriebssystem- und dateisystem-kompatiblen PDF-Dateinamen
 * für das Arbeitsblatt bzw. das Lösungsblatt.
 *
 * - Ersetzt Steuerzeichen und verbotene Dateisystemzeichen (\ / : * ? " < > |).
 * - Begrenzt die Basislänge kontrolliert (Standard 100 Zeichen), um Windows MAX_PATH nicht zu verletzen.
 * - Hängt für Lösungen ' - Lösungen.pdf' an.
 */
export function sanitizeWorksheetFilename(
  rawTitle: string | undefined | null,
  isSolution = false,
  maxLength = 100
): string {
  const fallbackBase = 'Arbeitsblatt'
  const solutionSuffix = ' - Lösungen'
  const extension = '.pdf'

  // 1. Bereinigen: Steuerzeichen, Whitespace und illegale Dateisystem-Zeichen entfernen
  const withoutControlChars = Array.from(rawTitle ?? '')
    .map((ch) => (ch.charCodeAt(0) < 32 ? ' ' : ch))
    .join('')

  let cleaned = withoutControlChars
    .trim()
    .replace(/[\\/:*?"<>|]/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim()

  // 2. Doppelte Bindestriche / unschöne Kanten glätten
  cleaned = cleaned
    .replace(/(?:\s*-\s*){2,}/g, ' - ')
    .replace(/^[-_\s.]+/, '')
    .replace(/[-_\s.]+$/, '')

  // 3. Fallback bei leerem String
  if (!cleaned) {
    cleaned = fallbackBase
  }

  // 4. Längenbegrenzung unter Berücksichtigung des Lösungs-Suffixes
  const reservedForSuffix = isSolution ? solutionSuffix.length : 0
  const maxAllowedBase = Math.max(10, maxLength - reservedForSuffix)

  if (cleaned.length > maxAllowedBase) {
    // Wortweises Kürzen, falls möglich
    const sliced = cleaned.slice(0, maxAllowedBase)
    const lastSpace = sliced.lastIndexOf(' ')
    if (lastSpace > maxAllowedBase * 0.6) {
      cleaned = sliced.slice(0, lastSpace).trim()
    } else {
      cleaned = sliced.trim()
    }
    // Nachlaufende Sonderzeichen nach dem Schnitt säubern
    cleaned = cleaned.replace(/[-_\s.]+$/, '')
    if (!cleaned) {
      cleaned = fallbackBase
    }
  }

  const baseWithSuffix = isSolution ? `${cleaned}${solutionSuffix}` : cleaned
  return `${baseWithSuffix}${extension}`
}

/**
 * Konvertiert einen Base64-String in ein Blob-Objekt.
 */
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteChars = atob(base64)
  const byteNumbers = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }
  return new Blob([byteNumbers], { type: mimeType })
}

/**
 * Robuster Dateidownload via Blob & Object-URL.
 */
export const downloadFile = (base64: string, filename: string, mimeType: string) => {
  const blob = base64ToBlob(base64, mimeType)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const downloadPdf = (base64: string, filename: string) => {
  downloadFile(base64, filename, 'application/pdf')
}

export const handlePrint = (base64: string) => {
  const url = URL.createObjectURL(
    new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'application/pdf' })
  )
  const win = window.open(url, '_blank')
  if (!win) {
    URL.revokeObjectURL(url)
    return
  }
  let handled = false
  const triggerPrintAndCleanup = () => {
    if (handled) return
    handled = true
    if (!win.closed) win.print()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  win.addEventListener('load', triggerPrintAndCleanup, { once: true })
  setTimeout(triggerPrintAndCleanup, 500)
}

export const handleCopy = async (text: string) => {
  await navigator.clipboard.writeText(text)
}
