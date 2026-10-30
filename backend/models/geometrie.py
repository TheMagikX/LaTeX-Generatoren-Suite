# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel
from typing import Literal


class TriangleConstructionConfig(BaseModel):
    mode: Literal["SSS", "SWS", "WSW"] = "SSS"
    rotation: float = 0.0
    a: float = 4.0
    b: float = 3.5
    c: float = 5.0
    alpha: float = 40.0
    beta: float = 60.0
    step: int = 0


class AngleColors(BaseModel):
    alpha: str = "F1C40F"
    beta: str = "F1C40F"
    gamma: str = "F1C40F"
    delta: str = "F1C40F"


class AngleRadii(BaseModel):
    alpha: float = 7.0
    beta: float = 7.0
    gamma: float = 7.0
    delta: float = 7.0


class AngleOpacities(BaseModel):
    alpha: float = 0.2
    beta: float = 0.2
    gamma: float = 0.2
    delta: float = 0.2


class AngleLabels(BaseModel):
    alpha: str = r"$\alpha$"
    beta: str = r"$\beta$"
    gamma: str = r"$\gamma$"
    delta: str = r"$\delta$"


class PointLabels(BaseModel):
    A: str = r"$A$"
    B: str = r"$B$"
    C: str = r"$C$"
    D: str = r"$D$"


class SideValuesConfig(BaseModel):
    a: bool = False
    b: bool = False
    c: bool = False
    d: bool = False


class AngleValuesConfig(BaseModel):
    alpha: bool = False
    beta: bool = False
    gamma: bool = False
    delta: bool = False


class MeasurementsConfig(BaseModel):
    show_sides: SideValuesConfig = SideValuesConfig()
    show_angles: AngleValuesConfig = AngleValuesConfig()


class PointsConfig(BaseModel):
    show: bool = True
    labels: PointLabels = PointLabels()


class AnglesConfig(BaseModel):
    show_arcs: bool = True
    show_labels: bool = True
    labels: AngleLabels = AngleLabels()
    colors: AngleColors = AngleColors()
    radii: AngleRadii = AngleRadii()
    opacities: AngleOpacities = AngleOpacities()


class HelperLineConfig(BaseModel):
    show: bool = False
    show_label: bool = True
    show_right_angle: bool = True
    label: str = ""
    options: str = r"pos=0.5, auto, font=\tiny"
    style: str = "dashed, color=gray"


class HeightsConfig(BaseModel):
    ha: HelperLineConfig = HelperLineConfig(label=r"$h_a$")
    hb: HelperLineConfig = HelperLineConfig(label=r"$h_b$")
    hc: HelperLineConfig = HelperLineConfig(label=r"$h_c$")


class MediansConfig(BaseModel):
    sa: HelperLineConfig = HelperLineConfig(label=r"$s_a$", options=r"pos=0.7, auto, swap, font=\tiny")
    sb: HelperLineConfig = HelperLineConfig(label=r"$s_b$", options=r"pos=0.7, auto, swap, font=\tiny")
    sc: HelperLineConfig = HelperLineConfig(label=r"$s_c$", options=r"pos=0.7, auto, swap, font=\tiny")


class AngleBisectorsConfig(BaseModel):
    wa: HelperLineConfig = HelperLineConfig(label=r"$wh_a$", options=r"pos=0.8, auto, font=\tiny")
    wb: HelperLineConfig = HelperLineConfig(label=r"$wh_b$", options=r"pos=0.8, auto, font=\tiny")
    wc: HelperLineConfig = HelperLineConfig(label=r"$wh_c$", options=r"pos=0.8, auto, font=\tiny")


class PerpendicularBisectorsConfig(BaseModel):
    ma: HelperLineConfig = HelperLineConfig(label=r"$m_a$")
    mb: HelperLineConfig = HelperLineConfig(label=r"$m_b$")
    mc: HelperLineConfig = HelperLineConfig(label=r"$m_c$")


class OthersConfig(BaseModel):
    circumcircle: bool = False
    incircle: bool = False
    grid: bool = False


class TriangleElementConfig(BaseModel):
    points: PointsConfig = PointsConfig()
    angles: AnglesConfig = AnglesConfig()
    measurements: MeasurementsConfig = MeasurementsConfig()
    heights: HeightsConfig = HeightsConfig()
    medians: MediansConfig = MediansConfig()
    angle_bisectors: AngleBisectorsConfig = AngleBisectorsConfig()
    perpendicular_bisectors: PerpendicularBisectorsConfig = PerpendicularBisectorsConfig()
    others: OthersConfig = OthersConfig()


class TriangleStyleConfig(BaseModel):
    fill_color: str = r"{rgb,255:red,230; green,126; blue,34}"
    fill_opacity: float = 0.2
    stroke_color: str = "black"
    line_width: str = "semithick"
    helper_style_default: str = "dashed, color=gray"


class QuadrilateralConstructionConfig(BaseModel):
    mode: Literal["Parallelogram", "Trapezoid", "Rectangle", "Rhombus", "Kite", "FreeQuad"] = "Rectangle"
    a: float = 5.0
    b: float = 3.0
    c: float = 4.0
    alpha: float = 70.0
    height: float = 3.0
    offset_c: float = 1.0
    # Free quadrilateral: four user-defined vertices
    p_ax: float = 0.0
    p_ay: float = 0.0
    p_bx: float = 5.0
    p_by: float = 0.0
    p_cx: float = 6.0
    p_cy: float = 3.0
    p_dx: float = 1.0
    p_dy: float = 3.0


class GeometrieConfig(BaseModel):
    shape: Literal["Triangle", "Quadrilateral"] = "Triangle"
    construction: TriangleConstructionConfig = TriangleConstructionConfig()
    quad_construction: QuadrilateralConstructionConfig = QuadrilateralConstructionConfig()
    elements: TriangleElementConfig = TriangleElementConfig()
    style: TriangleStyleConfig = TriangleStyleConfig()
    pakete_laden: bool = True
    command_laden: bool = True
    font_family: str = "Fira"
    preamble_add: str = ""
