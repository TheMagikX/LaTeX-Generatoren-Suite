// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
//
// Based on / derived from interior (https://github.com/ddoemonn/interior)
// Copyright (c) 2026 ozzy (MIT License)
//
// Adaptations, timing enhancements, and integration for LaTeX-Generatoren-Suite:
// Copyright (C) 2026 C. Meyer (AGPL-3.0-or-later)

import { useEffect, useRef, useState } from 'react'

export type UseTextloadOptions = {
  isLoading: boolean
  delayMs?: number
  minDurationMs?: number
}

/**
 * Hook zur Steuerung des Textload-Zustands:
 * - delayMs: Sofortige oder verzögerte Einblendung (Standard: 0ms für sofortige Reaktion).
 * - minDurationMs: Garantiert, dass die Animation mindestens die angegebene Zeit
 *   (Standard: 500ms = 0.5s) sichtbar bleibt, sodass der Nutzer die Micro-Interaction
 *   wahrnehmen kann.
 */
export function useTextload({
  isLoading,
  delayMs = 0,
  minDurationMs = 500,
}: UseTextloadOptions) {
  const [showSkeleton, setShowSkeleton] = useState(false)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    if (isLoading) {
      if (!showSkeleton) {
        if (delayMs <= 0) {
          startTimeRef.current = performance.now()
          setShowSkeleton(true)
        } else {
          timer = setTimeout(() => {
            startTimeRef.current = performance.now()
            setShowSkeleton(true)
          }, delayMs)
        }
      }
    } else {
      if (showSkeleton) {
        const elapsed = performance.now() - startTimeRef.current
        const remaining = Math.max(0, minDurationMs - elapsed)
        timer = setTimeout(() => {
          setShowSkeleton(false)
        }, remaining)
      }
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isLoading, showSkeleton, delayMs, minDurationMs])

  return { showSkeleton, isBusy: isLoading }
}
