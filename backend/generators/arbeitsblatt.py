# SPDX-License-Identifier: AGPL-3.0-or-later

import re
from typing import Any
from jinja2.sandbox import ImmutableSandboxedEnvironment
from jinja2.exceptions import SecurityError
from models.arbeitsblatt import ArbeitsblattConfig
from core.latex_document import COPYRIGHT_COMMENT, HYPERSETUP_BASIC
import config

_SANDBOXED_JINJA_ENV = ImmutableSandboxedEnvironment(
    trim_blocks=True,
    lstrip_blocks=True,
)


def _is_safe_json_value(val: Any, depth: int = 0) -> bool:
    """Recursively verifies that a value contains only basic JSON-serializable types."""
    if depth > 10:
        return False
    if isinstance(val, (str, int, float, bool, type(None))):
        return True
    if isinstance(val, list):
        return all(_is_safe_json_value(item, depth + 1) for item in val)
    if isinstance(val, dict):
        return all(
            isinstance(k, str) and not k.startswith("_") and _is_safe_json_value(v, depth + 1)
            for k, v in val.items()
        )
    return False


def sanitize_worksheet_variables(python_vars: dict | None) -> dict:
    """
    Filters pre-computed worksheet variables (from client-side Pyodide execution)
    to ensure only safe JSON primitive/collection types are passed to the Jinja2 sandbox.
    """
    if not isinstance(python_vars, dict):
        return {}
    clean_vars = {}
    for k, v in python_vars.items():
        if not isinstance(k, str) or k == "__builtins__" or k.startswith("_"):
            continue
        if _is_safe_json_value(v):
            clean_vars[k] = v
    return clean_vars


def generate_arbeitsblatt_latex(cfg: ArbeitsblattConfig, show_solution: bool, python_vars: dict) -> str:
    """
    Renders the Jinja2 template inside an ImmutableSandboxedEnvironment and wraps it in a full LaTeX document.
    """
    pv = sanitize_worksheet_variables(python_vars)
    pv["show_solution"] = show_solution

    try:
        jinja_template = _SANDBOXED_JINJA_ENV.from_string(cfg.template_text)
        rendered_body = jinja_template.render(**pv)
        # Remove excessive empty lines
        rendered_body = re.sub(r'\n{3,}', '\n\n', rendered_body)
    except SecurityError as se:
        return f"%% Jinja-Security Error: {se}\n\\begin{{document}}Sicherheitsfehler im Template: {se}\\end{{document}}"
    except Exception as e:
        return f"%% Jinja-Template Error: {e}\n\\begin{{document}}Error: {e}\\end{{document}}"

    ki_disclaimer = r"\tiny \textit{Dieses Dokument wurde computergestützt erstellt. Trotz sorgfältiger Prüfung erfolgt die Bereitstellung ohne Gewähr auf Richtigkeit.}"
    generated_seed = cfg.random_seed
    header_and_footer = f"""
%%Kopf und Fußzeile
\\newcommand{{\\dozent}}{{{cfg.header_dozent}}}
\\newcommand{{\\fach}}{{{cfg.header_subject}}}
\\newcommand{{\\klasse}}{{{cfg.header_class}}}
\\newcommand{{\\datum}}{{}}
\\pagestyle{{headandfoot}}
\\firstpageheadrule
\\runningheadrule
\\firstpageheader{{\\dozent}}{{}}{{\\fach, \\klasse}}
\\runningheader{{\\dozent}}{{}}{{\\fach, \\klasse}}
\\firstpagefooter{{}}{{{ki_disclaimer}}}{{\\tiny seed: {generated_seed}}}
\\runningfooter{{}}{{{ki_disclaimer}}}{{}}
"""

    title_text = cfg.header_title
    if show_solution:
        title_text += " - Lösungen"

    if cfg.header_title_visible:
        title_cmd = f"""
    \\begin{{center}}
        \\Large \\textbf{{{title_text}}}
    \\end{{center}} \\vspace*{{{cfg.header_title_spacing}}}
    """
    else:
        title_cmd = ""

    pkts = config.get_latex_input_path("Pakete.tex") if cfg.pakete_laden else ""
    cmds_tex = config.get_latex_input_path("commands.tex") if cfg.command_laden else ""
    font_tex = config.get_font_input_path(getattr(cfg, 'font_family', "Fira"))

    # Specific paths from OLD_FILES
    exam_deutsch = config.get_latex_input_path("ExamDeutsch.tex")
    additional_inputs = config.get_additional_inputs_latex(fallback_to_defaults=True)

    latex = f"""\\documentclass[11pt, addpoints, answers]{{exam}}
{pkts}
{cmds_tex}
{exam_deutsch}

\\usepackage[onehalfspacing]{{setspace}}
\\usepackage{{lmodern}}
\\usepackage{{tabularray}}

{font_tex}
\\renewcommand{{\\questionshook}}{{%
    \\setlength{{\\leftmargin}}{{0cm}}%
    \\setlength{{\\labelwidth}}{{-\\labelsep}}%
    \\setlength{{\\itemsep}}{{-3pt}}
}}
\\renewcommand{{\\partshook}}{{%
    \\setlength{{\\leftmargin}}{{1.25cm}}
    \\setlength{{\\labelsep}}{{0.35cm}}% Abstand Label→Text
    \\setlength{{\\itemsep}}{{3pt}}% Abstand zwischen Parts
}}%
\\renewcommand{{\\subpartshook}}{{%
    \\setlength{{\\leftmargin}}{{0.6cm}}% wie parts
    \\setlength{{\\labelsep}}{{0.25cm}}% gewünschter Abstand
    \\setlength{{\\itemsep}}{{3pt}}%
}}

\\qformat{{\\textbf{{Aufgabe \\thequestion}} \\hfill}}

\\usepackage{{icomma}}
\\usepackage[a4paper,left=20mm,right=20mm,top=22mm,bottom=17mm,footskip=0.5cm,headsep=0.5cm]{{geometry}}
\\setlength{{\\parindent}}{{0pt}}

{additional_inputs}
{HYPERSETUP_BASIC}

\\providecommand{{\\abstaendeexam}}{{}}
\\providecommand{{\\aufgabenbezeichnungalseigenezeile}}{{\n    \\totalformat{{\\textbf{{(\\totalpoints \\space Punkte)}}}}\n    \\qformat{{\\textbf{{Aufgabe \\thequestion}} \\hfill}}\n}}

\\begin{{document}}
\\aufgabenbezeichnungalseigenezeile
{header_and_footer}
{title_cmd}
{rendered_body}
\\end{{document}}

{COPYRIGHT_COMMENT}
"""
    return latex
