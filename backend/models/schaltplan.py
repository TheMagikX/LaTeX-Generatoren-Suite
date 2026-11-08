# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, model_validator
from typing import Any, List, Optional
from models.base import BaseGeneratorConfig

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

class SchaltplanConfig(BaseGeneratorConfig):
    nodes: List[CircuitNode] = []
    components: List[CircuitComponent] = []
    style_standard: str = "europe (DIN)"
    style_scale: float = 1.0
    show_grid: bool = False
    show_nodes: bool = False
    show_node_labels: bool = False
    style_tikz_opts: str = ""
    preamble_add: str = ""

    @model_validator(mode="before")
    @classmethod
    def _map_legacy_package_flags(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            if "load_packages" in data and "pakete_laden" not in data:
                data["pakete_laden"] = data.pop("load_packages")
            if "load_commands" in data and "command_laden" not in data:
                data["command_laden"] = data.pop("load_commands")
        return data

    @property
    def load_packages(self) -> bool:
        return self.pakete_laden

    @property
    def load_commands(self) -> bool:
        return self.command_laden

