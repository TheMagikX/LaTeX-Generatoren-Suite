// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../components/ui'
import { buttonStyles } from '../../../styles/buttons'
import type { Config3D, Shape3DUpdater } from '../typesKoord3D'
import { Koord3DShapeCard } from './items/Koord3DShapeCard'

interface Koord3DTabShapesProps {
  config: Config3D
  addShape: () => void
  removeShape: (i: number) => void
  updateShape: Shape3DUpdater
  duplicateShape: (i: number) => void
  setTabVisible: (key: 'shapes', value: boolean) => void
  setAllExpanded: (prefix: string, count: number, value: boolean) => void
  isExpanded: (key: string) => boolean
  toggleExpand: (key: string) => void
}

export const Koord3DTabShapes = ({
  config,
  addShape,
  removeShape,
  updateShape,
  duplicateShape,
  setTabVisible,
  setAllExpanded,
  isExpanded,
  toggleExpand
}: Koord3DTabShapesProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button onClick={addShape} className={buttonStyles.fullStretchButton}>
          <Plus size={18} /> Shape hinzufügen
        </Button>
        {config.shapes.length > 0 && <>
          <button onClick={() => setTabVisible('shapes', true)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><Eye size={12} /> Alle einblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setTabVisible('shapes', false)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><EyeOff size={12} /> Alle ausblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('sh', config.shapes.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('sh', config.shapes.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
        </>}
      </div>
      {config.shapes.map((sh, i) => (
        <Koord3DShapeCard
          key={i}
          index={i}
          shape={sh}
          points={config.points}
          isExpanded={isExpanded(`sh-${i}`)}
          onToggleExpand={() => toggleExpand(`sh-${i}`)}
          onUpdate={(field, value) => updateShape(i, field, value)}
          onRemove={() => removeShape(i)}
          onDuplicate={() => duplicateShape(i)}
          isDesignExpanded={isExpanded(`sh-${i}-design`)}
          onToggleDesignExpand={() => toggleExpand(`sh-${i}-design`)}
        />
      ))}
    </div>
  )
}
