// SPDX-License-Identifier: AGPL-3.0-or-later

import { Field, NumberInput, Switch } from '../../../components/ui'
import type { BruchConfig } from '../typesBruch'

interface BruchTabErweiternProps {
  config: BruchConfig
  updateConfig: (patch: Partial<BruchConfig>) => void
}

export function BruchTabErweitern({ config, updateConfig }: BruchTabErweiternProps) {
  return (
    <div className="space-y-6">
      <Field label="Erweiterungsfaktor">
        <NumberInput
          value={config.erweiter_faktor}
          min={2}
          max={20}
          onChange={(e) => updateConfig({ erweiter_faktor: parseInt(e.target.value) })}
        />
      </Field>

      {config.form === 'Rechteck' && (
        <Field label="Schnittrichtung">
          <select
            value={config.split_mode}
            onChange={(e) => updateConfig({ split_mode: e.target.value })}
            className="w-full bg-panel border border-line rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Horizontal">Horizontal</option>
            <option value="Vertikal">Vertikal</option>
          </select>
        </Field>
      )}

      <Field label="Stil der Teilungsstriche">
        <select
          value={config.split_style}
          onChange={(e) => updateConfig({ split_style: e.target.value })}
          className="w-full bg-panel border border-line rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="Standard">Standard (wie Rahmen)</option>
          <option value="Hervorgehoben">Hervorgehoben (Rot)</option>
        </select>
      </Field>

      <div className="space-y-3 pt-2">
        <Switch
          label="Erweitern anzeigen"
          description="Vorher / Nachher Vergleichsbild generieren."
          checked={config.show_erweitern}
          onChange={(v: boolean) => updateConfig({ show_erweitern: v })}
        />
        <Switch
          label="Kürzen anzeigen"
          description="Vergleichsbild zum kleinstmöglichen Bruch generieren."
          checked={config.show_kuerzen}
          onChange={(v: boolean) => updateConfig({ show_kuerzen: v })}
        />
      </div>
    </div>
  )
}
