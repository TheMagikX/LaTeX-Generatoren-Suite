// SPDX-License-Identifier: AGPL-3.0-or-later

import { Switch, FontSelector } from '../../../components/ui'
import type { GluckConfig, GluckSetter } from '../typesGluck'
import { SelectField } from '../utilsGluck'
import { LABEL_FONTSIZES, LABEL_MODES } from '../constantsGluck'

interface GluckTabBeschriftungProps {
  config: GluckConfig;
  updateConfig: GluckSetter;
}

export const GluckTabBeschriftung = ({ config, updateConfig }: GluckTabBeschriftungProps) => {
  return (
    <div className="space-y-8">
      <Switch checked={config.show_labels} onChange={v => updateConfig('show_labels', v)} label="Labels in Sektoren anzeigen" description="Aktiviert die Textanzeige innerhalb der Rad-Sektoren." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-line">
        <SelectField label="Schriftgröße" value={config.label_fontsize} onChange={v => updateConfig('label_fontsize', v)}
          options={LABEL_FONTSIZES} />
        <SelectField label="Ausrichtung" value={config.label_mode} onChange={v => updateConfig('label_mode', v)}
          options={LABEL_MODES} />
      </div>

      <div className="pt-4 border-t border-line">
        <FontSelector value={config.font_family} onChange={v => updateConfig('font_family', v)} />
      </div>
    </div>
  )
}
