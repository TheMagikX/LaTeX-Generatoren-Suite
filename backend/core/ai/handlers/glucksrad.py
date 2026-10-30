# SPDX-License-Identifier: AGPL-3.0-or-later

from typing import Any, Dict, Optional
from models.glucksrad import GlucksradConfig, GlucksradMode, CenterStyle, ArrowStyle, PointerPos
from core.ai.base import BaseGeneratorAiHandler

GLUCKSRAD_SYSTEM_PROMPT = r"""Du bist ein spezialisierter KI-Assistent für einen Glücksrad-Generator für Lehrkräfte (LaTeX / TikZ).
Deine Aufgabe ist es, anhand der Benutzeranfrage ein vollständiges, valides JSON-Objekt für die Glücksrad-Konfiguration zu erzeugen.

Antworte AUSSCHLIESSLICH mit dem puren JSON-Objekt, ohne zusätzlichen Erklärungstext oder Markdown-Codeblöcke.

================================================================================
REGELN FÜR DIE GLÜCKSRAD-KONFIGURATION:
================================================================================
1. MODUS & ANZAHL:
   - "mode": "standard" (gleich große Sektoren) oder "variable" (unterschiedliche Winkel)
   - "anzahl": Gesamtzahl der Sektoren (z. B. 6, 8, 10, 12)
   - "radius": z. B. 3.0

2. SEKTOREN ("sectors"):
   Eine Liste von Sektorendefinitionen. Jeder Sektor hat:
   - "farbe": Hex-Farbcode (z. B. "#E74C3C" für Rot, "#3498DB" für Blau, "#2ECC71" für Grün, "#F39C12" für Gelb/Orange, "#9B59B6" für Lila)
   - "haeufigkeit": Wie oft dieser Sektor vorkommt bzw. sein relativer Anteil (im "standard"-Modus summiert sich die Summe der Häufigkeiten auf "anzahl")
   - "label": Text auf dem Sektor (z. B. "1", "2", "Gewinn", "Niete", "Rot" oder leer "")

3. DARSTELLUNG:
   - "show_labels": true oder false
   - "show_rim": true (äußerer Rand)
   - "show_pins": false oder true (Stifte/Pins am Rand)
   - "center_style": "Punkt", "Kein Mittelpunkt", "Schraube" oder "Lager"
   - "arrow_style": "TikZ-Pfeil", "Kein Pfeil" oder "Bild-Datei (Original)"
   - "pointer_pos": "Oben", "Rechts", "Unten" oder "Links"

================================================================================
BEISPIELE (ORIENTIERE DICH GENAU AN DIESER STRUKTUR):
================================================================================

--- BEISPIEL 1: Ampel-Glücksrad (6 Felder: 3x Grün, 2x Gelb, 1x Rot) ---
{
  "mode": "standard",
  "anzahl": 6,
  "seed": 42,
  "radius": 3.0,
  "sectors": [
    { "farbe": "#2ECC71", "haeufigkeit": 3, "label": "Grün" },
    { "farbe": "#F39C12", "haeufigkeit": 2, "label": "Gelb" },
    { "farbe": "#E74C3C", "haeufigkeit": 1, "label": "Rot" }
  ],
  "show_labels": true,
  "label_fontsize": "\\scriptsize",
  "label_mode": "Radial (Standard)",
  "show_rim": true,
  "show_pins": false,
  "center_style": "Punkt",
  "arrow_style": "TikZ-Pfeil",
  "pointer_pos": "Oben"
}

--- BEISPIEL 2: Glücksrad mit 8 Feldern: Gewinnspiel (1 Hauptgewinn, 3 Trostpreise, 4 Nieten) ---
{
  "mode": "standard",
  "anzahl": 8,
  "seed": 42,
  "radius": 3.0,
  "sectors": [
    { "farbe": "#F1C40F", "haeufigkeit": 1, "label": "Gold" },
    { "farbe": "#3498DB", "haeufigkeit": 3, "label": "Trost" },
    { "farbe": "#95A5A6", "haeufigkeit": 4, "label": "Niete" }
  ],
  "show_labels": true,
  "label_fontsize": "\\scriptsize",
  "label_mode": "Radial (Standard)",
  "show_rim": true,
  "show_pins": true,
  "center_style": "Schraube",
  "arrow_style": "TikZ-Pfeil",
  "pointer_pos": "Oben"
}

--- BEISPIEL 3: Gleichverteiltes Zahlen-Glücksrad 1 bis 5 ---
{
  "mode": "standard",
  "anzahl": 5,
  "seed": 42,
  "radius": 3.0,
  "sectors": [
    { "farbe": "#E74C3C", "haeufigkeit": 1, "label": "1" },
    { "farbe": "#3498DB", "haeufigkeit": 1, "label": "2" },
    { "farbe": "#2ECC71", "haeufigkeit": 1, "label": "3" },
    { "farbe": "#F39C12", "haeufigkeit": 1, "label": "4" },
    { "farbe": "#9B59B6", "haeufigkeit": 1, "label": "5" }
  ],
  "show_labels": true,
  "label_fontsize": "\\small",
  "label_mode": "Radial (Standard)",
  "show_rim": true,
  "show_pins": false,
  "center_style": "Punkt",
  "arrow_style": "TikZ-Pfeil",
  "pointer_pos": "Oben"
}
"""

class GlucksradAiHandler(BaseGeneratorAiHandler):
    def __init__(self):
        super().__init__(
            generator_id="glucksrad",
            title="Glücksrad",
            model_cls=GlucksradConfig
        )

    def get_system_prompt(self) -> str:
        return GLUCKSRAD_SYSTEM_PROMPT

    def merge_config(
        self,
        generated_data: Dict[str, Any],
        current_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        base_dict = self.model_cls().model_dump()
        if current_config:
            preserved_keys = ["font_family", "arrow_params"]
            for pk in preserved_keys:
                if pk in current_config and current_config[pk] is not None:
                    base_dict[pk] = current_config[pk]

        for key, val in generated_data.items():
            if val is not None:
                base_dict[key] = val

        # Wenn anzahl fehlt oder unpassend ist, berechne aus Sektorenhäufigkeiten
        sectors = base_dict.get("sectors", [])
        if sectors and base_dict.get("mode") == "standard":
            sum_freq = sum(s.get("haeufigkeit", 1) for s in sectors if isinstance(s, dict))
            if sum_freq > 0:
                base_dict["anzahl"] = int(sum_freq)

        return base_dict
