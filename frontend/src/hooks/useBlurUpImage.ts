// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
//
// Based on / derived from interior (https://github.com/ddoemonn/interior)
// Copyright (c) 2026 ozzy (MIT License)
//
// Adaptations, timing enhancements, and integration for LaTeX-Generatoren-Suite:
// Copyright (C) 2026 C. Meyer (AGPL-3.0-or-later)

import { useEffect, useRef, useState } from 'react'
import { useIsomorphicLayoutEffect } from 'motion/react'

export type BlurUpStatus = 'loading' | 'ready' | 'error'

export type UseBlurUpImageOptions = {
  src?: string
  srcSet?: string
  onReady?: () => void
  onError?: () => void
}

export function useBlurUpImage({
  src,
  srcSet,
  onReady,
  onError,
}: UseBlurUpImageOptions) {
  const ref = useRef<HTMLImageElement>(null)
  const [state, setState] = useState<{
    status: BlurUpStatus
    instant: boolean
  }>({ status: 'loading', instant: false })

  const ready = useRef(onReady)
  const failed = useRef(onError)

  useEffect(() => {
    ready.current = onReady
    failed.current = onError
  }, [onReady, onError])

  useIsomorphicLayoutEffect(() => {
    const img = ref.current

    const set = (status: BlurUpStatus, instant: boolean) =>
      setState((prev) =>
        prev.status === status && prev.instant === instant
          ? prev
          : { status, instant },
      )

    if (!img || !src) {
      set('loading', false)
      return
    }

    let alive = true
    const cached = img.complete && img.naturalWidth > 0

    const reveal = () => {
      if (!alive) return
      set('ready', cached)
      ready.current?.()
    }

    const fail = () => {
      if (!alive) return
      set('error', cached)
      failed.current?.()
    }

    if (img.complete) {
      if (cached) reveal()
      else fail()
      return () => {
        alive = false
      }
    }

    set('loading', false)

    const onLoad = () => {
      if (!alive) return
      if (typeof img.decode === 'function') {
        img.decode().then(reveal, fail)
        return
      }
      reveal()
    }

    img.addEventListener('load', onLoad)
    img.addEventListener('error', fail)

    return () => {
      alive = false
      img.removeEventListener('load', onLoad)
      img.removeEventListener('error', fail)
    }
  }, [src, srcSet])

  return {
    ref,
    status: state.status,
    instant: state.instant,
    loaded: state.status === 'ready',
  }
}
