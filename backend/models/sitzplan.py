# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel
from typing import List, Tuple, Dict, Optional

class StudentConfig(BaseModel):
    name: str
    wants_neighbors: List[str] = []
    dislikes_neighbors: List[str] = []
    wants_front: bool = False

class LayoutConfig(BaseModel):
    rows: int
    cols: int
    matrix: Optional[List[List[int]]] = None
    blocked_seats: List[Tuple[int, int]] = []
    front_rows: int = 1

class HardRuleConfig(BaseModel):
    not_same_row: List[Tuple[str, str]] = []
    not_same_col: List[Tuple[str, str]] = []
    min_distance: List[Dict] = []  # List of {"names": [str, str], "k": int}
    no_alone: bool = False
    no_alone_vertical: bool = False
    no_alone_diagonal: bool = False

class SitzplanRequest(BaseModel):
    students: List[StudentConfig]
    layout: LayoutConfig
    w_front: int = 2
    w_neighbor: int = 4
    include_vertical: bool = True
    include_diagonal: bool = True
    mutual_factor: int = 2
    dislike_distance: int = 1  # min Manhattan distance between disliked students (1 = not adjacent)
    hard_rules: HardRuleConfig

class SitzplanResponse(BaseModel):
    assignment: Dict[str, int]  # name -> seat_id
    report: List[Dict]
    per_student_report: Dict[str, Dict]
    solver_used: str = "greedy"
