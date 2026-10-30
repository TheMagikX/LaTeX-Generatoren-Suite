// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ThemeColors } from '../types'

interface ThemePreviewProps {
  c: ThemeColors
}

export function ThemePreview({ c }: ThemePreviewProps) {
  return (
    <div
      style={{ background: c.canvas, borderColor: c.border }}
      className="w-full h-24 rounded-xl border overflow-hidden flex"
    >
      {/* Sidebar strip */}
      <div
        style={{ background: c.panel, borderColor: c.border }}
        className="w-10 h-full border-r flex flex-col items-center gap-1.5 pt-3 pb-2 shrink-0"
      >
        {/* Logo dot */}
        <div style={{ background: c.primary }} className="w-3.5 h-3.5 rounded-sm mb-1" />
        {/* Nav items */}
        {[1, 1, 0.4, 0.4, 0.4].map((op, i) => (
          <div
            key={i}
            style={{ background: i < 2 ? c.muted : c.border, opacity: op }}
            className="w-5 h-1.5 rounded-full"
          />
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 p-2.5 flex flex-col gap-1.5">
        {/* Top bar */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <div style={{ background: c.ink, opacity: 0.8 }} className="w-16 h-2 rounded-full" />
          <div style={{ background: c.primary, opacity: 0.15 }} className="flex-1 h-2 rounded-full" />
        </div>
        {/* Card row */}
        <div className="flex gap-1.5">
          {[c.panel, c.raised, c.raised].map((bg, i) => (
            <div
              key={i}
              style={{ background: bg, borderColor: c.border }}
              className="flex-1 rounded-lg border p-1.5"
            >
              <div
                style={{ background: i === 0 ? c.primary : c.muted, opacity: i === 0 ? 0.9 : 0.4 }}
                className="w-full h-1.5 rounded-full mb-1"
              />
              <div style={{ background: c.muted, opacity: 0.25 }} className="w-3/4 h-1 rounded-full" />
            </div>
          ))}
        </div>
        {/* Bottom accent bar */}
        <div
          style={{ background: c.raised, borderColor: c.border }}
          className="flex-1 rounded-lg border flex items-center gap-1.5 px-2"
        >
          <div style={{ background: c.primary, opacity: 0.7 }} className="w-2 h-2 rounded-sm shrink-0" />
          <div style={{ background: c.muted, opacity: 0.3 }} className="flex-1 h-1 rounded-full" />
        </div>
      </div>
    </div>
  )
}
