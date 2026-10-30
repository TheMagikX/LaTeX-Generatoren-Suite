# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Union

class ShadeConfig(BaseModel):
    show: bool = False
    a: Optional[float] = None
    b: Optional[float] = None
    fill: str = "blue!35"
    pattern: str = "none"
    alpha: float = 0.5
    draw: str = "none"

class BetweenConfig(BaseModel):
    show: bool = False
    other_index: int
    a: Optional[float] = None
    b: Optional[float] = None
    fill: str = "blue!35"
    pattern: str = "none"
    alpha: float = 0.5
    draw: str = "none"

class SlopeConfig(BaseModel):
    show: bool = True
    x0: float = 1.0
    dx: float = 1.0
    style: str = "black, thick"
    label_show: bool = True
    label_x: str = r"$\Delta x$"
    label_y: str = r"$\Delta y$"
    label_style: str = r"font=\scriptsize"

class TangentConfig(BaseModel):
    show: bool = True
    x0: float = 1.0
    xmin: Optional[float] = None
    xmax: Optional[float] = None
    style: str = "red, thick"
    is_normal: bool = False
    label_show: bool = False
    label_text: str = ""
    label_pos: float = 0.5

class PlotConfig(BaseModel):
    show: bool = True
    func: str
    color: str = "#1e293b"
    line_width: str = "thick"
    line_style: str = "solid"
    custom_style: str = ""
    settings: Optional[str] = None
    xmin: Optional[float] = None
    xmax: Optional[float] = None
    label_text: Optional[str] = None
    label_pos: float = 0.6
    label_style: str = r"above, sloped, font=\small, fill=white, inner sep=1pt"
    shades: List[ShadeConfig] = []
    betweens: List[BetweenConfig] = []
    slopes: List[SlopeConfig] = []
    tangents: List[TangentConfig] = []

class CSVPlotConfig(BaseModel):
    show: bool = True
    path: str
    color: str = "#1e293b"
    line_width: str = "thick"
    line_style: str = "solid"
    custom_style: str = ""
    style: Optional[str] = None
    xcol: str
    ycol: str
    sep: str = "semicolon"
    read_comma: bool = True
    only_marks: bool = False
    marker_symbol: str = "*"
    marker_size: float = 1.0
    marker_options: str = ""

class NodeConfig(BaseModel):
    show: bool = True
    x: float
    y: float
    text: str = "Hinweis"
    color: str = "#1e293b"
    font_size: str = r"\small"
    anchor: str = "center"
    custom_opts: str = ""
    opts: Optional[str] = None
    bg_white: bool = False
    marker: bool = False
    mark_style: str = "only marks, mark=*, color=black"
    mark_size: float = 1.6
    arrow: bool = False
    arrow_style: str = "->, thick"
    dx: float = 0.0
    dy: float = 0.0

    @model_validator(mode="before")
    @classmethod
    def migrate_legacy_node(cls, values: dict):
        if isinstance(values, dict):
            raw_opts = values.get("opts")
            if raw_opts and isinstance(raw_opts, str):
                tokens = [t.strip() for t in raw_opts.split(",") if t.strip()]
                custom = []
                known_anchors = {"center", "north", "south", "east", "west", "north east", "north west", "south east", "south west", "above", "below", "left", "right"}
                for t in tokens:
                    t_low = t.lower()
                    if t_low.startswith("font="):
                        if "font_size" not in values:
                            values["font_size"] = t.split("=", 1)[1].strip()
                    elif t_low.startswith("anchor="):
                        if "anchor" not in values:
                            values["anchor"] = t.split("=", 1)[1].strip()
                    elif t_low in known_anchors:
                        if "anchor" not in values:
                            values["anchor"] = t_low
                    elif t_low.startswith("hexcol="):
                        if "color" not in values:
                            values["color"] = f"#{t.split('=', 1)[1].strip()}"
                    elif t_low == "fill=white":
                        values["bg_white"] = True
                    elif t_low == "draw=none":
                        pass
                    else:
                        custom.append(t)
                if "custom_opts" not in values and custom:
                    values["custom_opts"] = ", ".join(custom)
        return values

