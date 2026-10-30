# SPDX-License-Identifier: AGPL-3.0-or-later

from models.latex_image import LatexImageConfig
from core.latex_document import (
    DEFAULT_FALLBACK_PACKAGES,
    render_varwidth_document,
)

def generate_latex_image_latex(cfg: LatexImageConfig) -> str:
    return render_varwidth_document(
        cfg.code,
        width_cm=cfg.latex_width,
        spacing=cfg.spacing,
        font_family=getattr(cfg, "font_family", "Fira"),
        include_shared_packages=cfg.pakete_laden,
        include_commands=cfg.command_laden,
        fallback_packages=DEFAULT_FALLBACK_PACKAGES,
    )
