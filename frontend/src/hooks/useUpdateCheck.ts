// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 C. Meyer

import { useContext } from 'react'
import { UpdateContext, type UpdateContextType } from '../context/update'

export type { UpdateContextType }

export function useUpdateCheck(): UpdateContextType {
  const context = useContext(UpdateContext)
  if (!context) {
    throw new Error('useUpdateCheck must be used within an UpdateProvider')
  }
  return context
}
