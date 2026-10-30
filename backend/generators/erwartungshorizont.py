# SPDX-License-Identifier: AGPL-3.0-or-later

import re
from models.erwartungshorizont import ErwartungshorizontConfig
from core.latex_document import (
    DEFAULT_FALLBACK_PACKAGES,
    HEXCOL_TIKZ_KEY,
    HYPERSETUP_BASIC,
    LatexDocumentSpec,
    font_input,
    render_latex_document,
    shared_commands_input,
    shared_package_input,
)

def generate_erwartungshorizont_latex(cfg: ErwartungshorizontConfig) -> str:
    """
    Generiert den vollständigen LaTeX-Code für einen Erwartungshorizont / Musterlösung.
    Wenn \\begin{subtask} im Code vorhanden ist, wird standalone mit [preview, multi=subtask] genutzt.
    - feste_breite=True (Standard): jede Teilaufgabe wird als minipage{width_cm} gerendert -> exakt gleiche Breite in Word.
    - feste_breite=False: jede Teilaufgabe wird als varwidth{width_cm} gerendert -> natürliche Mindestbreite.
    """
    has_subtasks = bool(re.search(r"\\begin\{subtask\}", cfg.code))

    border = "2pt"
    width_cm = cfg.latex_width

    if has_subtasks:
        class_options = ("preview", "multi=subtask", f"border={border}")
        if cfg.feste_breite:
            subtask_def = rf"\newenvironment{{subtask}}{{\begin{{minipage}}{{{width_cm}cm}}}}{{\end{{minipage}}}}"
        else:
            subtask_def = (
                r"\usepackage{varwidth}" + "\n"
                + rf"\newenvironment{{subtask}}{{\begin{{varwidth}}{{{width_cm}cm}}}}{{\end{{varwidth}}}}"
            )
    else:
        if cfg.feste_breite:
            class_options = (f"border={border}",)
            subtask_def = rf"\newenvironment{{subtask}}{{\begin{{minipage}}{{{width_cm}cm}}}}{{\end{{minipage}}}}"
        else:
            class_options = (f"border={border}", f"varwidth={width_cm}cm")
            subtask_def = r"\newenvironment{subtask}{}{}"

    preamble_parts = (
        shared_package_input(cfg.pakete_laden, DEFAULT_FALLBACK_PACKAGES),
        shared_commands_input(cfg.command_laden),
        font_input(getattr(cfg, "font_family", "Fira")),
        rf"\usepackage[{cfg.spacing}]{{setspace}}",
        r"\usepackage{icomma}",
        subtask_def,
        HEXCOL_TIKZ_KEY,
    )

    body = cfg.code
    if not has_subtasks and cfg.feste_breite:
        body = rf"\begin{{minipage}}{{{width_cm}cm}}" + "\n" + body + "\n" + r"\end{minipage}"

    return render_latex_document(
        LatexDocumentSpec(
            body=body,
            class_options=class_options,
            preamble_parts=preamble_parts,
            indent_body=True,
            metadata_block=HYPERSETUP_BASIC,
        )
    )
