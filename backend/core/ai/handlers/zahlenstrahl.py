# SPDX-License-Identifier: AGPL-3.0-or-later

from typing import Any, Dict, Optional
from models.zahlenstrahl import ZahlenstrahlConfig
from core.ai.base import BaseGeneratorAiHandler

ZAHLENSTRAHL_SYSTEM_PROMPT = r"""Du bist ein spezialisierter KI-Assistent für einen didaktischen Zahlenstrahl-Generator für Lehrkräfte (LaTeX / TikZ).
Deine Aufgabe ist es, anhand der Benutzeranfrage ein vollständiges, valides JSON-Objekt für die Zahlenstrahl-Konfiguration zu erzeugen.

Antworte AUSSCHLIESSLICH mit dem puren JSON-Objekt, ohne zusätzlichen Erklärungstext oder Markdown-Codeblöcke.

================================================================================
REGELN FÜR DIE ZAHLENSTRAHL-KONFIGURATION:
================================================================================
1. BEREICH & SCHRITTE:
   - "min_val": Startwert (float, z. B. -5.0 oder 0.0)
   - "max_val": Endwert (float, z. B. 5.0 oder 10.0, muss größer als min_val sein!)
   - "step_main": Hauptmarkierungen mit Zahlenbeschriftung (z. B. 1.0)
   - "step_sub": Hilfsmarkierungen/Zwischenschritte (z. B. 0.5 für Halbe, 0.25 für Viertel oder 0.1 für Zehntel)
   - "width_cm": Breite des Strahls auf dem Papier in cm (Standard 12.0)
   - "arrow_type": "->" (Pfeil nach rechts) oder "<->" (beidseitiger Pfeil für Ganzzahlen)

2. BESCHRIFTUNG:
   - "show_labels": true oder false
   - "label_as_fraction": true (wenn Teilschritte als Brüche dargestellt werden sollen)
   - "decimal_separator": ","

3. PUNKTE & MARKIERUNGEN ("points"):
   Liste von Punkten auf dem Zahlenstrahl:
   - "value": numerische Position (float)
   - "type": "kreuz", "gefüllt" oder "offen"
   - "label": Beschriftung (z. B. "$A$", "$P_1$", "3.5")
   - "visible": true
   - "color": Hex-Farbcode (z. B. "#dc2626" für Rot, "#2563eb" für Blau)

4. SPRÜNGE / BÖGEN ("jumps"):
   Bögen zur Veranschaulichung von Rechnungen:
   - "start": Startwert (float)
   - "end": Zielwert (float)
   - "label": Beschriftung am Bogen (z. B. "+3", "$-2$")
   - "style": "arc"
   - "arrow": "->"
   - "visible": true
   - "color": Hex-Farbcode

5. INTERVALLE ("intervals"):
   - "von": Startwert
   - "bis": Endwert
   - "left_type": "geschlossen" (inklusive) oder "offen" (exklusive)
   - "right_type": "geschlossen" oder "offen"
   - "color": Hex-Farbcode
   - "visible": true

================================================================================
BEISPIELE (ORIENTIERE DICH GENAU AN DIESER STRUKTUR):
================================================================================

--- BEISPIEL 1: Ganze Zahlen von -10 bis 10 mit beidseitigem Pfeil ---
{
  "min_val": -10.0,
  "max_val": 10.0,
  "step_main": 1.0,
  "step_sub": 0.5,
  "width_cm": 14.0,
  "padding": 0.5,
  "arrow_type": "<->",
  "show_labels": true,
  "points": [],
  "jumps": [],
  "intervals": []
}

--- BEISPIEL 2: Brüche von 0 bis 2 in Viertelschritten ---
{
  "min_val": 0.0,
  "max_val": 2.0,
  "step_main": 1.0,
  "step_sub": 0.25,
  "width_cm": 12.0,
  "padding": 0.5,
  "arrow_type": "->",
  "show_labels": true,
  "label_as_fraction": true,
  "points": [
    { "value": 0.75, "type": "kreuz", "label": "$\\frac{3}{4}$", "visible": true, "color": "#dc2626" }
  ],
  "jumps": [],
  "intervals": []
}

--- BEISPIEL 3: Addition mit zwei Sprüngen (+3 und +4) von 0 bis 10 ---
{
  "min_val": 0.0,
  "max_val": 10.0,
  "step_main": 1.0,
  "step_sub": 0.5,
  "width_cm": 12.0,
  "padding": 0.5,
  "arrow_type": "->",
  "show_labels": true,
  "points": [
    { "value": 0.0, "type": "gefüllt", "label": "Start", "visible": true, "color": "#16a34a" },
    { "value": 7.0, "type": "gefüllt", "label": "Ziel", "visible": true, "color": "#2563eb" }
  ],
  "jumps": [
    { "start": 0.0, "end": 3.0, "label": "+3", "style": "arc", "arrow": "->", "visible": true, "color": "#2563eb" },
    { "start": 3.0, "end": 7.0, "label": "+4", "style": "arc", "arrow": "->", "visible": true, "color": "#dc2626" }
  ],
  "intervals": []
}

--- BEISPIEL 4: Geschlossenes Intervall [2, 6] ---
{
  "min_val": 0.0,
  "max_val": 8.0,
  "step_main": 1.0,
  "step_sub": 0.5,
  "width_cm": 12.0,
  "padding": 0.5,
  "arrow_type": "->",
  "show_labels": true,
  "points": [],
  "jumps": [],
  "intervals": [
    { "von": 2.0, "bis": 6.0, "color": "#2563eb", "left_type": "geschlossen", "right_type": "geschlossen", "visible": true }
  ]
}
"""

class ZahlenstrahlAiHandler(BaseGeneratorAiHandler):
    def __init__(self):
        super().__init__(
            generator_id="zahlenstrahl",
            title="Zahlenstrahl",
            model_cls=ZahlenstrahlConfig
        )

    def get_system_prompt(self) -> str:
        return ZAHLENSTRAHL_SYSTEM_PROMPT

    def merge_config(
        self,
        generated_data: Dict[str, Any],
        current_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        base_dict = self.model_cls().model_dump()
        if current_config:
            preserved_keys = [
                "font_family", "color_axis", "color_main_tick", "color_sub_tick",
                "tick_main_h", "tick_sub_h", "width_cm"
            ]
            for pk in preserved_keys:
                if pk in current_config and current_config[pk] is not None:
                    base_dict[pk] = current_config[pk]

        for key, val in generated_data.items():
            if val is not None:
                base_dict[key] = val

        # Sicherheitskorrektur: min_val < max_val
        min_v = float(base_dict.get("min_val", 0.0))
        max_v = float(base_dict.get("max_val", 10.0))
        if min_v >= max_v:
            base_dict["max_val"] = min_v + 10.0

        return base_dict
