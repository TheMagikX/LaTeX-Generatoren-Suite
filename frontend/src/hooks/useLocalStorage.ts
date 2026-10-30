// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'

function useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored === null) return defaultValue
      // Shallow-merge so new fields added to DEFAULT get their default values
      return { ...defaultValue, ...(JSON.parse(stored) as T) }
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
