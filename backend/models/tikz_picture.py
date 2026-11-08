# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from models.base import BaseGeneratorConfig

class TikzPictureConfig(BaseGeneratorConfig):
    code: str = Field(default="\\draw[black,thick] (0,0) -- (5,0);", description="The inner TikZ code")
    options: str = Field(default="line join=round", description="Options for \\begin{tikzpicture}[...]")

