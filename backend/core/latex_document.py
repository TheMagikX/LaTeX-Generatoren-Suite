# SPDX-License-Identifier: AGPL-3.0-or-later

from dataclasses import dataclass, field
import pathlib
import re
from typing import Iterable

import config


DEFAULT_FALLBACK_PACKAGES = r"""
\usepackage{tikz}
\usetikzlibrary{angles,quotes}
\usepackage{newunicodechar}
\newunicodechar{–}{--}   % U+2013 en dash -> --
\newunicodechar{—}{---}  % U+2014 em dash -> ---
\newunicodechar{^^a0}{~} % U+00A0 NBSP    -> geschütztes Leerzeichen
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usepackage{siunitx}
\sisetup{locale=DE,separate-uncertainty,per-mode=fraction,mode=text}
\DeclareSIUnit{\litre}{l}
"""

PGFPLOTS_FALLBACK_PACKAGES = (
    r"\usepackage{pgfplots}"
    r"\pgfplotsset{compat=1.18}"
    r"\usepgfplotslibrary{fillbetween}"
    r"\usepackage{tikz}"
    r"\usetikzlibrary{angles,quotes,intersections,decorations.softclip}"
    r"\usepackage{siunitx}"
    r"\sisetup{locale=DE}"
)

HEXCOL_TIKZ_KEY = r"""
\tikzset{
  hexcol/.code args={#1}{%
    \definecolor{tmphex}{HTML}{#1}%%
    \tikzset{color=tmphex,draw=tmphex,fill=none}%%
  }
}
"""


@dataclass
class LatexDocumentSpec:
    body: str
    document_class: str = "standalone"
    class_options: tuple[str, ...] = ("border=2pt",)
    preamble_parts: tuple[str, ...] = field(default_factory=tuple)
    indent_body: bool = False
    trailing_newline: bool = True
    metadata_block: str | None = None


def _clean_parts(parts: Iterable[str]) -> list[str]:
    r"""Clean preamble parts and deduplicate \input{...} statements across parts."""
    seen_inputs: set[str] = set()
    cleaned_parts: list[str] = []

    for part in parts:
        if not part or not part.strip():
            continue
        cleaned_lines: list[str] = []
        for line in part.splitlines():
            stripped = line.strip()
            m = re.match(r"^\\input\{([^}]+)\}$", stripped)
            if m:
                target_str = m.group(1).strip().replace("\\", "/")
                target_p = pathlib.Path(target_str)
                resolved_key = target_p.resolve().as_posix().lower() if target_p.exists() else target_str.lower()
                stem = target_p.stem.lower().replace("-default", "")
                parent_dir = target_p.resolve().parent.as_posix().lower() if target_p.parent.exists() else ""
                base_key = f"{parent_dir}/{stem}"

                if resolved_key in seen_inputs or base_key in seen_inputs:
                    continue

                seen_inputs.add(resolved_key)
                seen_inputs.add(base_key)

            cleaned_lines.append(line)

        cleaned_text = "\n".join(cleaned_lines).strip()
        if cleaned_text:
            cleaned_parts.append(cleaned_text)

    return cleaned_parts


def shared_package_input(include_shared_packages: bool, fallback_packages: str = DEFAULT_FALLBACK_PACKAGES) -> str:
    return config.get_latex_input_path("Pakete.tex") if include_shared_packages else fallback_packages


def shared_commands_input(include_commands: bool) -> str:
    if not include_commands:
        return ""
    lines = [config.get_commands_input_path()]
    extra = config.get_additional_inputs_latex(fallback_to_defaults=False)
    if extra:
        lines.append(extra)
    return "\n".join(lines)


def shared_tikz_input(include_tikz_shared: bool) -> str:
    if not include_tikz_shared:
        return ""
    # If TikZ.tex is already configured as an additional input, do not emit duplicate
    configured = {p.name.lower() for p in config.get_additional_input_paths()}
    if "tikz.tex" in configured:
        return ""
    return config.get_latex_input_path("TikZ.tex")


def font_input(font_family: str = "Fira") -> str:
    return config.get_font_input_path(font_family)


COPYRIGHT_COMMENT = f"""% ==============================================================================
% Erstellt mit der {config.EXPORT_CREATOR} ({config.SOURCE_CODE_URL})
% Software:        GNU AGPLv3 (AGPL-3.0-or-later)
% Vorlagen/Inhalt: Creative Commons BY-NC-SA 4.0
% Nutzungsrechte:  Freie Nutzung und Anpassung für Unterricht und Lehre gestattet.
% Hinweis:         Kommerzielle Weiterverbreitung mitgelieferter Presets untersagt.
% =============================================================================="""

