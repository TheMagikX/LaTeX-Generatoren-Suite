# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, Union

class ArbeitsblattConfig(BaseModel):
    template_text: str = Field(..., description="The Jinja2 LaTeX template")
    python_code: str = Field(..., description="The Python code to generate variables")
    variables: Optional[Dict[str, Any]] = Field(None, description="Pre-executed variables to use for rendering")
    random_seed: Optional[Union[int, str]] = Field(None, description="Optional seed for reproducible worksheet variables")
    
    header_title: str = "Arbeitsblatt"
    header_title_spacing: str = "-12pt"
    header_title_visible: bool = True
    
    header_class: str = "Klasse 8"
    header_dozent: str = "Lehrkraft"
    header_subject: str = "Mathematik"
    
    add_qrcode: bool = False
    
    # LaTeX Extras
    pakete_laden: bool = True
    command_laden: bool = True
    font_family: str = "Fira"
