// SPDX-License-Identifier: AGPL-3.0-or-later

import { Layers } from 'lucide-react'
import { Accordion, SecHead } from '../../../components/ui'
import type { Config } from '../typesGeo'
import { HelperLineEditor } from '../utilsGeo'

type TriangleHeights = Partial<Record<'ha' | 'hb' | 'hc', number>>

interface GeoTabSpecialLinesProps {
  cfg: Config
  updEl: (patch: Partial<Config['elements']>) => void
}

const formatLength = (value?: number) => (
  Number.isFinite(value) ? `${value!.toFixed(2)} cm` : null
)

const calculateTriangleHeights = (cfg: Config): TriangleHeights => {
  if (cfg.shape !== 'Triangle') return {}

  const { mode } = cfg.construction
  let a = cfg.construction.a
  let b = cfg.construction.b
  const c = cfg.construction.c
  let area = 0

  if (mode === 'SSS') {
    if (a <= 0 || b <= 0 || c <= 0 || a + b <= c || a + c <= b || b + c <= a) return {}
    const s = (a + b + c) / 2
    area = Math.sqrt(s * (s - a) * (s - b) * (s - c))
  } else if (mode === 'SWS') {
    const alphaRad = cfg.construction.alpha * Math.PI / 180
    if (b <= 0 || c <= 0 || cfg.construction.alpha <= 0 || cfg.construction.alpha >= 180) return {}
    a = Math.sqrt(b ** 2 + c ** 2 - 2 * b * c * Math.cos(alphaRad))
    area = 0.5 * b * c * Math.sin(alphaRad)
  } else {
    const alpha = cfg.construction.alpha
    const beta = cfg.construction.beta
    const gamma = 180 - alpha - beta
    if (c <= 0 || alpha <= 0 || beta <= 0 || gamma <= 0) return {}
    const sinGamma = Math.sin(gamma * Math.PI / 180)
    if (Math.abs(sinGamma) < 1e-12) return {}
    a = c * Math.sin(alpha * Math.PI / 180) / sinGamma
    b = c * Math.sin(beta * Math.PI / 180) / sinGamma
    area = 0.5 * b * c * Math.sin(alpha * Math.PI / 180)
  }

  if (area <= 0 || a <= 0 || b <= 0 || c <= 0) return {}

  return {
    ha: 2 * area / a,
    hb: 2 * area / b,
    hc: 2 * area / c,
  }
}

const LineLabel = ({
  name,
  symbol,
  subscript,
  value,
}: {
  name: string
  symbol: string
  subscript?: string
  value?: number
}) => {
  const length = formatLength(value)

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
      <span>{name}</span>
      <span>
        {symbol}
        {subscript && <sub>{subscript}</sub>}
      </span>
      {length && <span className="text-xs font-medium text-muted">({length})</span>}
    </span>
  )
}

export const GeoTabSpecialLines = ({ cfg, updEl }: GeoTabSpecialLinesProps) => {
  const heights = calculateTriangleHeights(cfg)

  return (
    <Accordion title="Spezielle Linien" icon={<Layers size={18} />}>
      <div className="space-y-8">
        <div>
          <SecHead>Höhen</SecHead>
          <div className="space-y-3">
            {(['ha', 'hb', 'hc'] as const).map(k => (
              (cfg.shape === 'Triangle' || k === 'hc') && (
                <HelperLineEditor
                  key={k}
                  label={cfg.shape === 'Triangle'
                    ? <LineLabel name="Höhe" symbol="h" subscript={k[1]} value={heights[k]} />
                    : <LineLabel name="Höhe" symbol="h" />}
                  value={cfg.elements.heights[k]}
                  onChange={v => updEl({ heights: { ...cfg.elements.heights, [k]: v } })}
                />
              )
            ))}
          </div>
        </div>
        {cfg.shape === 'Triangle' && (
          <>
            <div className="w-full h-px bg-raised/80" />
            <div>
              <SecHead>Seitenhalbierende</SecHead>
              <div className="space-y-3">
                {(['sa', 'sb', 'sc'] as const).map(k => (
                  <HelperLineEditor key={k} label={<LineLabel name="Seitenhalbierende" symbol="s" subscript={k[1]} />} value={cfg.elements.medians[k]} onChange={v => updEl({ medians: { ...cfg.elements.medians, [k]: v } })} />
                ))}
              </div>
            </div>
            <div className="w-full h-px bg-raised/80" />
            <div>
              <SecHead>Winkelhalbierende</SecHead>
              <div className="space-y-3">
                {(['wa', 'wb', 'wc'] as const).map(k => (
                  <HelperLineEditor key={k} label={<LineLabel name="Winkelhalbierende" symbol="w" subscript={k[1]} />} value={cfg.elements.angle_bisectors[k]} onChange={v => updEl({ angle_bisectors: { ...cfg.elements.angle_bisectors, [k]: v } })} />
                ))}
              </div>
            </div>
            <div className="w-full h-px bg-raised/80" />
            <div>
              <SecHead>Mittelsenkrechte</SecHead>
              <div className="space-y-3">
                {(['ma', 'mb', 'mc'] as const).map(k => (
                  <HelperLineEditor key={k} label={<LineLabel name="Mittelsenkrechte" symbol="m" subscript={k[1]} />} value={cfg.elements.perpendicular_bisectors[k]} onChange={v => updEl({ perpendicular_bisectors: { ...cfg.elements.perpendicular_bisectors, [k]: v } })} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Accordion>
  )
}
