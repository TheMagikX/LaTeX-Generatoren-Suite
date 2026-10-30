// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { Config3D, IntersectionUpdater } from '../typesKoord3D'
import { Koord3DIntersectionCard } from './items/Koord3DIntersectionCard'

interface Koord3DTabIntersectionsProps {
  config: Config3D
  addIntersection: () => void
  removeIntersection: (i: number) => void
  updateIntersection: IntersectionUpdater
  isExpanded: (key: string) => boolean
  toggleExpand: (key: string) => void
}

export const Koord3DTabIntersections = ({
  config,
  addIntersection,
  removeIntersection,
  updateIntersection,
  isExpanded,
  toggleExpand
}: Koord3DTabIntersectionsProps) => {
  return (
    <div className="space-y-4">
      <Button onClick={addIntersection} className="w-full flex items-center justify-center gap-2 whitespace-nowrap">
        <Plus size={18} /> Schnitt hinzufügen
      </Button>
      {config.intersections.map((inter, i) => (
        <Koord3DIntersectionCard
          key={i}
          index={i}
          intersection={inter}
          lines={config.lines}
          planes={config.planes}
          isExpanded={isExpanded(`int-${i}`)}
          onToggleExpand={() => toggleExpand(`int-${i}`)}
          onUpdate={(field, value) => updateIntersection(i, field, value)}
          onRemove={() => removeIntersection(i)}
        />
      ))}
    </div>
  )
}
