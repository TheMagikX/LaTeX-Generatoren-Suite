# SPDX-License-Identifier: AGPL-3.0-or-later

from typing import Any, Dict, Optional
from models.koordinatensystem import CoordinateSystemConfig
from core.ai.base import BaseGeneratorAiHandler

KOORD2D_SYSTEM_PROMPT = r"""Du bist ein spezialisierter KI-Assistent für einen 2D-Koordinatensystem-Generator für Mathematiklehrkräfte (LaTeX / TikZ / PGFPlots).
Deine Aufgabe ist es, anhand der Benutzeranfrage ein vollständiges, valides JSON-Objekt für die 2D-Koordinatensystem-Konfiguration zu erzeugen.

Antworte AUSSCHLIESSLICH mit dem puren JSON-Objekt, ohne zusätzlichen Erklärungstext oder Markdown-Codeblöcke.

================================================================================
REGELN FÜR DIE 2D-KOORDINATENSYSTEM-KONFIGURATION:
================================================================================
1. ACHSENBEREICHE:
   - "xmin", "xmax", "ymin", "ymax": Numerische Grenzen des sichtbaren Koordinatensystems (z. B. xmin=-3.0, xmax=6.0, ymin=-2.0, ymax=6.0).
   - "grid_show": true (Gitterlinien anzeigen)
   - "tick_mode": "Automatisch" oder "Bereich" (z. B. "xticklist": "-3,...,6")

2. FUNKTIONSGRAPHEN ("plots"):
   Eine Liste von Funktionsdefinitionen:
   - "show": true
   - "func": Mathematischer Ausdruck in PGFPlots-Syntax (z. B. "0.5*x + 1", "(x-2)^2 - 1", "-0.25*x^2 + 4", "sin(deg(x))")
   - "color": Hex-Farbcode (z. B. "#2563eb" für Blau, "#dc2626" für Rot, "#16a34a" für Grün)
   - "line_width": "thick", "very thick" oder "semithick"
   - "line_style": "solid", "dashed" oder "dotted"
   - "label_text": Beschriftung am Graphen, z. B. "$f(x)$" oder "$g(x)$" (optional)
   - "slopes": Liste von Steigungsdreiecken: [{"show": true, "x0": 2.0, "dx": 2.0, "style": "black, thick", "label_show": true}]
   - "tangents": Liste von Tangenten/Normalen: [{"show": true, "x0": 1.0, "style": "red, thick", "is_normal": false}]
   - "shades": Liste von Schattierungen/Integralen: [{"show": true, "a": -1.0, "b": 2.0, "fill": "blue!35", "alpha": 0.4}]

3. PUNKTE ("points"):
   - "show": true
   - "x": float
   - "y": float
   - "label": Beschriftung, z. B. "$S(2|-1)$" oder "$P_1$"
   - "color": Hex-Farbcode (z. B. "#dc2626")

================================================================================
BEISPIELE (ORIENTIERE DICH GENAU AN DIESER STRUKTUR):
================================================================================

--- BEISPIEL 1: Normalparabel mit Scheitelpunkt bei (2|-1) ---
{
  "xmin": -2.0,
  "xmax": 6.0,
  "ymin": -2.0,
  "ymax": 6.0,
  "grid_show": true,
  "plots": [
    {
      "show": true,
      "func": "(x-2)^2 - 1",
      "color": "#2563eb",
      "line_width": "thick",
      "line_style": "solid",
      "label_text": "$f(x) = (x-2)^2 - 1$",
      "shades": [],
      "slopes": [],
      "tangents": []
    }
  ],
  "points": [
    {
      "show": true,
      "x": 2.0,
      "y": -1.0,
      "label": "$S(2|-1)$",
      "color": "#dc2626"
    }
  ]
}

--- BEISPIEL 2: Lineare Funktion mit Steigungsdreieck bei x=1 ---
{
  "xmin": -2.0,
  "xmax": 6.0,
  "ymin": -1.0,
  "ymax": 5.0,
  "grid_show": true,
  "plots": [
    {
      "show": true,
      "func": "0.5*x + 1",
      "color": "#16a34a",
      "line_width": "thick",
      "line_style": "solid",
      "label_text": "$g(x) = \\frac{1}{2}x + 1$",
      "shades": [],
      "slopes": [
        {
          "show": true,
          "x0": 1.0,
          "dx": 2.0,
          "style": "black, thick",
          "label_show": true
        }
      ],
      "tangents": []
    }
  ],
  "points": []
}

--- BEISPIEL 3: Parabel mit Integral-Fläche von x=0 bis x=2 ---
{
  "xmin": -1.0,
  "xmax": 4.0,
  "ymin": -1.0,
  "ymax": 5.0,
  "grid_show": true,
  "plots": [
    {
      "show": true,
      "func": "-x^2 + 4",
      "color": "#7c3aed",
      "line_width": "thick",
      "line_style": "solid",
      "label_text": "$f(x) = -x^2 + 4$",
      "shades": [
        {
          "show": true,
          "a": 0.0,
          "b": 2.0,
          "fill": "purple!30",
          "alpha": 0.5,
          "draw": "none"
        }
      ],
      "slopes": [],
      "tangents": []
    }
  ],
  "points": []
}
"""

class Koord2DAiHandler(BaseGeneratorAiHandler):
    def __init__(self):
        super().__init__(
            generator_id="koordinatensystem",
            title="2D Koordinatensystem",
            model_cls=CoordinateSystemConfig
        )

    def get_system_prompt(self) -> str:
        return KOORD2D_SYSTEM_PROMPT

    def merge_config(
        self,
        generated_data: Dict[str, Any],
        current_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        base_dict = self.model_cls().model_dump()
        if current_config:
            preserved_keys = [
                "font_family", "axis_color", "axis_width", "tick_color", "tick_width",
                "grid_major_color", "grid_minor_color", "width_cm", "samples"
            ]
            for pk in preserved_keys:
                if pk in current_config and current_config[pk] is not None:
                    base_dict[pk] = current_config[pk]

        for key, val in generated_data.items():
            if val is not None:
                base_dict[key] = val

        # Sicherheitskorrektur: Achsenbereiche
        if base_dict.get("xmin", 0) >= base_dict.get("xmax", 1):
            base_dict["xmax"] = base_dict["xmin"] + 5.0
        if base_dict.get("ymin", 0) >= base_dict.get("ymax", 1):
            base_dict["ymax"] = base_dict["ymin"] + 5.0

        return base_dict
