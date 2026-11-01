// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Skaliert ein PNG (Base64, mit oder ohne Data-URL-Praefix) clientseitig herunter
 * und gibt ein PNG als Data-URL zurueck. Das Seitenverhaeltnis bleibt erhalten,
 * das Bild wird nie vergroessert.
 */
export async function generateThumbnailFromBase64(
  base64Image: string,
  maxWidth = 480,
  maxHeight = 360,
): Promise<string> {
  const src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Thumbnail: Bild konnte nicht geladen werden'))
    el.src = src
  })

  if (!img.naturalWidth || !img.naturalHeight) {
    throw new Error('Thumbnail: Bild hat keine Abmessungen')
  }

  const scale = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight)
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Thumbnail: Canvas nicht verfuegbar')

  // Transparente Kompilate (TikZ) auf weissem Grund darstellen
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  return canvas.toDataURL('image/png')
}
