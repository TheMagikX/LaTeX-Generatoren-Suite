# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from typing import List, Optional

class CircuitNode(BaseModel):
    id: str
    name: str
    x: float
    y: float
    show_dot: Optional[bool] = None

class CircuitComponent(BaseModel):
    id: str
    type_name: str
    from_node: str
    to_node: Optional[str] = None
    label: Optional[str] = ""
    value: Optional[str] = ""
    style: Optional[str] = ""

class SchaltplanConfig(BaseModel):
    nodes: List[CircuitNode] = []
    components: List[CircuitComponent] = []
    style_standard: str = "europe (DIN)"
    style_scale: float = 1.0
    show_grid: bool = False
    show_nodes: bool = False
    show_node_labels: bool = False
    style_tikz_opts: str = ""
    load_packages: bool = True
    load_commands: bool = True
    font_family: str = "Fira"
    preamble_add: str = ""
