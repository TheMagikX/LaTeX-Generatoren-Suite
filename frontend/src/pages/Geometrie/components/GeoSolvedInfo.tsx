// SPDX-License-Identifier: AGPL-3.0-or-later

import { CheckCircle, XCircle } from 'lucide-react'
import type { GeoSolved } from '../typesGeo'

interface GeoSolvedInfoProps {
  shape: 'Triangle' | 'Quadrilateral'
  solved?: GeoSolved
  solveError?: string
}

export const GeoSolvedInfo = ({ shape, solved, solveError }: GeoSolvedInfoProps) => {
  if (solveError) {
    return (
      <div className="flex items-center gap-3 px-6 py-4 bg-error/10 border border-error/30 rounded-2xl text-sm text-error animate-in fade-in zoom-in-95 duration-500">
        <XCircle size={20} className="text-error" />
        <span className="font-medium">{solveError}</span>
      </div>
    )
  }

  if (!solved) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-panel/80 border border-success/30 rounded-2xl shadow-sm backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-3 text-success">
        <CheckCircle size={20} className="drop-shadow-sm" />
        <span className="text-sm font-semibold tracking-wide">
          {shape === 'Triangle' ? 'Dreieck erfolgreich gelöst' : 'Viereck erfolgreich berechnet'}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-6 text-sm font-mono text-muted bg-raised/60 px-5 py-2 rounded-xl border border-line">
        <div className="flex gap-4">
          <span>a={solved.sides.a?.toFixed(2)}</span>
          <span>b={solved.sides.b?.toFixed(2)}</span>
          <span>c={solved.sides.c?.toFixed(2)}</span>
          {shape === 'Quadrilateral' && solved.sides.d != null && (
            <span>d={solved.sides.d.toFixed(2)}</span>
          )}
        </div>
        {(shape === 'Triangle' || Object.keys(solved.angles).length > 0) && (
          <>
            <div className="w-px h-4 bg-line" />
            <div className="flex gap-4 text-ink">
              {solved.angles.alpha != null && <span>α={solved.angles.alpha.toFixed(1)}°</span>}
              {solved.angles.beta != null && <span>β={solved.angles.beta.toFixed(1)}°</span>}
              {solved.angles.gamma != null && <span>γ={solved.angles.gamma.toFixed(1)}°</span>}
              {shape === 'Quadrilateral' && solved.angles.delta != null && <span>δ={solved.angles.delta.toFixed(1)}°</span>}
            </div>
          </>
        )}
        {solved.diagonals && (
          <>
            <div className="w-px h-4 bg-line" />
            <div className="flex gap-4 text-muted">
              <span>e={solved.diagonals.e?.toFixed(2)}</span>
              <span>f={solved.diagonals.f?.toFixed(2)}</span>
            </div>
          </>
        )}
        {(solved.area != null || solved.perimeter != null) && (
          <>
            <div className="w-px h-4 bg-line" />
            <div className="flex gap-4 text-secondary">
              {solved.area != null && <span>A={solved.area.toFixed(2)} cm²</span>}
              {solved.perimeter != null && <span>U={solved.perimeter.toFixed(2)} cm</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
