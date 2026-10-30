# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Any

class Point3DConfig(BaseModel):
    show: bool = True
    x: float = 2.0
    y: float = 1.0
    z: float = 3.0
    label: str = "P"
    color: str = "#1e293b"
    mark: str = "*"
    size: float = 2.0
    anchor: str = "west"
    trail: bool = False
    trail_marks: bool = False
    trail_color: str = "#64748b"
    trail_style: str = "dashed"
    trail_width: float = 0.8
    trail_alpha: float = 80.0
    # Projektionen auf Grundebenen (2.1)
    proj_xy: bool = False
    proj_xz: bool = False
    proj_yz: bool = False
    proj_color: str = "#64748b"
    proj_style: str = "dashed"

class Vector3DConfig(BaseModel):
    show: bool = True
    x1: float = 1.0
    y1: float = 0.0
    z1: float = 0.0
    x2: float = 0.0
    y2: float = 2.0
    z2: float = 2.0
    color: str = "#ef4444"
    style: str = "solid"
    width: float = 1.2
    arrow: str = "Stealth[length=3mm]"
    label: str = ""
    label_pos: str = "midway, above"
    draw_mode: str = "vorne"   # "vorne" | "hinten" | "automatisch"
    behind_style: str = "dashed, opacity=0.5"

class Line3DConfig(BaseModel):
    show: bool = True
    x0: float = 2.0
    y0: float = 0.0
    z0: float = 4.0
    rx: float = 1.0
    ry: float = 2.0
    rz: float = 1.0
    color: str = "#64748b"
    style: str = "solid"
    width: float = 1.0
    tmin: float = -10.0
    tmax: float = 10.0
    rvec_show: bool = False
    rvec_color: str = "#1e293b"
    rvec_style: str = "solid"
    rvec_width: float = 1.2
    rvec_arrow: str = "Stealth[length=3mm]"
    rvec_label: str = r"$\vec{r}$"
    rvec_label_style: str = "midway, below"
    svec_show: bool = False
    svec_color: str = "#1e293b"
    svec_style: str = "solid"
    svec_width: float = 1.2
    svec_arrow: str = "Stealth[length=3mm]"
    svec_label: str = r"$\vec{s}$"
    svec_label_style: str = "midway, below"
    draw_mode: str = "vorne"   # "vorne" | "hinten" | "automatisch"
    behind_style: str = "dashed, opacity=0.5"
    line_mode: str = "stuetz_richtung"
    svec_point_idx: Optional[int] = None
    pt1_x: Optional[float] = None
    pt1_y: Optional[float] = None
    pt1_z: Optional[float] = None
    pt2_x: Optional[float] = None
    pt2_y: Optional[float] = None
    pt2_z: Optional[float] = None
    pt1_idx: Optional[int] = None
    pt2_idx: Optional[int] = None

class Plane3DConfig(BaseModel):
    show: bool = True
    name: str = ""
    mode: str = "3 Punkte" # "3 Punkte" oder "Koordinatenform"
    # 3 Punkte Modus
    x1: float = 2.0
    y1: float = 0.0
    z1: float = 0.0
    x2: float = 0.0
    y2: float = 2.0
    z2: float = 0.0
    x3: float = 0.0
    y3: float = 0.0
    z3: float = 2.0
    # Koordinatenform Modus
    n1: float = 0.0
    n2: float = 0.0
    n3: float = 1.0
    d: float = 2.0
    
    color: str = "#2563eb"
    alpha: float = 50.0
    pattern: str = ""
    normal_show: bool = False
    normal_color: str = "#1e293b"
    normal_style: str = "solid"
    normal_width: float = 1.2
    normal_arrow: str = "Stealth[length=3mm]"
    normal_label: str = r"$\vec{n}$"
    normal_label_pos: str = "midway, above right"
    p1_idx: Optional[int] = None
    p2_idx: Optional[int] = None
    p3_idx: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def _migrate_normal_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            old_style = data.get("normal_style")
            if old_style and ("-" in old_style or "thick" in old_style or "black" in old_style or "Stealth" in old_style):
                if "normal_arrow" not in data:
                    data["normal_arrow"] = "Stealth[length=3mm]" if "Stealth" in old_style else ("Latex[length=3mm]" if "latex" in old_style.lower() else "Stealth[length=3mm]")
                if "normal_style" not in data or data["normal_style"] == old_style:
                    data["normal_style"] = "solid"
        return data

class IntersectionConfig(BaseModel):
    show: bool = True
    type: str = "Gerade-Gerade" # "Gerade-Gerade", "Gerade-Ebene", "Ebene-Ebene"
    item1_index: int = 0
    item2_index: int = 1
    color: str = "black"
    label: str = "S"
    mark: str = "*"
    size: float = 3.0
    width: float = 1.5
    style: str = "solid"

class Shape3DConfig(BaseModel):
    show: bool = True
    name: str = ""
    point_indices: List[int] = []
    color: str = "#1e293b"
    fill_color: str = "#2563eb"
    fill_alpha: float = 30.0
    width: float = 1.0
    style: str = "solid"
    closed: bool = False

class CoordinateSystem3DConfig(BaseModel):
    xmin: float = 0.0
    xmax: float = 5.0
    ymin: float = 0.0
    ymax: float = 5.0
    zmin: float = 0.0
    zmax: float = 5.0
    
    label_show: bool = True
    xlabel: str = r"\large $x_1$"
    xlabel_pos: str = "axis cs:4.5,0,0.4"
    xlabel_background: bool = False
    xlabel_background_sep: float = 1.5
    
    ylabel: str = r"\large $x_2$"
    ylabel_pos: str = "axis cs:0,4.5,0.3"
    ylabel_background: bool = False
    ylabel_background_sep: float = 1.5
    
    zlabel: str = r"\large $x_3$"
    zlabel_pos: str = "axis cs:0.5,0,4.7"
    zlabel_background: bool = False
    zlabel_background_sep: float = 1.5
    
    majorticklabels: bool = True
    ticks_show: bool = True
    tick_mode: str = "Automatisch"
    
    xticklist: str = "0,...,5"
    yticklist: str = "0,...,5"
    zticklist: str = "0,...,5"
    
    scale_x: float = 1.0
    scale_y: float = 1.0
    scale_z: float = 1.0
    
    tickformat_x: str = "font=\\normalsize"
    tickformat_y: str = "font=\\normalsize"
    tickformat_z: str = "font=\\normalsize"
    
    mult_x: float = 1.0
    mult_y: float = 1.0
    mult_z: float = 1.0
    
    prec_x: int = 0
    prec_y: int = 0
    prec_z: int = 0
    
    sep_x: bool = False
    sep_y: bool = False
    sep_z: bool = False
    
    label_suffix_x: str = ""
    label_suffix_y: str = ""
    label_suffix_z: str = ""
    
    axis_width: float = 1.25
    axis_color: str = "black"
    axis_arrow: str = ""
    axis_on_top: bool = False
    
    tick_width: float = 1.0
    tick_color: str = "black"
    tick_length: float = 3.0
    minor_ticks: bool = False
    minor_tick_num: int = 4
    
    azimuth: int = 0
    elevation: int = 30
    
    render_dpi: int = 1000
    width_cm: float = 12.0
    
    points: List[Point3DConfig] = []
    vectors: List[Vector3DConfig] = []
    lines: List[Line3DConfig] = []
    planes: List[Plane3DConfig] = []
    intersections: List[IntersectionConfig] = []
    shapes: List[Shape3DConfig] = []
    
    manual_code: str = ""
    
    pakete_laden: bool = True
    command_laden: bool = True
    font_family: str = "Fira"
