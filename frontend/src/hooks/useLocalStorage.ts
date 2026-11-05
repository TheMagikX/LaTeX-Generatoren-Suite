// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'

function useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored === null) return defaultValue
      // Shallow-merge so new fields added to DEFAULT get their default values
      const parsed: unknown = JSON.parse(stored)
      if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return { ...defaultValue, ...parsed } as T
        }
        return defaultValue
      }
      if (Array.isArray(defaultValue)) {
        return (Array.isArray(parsed) ? parsed : defaultValue) as T
      }
      if (defaultValue !== null && defaultValue !== undefined && typeof parsed !== typeof defaultValue) {
        return defaultValue
      }
      return parsed as T
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // ignore storage quota errors
    }
  }, [key, state])

  return [state, setState]
}

export default useLocalStorage
