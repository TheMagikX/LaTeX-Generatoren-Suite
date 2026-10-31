// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
//
// Based on / derived from interior (https://github.com/ddoemonn/interior)
// Copyright (c) 2026 ozzy (MIT License)
//
// Adaptations, styling, and integration for LaTeX-Generatoren-Suite:
// Copyright (C) 2026 C. Meyer (AGPL-3.0-or-later)

import React, { useId } from 'react'
import { Reorder, useDragControls, useReducedMotion } from 'motion/react'
import { useReorderList, type UseReorderListOptions } from '../hooks/useReorderList'

export type { UseReorderListOptions }

const CELL = { type: 'spring', stiffness: 500, damping: 35, mass: 0.3 } as const
const INSTANT = { duration: 0 } as const

export type ReorderListProps<T> = UseReorderListOptions<T> & {
  children: (item: T, index: number) => React.ReactNode
  label: string
  className?: string
  itemClassName?: string
}

const GRIP = (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true" className="shrink-0">
    <circle cx="2.5" cy="2.5" r="1.2" />
    <circle cx="7.5" cy="2.5" r="1.2" />
    <circle cx="2.5" cy="7" r="1.2" />
    <circle cx="7.5" cy="7" r="1.2" />
    <circle cx="2.5" cy="11.5" r="1.2" />
    <circle cx="7.5" cy="11.5" r="1.2" />
  </svg>
)

interface ReorderRowProps<T> {
  item: T
  index: number
  id: string
  hintId: string
  disabled: boolean
  reduced: boolean
  list: ReturnType<typeof useReorderList<T>>
  children: (item: T, index: number) => React.ReactNode
  getLabel: (item: T) => string
  itemClassName: string
}

function ReorderRow<T>({
  item,
  index,
  id,
  hintId,
  disabled,
  reduced,
  list,
  children,
  getLabel,
  itemClassName,
}: ReorderRowProps<T>) {
  const dragControls = useDragControls()
  const held = list.grabbed === id
  const lifted = held || list.dragging === id

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      tabIndex={disabled ? -1 : 0}
      aria-describedby={hintId}
      aria-pressed={held}
      role="listitem"
      onKeyDown={list.rowKeyDown(id)}
      onDragStart={() => list.onDragStart(id)}
      onDragEnd={() => list.onDragEnd(id)}
      onBlur={() => held && list.cancel()}
      transition={reduced ? INSTANT : CELL}
      className={`relative flex items-center gap-3 rounded-xl border bg-raised/40 px-3 py-2.5 outline-none ${
        lifted
          ? 'z-30 cursor-grabbing border-primary/60 bg-panel shadow-2xl !transition-none'
          : 'border-line hover:border-rim hover:bg-raised/70 transition-[border-color,background-color,box-shadow] duration-150'
      } ${
        held
          ? 'ring-2 ring-primary/40 border-primary bg-panel'
          : 'focus-visible:ring-2 focus-visible:ring-primary/40'
      } ${itemClassName}`}
    >
      <div
        aria-hidden="true"
        onPointerDown={(e) => {
          if (!disabled) {
            e.preventDefault()
            dragControls.start(e)
          }
        }}
        className={`shrink-0 select-none p-1.5 rounded-lg cursor-grab active:cursor-grabbing touch-none transition-colors duration-150 ${
          lifted ? 'text-primary bg-primary/10' : 'text-ghost hover:text-ink hover:bg-overlay'
        }`}
        title="Am Anfasser ziehen zum Umsortieren"
      >
        {GRIP}
      </div>
      <span className="sr-only">{getLabel(item)}</span>
      <div className="min-w-0 flex-1">
        {children(item, index)}
      </div>
    </Reorder.Item>
  )
}

export function ReorderList<T>({
  children,
  label,
  className = '',
  itemClassName = '',
  ...options
}: ReorderListProps<T>) {
  const { items, getId, getLabel, onReorder, disabled = false } = options
  const list = useReorderList(options)
  const reduced = useReducedMotion() === true
  const hintId = useId()

  return (
    <div className={`w-full ${className}`}>
      <Reorder.Group
        axis="y"
        values={items as T[]}
        onReorder={onReorder}
        aria-label={label}
        className="m-0 list-none space-y-2 p-0"
      >
        {items.map((item, index) => {
          const id = getId(item)
          return (
            <ReorderRow
              key={id}
              item={item}
              index={index}
              id={id}
              hintId={hintId}
              disabled={disabled}
              reduced={reduced}
              list={list}
              children={children}
              getLabel={getLabel}
              itemClassName={itemClassName}
            />
          )
        })}
      </Reorder.Group>
      <span id={hintId} className="sr-only">
        Am Anfasser ziehen zum Umsortieren. Mit der Tastatur: Leertaste zum Auswählen, Pfeiltasten zum Verschieben, Leertaste zum Ablegen, Escape zum Abbrechen.
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {list.spoken}
      </span>
    </div>
  )
}
