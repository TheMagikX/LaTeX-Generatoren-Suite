# SPDX-License-Identifier: AGPL-3.0-or-later

from models.tikz_picture import TikzPictureConfig
from core.latex_document import DEFAULT_FALLBACK_PACKAGES, render_standalone_tikz

def generate_tikz_picture_latex(cfg: TikzPictureConfig) -> str:
    return render_standalone_tikz(
        cfg.code,
        options=cfg.options,
        font_family=getattr(cfg, "font_family", "Fira"),
        include_shared_packages=cfg.pakete_laden,
        include_commands=cfg.command_laden,
        include_tikz_shared=True,
        fallback_packages=DEFAULT_FALLBACK_PACKAGES,
    )
