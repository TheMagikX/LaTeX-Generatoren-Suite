// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../components/ui'
import { buttonStyles } from '../../../styles/buttons'
import type { Config3D, Point3DUpdater } from '../typesKoord3D'
import { Koord3DPointCard } from './items/Koord3DPointCard'

interface Koord3DTabPointsProps {
  config: Config3D
  addPoint: () => void
  removePoint: (i: number) => void
  updatePoint: Point3DUpdater
  duplicatePoint: (i: number) => void
  setTabVisible: (key: 'points', value: boolean) => void
  setAllExpanded: (prefix: string, count: number, value: boolean) => void
  isExpanded: (key: string) => boolean
  toggleExpand: (key: string) => void
}

export const Koord3DTabPoints = ({
  config,
  addPoint,
  removePoint,
  updatePoint,
  duplicatePoint,
  setTabVisible,
  setAllExpanded,
  isExpanded,
  toggleExpand
}: Koord3DTabPointsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button onClick={addPoint} className={buttonStyles.fullStretchButton}>
          <Plus size={18} /> Punkt hinzufügen
        </Button>
        {config.points.length > 0 && <>
          <button onClick={() => setTabVisible('points', true)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><Eye size={12} /> Alle einblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setTabVisible('points', false)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><EyeOff size={12} /> Alle ausblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('pt', config.points.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('pt', config.points.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
        </>}
      </div>
      {config.points.map((pt, i) => (
        <Koord3DPointCard
          key={i}
          index={i}
          point={pt}
          isExpanded={isExpanded(`pt-${i}`)}
          onToggleExpand={() => toggleExpand(`pt-${i}`)}
          onUpdate={(field, value) => updatePoint(i, field, value)}
          onRemove={() => removePoint(i)}
          onDuplicate={() => duplicatePoint(i)}
          isDesignExpanded={isExpanded(`pt-${i}-design`)}
          onToggleDesignExpand={() => toggleExpand(`pt-${i}-design`)}
        />
      ))}
    </div>
  )
}
