// SPDX-License-Identifier: AGPL-3.0-or-later

import type {
  DotType,
  CornerSquareType,
  CornerDotType,
  ErrorCorrectionLevel
} from 'qr-code-styling'

export type QRExportFormat = 'png'
export type QRLabelMode = 'none' | 'url' | 'manual'

export interface QRConfig {
  url: string
  exportFormat: QRExportFormat
  labelMode: QRLabelMode
  manualLabel: string
  qrSize: number
  margin: number
  dotColor: string
  eyeColor: string
  backgroundColor: string
  errorCorrectionLevel: ErrorCorrectionLevel
  dotType: DotType
  cornerSquareType: CornerSquareType
  cornerDotType: CornerDotType
  logoUrl: string | null
}

export interface QRState {
  logoFile: File | null
  previewUrl: string | null
  copied: boolean
}
