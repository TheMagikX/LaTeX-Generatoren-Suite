// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../components/ui'
import { buttonStyles } from '../../../styles/buttons'
import type { Config3D, Vector3DUpdater } from '../typesKoord3D'
import { Koord3DVectorCard } from './items/Koord3DVectorCard'

interface Koord3DTabVectorsProps {
  config: Config3D
  addVector: () => void
  removeVector: (i: number) => void
  updateVector: Vector3DUpdater
  duplicateVector: (i: number) => void
  setTabVisible: (key: 'vectors', value: boolean) => void
  setAllExpanded: (prefix: string, count: number, value: boolean) => void
  isExpanded: (key: string) => boolean
  toggleExpand: (key: string) => void
  onSetPoints: (i: number, startIdx: number | null, endIdx: number | null) => void
}

export const Koord3DTabVectors = ({
  config,
  addVector,
  removeVector,
  updateVector,
  duplicateVector,
  setTabVisible,
  setAllExpanded,
  isExpanded,
  toggleExpand,
  onSetPoints
}: Koord3DTabVectorsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button onClick={addVector} className={buttonStyles.fullStretchButton}>
          <Plus size={18} /> Vektor hinzufügen
        </Button>
        {config.vectors.length > 0 && <>
          <button onClick={() => setTabVisible('vectors', true)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><Eye size={12} /> Alle einblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setTabVisible('vectors', false)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><EyeOff size={12} /> Alle ausblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('vec', config.vectors.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('vec', config.vectors.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
        </>}
      </div>
      {config.vectors.map((v, i) => (
        <Koord3DVectorCard
          key={i}
          index={i}
          vector={v}
          points={config.points}
          isExpanded={isExpanded(`vec-${i}`)}
          onToggleExpand={() => toggleExpand(`vec-${i}`)}
          onUpdate={(field, value) => updateVector(i, field, value)}
          onRemove={() => removeVector(i)}
          onDuplicate={() => duplicateVector(i)}
          onSetPoints={(startIdx, endIdx) => onSetPoints(i, startIdx, endIdx)}
          isDesignExpanded={isExpanded(`vec-${i}-design`)}
          onToggleDesignExpand={() => toggleExpand(`vec-${i}-design`)}
        />
      ))}
    </div>
  )
}
