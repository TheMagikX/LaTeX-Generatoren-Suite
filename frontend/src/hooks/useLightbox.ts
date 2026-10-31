// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
//
// Based on / derived from interior (https://github.com/ddoemonn/interior)
// Copyright (c) 2026 ozzy (MIT License)
//
// Adaptations, styling, and integration for LaTeX-Generatoren-Suite:
// Copyright (C) 2026 C. Meyer (AGPL-3.0-or-later)

import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, useMotionValue, useReducedMotion } from 'motion/react'

const CELL = {
  type: 'spring',
  stiffness: 520,
  damping: 34,
  mass: 0.45,
} as const

const HOME = {
  type: 'spring',
  stiffness: 150,
  damping: 27,
  mass: 1,
} as const

const TOGGLE = 2.5
const KEY_ZOOM = 1.6
const KEY_PAN = 56
const WHEEL_RATE = 140
const SLOP = 8
const NEAR_HOME = 1.02
const SNAP_HOME = 1.05

type Spring = {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

type Drag = {
  id: number
  from: { x: number; y: number }
  x: number
  y: number
}

export type UseLightboxOptions = {
  maxScale?: number
  steps?: number
  disabled?: boolean
  onDismiss?: () => void
}

export function useLightbox<
  Frame extends HTMLElement = HTMLDivElement,
  Content extends HTMLElement = HTMLImageElement,
>({
  maxScale = 4,
  steps = 8,
  disabled = false,
  onDismiss,
}: UseLightboxOptions = {}) {
  const cells = Math.max(1, Math.round(steps))
  const top = Math.max(1.1, maxScale)

  const frameRef = useRef<Frame>(null)
  const contentRef = useRef<Content>(null)

  const scale = useMotionValue(1)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const [step, setStep] = useState(0)
  const [settled, setSettled] = useState(0)

  const stepRef = useRef(0)
  const settledRef = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drag = useRef<Drag | null>(null)
  const onContent = useRef(false)

  const reduced = useReducedMotion()
  const dismiss = useRef(onDismiss)
  useEffect(() => {
    dismiss.current = onDismiss
  }, [onDismiss])

  const toStep = useCallback(
    (s: number) => clamp(Math.round(((s - 1) / (top - 1)) * cells), 0, cells),
    [cells, top],
  )

  const mark = useCallback(
    (s: number) => {
      const next = toStep(s)
      if (stepRef.current === next) return
      stepRef.current = next
      setStep(next)
    },
    [toStep],
  )

  const settle = useCallback(
    (s: number) => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      const next = toStep(s)
      if (settledRef.current === next) return
      settledRef.current = next
      setSettled(next)
    },
    [toStep],
  )

  const settleSoon = useCallback(
    (s: number) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        settle(s)
      }, 220)
    },
    [settle],
  )

  const limit = useCallback((s: number) => {
    const frame = frameRef.current
    const content = contentRef.current
    if (!frame || !content) return { mx: 0, my: 0 }
    return {
      mx: Math.max(0, (content.offsetWidth * s - frame.clientWidth) / 2),
      my: Math.max(0, (content.offsetHeight * s - frame.clientHeight) / 2),
    }
  }, [])

  const place = useCallback(
    (s: number, nx: number, ny: number) => {
      const { mx, my } = limit(s)
      scale.set(s)
      x.set(clamp(nx, -mx, mx))
      y.set(clamp(ny, -my, my))
      mark(s)
    },
    [limit, mark, scale, x, y],
  )

  const glide = useCallback(
    (s: number, nx: number, ny: number, spring: Spring = CELL) => {
      const { mx, my } = limit(s)
      const tx = clamp(nx, -mx, mx)
      const ty = clamp(ny, -my, my)
      mark(s)
      settleSoon(s)
      if (reduced) {
        scale.set(s)
        x.set(tx)
        y.set(ty)
        return
      }
      animate(scale, s, spring)
      animate(x, tx, spring)
      animate(y, ty, spring)
    },
    [limit, mark, reduced, scale, settleSoon, x, y],
  )

  const reset = useCallback(
    (spring: Spring = HOME) => {
      mark(1)
      settle(1)
      if (reduced) {
        scale.set(1)
        x.set(0)
        y.set(0)
        return
      }
      animate(scale, 1, spring)
      animate(x, 0, spring)
      animate(y, 0, spring)
    },
    [mark, reduced, scale, settle, x, y],
  )

  const zoomAt = useCallback(
    (target: number, cx: number, cy: number, instant = false) => {
      const frame = frameRef.current
      if (!frame) return
      const r = frame.getBoundingClientRect()
      const px = cx - (r.left + r.width / 2)
      const py = cy - (r.top + r.height / 2)
      const s0 = scale.get()
      const s1 = clamp(target, 1, top)
      const ratio = s1 / s0
      const nx = px - ratio * (px - x.get())
      const ny = py - ratio * (py - y.get())
      if (instant) place(s1, nx, ny)
      else glide(s1, nx, ny)
    },
    [glide, place, scale, top, x, y],
  )

  const onWheel = useCallback(
    (e: React.WheelEvent<Frame>) => {
      if (disabled) return
      e.preventDefault()
      const s0 = scale.get()
      const next = clamp(s0 * Math.exp(-e.deltaY / WHEEL_RATE), 1, top)
      zoomAt(next, e.clientX, e.clientY, true)
      settleSoon(next)
    },
    [disabled, scale, settleSoon, top, zoomAt],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<Frame>) => {
      if (disabled || e.button !== 0) return
      const target = e.target as HTMLElement | null
      onContent.current = !!(target && contentRef.current?.contains(target))
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current = {
        id: e.pointerId,
        from: { x: e.clientX, y: e.clientY },
        x: x.get(),
        y: y.get(),
      }
    },
    [disabled, x, y],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<Frame>) => {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      const dx = e.clientX - d.from.x
      const dy = e.clientY - d.from.y
      const s = scale.get()
      const { mx, my } = limit(s)
      x.set(clamp(d.x + dx, -mx, mx))
      y.set(clamp(d.y + dy, -my, my))
    },
    [limit, scale, x, y],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<Frame>) => {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      drag.current = null
      const dx = e.clientX - d.from.x
      const dy = e.clientY - d.from.y
      const dist = Math.hypot(dx, dy)
      const s = scale.get()

      if (dist < SLOP) {
        if (!onContent.current && s <= NEAR_HOME) {
          dismiss.current?.()
          return
        }
        if (s <= NEAR_HOME) {
          zoomAt(TOGGLE, e.clientX, e.clientY)
        } else {
          reset()
        }
        return
      }

      if (s < SNAP_HOME) {
        reset()
      }
    },
    [reset, scale, zoomAt],
  )

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<Frame>) => {
      if (disabled) return
      e.preventDefault()
      if (scale.get() > 1.2) {
        reset()
      } else {
        zoomAt(TOGGLE, e.clientX, e.clientY)
      }
    },
    [disabled, reset, scale, zoomAt],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<Frame>) => {
      if (disabled) return
      const s = scale.get()
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        const frame = frameRef.current
        if (frame) {
          const r = frame.getBoundingClientRect()
          zoomAt(s * KEY_ZOOM, r.left + r.width / 2, r.top + r.height / 2)
        }
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        const frame = frameRef.current
        if (frame) {
          const r = frame.getBoundingClientRect()
          zoomAt(s / KEY_ZOOM, r.left + r.width / 2, r.top + r.height / 2)
        }
      } else if (e.key === '0') {
        e.preventDefault()
        reset()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        glide(s, x.get(), y.get() + KEY_PAN)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        glide(s, x.get(), y.get() - KEY_PAN)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        glide(s, x.get() + KEY_PAN, y.get())
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        glide(s, x.get() - KEY_PAN, y.get())
      }
    },
    [disabled, glide, reset, scale, x, y, zoomAt],
  )

  useEffect(() => {
    const bail = () => {
      drag.current = null
    }
    window.addEventListener('blur', bail)
    return () => {
      window.removeEventListener('blur', bail)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return {
    frameRef,
    contentRef,
    bind: {
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onDoubleClick,
      onKeyDown,
    },
    scale,
    x,
    y,
    step,
    steps: cells,
    zoom: 1 + (step / cells) * (top - 1),
    settledZoom: 1 + (settled / cells) * (top - 1),
    zoomed: step > 0,
    reset,
    zoomAt,
  }
}
