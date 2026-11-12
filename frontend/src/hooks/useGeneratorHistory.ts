// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from 'react'
import useLocalStorage from './useLocalStorage'

export interface HistoryOptions {
  maxDepth?: number
  debounceMs?: number
  enableShortcuts?: boolean
}

export interface HistoryActions {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

export interface HistoryControls<T> extends HistoryActions {
  resetHistory: (newState?: T) => void
  commitImmediate: (newState: T | ((prev: T) => T)) => void
}

export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false
    }
    return true
  }
  const keysA = Object.keys(a as Record<string, unknown>)
  const keysB = Object.keys(b as Record<string, unknown>)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false
    }
  }
  return true
}

export function isEditableTextElement(el: Element | null): boolean {
  if (!el) return false
  const htmlEl = el as HTMLElement
  if (htmlEl.isContentEditable || htmlEl.contentEditable === 'true') return true
  if (htmlEl.closest?.('.cm-editor, .ace_editor')) return true
  const tag = el.tagName
  if (tag === 'TEXTAREA') return true
  if (tag === 'INPUT') {
    const type = ((el as HTMLInputElement).type || 'text').toLowerCase()
    // Slider (range), Checkbox, Radio, Color und Button sollen Generator-Undo auslösen
    const nonTextTypes = ['range', 'checkbox', 'radio', 'color', 'button', 'submit', 'reset']
    return !nonTextTypes.includes(type)
  }
  return false
}

export function useGeneratorHistory<T>(
  storageKey: string,
  initialValue: T,
  options?: HistoryOptions
): [T, Dispatch<SetStateAction<T>>, HistoryControls<T>] {
  const maxDepth = options?.maxDepth ?? 30
  const debounceMs = options?.debounceMs ?? 400
  const enableShortcuts = options?.enableShortcuts ?? true

  const [state, setStorageState] = useLocalStorage<T>(storageKey, initialValue)
  const stateRef = useRef<T>(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const pastRef = useRef<T[]>([])
  const futureRef = useRef<T[]>([])
  const pendingBaseRef = useRef<T | null>(null)
  const debounceTimerRef = useRef<number | null>(null)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0 || pendingBaseRef.current !== null)
    setCanRedo(futureRef.current.length > 0)
  }, [])

  const flushPending = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (pendingBaseRef.current !== null) {
      pastRef.current = [...pastRef.current.slice(-(maxDepth - 1)), pendingBaseRef.current]
      pendingBaseRef.current = null
    }
  }, [maxDepth])

  const setState: Dispatch<SetStateAction<T>> = useCallback((updater) => {
    const prev = stateRef.current
    const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater
    if (isDeepEqual(next, prev)) {
      return
    }
    if (pendingBaseRef.current === null) {
      pendingBaseRef.current = prev
    }
    futureRef.current = []
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null
      if (pendingBaseRef.current !== null) {
        pastRef.current = [...pastRef.current.slice(-(maxDepth - 1)), pendingBaseRef.current]
        pendingBaseRef.current = null
        syncFlags()
      }
    }, debounceMs)

    stateRef.current = next
    setStorageState(next)
    syncFlags()
  }, [debounceMs, maxDepth, setStorageState, syncFlags])

  const commitImmediate = useCallback((updater: T | ((prev: T) => T)) => {
    flushPending()
    const prev = stateRef.current
    const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater
    if (isDeepEqual(next, prev)) {
      syncFlags()
      return
    }
    pastRef.current = [...pastRef.current.slice(-(maxDepth - 1)), prev]
    futureRef.current = []
    stateRef.current = next
    setStorageState(next)
    syncFlags()
  }, [flushPending, maxDepth, setStorageState, syncFlags])

  const undo = useCallback(() => {
    flushPending()
    if (pastRef.current.length === 0) return
    const previous = pastRef.current[pastRef.current.length - 1]
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [stateRef.current, ...futureRef.current.slice(0, maxDepth - 1)]
    stateRef.current = previous
    setStorageState(previous)
    syncFlags()
  }, [flushPending, maxDepth, setStorageState, syncFlags])

  const redo = useCallback(() => {
    flushPending()
    if (futureRef.current.length === 0) return
    const next = futureRef.current[0]
    futureRef.current = futureRef.current.slice(1)
    pastRef.current = [...pastRef.current.slice(-(maxDepth - 1)), stateRef.current]
    stateRef.current = next
    setStorageState(next)
    syncFlags()
  }, [flushPending, maxDepth, setStorageState, syncFlags])

  const resetHistory = useCallback((newState?: T) => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    pendingBaseRef.current = null
    pastRef.current = []
    futureRef.current = []
    if (newState !== undefined) {
      stateRef.current = newState
      setStorageState(newState)
    }
    syncFlags()
  }, [setStorageState, syncFlags])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!enableShortcuts) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((!event.ctrlKey && !event.metaKey) || event.altKey) return
      if (isEditableTextElement(document.activeElement)) return

      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        if (pastRef.current.length > 0 || pendingBaseRef.current !== null) {
          event.preventDefault()
          undo()
        }
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        if (futureRef.current.length > 0) {
          event.preventDefault()
          redo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableShortcuts, undo, redo])

  return [state, setState, { undo, redo, canUndo, canRedo, resetHistory, commitImmediate }]
}

export default useGeneratorHistory
