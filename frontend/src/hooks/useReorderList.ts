// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
//
// Based on / derived from interior (https://github.com/ddoemonn/interior)
// Copyright (c) 2026 ozzy (MIT License)
//
// Adaptations, timing enhancements, and integration for LaTeX-Generatoren-Suite:
// Copyright (C) 2026 C. Meyer (AGPL-3.0-or-later)

import { useCallback, useEffect, useRef, useState } from 'react'

const moveItem = <T,>(list: readonly T[], from: number, to: number): T[] => {
  const next = [...list]
  const [taken] = next.splice(from, 1)
  next.splice(to, 0, taken)
  return next
}

export type UseReorderListOptions<T> = {
  items: readonly T[]
  getId: (item: T) => string
  getLabel: (item: T) => string
  onReorder: (next: T[]) => void
  onCommit?: (next: T[]) => void
  disabled?: boolean
}

export function useReorderList<T>({
  items,
  getId,
  getLabel,
  onReorder,
  onCommit,
  disabled = false,
}: UseReorderListOptions<T>) {
  const [grabbed, setGrabbed] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [spoken, setSpoken] = useState('')

  const emit = useRef(onReorder)
  const settle = useRef(onCommit)
  const live = useRef(items)
  const snapshot = useRef<readonly T[] | null>(null)

  useEffect(() => {
    emit.current = onReorder
    settle.current = onCommit
    live.current = items
  })

  const indexOf = useCallback(
    (id: string) => live.current.findIndex((item) => getId(item) === id),
    [getId],
  )

  const grab = useCallback(
    (id: string) => {
      snapshot.current = live.current
      setGrabbed(id)
      const at = indexOf(id)
      const item = live.current[at]
      setSpoken(
        `${getLabel(item)} ausgewählt, Position ${at + 1} von ${live.current.length}.`,
      )
    },
    [getLabel, indexOf],
  )

  const drop = useCallback(
    (id: string) => {
      snapshot.current = null
      setGrabbed(null)
      const at = indexOf(id)
      const item = live.current[at]
      setSpoken(`${getLabel(item)} abgelegt an Position ${at + 1}.`)
      settle.current?.([...live.current])
    },
    [getLabel, indexOf],
  )

  const cancel = useCallback(() => {
    if (snapshot.current) emit.current([...snapshot.current])
    snapshot.current = null
    setGrabbed(null)
    setSpoken('Sortierung abgebrochen, ursprüngliche Reihenfolge wiederhergestellt.')
  }, [])

  const step = useCallback(
    (id: string, delta: -1 | 1) => {
      const from = indexOf(id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= live.current.length) return
      const next = moveItem(live.current, from, to)
      emit.current(next)
      const item = next[to]
      setSpoken(
        `${getLabel(item)}, Position ${to + 1} von ${next.length}.`,
      )
      if (snapshot.current === null) settle.current?.(next)
    },
    [getLabel, indexOf],
  )

  const rowKeyDown = useCallback(
    (id: string) => (event: React.KeyboardEvent<HTMLElement>) => {
      if (disabled || event.target !== event.currentTarget) return
      const held = grabbed === id
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        if (held) drop(id)
        else grab(id)
        return
      }
      if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && held) {
        event.preventDefault()
        step(id, event.key === 'ArrowUp' ? -1 : 1)
        return
      }
      if (event.key === 'Escape' && held) {
        event.preventDefault()
        cancel()
      }
    },
    [disabled, grabbed, grab, drop, step, cancel],
  )

  const onDragStart = useCallback(
    (id: string) => {
      snapshot.current = live.current
      setDragging(id)
    },
    [],
  )

  const onDragEnd = useCallback(
    (id: string) => {
      snapshot.current = null
      setDragging(null)
      const at = indexOf(id)
      const item = live.current[at]
      setSpoken(`${getLabel(item)} abgelegt an Position ${at + 1}.`)
      settle.current?.([...live.current])
    },
    [getLabel, indexOf],
  )

  return {
    grabbed,
    dragging,
    spoken,
    grab,
    drop,
    cancel,
    step,
    rowKeyDown,
    onDragStart,
    onDragEnd,
  }
}
