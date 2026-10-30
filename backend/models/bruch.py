# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from typing import Optional

class BruchConfig(BaseModel):
    zaehler: int = Field(3, ge=0, le=200)
    nenner: int = Field(4, ge=1, le=200)
    form: str = "Rechteck"  # "Rechteck" or "Kreis"
    fill_color: str = "#4A90D9"
    border_color: str = "#1a1a2e"
    seed: int = 42
    show_label: bool = True
    label_override: Optional[str] = None
    rect_mode: str = "Automatisch"  # "Automatisch" or "Manuell"
    rect_rows: int = 0
    erweiter_faktor: int = Field(2, ge=2, le=20)
    split_mode: str = "Horizontal"  # "Horizontal" or "Vertikal"
    split_style: str = "Hervorgehoben"  # "Standard" or "Hervorgehoben"
    border_width: float = Field(0.6, ge=0.1, le=5.0)
    fill_pattern: str = "solid"
    mixed_number: bool = False
    show_erweitern: bool = False
    show_kuerzen: bool = False
    font_family: str = "Fira"
