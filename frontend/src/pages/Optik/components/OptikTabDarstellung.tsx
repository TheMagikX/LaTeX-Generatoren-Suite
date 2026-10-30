// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slider, FontSelector } from '../../../components/ui'
import { SecHead, Chk } from '../utilsOptik'
import type { OptikConfig, OptikSetter } from '../typesOptik'

interface OptikTabDarstellungProps {
  config: OptikConfig
  set: OptikSetter
}

export const OptikTabDarstellung = ({ config, set }: OptikTabDarstellungProps) => {

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Slider
          label="Achsen-Überstand (cm)"
          min={0.2}
          max={5}
          step={0.2}
          value={config.axis_extra}
          onChange={v => set('axis_extra', v)}
        />
        <Slider
          label="Verlängerung virt. Strahlen (Faktor)"
          min={1.0}
          max={5.0}
          step={0.1}
          value={config.virtual_ray_extension ?? 1.0}
          onChange={v => set('virtual_ray_extension', v)}
        />
      </div>

      <div className="space-y-3 pt-4 border-t border-line">
        <SecHead>Linsen</SecHead>
        <Chk
          checked={config.realistic_lens}
          onChange={v => set('realistic_lens', v)}
          label="🔭 Realistische Linsenform (Bézier)"
          help="Zeichnet die Linse als gekrümmte Fläche statt als Linie"
        />
        <Chk
          checked={config.show_lens_plane}
          onChange={v => set('show_lens_plane', v)}
          label="📏 Linsenebene anzeigen (gestrichelt)"
        />
      </div>

      <div className="space-y-3 pt-4 border-t border-line">
        <SecHead>Maßpfeile (nur 1. Objekt)</SecHead>
        <Chk
          checked={config.show_annot_g}
          onChange={v => set('show_annot_g', v)}
          label="Gegenstandsweite g"
          help="Doppelpfeil: von der Linsenebene bis zum Gegenstand"
        />
        <Chk
          checked={config.show_annot_b}
          onChange={v => set('show_annot_b', v)}
          label="Bildweite b"
          help="Doppelpfeil: von der Linsenebene bis zum Bild"
        />
        <Chk
          checked={config.show_annot_f}
          onChange={v => set('show_annot_f', v)}
          label="Brennweite f"
          help="Doppelpfeil: von der Linsenebene zum bildseitigen Brennpunkt"
        />
        <Chk
          checked={config.show_annot_G}
          onChange={v => set('show_annot_G', v)}
          label="Gegenstandsgröße G"
          help="Vertikaler Doppelpfeil neben dem Gegenstand"
        />
        <Chk
          checked={config.show_annot_B}
          onChange={v => set('show_annot_B', v)}
          label="Bildgröße B"
          help="Vertikaler Doppelpfeil neben dem Bild"
        />
      </div>

      <div className="pt-4 border-t border-line">
        <FontSelector value={config.font_family} onChange={v => set('font_family', v)} />
      </div>
    </div>
  )
}
