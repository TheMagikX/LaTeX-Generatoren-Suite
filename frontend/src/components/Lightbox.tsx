// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
//
// Based on / derived from interior (https://github.com/ddoemonn/interior)
// Copyright (c) 2026 ozzy (MIT License)
//
// Adaptations, styling, and integration for LaTeX-Generatoren-Suite:
// Copyright (C) 2026 C. Meyer (AGPL-3.0-or-later)

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useLightbox } from '../hooks/useLightbox'

export type { UseLightboxOptions } from '../hooks/useLightbox'

const HOME = {
  type: 'spring',
  stiffness: 150,
  damping: 27,
  mass: 1,
} as const

const VEIL = {
  type: 'spring',
  stiffness: 260,
  damping: 34,
  mass: 0.8,
} as const

const EASE = [0.23, 1, 0.32, 1] as const
const EXIT = { duration: 0.2, ease: [0.4, 0, 1, 1] } as const

const GLYPH = {
  type: 'spring',
  stiffness: 700,
  damping: 46,
  mass: 0.5,
} as const

const TOGGLE = 2.5

const CHROME_BUTTON =
  'grid size-9 place-items-center rounded-xl border border-line bg-panel/90 text-muted backdrop-blur-md transition-all duration-150 hover:bg-raised hover:text-ink focus-visible:ring-2 focus-visible:ring-primary shadow-lg cursor-pointer'

export type LightboxProps = {
  open: boolean
  onClose: () => void
  src: string
  alt: string
  originRef?: React.RefObject<HTMLElement | null>
  caption?: string
  width?: number
  height?: number
  maxScale?: number
  className?: string
}

type Landing = { dx: number; dy: number; s: number; o: number; r: number }

