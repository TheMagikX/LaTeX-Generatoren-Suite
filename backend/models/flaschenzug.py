# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel
from typing import List, Optional

class PulleyConfig(BaseModel):
    id: str
    name: str = ""
    x: float = 0.0
    y: float = 0.0
    radius: float = 0.3
    label: str = ""
    label_pos: str = "above right"
    mount: str = "Keine"
    mount_angle: float = 90.0
    mount_length: float = 0.5

class AnchorConfig(BaseModel):
    id: str
    name: str = ""
    x: float = 0.0
    y: float = 0.0
    label: str = ""
    shape: str = "Kreis"
    size: float = 2.0

class RopeSegmentConfig(BaseModel):
    name: str = ""
    side: str = "cw"

class RopeConfig(BaseModel):
    id: str
    name: str = ""
    path: List[RopeSegmentConfig] = []
    style: str = "plain"
    color: str = "black"
    width: float = 1.0

class MassConfig(BaseModel):
    id: str
    ref: str = ""
    name: str = ""
    length: float = 1.0
    label: str = ""
    relation: str = "Mitte"

class ForceConfig(BaseModel):
    id: str
    ref_type: str = "pulley"
    ref_name: str = ""
    magnitude: float = 1.0
    angle: float = 90.0
    label: str = ""
    color: str = "red"

class ManualMountConfig(BaseModel):
    id: str
    x1: float = 0.0
    y1: float = 0.0
    x2: float = 0.0
    y2: float = 0.0
    type: str = "Einseitig"

class FlaschenzugGlobalConfig(BaseModel):
    style_scale: float = 1.0
    tikz_opts: str = ""
    preview_grid: bool = False
    coordinate_helpers_preview_only: bool = False
    show_labels: bool = True
    rope_style: str = "plain"
    rope_color: str = "black"

class FlaschenzugEnvironmentConfig(BaseModel):
    show_boden: bool = False
    boden_y: float = -1.0
    boden_width: float = 6.0
    show_decke: bool = False
    decke_y: float = 3.0
    decke_width: float = 6.0

class FlaschenzugConfig(BaseModel):
    pulleys: List[PulleyConfig] = []
    anchors: List[AnchorConfig] = []
    ropes: List[RopeConfig] = []
    masses: List[MassConfig] = []
    forces: List[ForceConfig] = []
    manual_mounts: List[ManualMountConfig] = []
    global_opts: FlaschenzugGlobalConfig = FlaschenzugGlobalConfig()
    environment: FlaschenzugEnvironmentConfig = FlaschenzugEnvironmentConfig()
