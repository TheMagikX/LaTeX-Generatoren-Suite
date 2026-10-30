// SPDX-License-Identifier: AGPL-3.0-or-later

import type { QRConfig } from './typesQR'

export const DEFAULT_QR_CONFIG: QRConfig = {
  url: 'https://',
  exportFormat: 'png',
  labelMode: 'none',
  manualLabel: '',
  qrSize: 512,
  margin: 0,
  dotColor: '#000000',
  eyeColor: '#000000',
  backgroundColor: '#ffffff',
  errorCorrectionLevel: 'H',
  dotType: 'rounded',
  cornerSquareType: 'extra-rounded',
  cornerDotType: 'rounded',
  logoUrl: null
}

export const QR_LOGO_PRESETS: { label: string; url: string }[] = []
