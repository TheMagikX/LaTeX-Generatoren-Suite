# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum

class StellenwertMode(str, Enum):
    ZIFFERN = "Ziffern"
    PLAETTCHEN = "Plättchen"
    BEIDES = "Beides"
    LEER = "Leer"

class TokenStyle(str, Enum):
    FILLED = "filled"
    OUTLINE = "outline"
    CROSS = "cross"

class StellenwertColumn(BaseModel):
    id: str
    label: str
    color: str = "#000000"
    active: bool = True

class StellenwertGroup(BaseModel):
    id: str
    label: str
    start_col_id: str
    end_col_id: str
    color: str = "#f1f5f9" # Light gray default

class StellenwertRow(BaseModel):
    id: str
    label: Optional[str] = None
    values: Dict[str, Optional[int]] = {} # column_id -> value
    active: bool = True
    is_placeholder: bool = False

class StellenwertLayout(BaseModel):
    show_header: bool = True
    show_row_labels: bool = False
    show_grid: bool = True
    row_height: float = 1.2
    col_width: float = 1.5
    token_style: TokenStyle = TokenStyle.FILLED
    token_size: float = 0.18
    max_tokens_per_row: int = 5
    header_vertical: bool = False
    auto_header_height: bool = True
    header_height: float = 1.0
    color_column_rows: bool = False
    column_bg_opacity: float = 0.1
    header_bg_opacity: float = 0.85
    column_bg_opacity_ratio: float = 0.80

class StellenwertConfig(BaseModel):
    columns: List[StellenwertColumn]
    groups: List[StellenwertGroup] = []
    rows: List[StellenwertRow] = []
    mode: StellenwertMode = StellenwertMode.BEIDES
    layout: StellenwertLayout = Field(default_factory=StellenwertLayout)
    decimal_separator_pos: Optional[int] = None # Thick line after X columns
    font_size: str = "Large"
    font_family: str = "Fira"
