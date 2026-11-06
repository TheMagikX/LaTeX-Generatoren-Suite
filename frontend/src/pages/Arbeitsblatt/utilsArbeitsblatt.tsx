// SPDX-License-Identifier: AGPL-3.0-or-later

export const downloadFile = (base64: string, filename: string, mimeType: string) => {
  const link = document.createElement('a')
  link.href = `data:${mimeType};base64,${base64}`
  link.download = filename
  link.click()
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
