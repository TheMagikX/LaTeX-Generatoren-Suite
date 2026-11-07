// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'

const LOCAL_STORAGE_WRITE_DELAY_MS = 150

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

  const pendingWriteRef = useRef<{ key: string; value: T } | null>(null)

  useEffect(() => {
    pendingWriteRef.current = { key, value: state }
    const timerId = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch {
        // ignore storage quota errors
      } finally {
        if (pendingWriteRef.current?.key === key && pendingWriteRef.current?.value === state) {
          pendingWriteRef.current = null
        }
      }
    }, LOCAL_STORAGE_WRITE_DELAY_MS)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [key, state])

  useEffect(() => {
    return () => {
      if (pendingWriteRef.current !== null) {
        try {
          localStorage.setItem(
            pendingWriteRef.current.key,
            JSON.stringify(pendingWriteRef.current.value)
          )
        } catch {
          // ignore storage quota errors
        }
        pendingWriteRef.current = null
      }
    }
  }, [])

  return [state, setState]
}

export default useLocalStorage
