# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field

class TikzPictureConfig(BaseModel):
    code: str = Field(default="\\draw[black,thick] (0,0) -- (5,0);", description="The inner TikZ code")
    options: str = Field(default="line join=round", description="Options for \\begin{tikzpicture}[...]")
    pakete_laden: bool = Field(default=True, description="Whether to load all packages")
    command_laden: bool = Field(default=True, description="Whether to load all commands")
    font_family: str = Field(default="Fira", description="Font family to use")
