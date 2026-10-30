// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plus, Trash2, Info } from 'lucide-react'
import { Button, Input, Label, Card, Slider, NumberInput } from '../../../components/ui'
import type { ColorSectorUpdater, GluckConfig, GluckSetter } from '../typesGluck'
import { PALETTES } from '../constantsGluck'
import { SecHeadComponent } from '../utilsGluck'

interface GluckTabSektorenProps {
  config: GluckConfig;
  updateConfig: GluckSetter;
  updateSector: ColorSectorUpdater;
  addSector: () => void;
  removeSector: (idx: number) => void;
  applyPalette: (paletteName: string) => void;
  validation: { ok: boolean; msg: string };
}

export const GluckTabSektoren = ({
  config,
  updateConfig,
  updateSector,
  addSector,
  removeSector,
  applyPalette,
  validation
}: GluckTabSektorenProps) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <SecHeadComponent>Modus</SecHeadComponent>
          <div className="flex gap-2 mt-1">
            {([
              { id: 'standard', lbl: 'Standard (Gleich groß)' },
              { id: 'variable', lbl: 'Variable Sektorgrößen' }
            ] as const).map(m => (
              <button key={m.id} onClick={() => updateConfig('mode', m.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${config.mode === m.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-raised text-muted hover:bg-overlay'}`}>
                {m.lbl}
              </button>
            ))}
          </div>
        </div>
        <Slider label="Zufalls-Seed" min={0} max={999} value={config.seed} onChange={v => updateConfig('seed', v)} className="w-full md:w-64" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SecHeadComponent>Farb-Definitionen</SecHeadComponent>
          <div className="flex items-center gap-3">
            <select onChange={e => applyPalette(e.target.value)} defaultValue="—"
              className="px-3 py-1 bg-raised border border-rim rounded-lg text-xs text-ink focus:outline-none">
              <option value="—">Palette wählen...</option>
              {Object.keys(PALETTES).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <Button onClick={addSector} size="sm" className="h-8 flex items-center gap-1">
              <Plus size={14} /> Farbe
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {config.sectors.map((s, idx) => (
            <div key={idx} className="bg-raised/30 border border-line rounded-xl p-3 flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-caption tracking-tight">Farbe</span>
                <input type="color" value={s.farbe} onChange={e => updateSector(idx, 'farbe', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-none" />
              </div>
              <div className="flex-1">
                <Label>{config.mode === 'variable' ? 'Gewicht' : 'Anzahl'}</Label>
                <NumberInput step={config.mode === 'variable' ? 0.5 : 1} min={0}
                  value={s.haeufigkeit} onChange={e => updateSector(idx, 'haeufigkeit', parseFloat(e.target.value))} />
              </div>
              <div className="flex-[2]">
                <Label>Bezeichnung (Label)</Label>
                <Input value={s.label} onChange={e => updateSector(idx, 'label', e.target.value)} placeholder="z.B. Gewinn" />
              </div>
              <button onClick={() => removeSector(idx)} className="mt-5 p-2 text-ghost hover:text-red-400 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Card className={`p-4 border-line border-l-4 ${validation.ok ? 'bg-green-500/5 border-l-green-500' : 'bg-red-500/5 border-l-red-500'}`}>
        <div className="flex gap-3">
          <Info className={validation.ok ? "text-green-400" : "text-red-400"} size={20} />
          <p className="text-sm text-ink">{validation.msg}</p>
        </div>
      </Card>
    </div>
  )
}
