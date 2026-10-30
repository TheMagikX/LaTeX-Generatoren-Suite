// SPDX-License-Identifier: AGPL-3.0-or-later

import { Ruler } from 'lucide-react'
import { Accordion, SecHead, Field, NumberInput, Slider } from '../../../components/ui'
import type { Config } from '../typesGeo'

interface GeoTabConstructionProps {
  cfg: Config
  updC: (patch: Partial<Config['construction']>) => void
  updQ: (patch: Partial<Config['quad_construction']>) => void
}

export const GeoTabConstruction = ({ cfg, updC, updQ }: GeoTabConstructionProps) => {
  return (
    <Accordion title="Konstruktion" icon={<Ruler size={18} />} defaultOpen>
      {cfg.shape === 'Triangle' ? (
        <>
          <SecHead>Modus wählen</SecHead>
          <div className="flex p-1.5 bg-panel/80 rounded-xl border border-line shrink-0">
            {(['SSS', 'SWS', 'WSW'] as const).map(m => (
              <button
                key={m}
                onClick={() => updC({ mode: m })}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${cfg.construction.mode === m
                    ? 'bg-primary text-white shadow-md scale-[1.02]'
                    : 'text-muted hover:text-ink hover:bg-raised'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="mt-6 mb-6">
            <SecHead>Eingabewerte</SecHead>
            <div className="grid grid-cols-3 gap-4">
              {cfg.construction.mode === 'SSS' && (
                <>
                  <Field label="Seite a"><NumberInput value={cfg.construction.a} step={0.5} min={0.1} onChange={e => updC({ a: +e.target.value })} className="bg-panel/50" /></Field>
                  <Field label="Seite b"><NumberInput value={cfg.construction.b} step={0.5} min={0.1} onChange={e => updC({ b: +e.target.value })} className="bg-panel/50" /></Field>
                  <Field label="Seite c"><NumberInput value={cfg.construction.c} step={0.5} min={0.1} onChange={e => updC({ c: +e.target.value })} className="bg-panel/50" /></Field>
                </>
              )}
              {cfg.construction.mode === 'SWS' && (
                <>
                  <Field label="Seite c"><NumberInput value={cfg.construction.c} step={0.5} min={0.1} onChange={e => updC({ c: +e.target.value })} className="bg-panel/50" /></Field>
                  <Field label="Winkel α"><NumberInput value={cfg.construction.alpha} step={1} min={1} max={179} onChange={e => updC({ alpha: +e.target.value })} className="bg-panel/50" /></Field>
                  <Field label="Seite b"><NumberInput value={cfg.construction.b} step={0.5} min={0.1} onChange={e => updC({ b: +e.target.value })} className="bg-panel/50" /></Field>
                </>
              )}
              {cfg.construction.mode === 'WSW' && (
                <>
                  <Field label="Winkel α"><NumberInput value={cfg.construction.alpha} step={1} min={1} max={179} onChange={e => updC({ alpha: +e.target.value })} className="bg-panel/50" /></Field>
                  <Field label="Seite c"><NumberInput value={cfg.construction.c} step={0.5} min={0.1} onChange={e => updC({ c: +e.target.value })} className="bg-panel/50" /></Field>
                  <Field label="Winkel β"><NumberInput value={cfg.construction.beta} step={1} min={1} max={179} onChange={e => updC({ beta: +e.target.value })} className="bg-panel/50" /></Field>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <SecHead>Viereck-Typ</SecHead>
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-panel/80 rounded-xl border border-line mb-6">
            {(['Rectangle', 'Parallelogram', 'Trapezoid', 'Rhombus', 'Kite', 'FreeQuad'] as const).map(m => (
              <button
                key={m}
                onClick={() => updQ({ mode: m })}
                className={`py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${cfg.quad_construction.mode === m
                    ? 'bg-primary text-white shadow-md'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                {m === 'Rectangle' ? 'Rechteck'
                  : m === 'Parallelogram' ? 'Parallelogramm'
                  : m === 'Trapezoid' ? 'Trapez'
                  : m === 'Rhombus' ? 'Raute'
                  : m === 'Kite' ? 'Drachen'
                  : 'Frei (4 Punkte)'}
              </button>
            ))}
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label={cfg.quad_construction.mode === 'Kite' ? 'Seite a (AB = AD)' : 'Basis a'}>
                <NumberInput value={cfg.quad_construction.a} step={0.5} min={0.1} onChange={e => updQ({ a: +e.target.value })} />
              </Field>
              {(cfg.quad_construction.mode === 'Rectangle' || cfg.quad_construction.mode === 'Parallelogram' || cfg.quad_construction.mode === 'Kite') && (
                <Field label={cfg.quad_construction.mode === 'Kite' ? 'Seite b (BC = DC)' : 'Seite b'}>
                  <NumberInput value={cfg.quad_construction.b} step={0.5} min={0.1} onChange={e => updQ({ b: +e.target.value })} />
                </Field>
              )}
            </div>

            {(cfg.quad_construction.mode === 'Parallelogram' || cfg.quad_construction.mode === 'Rhombus' || cfg.quad_construction.mode === 'Kite') && (
              <Field label="Winkel α (bei A)">
                <NumberInput value={cfg.quad_construction.alpha} step={1} min={1} max={179} onChange={e => updQ({ alpha: +e.target.value })} />
              </Field>
            )}

            {cfg.quad_construction.mode === 'Trapezoid' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Basis c">
                    <NumberInput value={cfg.quad_construction.c} step={0.5} min={0.1} onChange={e => updQ({ c: +e.target.value })} />
                  </Field>
                  <Field label="Höhe h">
                    <NumberInput value={cfg.quad_construction.height} step={0.5} min={0.1} onChange={e => updQ({ height: +e.target.value })} />
                  </Field>
                </div>
                <Field label="Versatz c (Offset)">
                  <NumberInput value={cfg.quad_construction.offset_c} step={0.5} onChange={e => updQ({ offset_c: +e.target.value })} />
                </Field>
              </div>
            )}

            {cfg.quad_construction.mode === 'FreeQuad' && (
              <div className="space-y-3">
                <p className="text-xs text-muted italic">Koordinaten der vier Eckpunkte A, B, C, D (im Uhrzeigersinn)</p>
                {(['A', 'B', 'C', 'D'] as const).map(pt => {
                  const xKey = `p_${pt.toLowerCase()}x` as 'p_ax' | 'p_bx' | 'p_cx' | 'p_dx'
                  const yKey = `p_${pt.toLowerCase()}y` as 'p_ay' | 'p_by' | 'p_cy' | 'p_dy'
                  return (
                    <div key={pt} className="grid grid-cols-2 gap-4">
                      <Field label={`${pt} x`}>
                        <NumberInput value={cfg.quad_construction[xKey]} step={0.5} onChange={e => updQ({ [xKey]: +e.target.value })} />
                      </Field>
                      <Field label={`${pt} y`}>
                        <NumberInput value={cfg.quad_construction[yKey]} step={0.5} onChange={e => updQ({ [yKey]: +e.target.value })} />
                      </Field>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      <Slider
        label={`Ausrichtung (Rotation): ${cfg.construction.rotation}°`}
        min={0} max={360} step={5}
        value={cfg.construction.rotation}
        onChange={v => updC({ rotation: v })}
      />

      {cfg.shape === 'Triangle' && (
        <div className="mt-6 pt-6 border-t border-line/60">
          <SecHead>Konstruktionsschritte</SecHead>
          <Slider
            label={(cfg.construction.step || 0) === 0 ? "Vollständiges Diagramm" : `Schritt ${cfg.construction.step}`}
            min={0} max={4} step={1}
            value={cfg.construction.step || 0}
            onChange={v => updC({ step: v })}
          />
          <p className="text-metadata mt-2 italic">
            Schritt 0 zeigt das Endergebnis mit allen Hilfslinien. Schritte 1-4 visualisieren den Zeichenprozess.
          </p>
        </div>
      )}
    </Accordion>
  )
}
