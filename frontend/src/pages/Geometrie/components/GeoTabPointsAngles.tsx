// SPDX-License-Identifier: AGPL-3.0-or-later

import { Edit3 } from 'lucide-react'
import { Accordion, SecHead, Switch, Field, Input, Slider } from '../../../components/ui'
import type { Config } from '../typesGeo'

interface GeoTabPointsAnglesProps {
  cfg: Config
  updEl: (patch: Partial<Config['elements']>) => void
}

export const GeoTabPointsAngles = ({ cfg, updEl }: GeoTabPointsAnglesProps) => {
  return (
    <Accordion title="Punkte & Winkel" icon={<Edit3 size={18} />}>
      <div className="space-y-6">
        <div>
          <SecHead>Eckpunkte</SecHead>
          <Switch 
            label={cfg.shape === 'Triangle' ? "Punkte A, B, C anzeigen" : "Punkte A, B, C, D anzeigen"} 
            checked={cfg.elements.points.show} 
            onChange={(v: boolean) => updEl({ points: { ...cfg.elements.points, show: v } })} 
          />
          {cfg.elements.points.show && (
            <div className="grid grid-cols-4 gap-4 mt-3">
              <Field label="Label A"><Input value={cfg.elements.points.labels.A} onChange={e => updEl({ points: { ...cfg.elements.points, labels: { ...cfg.elements.points.labels, A: e.target.value } } })} className="bg-panel/50 text-center" /></Field>
              <Field label="Label B"><Input value={cfg.elements.points.labels.B} onChange={e => updEl({ points: { ...cfg.elements.points, labels: { ...cfg.elements.points.labels, B: e.target.value } } })} className="bg-panel/50 text-center" /></Field>
              <Field label="Label C"><Input value={cfg.elements.points.labels.C} onChange={e => updEl({ points: { ...cfg.elements.points, labels: { ...cfg.elements.points.labels, C: e.target.value } } })} className="bg-panel/50 text-center" /></Field>
              {cfg.shape === 'Quadrilateral' && (
                <Field label="Label D"><Input value={cfg.elements.points.labels.D} onChange={e => updEl({ points: { ...cfg.elements.points, labels: { ...cfg.elements.points.labels, D: e.target.value } } })} className="bg-panel/50 text-center" /></Field>
              )}
            </div>
          )}
        </div>

        <div className="w-full h-px bg-raised/80" />

        <div>
          <SecHead>Winkel</SecHead>
          <div className="space-y-2 mb-4">
            <Switch label="Winkelbögen anzeigen" checked={cfg.elements.angles.show_arcs} onChange={(v: boolean) => updEl({ angles: { ...cfg.elements.angles, show_arcs: v } })} />
            <Switch label="Beschriftungen anzeigen" checked={cfg.elements.angles.show_labels} onChange={(v: boolean) => updEl({ angles: { ...cfg.elements.angles, show_labels: v } })} />
          </div>

          <div className="space-y-4">
            {(['alpha', 'beta', 'gamma', 'delta'] as const).map(k => (
              (k !== 'delta' || cfg.shape === 'Quadrilateral') && (
                <div key={k} className="p-4 bg-raised/20 border border-rim/50 rounded-xl space-y-4">
                  <div className="font-semibold text-ink text-sm flex items-center justify-between">
                    <span>{k === 'alpha' ? 'α (bei A)' : k === 'beta' ? 'β (bei B)' : k === 'gamma' ? 'γ (bei C)' : 'δ (bei D)'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Label">
                      <Input value={cfg.elements.angles.labels[k]} onChange={e => updEl({ angles: { ...cfg.elements.angles, labels: { ...cfg.elements.angles.labels, [k]: e.target.value } } })} className="bg-panel/50" />
                    </Field>
                    <Field label="Farbe (Hex)">
                      <Input value={cfg.elements.angles.colors[k]} onChange={e => updEl({ angles: { ...cfg.elements.angles, colors: { ...cfg.elements.angles.colors, [k]: e.target.value } } })} className="bg-panel/50 font-mono" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <Slider label="Radius" min={3} max={15} step={1} value={cfg.elements.angles.radii[k]} onChange={(v: number) => updEl({ angles: { ...cfg.elements.angles, radii: { ...cfg.elements.angles.radii, [k]: v } } })} />
                    <Slider label="Deckkraft" min={0} max={1} step={0.05} value={cfg.elements.angles.opacities[k]} onChange={(v: number) => updEl({ angles: { ...cfg.elements.angles, opacities: { ...cfg.elements.angles.opacities, [k]: v } } })} />
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </Accordion>
  )
}
