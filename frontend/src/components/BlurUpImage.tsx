// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
//
// Based on / derived from interior (https://github.com/ddoemonn/interior)
// Copyright (c) 2026 ozzy (MIT License)
//
// Adaptations, styling, and integration for LaTeX-Generatoren-Suite:
// Copyright (C) 2026 C. Meyer (AGPL-3.0-or-later)

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useBlurUpImage, type BlurUpStatus, type UseBlurUpImageOptions } from '../hooks/useBlurUpImage'

export type { BlurUpStatus, UseBlurUpImageOptions }

const DEVELOP = { duration: 0.65, ease: [0.23, 1, 0.32, 1] } as const
const INSTANT = { duration: 0 } as const

export type BlurUpImageProps = {
  src?: string
  alt: string
  width?: number
  height?: number
  placeholder?: string
  color?: string
  blur?: number
  isCompiling?: boolean
  onClick?: () => void
  onReady?: () => void
  onError?: () => void
  className?: string
  imgClassName?: string
}

export const BlurUpImage = React.forwardRef<HTMLImageElement, BlurUpImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      placeholder,
      color,
      blur = 14,
      isCompiling = false,
      onClick,
      onReady,
      onError,
      className = '',
      imgClassName = '',
    },
    forwardedRef,
  ) => {
    const reduced = useReducedMotion()
    const { ref, status, instant } = useBlurUpImage({
      src,
      onReady,
      onError,
    })

    // Sync forwardedRef
    React.useImperativeHandle(forwardedRef, () => ref.current as HTMLImageElement)

    const shown = status === 'ready'
    const still = reduced === true || instant
    const transition = still ? INSTANT : DEVELOP

    return (
      <div
        aria-busy={status === 'loading' || isCompiling}
        style={{ backgroundColor: color }}
        className={`relative max-w-full max-h-full overflow-hidden flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        {placeholder && (
          <img
            src={placeholder}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ filter: `blur(${blur}px)`, transform: 'scale(1.04)' }}
          />
        )}

        <motion.img
          ref={ref}
          src={src}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          draggable={false}
          className={`max-w-full max-h-full object-contain drop-shadow-xl transition-[transform] duration-300 ${imgClassName}`}
          initial={false}
          animate={
            still
              ? { opacity: shown ? (isCompiling ? 0.9 : 1) : 0 }
              : shown
                ? {
                    opacity: isCompiling ? 0.9 : 1,
                    filter: isCompiling ? 'blur(6px)' : 'blur(0px)',
                    scale: isCompiling ? 0.99 : 1,
                  }
                : {
                    opacity: 0,
                    filter: 'blur(16px)',
                    scale: 1.04,
                  }
          }
          transition={transition}
        />
      </div>
    )
  },
)

BlurUpImage.displayName = 'BlurUpImage'

