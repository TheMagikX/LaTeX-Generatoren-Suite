// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useRef } from 'react'
import { Settings } from 'lucide-react'
import { Accordion } from '../../../components/ui'
import type { FlaschenzugConfig } from '../typesFlasche'
import { useCanvasInteraction } from './canvas/hooks/useCanvasInteraction'
import { CanvasToolbar } from './canvas/components/CanvasToolbar'
import { CanvasSvgViewport } from './canvas/components/CanvasSvgViewport'
import { CanvasContextMenu } from './canvas/components/CanvasContextMenu'

interface Props {
  cfg: FlaschenzugConfig
  setCfg: React.Dispatch<React.SetStateAction<FlaschenzugConfig>>
}

export const FlascheCanvasEditor: React.FC<Props> = ({ cfg, setCfg }) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const interaction = useCanvasInteraction({ cfg, setCfg, svgRef })

  return (
    <Accordion title="Interaktiver Editor" icon={<Settings size={18} />} defaultOpen>
      <div className="space-y-4">
        <CanvasToolbar {...interaction} cfg={cfg} />

        <div className="relative">
          <CanvasSvgViewport ref={svgRef} {...interaction} cfg={cfg} />
          {interaction.contextMenu && (
            <CanvasContextMenu
              state={interaction.contextMenu}
              onClose={interaction.closeContextMenu}
              cfg={cfg}
              setCfg={setCfg}
            />
          )}
        </div>

        <div className="rounded-lg border border-line bg-raised/50 px-3 py-2 text-xs text-muted">
          {interaction.mode === 'rope'
            ? 'Seilmodus: Elemente anklicken. Rechtsklick auf Rollen, Punkte oder Seile öffnet die Einstellungen.'
            : 'Rasterpunkte werden auf 0,25 Einheiten gerundet; Rechtsklick auf Rollen, Punkte oder Seile öffnet das Kontextmenü.'}
        </div>
      </div>
    </Accordion>
  )
}
