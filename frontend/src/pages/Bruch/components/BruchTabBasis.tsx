// SPDX-License-Identifier: AGPL-3.0-or-later

import { Field, NumberInput, Switch, Input } from '../../../components/ui'
import type { BruchConfig } from '../typesBruch'

interface BruchTabBasisProps {
  config: BruchConfig
  updateConfig: (patch: Partial<BruchConfig>) => void
}

export function BruchTabBasis({ config, updateConfig }: BruchTabBasisProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Zähler (eingefärbt)">
          <NumberInput
            value={config.zaehler}
            min={0}
            max={200}
            onChange={(e) => updateConfig({ zaehler: parseInt(e.target.value) })}
          />
        </Field>
        <Field label="Nenner (gesamt)">
          <NumberInput
            value={config.nenner}
            min={1}
            max={200}
            onChange={(e) => updateConfig({ nenner: parseInt(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Zufalls-Seed">
        <NumberInput
          value={config.seed}
          min={0}
          onChange={(e) => updateConfig({ seed: parseInt(e.target.value) })}
        />
      </Field>
      <Switch
        label="Gemischte Zahl anzeigen"
        description="Bei unechten Brüchen (Zähler > Nenner) werden ganze Teile als separate Formen dargestellt."
        checked={config.mixed_number}
        onChange={(v: boolean) => updateConfig({ mixed_number: v })}
      />
      <Switch
        label="Bruch-Label anzeigen"
        description="Zeigt den Bruch als mathematische Formel unter dem Bild an."
        checked={config.show_label}
        onChange={(v: boolean) => updateConfig({ show_label: v })}
      />
      {config.show_label && (
        <Field label="Label-Überschreibung (LaTeX, optional)">
          <Input
            type="text"
            value={config.label_override}
            onChange={(e) => updateConfig({ label_override: e.target.value })}
            placeholder={`z.B. \\dfrac{a}{b}`}
            className="font-mono"
          />
        </Field>
      )}
    </div>
  )
}