class PointConfig(BaseModel):
    show: bool = True
    x: float
    y: float
    label: str
    color: str = "#1e293b"
    anchor: str = "west"
    custom_label_style: str = ""
    label_style: Optional[str] = None
    mark: str = "x"
    size: float = 3.0
    mark_style: str = "very thick"

class ParametricPlotConfig(BaseModel):
    show: bool = True
    x_t: str
    y_t: str
    color: str = "#1e293b"
    line_width: str = "very thick"
    line_style: str = "solid"
    custom_style: str = ""
    settings: Optional[str] = None
    tmin: float
    tmax: float
    ymin: Optional[float] = None
    ymax: Optional[float] = None
    label_show: bool = False
    label_text: str = r"\large $x$"
    label_pos: float = 0.6
    label_style: str = r"above, sloped, font=\small, fill=white, inner sep=1pt"

class CoordinateSystemConfig(BaseModel):
    xmin: float = 0.0
    xmax: float = 7.25
    ymin: float = 0.0
    ymax: float = 4.25
    
    label_show: bool = True
    xlabel: str = r"\large $x$"
    xlabel_pos: str = "0.99,0.05"
    xlabel_background: bool = False
    xlabel_background_sep: float = 1.5
    
    ylabel: str = r"\large $y$"
    ylabel_pos: str = "0.02,0.97"
    ylabel_background: bool = False
    ylabel_background_sep: float = 1.5
    ylabel_rot: bool = False
    
    majorticklabels: bool = True
    ticks_show: bool = True
    tick_mode: str = "Automatisch"
    
    xticklist: Optional[str] = None
    yticklist: Optional[str] = None
    x_tick_pos_manuell: Optional[str] = None
    x_tick_label_manuell: Optional[str] = None
    y_tick_pos_manuell: Optional[str] = None
    y_tick_label_manuell: Optional[str] = None
    
    scale_x: float = 1.0
    scale_y: float = 1.0
    xtickformat: str = "font=\\normalsize"
    ytickformat: str = "font=\\normalsize"
    xtickfrac: bool = False
    ytickfrac: bool = False
    mult_x: float = 1.0
    mult_y: float = 1.0
    prec_x: int = 0
    prec_y: int = 0
    minor_x: int = 1
    minor_y: int = 1
    sep_x: bool = False
    sep_y: bool = False
    label_suffix_x: str = ""
    label_suffix_y: str = ""
    xlog: bool = False
    ylog: bool = False
    
    grid_show: bool = True
    grid_major_color: str = "gray!50"
    grid_major_width: float = 0.6
    grid_major_extras: str = ""
    grid_minor_color: str = "gray!50"
    grid_minor_width: float = 0.6
    grid_minor_extras: str = ""

    @model_validator(mode="before")
    @classmethod
    def migrate_legacy_grid(cls, values: dict):
        if isinstance(values, dict):
            if "grid_color" in values:
                grid_c = values.get("grid_color", "gray!50")
                if "grid_major_color" not in values:
                    values["grid_major_color"] = grid_c
                if "grid_minor_color" not in values:
                    values["grid_minor_color"] = grid_c
            if "grid_width" in values:
                grid_w = values.get("grid_width", 0.6)
                if "grid_major_width" not in values:
                    values["grid_major_width"] = grid_w
                if "grid_minor_width" not in values:
                    values["grid_minor_width"] = grid_w
            if "grid_extras" in values:
                grid_e = values.get("grid_extras", "")
                if "grid_major_extras" not in values:
                    values["grid_major_extras"] = grid_e
                if "grid_minor_extras" not in values:
                    values["grid_minor_extras"] = grid_e
        return values
    
    axis_width: float = 1.25
    axis_color: str = "black"
    axis_extras: str = ""
    
    tick_width: float = 1.0
    tick_color: str = "black"
    tick_extras: str = ""
    
    width_cm: float = 12.0
    samples: int = 500
    
    plots: List[PlotConfig] = []
    csv_plots: List[CSVPlotConfig] = []
    nodes: List[NodeConfig] = []
    points: List[PointConfig] = []
    parametric_plots: List[ParametricPlotConfig] = []
    
    manual_code: str = ""
    
    pakete_laden: bool = True
    command_laden: bool = True
    font_family: str = "Fira"
