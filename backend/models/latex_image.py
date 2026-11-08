# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from models.base import BaseGeneratorConfig

class LatexImageConfig(BaseGeneratorConfig):
    code: str = Field(default=r"\textbf{This is a LaTeX-Image-Generator};", description="The LaTeX/TikZ snippet to render")
    spacing: str = Field(default="onehalfspacing", description="Spacing option (e.g. onehalfspacing)")
    latex_width: float = Field(default=14.0, ge=1.0, le=30.0, description="Width of the LaTeX document in cm")

