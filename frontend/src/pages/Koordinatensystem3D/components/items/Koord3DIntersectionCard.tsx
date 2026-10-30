// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { Card, Button, Switch, Label, Input, NumberInput } from '../../../../components/ui'
import type { Intersection, Line3D, Plane3D } from '../../typesKoord3D'

interface Koord3DIntersectionCardProps {
  index: number
  intersection: Intersection
  lines: Line3D[]
  planes: Plane3D[]
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: <K extends keyof Intersection>(field: K, value: Intersection[K]) => void
  onRemove: () => void
}

export const Koord3DIntersectionCard = ({
  index,
  intersection,
  lines,
  planes,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove
}: Koord3DIntersectionCardProps) => {
  return (
    <Card className="border-line bg-canvas/50 overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-raised/40 transition-colors"
      >
        {isExpanded ? <ChevronDown size={16} className="text-muted shrink-0" /> : <ChevronRight size={16} className="text-muted shrink-0" />}
        <span className="text-sm font-medium text-ink">Schnitt {index + 1}</span>
        {!isExpanded && (
          <span className="text-metadata truncate">{intersection.type} ({intersection.item1_index + 1}, {intersection.item2_index + 1})</span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Switch checked={intersection.show} onChange={val => onUpdate('show', val)} />
          <Button onClick={onRemove} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2">
            <Trash2 size={15} />
          </Button>
        </div>
      </button>
      {isExpanded && <div className="px-4 pb-4 border-t border-line/60">
        <div className="grid grid-cols-2 gap-4 mb-4 mt-3">
          <div>
            <Label>Typ</Label>
            <select value={intersection.type} onChange={e => onUpdate('type', e.target.value)}
              className="w-full px-3 py-2 bg-raised border border-line rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
              {['Gerade-Gerade', 'Gerade-Ebene', 'Ebene-Ebene'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>{intersection.type === 'Ebene-Ebene' ? 'Ebene 1' : 'Gerade 1'}</Label>
            <select value={intersection.item1_index} onChange={e => onUpdate('item1_index', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-raised border border-line rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
              {(intersection.type === 'Ebene-Ebene' ? planes : lines).map((_, idx) => (
                <option key={idx} value={idx}>{intersection.type === 'Ebene-Ebene' ? `Ebene ${idx + 1}` : `Gerade ${idx + 1}`}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>{intersection.type === 'Gerade-Gerade' ? 'Gerade 2' : 'Ebene 2'}</Label>
            <select value={intersection.item2_index} onChange={e => onUpdate('item2_index', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-raised border border-line rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
              {(intersection.type === 'Gerade-Gerade' ? lines : planes).map((_, idx) => (
                <option key={idx} value={idx}>{intersection.type === 'Gerade-Gerade' ? `Gerade ${idx + 1}` : `Ebene ${idx + 1}`}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Farbe</Label><Input value={intersection.color} onChange={e => onUpdate('color', e.target.value)} /></div>
          {intersection.type !== 'Ebene-Ebene' ? (
            <>
              <div><Label>Label</Label><Input value={intersection.label} onChange={e => onUpdate('label', e.target.value)} /></div>
              <div><Label>Marker</Label><Input value={intersection.mark} onChange={e => onUpdate('mark', e.target.value)} /></div>
            </>
          ) : (
            <>
              <div><Label>Dicke</Label><NumberInput step="0.1" value={intersection.width} onChange={e => onUpdate('width', parseFloat(e.target.value))} /></div>
              <div><Label>Stil</Label><Input value={intersection.style} onChange={e => onUpdate('style', e.target.value)} /></div>
            </>
          )}
        </div>
      </div>}
    </Card>
  )
}
