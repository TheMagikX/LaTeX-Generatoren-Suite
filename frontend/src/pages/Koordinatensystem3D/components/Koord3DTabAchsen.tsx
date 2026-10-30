// SPDX-License-Identifier: AGPL-3.0-or-later

import { RotateCcw } from 'lucide-react'
import { Label, Input, NumberInput } from '../../../components/ui'
import type { Config3D, Config3DSetter } from '../typesKoord3D'
import { SectionExpander, Chk, calcDefaultTickRange } from '../utilsKoord3D'

interface Koord3DTabAchsenProps {
  config: Config3D
  updateConfig: Config3DSetter
  isExpanded: (key: string) => boolean
  toggleExpand: (key: string) => void
}

export const Koord3DTabAchsen = ({ config, updateConfig, isExpanded, toggleExpand }: Koord3DTabAchsenProps) => {
  const axes = [
    { axis: 'x', title: 'x1', label: 'xlabel', pos: 'xlabel_pos', bg: 'xlabel_background', bgSep: 'xlabel_background_sep', scale: 'scale_x', ticks: 'xticklist', min: 'xmin', max: 'xmax', format: 'tickformat_x', mult: 'mult_x', prec: 'prec_x', sep: 'sep_x', suffix: 'label_suffix_x' },
    { axis: 'y', title: 'x2', label: 'ylabel', pos: 'ylabel_pos', bg: 'ylabel_background', bgSep: 'ylabel_background_sep', scale: 'scale_y', ticks: 'yticklist', min: 'ymin', max: 'ymax', format: 'tickformat_y', mult: 'mult_y', prec: 'prec_y', sep: 'sep_y', suffix: 'label_suffix_y' },
    { axis: 'z', title: 'x3', label: 'zlabel', pos: 'zlabel_pos', bg: 'zlabel_background', bgSep: 'zlabel_background_sep', scale: 'scale_z', ticks: 'zticklist', min: 'zmin', max: 'zmax', format: 'tickformat_z', mult: 'mult_z', prec: 'prec_z', sep: 'sep_z', suffix: 'label_suffix_z' },
  ] as const

  const handleTickModeChange = (m: string) => {
    updateConfig('tick_mode', m)
    if (m === 'Bereich') {
      if (!config.xticklist || config.xticklist.trim() === '') {
        updateConfig('xticklist', calcDefaultTickRange(config.xmin, config.xmax))
      }
      if (!config.yticklist || config.yticklist.trim() === '') {
        updateConfig('yticklist', calcDefaultTickRange(config.ymin, config.ymax))
      }
      if (!config.zticklist || config.zticklist.trim() === '') {
        updateConfig('zticklist', calcDefaultTickRange(config.zmin, config.zmax))
      }
    }
  }

  return (
    <div className="space-y-4">
      <SectionExpander
        title="Achsenbeschriftungen"
        expanded={isExpanded('achsen-labels')}
        onToggle={() => toggleExpand('achsen-labels')}
      >
        <div className="space-y-4">
          <Chk checked={config.label_show} onChange={v => updateConfig('label_show', v)} label="Beschriftungen anzeigen" />
          <div className="grid grid-cols-3 gap-4">
            {axes.map(axis => (
              <div key={axis.axis} className="space-y-3">
                <p className="text-sm font-semibold text-ink capitalize">{axis.title}-Achse</p>
                <div><Label>LaTeX Label</Label><Input value={config[axis.label]} onChange={e => updateConfig(axis.label, e.target.value)} /></div>
                <div><Label>Position</Label><Input value={config[axis.pos]} onChange={e => updateConfig(axis.pos, e.target.value)} /></div>
                <div className="bg-raised/50 rounded-lg p-3 space-y-2">
                  <Chk checked={config[axis.bg]} onChange={v => updateConfig(axis.bg, v)} label="Hintergrund weiß" />
                  <div><Label>Abstand (inner sep)</Label><NumberInput step="0.25" value={config[axis.bgSep]} onChange={e => updateConfig(axis.bgSep, parseFloat(e.target.value))} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionExpander>

      <SectionExpander
        title="Ticks &amp; Skalierung"
        expanded={isExpanded('achsen-ticks')}
        onToggle={() => toggleExpand('achsen-ticks')}
      >
        <div className="space-y-4">
          <div className="flex gap-6">
            <Chk checked={config.majorticklabels} onChange={v => updateConfig('majorticklabels', v)} label="Tick-Werte anzeigen" />
            <Chk checked={config.ticks_show} onChange={v => updateConfig('ticks_show', v)} label="Tick-Striche anzeigen" />
          </div>
          <div>
            <Label>Tick-Modus</Label>
            <div className="flex gap-2 mt-1">
              {(['Automatisch', 'Bereich'] as const).map(m => (
                <button key={m} onClick={() => handleTickModeChange(m)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${config.tick_mode === m ? 'bg-primary text-white' : 'bg-raised text-muted hover:bg-overlay'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {axes.map(axis => (
              <div key={axis.axis} className="space-y-3">
                <p className="text-sm font-semibold text-ink capitalize">{axis.title}-Achse</p>
                <div><Label>Skalierung</Label><NumberInput step="0.1" min="0.1" value={config[axis.scale]} onChange={e => updateConfig(axis.scale, parseFloat(e.target.value))} /></div>
                {config.tick_mode === 'Bereich' && (
                  <div>
                    <Label>Ticks (Komma)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={config[axis.ticks] || ''}
                        onChange={e => updateConfig(axis.ticks, e.target.value)}
                        placeholder={calcDefaultTickRange(config[axis.min], config[axis.max])}
                      />
                      <button
                        onClick={() => updateConfig(axis.ticks, calcDefaultTickRange(config[axis.min], config[axis.max]))}
                        className="p-2 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-line cursor-pointer"
                        title="Standard-Bereich berechnen"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="bg-raised/50 rounded-lg p-3 space-y-2">
                  <div><Label>Format (TikZ)</Label><Input value={config[axis.format]} onChange={e => updateConfig(axis.format, e.target.value)} /></div>
                  <div><Label>Skalierungsfaktor</Label><NumberInput step="0.1" value={config[axis.mult]} onChange={e => updateConfig(axis.mult, parseFloat(e.target.value))} /></div>
                  <div><Label>Nachkommastellen</Label><NumberInput step="1" min="0" value={config[axis.prec]} onChange={e => updateConfig(axis.prec, parseInt(e.target.value))} /></div>
                  <Chk checked={config[axis.sep]} onChange={v => updateConfig(axis.sep, v)} label="Tausendertrennung" />
                  <div><Label>Suffix (LaTeX)</Label><Input value={config[axis.suffix]} onChange={e => updateConfig(axis.suffix, e.target.value)} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionExpander>
    </div>
  )
}
