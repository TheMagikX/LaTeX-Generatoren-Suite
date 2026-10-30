// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
//
// Based on / derived from interior (https://github.com/ddoemonn/interior)
// Copyright (c) 2026 ozzy (MIT License)
//
// Adaptations, styling, and integration for LaTeX-Generatoren-Suite:
// Copyright (C) 2026 C. Meyer (AGPL-3.0-or-later)

import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useTextload } from '../hooks/useTextload'

export type { UseTextloadOptions } from '../hooks/useTextload'

const SPRING_TRANSITION = {
  type: 'spring',
  stiffness: 280,
  damping: 30,
  mass: 0.7,
} as const

const INSTANT_TRANSITION = { duration: 0 } as const

export type TextloadProps = {
  isLoading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
  className?: string
  reserveHeight?: string | number
  label?: string
  delayMs?: number
  minDurationMs?: number
}

/**
 * Textload-Container für nahtlose Übergänge zwischen
 * Text-/Code-Ladezustand und fertigem Inhalt ohne Layout-Sprünge.
 */
export function Textload({
  isLoading,
  children,
  skeleton,
  className = '',
  reserveHeight,
  label = 'Text wird geladen',
  delayMs = 0,
  minDurationMs = 500,
}: TextloadProps) {
  const { showSkeleton } = useTextload({ isLoading, delayMs, minDurationMs })
  const prefersReduced = useReducedMotion()

  const transition = prefersReduced ? INSTANT_TRANSITION : SPRING_TRANSITION

  return (
    <div
      aria-busy={isLoading}
      aria-label={isLoading ? label : undefined}
      style={reserveHeight ? { height: reserveHeight } : undefined}
      className={`relative grid overflow-hidden ${className}`}
    >
      {/* Eigentlicher Inhalt */}
      <motion.div
        className="col-start-1 row-start-1 w-full min-w-0"
        initial={false}
        animate={
          prefersReduced
            ? { opacity: showSkeleton ? 0 : 1 }
            : {
                opacity: showSkeleton ? 0 : 1,
                scale: showSkeleton ? 0.995 : 1,
                filter: showSkeleton ? 'blur(3px)' : 'blur(0px)',
              }
        }
        transition={transition}
        style={{
          transformOrigin: 'top left',
          pointerEvents: showSkeleton ? 'none' : undefined,
        }}
      >
        {children}
      </motion.div>

      {/* Lade-Overlay */}
      <AnimatePresence initial={false}>
        {showSkeleton && (
          <motion.div
            key="textload-skeleton"
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 w-full h-full"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(3px)' }}
            transition={transition}
          >
            {skeleton ?? <DefaultTextSkeleton />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Spezielles Code-Skeleton für LaTeX- & TikZ-Code
 */
export function CodeSkeleton({ lines = 7 }: { lines?: number }) {
  const linePatterns = [
    { indent: 'pl-0', width: 'w-44' },     // \documentclass...
    { indent: 'pl-0', width: 'w-36' },     // \usepackage{tikz}
    { indent: 'pl-0', width: 'w-52' },     // \begin{tikzpicture}
    { indent: 'pl-4', width: 'w-72' },     //   \draw[thick, primary] ...
    { indent: 'pl-4', width: 'w-60' },     //   \node at (2,3) ...
    { indent: 'pl-4', width: 'w-80' },     //   \filldraw[fill=blue!20] ...
    { indent: 'pl-0', width: 'w-48' },     // \end{tikzpicture}
    { indent: 'pl-4', width: 'w-64' },
    { indent: 'pl-4', width: 'w-56' },
    { indent: 'pl-0', width: 'w-40' },
  ]

  return (
    <div className="w-full h-full p-3 font-mono bg-canvas border border-line rounded-lg flex flex-col justify-between overflow-hidden select-none">
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, idx) => {
          const pattern = linePatterns[idx % linePatterns.length]
          return (
            <div key={idx} className={`flex items-center gap-3 ${pattern.indent}`}>
              <span className="text-[10px] text-muted/30 w-4 text-right shrink-0">
                {idx + 1}
              </span>
              <div
                className={`h-2.5 rounded-sm bg-gradient-to-r from-raised via-overlay to-raised animate-pulse ${pattern.width}`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-line/40 text-[10px] text-muted/50">
        <span>Generiere LaTeX-Code…</span>
        <span className="animate-pulse">●</span>
      </div>
    </div>
  )
}

function DefaultTextSkeleton() {
  return (
    <div className="w-full h-full p-4 bg-canvas/60 border border-line rounded-lg space-y-3 animate-pulse">
      <div className="h-3 bg-raised rounded w-3/4" />
      <div className="h-3 bg-raised rounded w-5/6" />
      <div className="h-3 bg-raised rounded w-2/3" />
    </div>
  )
}