HYPERSETUP_BASIC = f"""\\usepackage[hidelinks,unicode=true]{{hyperref}}
\\hypersetup{{
  pdftitle={{{config.APP_NAME} Dokument}},
  pdfauthor={{{config.EXPORT_CREATOR}}},
  pdfcreator={{{config.EXPORT_CREATOR} (XeLaTeX with TikZ/PGFPlots)}},
}}"""

HYPERSETUP_METADATA = f"""\\usepackage[hidelinks,unicode=true]{{hyperref}}
\\usepackage{{hyperxmp}}
\\hypersetup{{
  pdftitle={{{config.APP_NAME} Dokument}},
  pdfauthor={{{config.EXPORT_CREATOR}}},
  pdfproducer={{{config.APP_NAME} v{config.APP_VERSION} ({config.SOURCE_CODE_URL})}},
  pdfcreator={{{config.EXPORT_CREATOR} (XeLaTeX with TikZ/PGFPlots)}},
  pdfsubject={{Erstellt mit {config.EXPORT_CREATOR} (Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0) -- Freie Nutzung fuer Unterricht und Lehre.}},
  pdfkeywords={{{config.APP_NAME}, LaTeX, TikZ, AGPLv3, CC-BY-NC-SA-4.0, Unterrichtsmaterial}},
  pdfcopyright={{Erstellt mit {config.EXPORT_CREATOR}. Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0}},
  pdflicenseurl={{{config.SOURCE_CODE_URL}}}
}}"""


def latex_input(filename: str) -> str:
    return config.get_latex_input_path(filename)


def _extract_leading_color_defs(body: str) -> tuple[list[str], str]:
    lines = body.splitlines()
    color_defs: list[str] = []
    clean_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith((r"\definecolor", r"\colorlet", r"\providecolor")):
            color_defs.append(stripped)
        else:
            clean_lines.append(line)
    return color_defs, "\n".join(clean_lines).strip()


def render_latex_document(spec: LatexDocumentSpec) -> str:
    options = ",".join(option for option in spec.class_options if option)
    option_part = f"[{options}]" if options else ""
    parts = [rf"\documentclass{option_part}{{{spec.document_class}}}"]
    parts.extend(_clean_parts(spec.preamble_parts))
    body = spec.body.strip()
    extracted_colors, body = _extract_leading_color_defs(body)
    if extracted_colors:
        parts.extend(_clean_parts(extracted_colors))
    meta = HYPERSETUP_METADATA if spec.metadata_block is None else spec.metadata_block
    if meta:
        parts.append(meta)
    parts.append(r"\begin{document}")
    if spec.indent_body:
        body = "\n".join(f"    {line}" if line else "" for line in body.splitlines())
    parts.append(body)
    parts.append(r"\end{document}")
    parts.append("")
    parts.append(COPYRIGHT_COMMENT)
    rendered = "\n".join(parts)
    return rendered + ("\n" if spec.trailing_newline else "")


def render_standalone_tikz(
    body: str,
    *,
    options: str = "",
    border: str = "2pt",
    font_family: str = "Fira",
    include_shared_packages: bool = True,
    include_commands: bool = True,
    include_tikz_shared: bool = False,
    fallback_packages: str = DEFAULT_FALLBACK_PACKAGES,
    extra_preamble: Iterable[str] = (),
) -> str:
    tikz_options = f"[{options}]" if options else ""
    tikz_body = rf"\begin{{tikzpicture}}{tikz_options}" + "\n" + body.strip() + "\n" + r"\end{tikzpicture}"
    preamble_parts = (
        shared_package_input(include_shared_packages, fallback_packages),
        shared_commands_input(include_commands),
        font_input(font_family),
        shared_tikz_input(include_tikz_shared),
        HEXCOL_TIKZ_KEY,
        *tuple(extra_preamble),
    )
    return render_latex_document(
        LatexDocumentSpec(
            body=tikz_body,
            class_options=(f"border={border}",),
            preamble_parts=preamble_parts,
        )
    )


def render_varwidth_document(
    body: str,
    *,
    width_cm: float,
    spacing: str,
    border: str = "2pt",
    font_family: str = "Fira",
    include_shared_packages: bool = True,
    include_commands: bool = True,
    fallback_packages: str = DEFAULT_FALLBACK_PACKAGES,
    extra_preamble: Iterable[str] = (),
) -> str:
    preamble_parts = (
        shared_package_input(include_shared_packages, fallback_packages),
        shared_commands_input(include_commands),
        font_input(font_family),
        rf"\usepackage[{spacing}]{{setspace}}",
        r"\usepackage{icomma}",
        HEXCOL_TIKZ_KEY,
        *tuple(extra_preamble),
    )
    return render_latex_document(
        LatexDocumentSpec(
            body=body,
            class_options=(f"border={border}", f"varwidth={width_cm}cm"),
            preamble_parts=preamble_parts,
            indent_body=True,
        )
    )
