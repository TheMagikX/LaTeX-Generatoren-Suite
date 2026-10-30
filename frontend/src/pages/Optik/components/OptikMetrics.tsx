// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ImageMetric } from '../typesOptik'

export const MetricsPanel = ({ metrics }: { metrics: ImageMetric[] }) => {
  if (!metrics || metrics.length === 0) return null

  return (
    <div className="space-y-3">
      {metrics.map((img, i) => {
        const isInfinite = img.x === null
        const isLast = i === metrics.length - 1
        return (
          <div
            key={i}
            className={`rounded-xl border p-4 space-y-3 ${
              isLast
                ? img.virtual
                  ? 'border-orange-500/40 bg-orange-500/5'
                  : 'border-green-500/40 bg-green-500/5'
                : 'border-rim bg-raised/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">
                {isLast ? `Bild B` : `Zwischenbild B${i + 1}`}
              </span>
              {isLast && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    img.virtual
                      ? 'bg-orange-500/20 text-orange-300'
                      : 'bg-green-500/20 text-green-300'
                  }`}
                >
                  {img.virtual ? 'Virtuell' : 'Reell'}
                </span>
              )}
            </div>

            {isInfinite ? (
              <p className="text-xs text-amber-400">
                ⚠️ Gegenstand in der Brennebene – Bild im Unendlichen
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: `b${metrics.length > 1 ? i + 1 : ''}`, value: img.b, unit: 'cm' },
                  { label: `B${metrics.length > 1 ? i + 1 : ''}`, value: img.y, unit: 'cm' },
                  { label: '|b/g|', value: img.m !== null ? Math.abs(img.m) : null, unit: '' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="bg-panel/60 rounded-lg p-2 text-center">
                    <div className="text-metadata mb-0.5">{label}</div>
                    <div className="text-sm font-display font-semibold text-ink">
                      {value !== null ? value.toFixed(2) : '∞'}
                      {unit && (
                        <span className="text-metadata ml-0.5">{unit}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
