# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Union
from enum import Enum

class GrowDirection(str, Enum):
    right = "right"
    down = "down"
    up = "up"
    left = "left"

class NodeShape(str, Enum):
    circle = "circle"
    rectangle = "rectangle"
    coordinate = "coordinate"

class EdgePositioning(str, Enum):
    auto = "Neben Pfad (Auto)"
    outside = "Außen (Smart)"
    inside = "Innen (Smart)"
    on_path = "Auf Pfad (Deckend)"

class TreeMode(str, Enum):
    symmetric = "Symmetrisch (Standard)"
    flexible = "Flexibel (Individuell)"

class BaumNodeConfig(BaseModel):
    label: str = ""
    labelHidden: bool = False
    edge_label: str = ""
    edgeLabelHidden: bool = False
    prob_value: Optional[float] = None
    node_style: Optional[str] = None
    edge_style: Optional[str] = None
    num_children: int = 2

class LevelLabelConfig(BaseModel):
    enabled: bool = False
    offset: float = -4.0
    style: str = "font=\\bfseries\\small, darkgray"
    texts: Dict[int, str] = {}

class HighlightConfig(BaseModel):
    enabled: bool = False
    style: Optional[str] = None

class TreeStyleConfig(BaseModel):
    level_distance: float = 1.5
    sibling_distance_base: float = 2.5
    manual_sibling_dist_active: bool = False
    manual_sibling_distances: Dict[int, float] = {}
    grow_direction: GrowDirection = GrowDirection.down
    node_shape: NodeShape = NodeShape.circle
    global_node_style: str = "inner sep=2pt, font=\\small"
    global_edge_style: str = "midway, font=\\scriptsize, inner sep=1pt"
    edge_positioning: EdgePositioning = EdgePositioning.outside
    hide_edge_labels: bool = False
    highlight_style_default: str = "draw=red!70!black, line width=2pt, opacity=0.6, line cap=round"

class BaumdiagrammConfig(BaseModel):
    mode: TreeMode = TreeMode.symmetric
    max_depth: int = 2
    branches_global: int = 2
    use_numeric_probs: bool = False
    
    root_node: BaumNodeConfig = BaumNodeConfig(label="Start", num_children=2)
    nodes: Dict[str, BaumNodeConfig] = {}
    
    level_labels: LevelLabelConfig = LevelLabelConfig()
    
    results: Dict[str, str] = {}
    highlights: Dict[str, HighlightConfig] = {}
    
    # Path probability display settings
    show_path_prob_display: bool = False
    show_path_prob_in_result: bool = False
    style_results: str = "draw=none, shape=rectangle, font=\\tiny, gray"
    style_result_dist: float = 0.5
    width_cm: float = 12.0

    style: TreeStyleConfig = TreeStyleConfig()
    
    # LaTeX Extras
    pakete_laden: bool = True
    command_laden: bool = True
    font_family: str = "Fira"
    preamble_add: str = ""
