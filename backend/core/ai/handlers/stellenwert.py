# SPDX-License-Identifier: AGPL-3.0-or-later

from typing import Any, Dict, Optional
from models.stellenwerttafel import (
    StellenwertConfig,
    StellenwertColumn,
    StellenwertRow,
    StellenwertLayout,
    StellenwertMode
)
from core.ai.base import BaseGeneratorAiHandler

STELLENWERT_SYSTEM_PROMPT = r"""Du bist ein spezialisierter KI-Assistent für einen Stellenwerttafel-Generator für Lehrkräfte (LaTeX / TikZ).
Deine Aufgabe ist es, anhand der Benutzeranfrage ein vollständiges, valides JSON-Objekt für die Stellenwerttafel-Konfiguration zu erzeugen.

Antworte AUSSCHLIESSLICH mit dem puren JSON-Objekt, ohne zusätzlichen Erklärungstext oder Markdown-Codeblöcke.

================================================================================
REGELN FÜR DIE STELLENWERTTAFEL-KONFIGURATION:
================================================================================
1. SPALTEN ("columns"):
   Jede Spalte repräsentiert einen Stellenwert (von links nach rechts geordnet):
   - "id": eindeutige ID (z. B. "M", "HT", "ZT", "T", "H", "Z", "E", "z", "h", "t")
   - "label": Beschriftung im Tabellenkopf (z. B. "H", "Z", "E" oder "km", "m", "cm")
   - "color": Hex-Farbcode (z. B. "#2563eb" für Hunderter, "#dc2626" für Zehner, "#16a34a" für Einer)
   - "active": true

2. ZEILEN & WERTE ("rows"):
   Jede Zeile enthält eine eingetragene Zahl:
   - "id": z. B. "r1", "r2"
   - "label": Optionaler Zeilenname (z. B. "342" oder "Zahl 1")
   - "values": Dictionary von column_id -> Ziffer (0-9 oder null). z. B. {"H": 3, "Z": 4, "E": 2}
   - "active": true

3. MODUS ("mode"):
   - "Ziffern" (nur arabische Ziffern)
   - "Plättchen" (Rechenplättchen / Punkte)
   - "Beides" (Ziffern und Plättchen zusammen)
   - "Leer" (leere Übungstafel)

4. KOMMA-TRENNLINIE ("decimal_separator_pos"):
   Index der Spalte (0-basiert), NACH der das Komma bzw. ein dicker Trennstrich gezeichnet wird.
   Beispiel: Bei Spalten ["H", "Z", "E", "z", "h"] ist nach E der Index 2. Bei reinen Ganzzahlen: null.

5. LAYOUT ("layout"):
   - "show_header": true
   - "show_grid": true
   - "row_height": 1.4
   - "col_width": 1.8
   - "token_style": "filled"
   - "token_size": 0.18
   - "max_tokens_per_row": 5

================================================================================
BEISPIELE (ORIENTIERE DICH GENAU AN DIESER STRUKTUR):
================================================================================

--- BEISPIEL 1: H-Z-E Tafel mit Plättchen für die Zahl 342 ---
{
  "columns": [
    { "id": "H", "label": "H", "color": "#2563eb", "active": true },
    { "id": "Z", "label": "Z", "color": "#dc2626", "active": true },
    { "id": "E", "label": "E", "color": "#16a34a", "active": true }
  ],
  "groups": [],
  "rows": [
    { "id": "r1", "label": "342", "values": { "H": 3, "Z": 4, "E": 2 }, "active": true }
  ],
  "mode": "Plättchen",
  "decimal_separator_pos": null,
  "layout": {
    "show_header": true,
    "show_row_labels": false,
    "show_grid": true,
    "row_height": 1.5,
    "col_width": 2.0,
    "token_style": "filled",
    "token_size": 0.18,
    "max_tokens_per_row": 5
  }
}

--- BEISPIEL 2: Dezimalzahlen mit Kommastrich nach Einer (Z, E, z, h, t) ---
{
  "columns": [
    { "id": "Z", "label": "Z", "color": "#dc2626", "active": true },
    { "id": "E", "label": "E", "color": "#16a34a", "active": true },
    { "id": "z", "label": "z", "color": "#ea580c", "active": true },
    { "id": "h", "label": "h", "color": "#ca8a04", "active": true },
    { "id": "t", "label": "t", "color": "#0284c7", "active": true }
  ],
  "groups": [],
  "rows": [
    { "id": "r1", "label": "12,504", "values": { "Z": 1, "E": 2, "z": 5, "h": 0, "t": 4 }, "active": true }
  ],
  "mode": "Beides",
  "decimal_separator_pos": 1,
  "layout": {
    "show_header": true,
    "show_row_labels": false,
    "show_grid": true,
    "row_height": 1.4,
    "col_width": 1.8,
    "token_style": "filled",
    "token_size": 0.18,
    "max_tokens_per_row": 5
  }
}

--- BEISPIEL 3: Große Zahlen bis Millionen (M, HT, ZT, T, H, Z, E) ---
{
  "columns": [
    { "id": "M", "label": "M", "color": "#7c3aed", "active": true },
    { "id": "HT", "label": "HT", "color": "#0891b2", "active": true },
    { "id": "ZT", "label": "ZT", "color": "#0891b2", "active": true },
    { "id": "T", "label": "T", "color": "#0891b2", "active": true },
    { "id": "H", "label": "H", "color": "#2563eb", "active": true },
    { "id": "Z", "label": "Z", "color": "#dc2626", "active": true },
    { "id": "E", "label": "E", "color": "#16a34a", "active": true }
  ],
  "groups": [
    { "id": "g_mil", "label": "Millionen", "start_col_id": "M", "end_col_id": "M", "color": "#ede9fe" },
    { "id": "g_tsd", "label": "Tausender", "start_col_id": "HT", "end_col_id": "T", "color": "#e0f2fe" },
    { "id": "g_ein", "label": "Einer", "start_col_id": "H", "end_col_id": "E", "color": "#f1f5f9" }
  ],
  "rows": [
    { "id": "r1", "label": "Zahl 1", "values": { "M": 1, "HT": 2, "ZT": 5, "T": 0, "H": 0, "Z": 0, "E": 0 }, "active": true }
  ],
  "mode": "Ziffern",
  "decimal_separator_pos": null,
  "layout": {
    "show_header": true,
    "show_row_labels": false,
    "show_grid": true,
    "row_height": 1.2,
    "col_width": 1.5,
    "token_style": "filled",
    "token_size": 0.18,
    "max_tokens_per_row": 5
  }
}
"""

