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
  const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'application/pdf' }))
  const win = window.open(url, '_blank')
  if (win) {
    win.addEventListener('load', () => {
      win.print()
      URL.revokeObjectURL(url)
    })
    // Fallback if load event doesn't fire (some browsers/blobs)
    setTimeout(() => {
      if (!win.closed) win.print()
    }, 500)
  }
}

export const handleCopy = async (text: string) => {
  await navigator.clipboard.writeText(text)
}
