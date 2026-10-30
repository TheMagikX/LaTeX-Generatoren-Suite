# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import List, Optional

class MarkedPointConfig(BaseModel):
    value: float
    type: str = "kreuz"  # "kreuz", "gefüllt", "offen"
    label: str = ""
    visible: bool = True
    color: Optional[str] = None
    label_color: Optional[str] = None

class JumpConfig(BaseModel):
    start: float
    end: float
    label: str = ""
    style: str = "arc"  # "arc", "square", "straight"
    arrow: str = "-> " # "->", "-Stealth", etc.
    visible: bool = True
    color: Optional[str] = None
    label_color: Optional[str] = None

class IntervalConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    start: float = Field(..., alias="von")
    end: float = Field(..., alias="bis")
    color: str = "#2563eb"
    left_type: str = "offen"  # "offen" or "geschlossen"
    right_type: str = "offen" # "offen" or "geschlossen"
    visible: bool = True

class PointerConfig(BaseModel):
    value: float
    label: str = ""
    color: str = "#1e293b"
    label_color: Optional[str] = None
    visible: bool = True

class ZahlenstrahlConfig(BaseModel):
    # Range & Scaling
    min_val: float = -5.0
    max_val: float = 5.0
    width_cm: float = 12.0
    x_scale: Optional[float] = None
    padding: float = 0.5

    @model_validator(mode="before")
    @classmethod
    def migrate_legacy_scaling(cls, values: dict):
        if isinstance(values, dict):
            if "width_cm" not in values and "x_scale" in values and values["x_scale"] is not None:
                min_v = float(values.get("min_val", -5.0))
                max_v = float(values.get("max_val", 5.0))
                span = abs(max_v - min_v)
                if span == 0:
                    span = 1.0
                values["width_cm"] = round(span * float(values["x_scale"]), 2)
        return values

    # Ticks (Dreistufige Hierarchie)
    step_main: float = 1.0
    step_mid: Optional[float] = None
    step_sub: Optional[float] = 0.5
    tick_main_h: float = 0.12
    tick_mid_h: float = 0.08
    tick_sub_h: float = 0.05
    tick_main_width: str = "semithick"
    tick_mid_width: str = "thin"
    tick_sub_width: str = "very thin"
    line_width: str = "semithick"

    # Labels & Didactic Formatting
    show_labels: bool = True
    label_density: str = "major_only"  # "major_only", "major_and_mid", "all", "every_nth"
    label_every_nth: int = 1
    label_as_fraction: bool = False
    fraction_style: str = "auto"  # "auto", "fixed_denominator", "mixed"
    fraction_denominator: Optional[int] = 4
    fraction_inline: bool = False
    decimal_separator: str = ","
    decimal_precision: Optional[int] = None
    decimal_fixed_zerofill: bool = False
    hidden_ticks: List[float] = []
    hide_style: str = "box"  # "box" or "underline"

    # Presets
    scale_preset: Optional[str] = None

    # Style
    arrow_type: str = "->"
    jump_out_angle: int = 140

    # Colors (Hex)
    color_axis: str = "#000000"
    color_main_tick: str = "#000000"
    color_mid_tick: Optional[str] = None
    color_sub_tick: str = "#000000"
    color_label: str = "#000000"
    color_point: str = "#000000"
    color_jump: str = "#000000"

    # Collections
    points: List[MarkedPointConfig] = []
    jumps: List[JumpConfig] = []
    intervals: List[IntervalConfig] = []
    pointers: List[PointerConfig] = []
    zoom_points: List[MarkedPointConfig] = []
    zoom_intervals: List[IntervalConfig] = []
    zoom_pointers: List[PointerConfig] = []

    # Zoom (Magnifying Glass)
    zoom_active: bool = False
    zoom_min: float = 1.0
    zoom_max: float = 2.0
    zoom_scale: float = 2.0  # Scaling for the zoomed axis
    zoom_use_divisions: bool = True
    zoom_divisions_main: int = 10
    zoom_divisions_sub: int = 5
    zoom_step_main: Optional[float] = None # If None, use step_main
    zoom_step_mid: Optional[float] = None
    zoom_step_sub: Optional[float] = None  # If None, use step_sub
    zoom_show_labels: bool = True
    zoom_label_density: Optional[str] = None
    zoom_show_points: bool = True
    zoom_show_pointers: bool = True
    zoom_show_jumps: bool = False
    zoom_show_intervals: bool = True

    # Global
    font_family: str = "Fira"