function Stage({
  onClose,
  src,
  alt,
  originRef,
  caption,
  width,
  height,
  maxScale = 4,
  className = '',
}: LightboxProps) {
  const reduced = useReducedMotion()
  const titleId = useId()
  const hintId = useId()

  const fx = useMotionValue(0)
  const fy = useMotionValue(0)
  const fs = useMotionValue(1)
  const fo = useMotionValue(0)
  const fr = useMotionValue(14)

  const {
    frameRef,
    contentRef,
    bind,
    scale,
    x,
    y,
    zoomed,
    settledZoom,
    reset,
    zoomAt,
  } = useLightbox({ maxScale, onDismiss: onClose })

  const shellRef = useRef<HTMLDivElement>(null)

  const toggleZoom = useCallback(() => {
    const frame = frameRef.current
    if (!frame) return
    if (zoomed) {
      reset()
      return
    }
    const r = frame.getBoundingClientRect()
    zoomAt(
      Math.min(TOGGLE, Math.max(1.1, maxScale)),
      r.left + r.width / 2,
      r.top + r.height / 2,
      true,
    )
  }, [frameRef, maxScale, reset, zoomAt, zoomed])

  const landing = useCallback((): Landing => {
    const frame = frameRef.current
    const content = contentRef.current
    const origin = originRef?.current
    if (frame && content && origin && content.offsetWidth > 0) {
      const r = frame.getBoundingClientRect()
      const o = origin.getBoundingClientRect()
      if (o.width > 0) {
        const s = o.width / content.offsetWidth
        const rad = Number.parseFloat(getComputedStyle(origin).borderTopLeftRadius) || 12
        return {
          dx: o.left + o.width / 2 - (r.left + r.width / 2),
          dy: o.top + o.height / 2 - (r.top + r.height / 2),
          s,
          o: 1,
          r: rad / s,
        }
      }
    }
    return { dx: 0, dy: 10, s: 0.97, o: 0, r: 14 }
  }, [frameRef, contentRef, originRef])

  useLayoutEffect(() => {
    if (reduced) {
      fx.set(0)
      fy.set(0)
      fs.set(1)
      fo.set(1)
      fr.set(14)
      return
    }
    const d = landing()
    fx.set(d.dx)
    fy.set(d.dy)
    fs.set(d.s)
    fo.set(d.o)
    fr.set(d.r)

    const runs = [
      animate(fx, 0, HOME),
      animate(fy, 0, HOME),
      animate(fs, 1, HOME),
      animate(fo, 1, HOME),
      animate(fr, 14, HOME),
    ]
    return () => runs.forEach((r) => r.stop())
  }, [fo, fr, fs, fx, fy, landing, reduced])

  const away = useCallback(() => {
    if (reduced) return { opacity: 0, transition: { duration: 0.12 } }
    const d = landing()
    animate(fr, d.r, HOME)
    return {
      x: d.dx,
      y: d.dy,
      scale: d.s,
      opacity: d.o,
      transition: HOME,
    }
  }, [fr, landing, reduced])

  const unwind = useCallback(
    () => ({
      x: 0,
      y: 0,
      scale: 1,
      transition: reduced ? { duration: 0 } : HOME,
    }),
    [reduced],
  )

  useEffect(() => {
    const frame = frameRef.current
    const body = document.body
    const overflow = body.style.overflow
    body.style.overflow = 'hidden'
    frame?.focus({ preventScroll: true })
    return () => {
      body.style.overflow = overflow
    }
  }, [frameRef])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomed) {
          reset()
          return
        }
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, reset, zoomed])

  return (
    <div
      ref={shellRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`fixed inset-0 z-[9999] ${className}`}
    >
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{
          opacity: 0,
          transition: reduced ? { duration: 0 } : { duration: 0.3, ease: EASE },
        }}
        transition={reduced ? { duration: 0 } : VEIL}
        className="absolute inset-0 bg-canvas/90 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        ref={frameRef}
        data-lightbox-focus="1"
        tabIndex={-1}
        role="group"
        aria-labelledby={titleId}
        aria-describedby={hintId}
        style={{ touchAction: 'none' }}
        className={`absolute inset-0 overflow-hidden outline-none select-none ${
          zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
        {...bind}
      >
        <motion.div
          style={{ x: fx, y: fy, scale: fs, opacity: fo }}
          variants={{ away }}
          exit="away"
          className="absolute inset-0 flex items-center justify-center p-4 sm:p-14"
        >
          <motion.img
            ref={contentRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            draggable={false}
            style={{ x, y, scale, borderRadius: fr }}
            variants={{ away: unwind }}
            exit="away"
            onLoad={() => {
              if (fo.get() === 0) fo.set(1)
            }}
            className="max-h-full max-w-full object-contain drop-shadow-2xl"
          />
        </motion.div>
      </div>

      {/* Floating Toolbar Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: reduced ? { duration: 0 } : EXIT }}
        transition={reduced ? { duration: 0 } : VEIL}
        className="pointer-events-none absolute inset-0 flex items-start justify-between gap-3 p-4 sm:p-6"
      >
        <div
          id={titleId}
          className="pointer-events-auto max-w-[65%] truncate rounded-xl border border-line bg-panel/90 px-3 py-2 text-xs font-medium text-ink shadow-lg backdrop-blur-md"
        >
          {caption ?? alt}
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            data-lightbox-focus="1"
            type="button"
            onClick={toggleZoom}
            aria-label={zoomed ? 'Verkleinern' : 'Vergrößern'}
            title={zoomed ? 'Zoom zurücksetzen' : 'Vergrößern'}
            className={CHROME_BUTTON}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <motion.path
                animate={{
                  d: zoomed ? 'M8 11h6' : 'M8 11h6M11 8v6',
                }}
                transition={reduced ? { duration: 0 } : GLYPH}
              />
            </svg>
          </button>
          <button
            data-lightbox-focus="1"
            type="button"
            onClick={onClose}
            aria-label="Schließen (Esc)"
            title="Schließen (Esc)"
            className={CHROME_BUTTON}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>

      <p id={hintId} className="sr-only">
        Mausrad zum Zoomen, Ziehen zum Bewegen. Doppelklick für Zoom. Esc zum Schließen.
      </p>
      <p role="status" className="sr-only">
        Zoom {settledZoom.toFixed(1)}x
      </p>
    </div>
  )
}

const emptySubscribe = () => () => {}

export function Lightbox(props: LightboxProps) {
  const isClient = React.useSyncExternalStore(emptySubscribe, () => true, () => false)

  if (!isClient) return null

  return createPortal(
    <AnimatePresence>
      {props.open ? <Stage key="lightbox" {...props} /> : null}
    </AnimatePresence>,
    document.body,
  )
}
