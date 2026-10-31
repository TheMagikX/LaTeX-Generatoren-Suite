// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
//
// Based on / derived from interior (https://github.com/ddoemonn/interior)
// Copyright (c) 2026 ozzy (MIT License)
//
// Adaptations, styling, and integration for LaTeX-Generatoren-Suite:
// Copyright (C) 2026 C. Meyer (AGPL-3.0-or-later)

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useAsyncAction, type AsyncActionStatus } from '../hooks/useAsyncAction'

export type { AsyncActionStatus } from '../hooks/useAsyncAction'

const CELL = { type: 'spring', stiffness: 520, damping: 34, mass: 0.45 } as const
const CROSSFADE = { type: 'spring', stiffness: 260, damping: 34, mass: 0.8 } as const
const INSTANT = { duration: 0 } as const

function Spinner({ still }: { still: boolean }) {
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
      animate={still ? undefined : { rotate: 360 }}
      transition={still ? undefined : { duration: 0.85, repeat: Infinity, ease: 'linear' }}
    >
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M10.5 6A4.5 4.5 0 0 0 6 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </motion.svg>
  )
}

function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M2.6 6.3 4.9 8.6 9.4 3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AlertMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M6 2.9v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 9.05h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-amber-400 text-canvas font-semibold shadow-sm',
  secondary: 'bg-raised hover:bg-overlay text-muted hover:text-ink border border-line shadow-none',
  ghost: 'bg-transparent hover:bg-raised text-ghost hover:text-muted shadow-none',
}

export type LoadingButtonProps = {
  onAction?: () => unknown
  onClick?: () => void
  children: React.ReactNode
  pendingLabel?: React.ReactNode
  successLabel?: React.ReactNode
  errorLabel?: React.ReactNode
  resetAfter?: number
  disabled?: boolean
  pending?: boolean
  status?: AsyncActionStatus
  onError?: (error: unknown) => void
  className?: string
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  title?: string
}

export function LoadingButton({
  onAction,
  onClick,
  children,
  pendingLabel,
  successLabel = 'Fertig',
  errorLabel = 'Fehler',
  resetAfter = 1400,
  disabled = false,
  pending: externalPending,
  status: externalStatus,
  onError,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  title,
}: LoadingButtonProps) {
  const reduced = useReducedMotion()

  const internalAsync = useAsyncAction({
    action: onAction,
    resetAfter,
    onError,
  })

  // Falls externalPending oder externalStatus übergeben wurden (kontrollierter Modus)
  const currentStatus: AsyncActionStatus = externalStatus
    ? externalStatus
    : externalPending !== undefined
      ? (externalPending ? 'pending' : 'idle')
      : internalAsync.status

  const isPending = currentStatus === 'pending'
  const fade = reduced ? INSTANT : CROSSFADE

  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'

  const faces = [
    {
      key: 'idle',
      content: (
        <span className="flex items-center gap-2">
          {icon}
          <span>{children}</span>
        </span>
      ),
    },
    {
      key: 'pending',
      content: (
        <span className="flex items-center gap-2">
          <Spinner still={reduced === true || !isPending} />
          <span>{pendingLabel ?? children}</span>
        </span>
      ),
    },
    {
      key: 'success',
      content: (
        <span className="flex items-center gap-1.5 text-success">
          <CheckMark />
          <span>{successLabel}</span>
        </span>
      ),
    },
    {
      key: 'error',
      content: (
        <span className="flex items-center gap-1.5 text-error">
          <AlertMark />
          <span>{errorLabel}</span>
        </span>
      ),
    },
  ]

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isPending) {
      e.preventDefault()
      return
    }
    if (onClick) {
      onClick()
    } else if (onAction) {
      internalAsync.run()
    }
  }

  return (
    <motion.button
      type="button"
      disabled={disabled || isPending}
      title={title}
      aria-busy={isPending || undefined}
      whileTap={disabled || isPending || reduced ? undefined : { scale: 0.98 }}
      transition={CELL}
      onClick={handleClick}
      className={`relative inline-flex select-none items-center justify-center rounded-xl font-display transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${sizeClasses} ${className}`}
    >
      <span aria-hidden className="relative grid place-items-center">
        {faces.map((face) => (
          <motion.span
            key={face.key}
            initial={false}
            animate={
              face.key === currentStatus
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 3, filter: 'blur(3px)' }
            }
            transition={fade}
            className={`col-start-1 row-start-1 flex items-center justify-center whitespace-nowrap ${face.key === currentStatus ? '' : 'pointer-events-none'}`}
          >
            {face.content}
          </motion.span>
        ))}
      </span>

      <span role="status" aria-live="polite" className="sr-only">
        {isPending ? 'Wird ausgeführt…' : currentStatus === 'success' ? 'Erfolgreich abgeschlossen' : ''}
      </span>
    </motion.button>
  )
}
