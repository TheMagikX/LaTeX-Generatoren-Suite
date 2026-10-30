// SPDX-License-Identifier: AGPL-3.0-or-later

import { Settings, Zap, Compass, Brush } from 'lucide-react'
import { Slider, Switch, Accordion, Field } from '../../../components/ui'
import type { GluckConfig, GluckSetter } from '../typesGluck'
import { SelectField, SecHeadComponent } from '../utilsGluck'
import { ARROW_STYLES, POINTER_POSITIONS, CENTER_STYLES } from '../constantsGluck'

interface GluckTabPfeilProps {
  config: GluckConfig;
  updateConfig: GluckSetter;
}

export const GluckTabPfeil = ({ config, updateConfig }: GluckTabPfeilProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField label="Pfeil-Stil" value={config.arrow_style} onChange={v => updateConfig('arrow_style', v)}
          options={ARROW_STYLES} />
        <SelectField label="Indikator Position" value={config.pointer_pos} onChange={v => updateConfig('pointer_pos', v)}
          options={POINTER_POSITIONS} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-line">
        <Slider label="Radius (cm)" min={1} max={10} step={0.5} value={config.radius} onChange={v => updateConfig('radius', v)} />
        <SelectField label="Mittelpunkt-Stil" value={config.center_style} onChange={v => updateConfig('center_style', v)}
          options={CENTER_STYLES} />
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-line">
        <Switch checked={config.show_rim} onChange={v => updateConfig('show_rim', v)} label="Metallischer Rand" description="Fügt einen schattierten äußeren Ring hinzu." />
        <Switch checked={config.show_pins} onChange={v => updateConfig('show_pins', v)} label="Pins an Sektorgrenzen" description="Zeigt kleine Metall-Stifte am Rand der Sektoren." />
      </div>

      {config.arrow_style === "TikZ-Pfeil" && (
        <div className="space-y-4 pt-6 border-t border-line">
          <SecHeadComponent>TikZ-Pfeil Design</SecHeadComponent>

          <Accordion title="Allgemein" icon={<Settings size={18} />} defaultOpen={false}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <Field label="Farbe">
                  <input type="color" value={config.arrow_params.color}
                    onChange={e => updateConfig('arrow_params', { ...config.arrow_params, color: e.target.value })}
                    className="w-full h-10 rounded bg-transparent border border-rim p-1 cursor-pointer" />
                </Field>
                <Switch checked={config.arrow_params.handdrawn} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, handdrawn: v })} label="Handgezeichnet-Look" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Slider label="Länge" min={0.5} max={5} step={0.1} value={config.arrow_params.length} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, length: v })} />
                <Slider label="Schaftbreite" min={0.05} max={1} step={0.01} value={config.arrow_params.shaftwidth} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, shaftwidth: v })} />
                <Slider label="Mittelkreis-Radius" min={0.05} max={1} step={0.01} value={config.arrow_params.circleradius} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, circleradius: v })} />
              </div>
            </div>
          </Accordion>

          <Accordion title="Pfeilspitze" icon={<Zap size={18} />} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Slider label="Spitzen-Breite" min={0.1} max={1.5} step={0.05} value={config.arrow_params.widthtip} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, widthtip: v })} />
              <Slider label="Spitzen-Höhe" min={0.1} max={2} step={0.05} value={config.arrow_params.heighttip} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, heighttip: v })} />
            </div>
          </Accordion>

          <Accordion title="Pfeilschwanz" icon={<Compass size={18} />} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Slider label="Schwanz-Flügelbreite" min={0.05} max={1} step={0.05} value={config.arrow_params.tailwingwidth} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, tailwingwidth: v })} />
              <Slider label="Schwanz-Höhe" min={0.1} max={1.5} step={0.05} value={config.arrow_params.tailheight} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, tailheight: v })} />
              <Slider label="Schwanz-Einzug (Drop)" min={0} max={1} step={0.05} value={config.arrow_params.taildrop} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, taildrop: v })} />
            </div>
          </Accordion>

          {config.arrow_params.handdrawn && (
            <Accordion title="Handzeichnungsparameter" icon={<Brush size={18} />} defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Slider label="Segment-Länge (Welligkeit)" min={0.5} max={5} step={0.1} value={config.arrow_params.segment_length} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, segment_length: v })} />
                <Slider label="Amplitude (Welligkeit)" min={0.05} max={1} step={0.01} value={config.arrow_params.amplitude} onChange={v => updateConfig('arrow_params', { ...config.arrow_params, amplitude: v })} />
              </div>
            </Accordion>
          )}
        </div>
      )}
    </div>
  )
}
