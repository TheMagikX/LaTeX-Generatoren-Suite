# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from typing import List, Optional


class LightSource(BaseModel):
    x: float = 0.0
    y: float = 0.0
    angle: float = 0.0              # Ray direction in degrees (0=right, 90=up)
    spread: float = 0.0             # Fan width in degrees (0 = single ray)
    num_rays: int = 1               # Number of rays in fan (1..50)
    extended_width: float = 0.0     # Physical width of source for Halbschatten (0 = point source)
    ray_color: str = "yellow"
    label: str = ""
    show_light_zone: bool = False   # Fill the illuminated region
    light_zone_opacity: float = 0.2 # Fill opacity for the illuminated region
    source_size: float = 3.0        # Radius of the source marker in pt
    ray_line_width: float = 0.0     # Per-source ray line width (0 = use global)


class BarrierSegment(BaseModel):
    # Line segment fields
    x1: float = 0.0
    y1: float = -2.0
    x2: float = 0.0
    y2: float = 2.0
    
    # Curved segment fields
    is_curve: bool = False
    curve_type: str = "circular" # "circular", "parabolic"
    cx: float = 0.0
    cy: float = 0.0
    radius: float = 2.0
    start_angle: float = 0.0
    end_angle: float = 180.0


class PathNode(BaseModel):
    x: float
    y: float
    connection: str = "line"  # "line", "arc", "bezier"
    bend: float = 0.0         # degrees for ARC (relative bend)
    out_angle: float = 0.0    # absolute degrees for BEZIER
    in_angle: float = 0.0     # absolute degrees for BEZIER


class Barrier(BaseModel):
    nodes: List[PathNode] = Field(
        default_factory=lambda: [PathNode(x=0, y=-2), PathNode(x=0, y=2)]
    )
    is_closed: bool = False
    reflecting: bool = True
    color: str = "black"
    line_width: float = 2.0
    label: str = ""


class RefractionArea(BaseModel):
    mode: str = "rectangle"  # "rectangle", "path"
    # Rectangular fallback
    x_min: float = -2.0
    x_max: float = 2.0
    y_min: float = -5.0
    y_max: float = 5.0

    # Path support
    nodes: List[PathNode] = Field(default_factory=list)

    refractive_index: float = 1.5   # n >= 1.0
    fill_color: str = "cyan"
    fill_opacity: float = 0.15
    border_color: str = "cyan!60!black"
    border_width: float = 0.8
    label: str = ""


class RefractionAnnotations(BaseModel):
    show_normals: bool = False
    normal_color: str = "gray"
    normal_line_width: float = 0.5
    normal_length: float = 2.0
    normal_style: str = "dashed"

    show_angle_arcs: bool = False
    show_angle_labels: bool = True

    incident_color: str = "orange"
    incident_radius: float = 1.0
    incident_opacity: float = 0.2
    incident_label: str = r"$\alpha$"

    refracted_color: str = "teal"
    refracted_radius: float = 1.0
    refracted_opacity: float = 0.2
    refracted_label: str = r"$\beta$"


class StrahlenoptikConfig(BaseModel):
    light_sources: List[LightSource] = Field(
        default_factory=lambda: [LightSource()]
    )
    barriers: List[Barrier] = Field(default_factory=list)
    refraction_areas: List[RefractionArea] = Field(default_factory=list)
    refraction_annotations: RefractionAnnotations = Field(
        default_factory=RefractionAnnotations
    )
    max_reflections: int = 5
    show_shadow_zones: bool = True
    shadow_color: str = "black"
    shadow_opacity: float = 0.35
    partial_shadow_color: str = "black"
    partial_shadow_opacity: float = 0.15
    canvas_x_min: float = -10.0
    canvas_x_max: float = 10.0
    canvas_y_min: float = -10.0
    canvas_y_max: float = 10.0
    show_grid: bool = False
    grid_step: float = 1.0
    show_axes: bool = True
    ray_line_width: float = 0.8
    ray_arrow: bool = True
    font_family: str = "Latin Modern"
    show_partial_reflection: bool = False
