// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 C. Meyer

import { createContext } from 'react'
import type { UpdateCheckResult } from '../api/client'

export interface UpdateContextType {
  currentVersion: string
  checkOnStartup: boolean
  setCheckOnStartup: (enabled: boolean) => Promise<void>
  lastChecked: string | null
  updateResult: UpdateCheckResult | null
  isChecking: boolean
  checkError: string | null
  isDismissed: boolean
  dismissBanner: () => void
  checkForUpdatesNow: (force?: boolean) => Promise<UpdateCheckResult | null>
}

export const UpdateContext = createContext<UpdateContextType | null>(null)
