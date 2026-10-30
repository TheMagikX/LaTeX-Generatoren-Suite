# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class GlucksradMode(str, Enum):
    STANDARD = "standard"
    VARIABLE = "variable"

class LabelMode(str, Enum):
    RADIAL = "Radial (Standard)"
    HORIZONTAL = "Horizontal"
    TANGENTIAL = "Tangential"
    AUSSEN = "Außen"

class ArrowStyle(str, Enum):
    NONE = "Kein Pfeil"
    IMAGE = "Bild-Datei (Original)"
    TIKZ = "TikZ-Pfeil"

class CenterStyle(str, Enum):
    NONE = "Kein Mittelpunkt"
    PUNKT = "Punkt"
    SCHRAUBE = "Schraube"
    LAGER = "Lager"

class PointerPos(str, Enum):
    OBEN = "Oben"
    RECHTS = "Rechts"
    UNTEN = "Unten"
    LINKS = "Links"

class ColorSectorConfig(BaseModel):
    farbe: str = "#E74C3C"
    haeufigkeit: float = 1.0
    label: str = ""

class TikZArrowConfig(BaseModel):
    color: str = "#104861"
    handdrawn: bool = True
    length: float = 2.0
    shaftwidth: float = 0.2
    circleradius: float = 0.2
    widthtip: float = 0.4
    heighttip: float = 0.65
    tailwingwidth: float = 0.25
    tailheight: float = 0.4
    taildrop: float = 0.15
    segment_length: float = 2.0
    amplitude: float = 0.15

class GlucksradConfig(BaseModel):
    mode: GlucksradMode = GlucksradMode.STANDARD
    anzahl: int = 6
    seed: int = 42
    radius: float = 3.0
    sectors: List[ColorSectorConfig] = []
    
    show_labels: bool = False
    label_fontsize: str = "\\scriptsize"
    label_mode: LabelMode = LabelMode.RADIAL
    
    show_rim: bool = True
    show_pins: bool = False
    center_style: CenterStyle = CenterStyle.PUNKT
    
    arrow_style: ArrowStyle = ArrowStyle.IMAGE
    pointer_pos: PointerPos = PointerPos.OBEN
    arrow_params: TikZArrowConfig = Field(default_factory=TikZArrowConfig)
    
    font_family: str = "Fira"
    render_dpi: int = 1000
