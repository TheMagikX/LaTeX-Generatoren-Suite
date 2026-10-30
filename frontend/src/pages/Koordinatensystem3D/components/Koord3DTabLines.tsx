// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../components/ui'
import { buttonStyles } from '../../../styles/buttons'
import type { Config3D, Line3DUpdater } from '../typesKoord3D'
import { Koord3DLineCard } from './items/Koord3DLineCard'

interface Koord3DTabLinesProps {
  config: Config3D
  addLine: () => void
  removeLine: (i: number) => void
  updateLine: Line3DUpdater
  duplicateLine: (i: number) => void
  setTabVisible: (key: 'lines', value: boolean) => void
  setAllExpanded: (prefix: string, count: number, value: boolean) => void
  isExpanded: (key: string) => boolean
  toggleExpand: (key: string) => void
  onSetMode: (i: number, mode: 'stuetz_richtung' | '2_punkte') => void
  onSetPoint1: (i: number, ptIdx: number | null) => void
  onSetPoint2: (i: number, ptIdx: number | null) => void
  onSetSvecPoint: (i: number, ptIdx: number | null) => void
}

export const Koord3DTabLines = ({
  config,
  addLine,
  removeLine,
  updateLine,
  duplicateLine,
  setTabVisible,
  setAllExpanded,
  isExpanded,
  toggleExpand,
  onSetMode,
  onSetPoint1,
  onSetPoint2,
  onSetSvecPoint
}: Koord3DTabLinesProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button onClick={addLine} className={buttonStyles.fullStretchButton}>
          <Plus size={18} /> Gerade hinzufügen
        </Button>
        {config.lines.length > 0 && <>
          <button onClick={() => setTabVisible('lines', true)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><Eye size={12} /> Alle einblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setTabVisible('lines', false)} className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap flex items-center gap-1"><EyeOff size={12} /> Alle ausblenden</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('ln', config.lines.length, true)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Expand</button>
          <span className="text-slate-700 text-xs">|</span>
          <button onClick={() => setAllExpanded('ln', config.lines.length, false)} className="text-caption text-ghost hover:text-ink tracking-tighter cursor-pointer">Collapse</button>
        </>}
      </div>
      {config.lines.map((g, i) => (
        <Koord3DLineCard
          key={i}
          index={i}
          line={g}
          points={config.points}
          isExpanded={isExpanded(`ln-${i}`)}
          onToggleExpand={() => toggleExpand(`ln-${i}`)}
          onUpdate={(field, value) => updateLine(i, field, value)}
          onRemove={() => removeLine(i)}
          onDuplicate={() => duplicateLine(i)}
          onSetMode={(mode) => onSetMode(i, mode)}
          onSetPoint1={(ptIdx) => onSetPoint1(i, ptIdx)}
          onSetPoint2={(ptIdx) => onSetPoint2(i, ptIdx)}
          onSetSvecPoint={(ptIdx) => onSetSvecPoint(i, ptIdx)}
          isDesignExpanded={isExpanded(`ln-${i}-design`)}
          onToggleDesignExpand={() => toggleExpand(`ln-${i}-design`)}
        />
      ))}
    </div>
  )
}
