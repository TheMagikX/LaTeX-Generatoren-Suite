// SPDX-License-Identifier: AGPL-3.0-or-later

export const calcXLabelPos = (ymin: number, ymax: number): string => {
  const ykoord = ymin < 0 ? Math.round((Math.abs(ymin / Math.abs(ymax - ymin)) + 0.05) * 100) / 100 : 0.05
  return `0.99,${ykoord}`
}

export const calcYLabelPos = (xmin: number, xmax: number): string => {
  const xkoord = xmin < 0 ? Math.round((Math.abs(xmin / Math.abs(xmax - xmin)) + 0.015) * 100) / 100 : 0.02
  return `${xkoord},0.97`
}

export const calcDefaultTickRange = (minVal: number, maxVal: number): string => {
  if (isNaN(minVal) || isNaN(maxVal)) return ''
  const start = Math.floor(minVal)
  const end = Math.ceil(maxVal)
  if (start >= end) return `${start}`
  if (start + 1 === end) return `${start},${end}`
  return `${start},${start + 1},...,${end}`
}

// ---------------------------------------------------------------------------
// Stateless Helper Components
// ---------------------------------------------------------------------------
