// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Paintbrush, Copy, Clipboard, Sparkles } from 'lucide-react'
import { Button } from '../../../components/ui'

interface StyleCopyMenuProps {
  onCopyStyle: () => void
  onPasteStyle?: () => void
  onApplyToAll?: () => void
  hasCopiedStyle?: boolean
  itemTypeName?: string
}

export const StyleCopyMenu: React.FC<StyleCopyMenuProps> = ({
  onCopyStyle,
  onPasteStyle,
  onApplyToAll,
  hasCopiedStyle = false,
  itemTypeName = 'Element'
}) => {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })

  const toggleMenu = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right)
      })
    }
    setOpen(!open)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const handleScrollOrResize = () => {
      if (open) setOpen(false)
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScrollOrResize, true)
      window.addEventListener('resize', handleScrollOrResize)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open])

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleMenu()
        }}
        className={`p-2 ${
          hasCopiedStyle
            ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/40'
            : 'bg-primary/10 hover:bg-primary text-primary hover:text-white'
        }`}
        title={`Format von ${itemTypeName} übertragen`}
      >
        <Paintbrush size={15} />
      </Button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${menuPos.top}px`,
              right: `${menuPos.right}px`
            }}
            onClick={e => e.stopPropagation()}
            className="w-52 bg-panel border border-rim shadow-2xl rounded-xl z-[9999] py-1.5 text-xs text-ink overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-1 text-[10px] font-semibold text-ghost uppercase tracking-wider border-b border-line/50 mb-1">
              Format ({itemTypeName})
            </div>
            <button
              type="button"
              onClick={() => {
                onCopyStyle()
                setOpen(false)
              }}
              className="w-full px-3 py-2 text-left hover:bg-raised flex items-center gap-2 text-ink cursor-pointer transition-colors"
            >
              <Copy size={14} className="text-primary shrink-0" />
              <span>Format kopieren</span>
            </button>

            {onPasteStyle && (
              <button
                type="button"
                disabled={!hasCopiedStyle}
                onClick={() => {
                  if (hasCopiedStyle) {
                    onPasteStyle()
                    setOpen(false)
                  }
                }}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                  hasCopiedStyle
                    ? 'hover:bg-raised text-ink cursor-pointer'
                    : 'opacity-40 text-ghost cursor-not-allowed'
                }`}
              >
                <Clipboard size={14} className="text-amber-400 shrink-0" />
                <span>Format hier einfügen</span>
              </button>
            )}

            {onApplyToAll && (
              <button
                type="button"
                onClick={() => {
                  onApplyToAll()
                  setOpen(false)
                }}
                className="w-full px-3 py-2 text-left hover:bg-raised flex items-center gap-2 text-ink cursor-pointer transition-colors border-t border-line/50 mt-1 pt-2"
              >
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <span>Auf alle übertragen</span>
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  )
}
