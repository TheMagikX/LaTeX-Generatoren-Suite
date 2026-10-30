// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../components/ui'
import { buttonStyles } from '../../../styles/buttons'
import type { Config3D, Plane3DUpdater } from '../typesKoord3D'
import { Koord3DPlaneCard } from './items/Koord3DPlaneCard'

interface Koord3DTabPlanesProps {
  config: Config3D
  addPlane: () => void
  removePlane: (i: number) => void
  updatePlane: Plane3DUpdater
  duplicatePlane: (i: number) => void
  setTabVisible: (key: 'planes', value: boolean) => void
  setAllExpanded: (prefix: string, count: number, value: boolean) => void
  isExpanded: (key: string) => boolean
  toggleExpand: (key: string) => void
  onSetPoint: (i: number, n: 1 | 2 | 3, ptIdx: number | null) => void
}

export const Koord3DTabPlanes = ({
  config,
  addPlane,
  removePlane,
  updatePlane,
  duplicatePlane,
  setTabVisible,
  setAllExpanded,
  isExpanded,
  toggleExpand,
  onSetPoint
}: Koord3DTabPlanesProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button onClick={addPlane} className={buttonStyles.fullStretchButton}>
          <Plus size={18} /> Ebene hinzufügen
        </Button>
        {config.planes.length > 0 && <>
          <button onClick={() => setTabVisible('planes', true)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><Eye size={12} /> Alle einblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setTabVisible('planes', false)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><EyeOff size={12} /> Alle ausblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('pl', config.planes.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('pl', config.planes.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
        </>}
      </div>
      {config.planes.map((e, i) => (
        <Koord3DPlaneCard
          key={i}
          index={i}
          plane={e}
          points={config.points}
          isExpanded={isExpanded(`pl-${i}`)}
          onToggleExpand={() => toggleExpand(`pl-${i}`)}
          onUpdate={(field, value) => updatePlane(i, field, value)}
          onRemove={() => removePlane(i)}
          onDuplicate={() => duplicatePlane(i)}
          onSetPoint={(n, ptIdx) => onSetPoint(i, n, ptIdx)}
          isDesignExpanded={isExpanded(`pl-${i}-design`)}
          onToggleDesignExpand={() => toggleExpand(`pl-${i}-design`)}
        />
      ))}
    </div>
  )
}