class StellenwertAiHandler(BaseGeneratorAiHandler):
    def __init__(self):
        super().__init__(
            generator_id="stellenwerttafel",
            title="Stellenwerttafel",
            model_cls=StellenwertConfig
        )

    def get_system_prompt(self) -> str:
        return STELLENWERT_SYSTEM_PROMPT

    def merge_config(
        self,
        generated_data: Dict[str, Any],
        current_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # Basis-Default-Werte
        default_columns = [
            {"id": "H", "label": "H", "color": "#2563eb", "active": True},
            {"id": "Z", "label": "Z", "color": "#dc2626", "active": True},
            {"id": "E", "label": "E", "color": "#16a34a", "active": True}
        ]
        base_dict = {
            "columns": default_columns,
            "groups": [],
            "rows": [],
            "mode": StellenwertMode.BEIDES.value,
            "layout": StellenwertLayout().model_dump(),
            "decimal_separator_pos": None,
            "font_size": "Large",
            "use_fira": True
        }

        if current_config:
            preserved_keys = ["font_size", "use_fira"]
            for pk in preserved_keys:
                if pk in current_config:
                    base_dict[pk] = current_config[pk]
            if "layout" in current_config and isinstance(current_config["layout"], dict):
                base_dict["layout"].update(current_config["layout"])

        for key, val in generated_data.items():
            if val is not None:
                if key == "layout" and isinstance(val, dict):
                    base_dict["layout"].update(val)
                else:
                    base_dict[key] = val

        return base_dict
