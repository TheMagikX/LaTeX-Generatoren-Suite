# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field

class LatexImageConfig(BaseModel):
    code: str = Field(default="\textbf{This is a LaTeX-Image-Generator};", description="The LaTeX/TikZ snippet to render")
    spacing: str = Field(default="onehalfspacing", description="Spacing option (e.g. onehalfspacing)")
    latex_width: float = Field(default=14.0, ge=1.0, le=30.0, description="Width of the LaTeX document in cm")
    pakete_laden: bool = Field(default=True, description="Whether to load all packages")
    command_laden: bool = Field(default=True, description="Whether to load all commands")
    font_family: str = Field(default="Fira", description="Font family to use")
