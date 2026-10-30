# SPDX-License-Identifier: AGPL-3.0-or-later

import math
import random
from typing import List, Tuple
from pathlib import Path
from models.glucksrad import GlucksradConfig, GlucksradMode, LabelMode, ArrowStyle, CenterStyle, PointerPos
import config
from core.latex_document import LatexDocumentSpec, font_input, render_latex_document

def _hex_to_rgb01(hex_color: str) -> Tuple[float, float, float]:
    """Konvertiert #RRGGBB → (r, g, b) im Bereich [0, 1]."""
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    try:
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    except (ValueError, IndexError):
        return 1.0, 1.0, 1.0
    return r / 255, g / 255, b / 255

def _luminance(hex_color: str) -> float:
    """Relative Luminanz (0=dunkel, 1=hell) nach WCAG-Formel."""
    r, g, b = _hex_to_rgb01(hex_color)
    return 0.299 * r + 0.587 * g + 0.114 * b

def _label_text_color(hex_color: str) -> str:
    """Gibt 'white' oder 'black' zurück, je nach Hintergrundluminanz."""
    return "black" if _luminance(hex_color) > 0.5 else "white"

def _color_def(name: str, hex_color: str) -> str:
    r, g, b = _hex_to_rgb01(hex_color)
    return rf"\definecolor{{{name}}}{{rgb}}{{{r:.4f},{g:.4f},{b:.4f}}}"

def _build_sektor_farben(cfg: GlucksradConfig) -> List[dict]:
    """
    Standard-Modus: Erstellt eine Liste von Sektoren mit Farbe und Label.
    Fehlende Sektoren (wenn Summe < anzahl) werden weiß aufgefüllt.
    Überschüssige Zuteilungen werden auf anzahl begrenzt.
    Reihenfolge wird zufällig gemischt.
    """
    sektoren = []
    for i, fc in enumerate(cfg.sectors):
        h = min(int(fc.haeufigkeit), cfg.anzahl - len(sektoren))
        if h <= 0:
            continue
        for _ in range(h):
            sektoren.append({"farbe": fc.farbe, "label": fc.label, "farb_idx": i})
            if len(sektoren) >= cfg.anzahl:
                break
        if len(sektoren) >= cfg.anzahl:
            break

    # Weiße Sektoren auffüllen falls nötig
    while len(sektoren) < cfg.anzahl:
        sektoren.append({"farbe": "#FFFFFF", "label": "", "farb_idx": -1})

    # Zufällig mischen mit Seed
    rng = random.Random(cfg.seed)
    rng.shuffle(sektoren)
    return sektoren

def _build_sektor_farben_variable(cfg: GlucksradConfig) -> List[dict]:
    """
    Variabler Modus: Ein Sektor pro Farbe, proportional zur Gewichtung.
    Gibt eine Liste von Sektoren mit zusätzlichem Feld 'angle' zurück.
    """
    total_weight = sum(max(0.0, fc.haeufigkeit) for fc in cfg.sectors)
    if total_weight <= 0:
        return []
    sektoren = []
    for i, fc in enumerate(cfg.sectors):
        w = max(0.0, fc.haeufigkeit)
        if w <= 0:
            continue
        sektoren.append({
            "farbe": fc.farbe,
            "label": fc.label,
            "farb_idx": i,
            "angle": (w / total_weight) * 360.0,
        })
    return sektoren

def generate_glucksrad_latex(cfg: GlucksradConfig) -> str:
    """Erzeugt den vollständigen LaTeX-Code für das Glücksrad."""
    
    if cfg.mode == GlucksradMode.VARIABLE:
        sektoren = _build_sektor_farben_variable(cfg)
        angles = [s["angle"] for s in sektoren]
    else:
        sektoren = _build_sektor_farben(cfg)
        winkel_schritt = 360.0 / max(1, len(sektoren))
        angles = [winkel_schritt] * len(sektoren)

    color_defs = []
    # Farb-Definitionen
    for i, s in enumerate(sektoren):
        cname = f"SektCol{i}"
        color_defs.append(_color_def(cname, s["farbe"]))

    lines = [r"\begin{tikzpicture}"]

    # --- Äußerer Rand (Schattenring mit Gradient) ---
    rim_r = cfg.radius + 0.2
    if cfg.show_rim:
        lines.append(rf"  \pgfdeclarehorizontalshading{{glucksradRim}}{{100bp}}"
                     rf"{{color(0bp)=(black!90);color(60bp)=(black!10);color(100bp)=(black!85)}}")
        lines.append(rf"  \draw[black, thick, fill=gray] (0,0) circle ({rim_r:.2f}cm);")
        lines.append(rf"  \fill[shading=glucksradRim, shading angle=-50] (0,0) circle ({rim_r:.2f}cm);")
    else:
        lines.append(rf"  \draw[black, thick, fill=gray!60] (0,0) circle ({rim_r:.2f}cm);")

    # --- Weißer Untergrund ---
    lines.append(rf"  \draw[black, thick, fill=white] (0,0) circle ({cfg.radius:.2f}cm);")

    # --- Sektoren (gefärbt) ---
    a_start = 90.0
    for i, s in enumerate(sektoren):
        a_end = a_start + angles[i]
        cname = f"SektCol{i}"
        sx = cfg.radius * math.cos(math.radians(a_start))
        sy = cfg.radius * math.sin(math.radians(a_start))
        lines.append(
            rf"  \fill[{cname}] (0,0) -- ({sx:.6f},{sy:.6f}) "
            rf"arc ({a_start:.4f}:{a_end:.4f}:{cfg.radius:.2f}cm) -- cycle;"
        )
        a_start = a_end

    # --- Trennlinien ---
    lines.append(rf"  \draw[black, thick] (0,0) circle ({cfg.radius:.2f}cm);")
    a_start = 90.0
    for i in range(len(sektoren)):
        a = a_start
        ex = cfg.radius * math.cos(math.radians(a))
        ey = cfg.radius * math.sin(math.radians(a))
        lines.append(rf"  \draw[black, thick] (0,0) -- ({ex:.6f},{ey:.6f});")
        a_start += angles[i]

    # --- Pins an Sektorgrenzen ---
    if cfg.show_pins:
        pin_r = cfg.radius + 0.07
        a_start = 90.0
        for i in range(len(sektoren)):
            px = pin_r * math.cos(math.radians(a_start))
            py = pin_r * math.sin(math.radians(a_start))
            lines.append(rf"  \fill[white, draw=black, line width=0.4pt] ({px:.4f},{py:.4f}) circle (2pt);")
            a_start += angles[i]

    # --- Beschriftungen in Sektormitte (mit Autokontrast & Ausrichtungsmodus) ---
    if cfg.show_labels:
        a_start = 90.0
        for i, s in enumerate(sektoren):
            if not s["label"]:
                a_start += angles[i]
                continue
            a_mid = a_start + angles[i] / 2.0
            tc = _label_text_color(s["farbe"])

            if cfg.label_mode == LabelMode.AUSSEN:
                # Text außerhalb des Rades, mit kurzer Verbindungslinie
                inner_r = cfg.radius + 0.05
                outer_r = rim_r + 0.42
                lx = outer_r * math.cos(math.radians(a_mid))
                ly = outer_r * math.sin(math.radians(a_mid))
                li_x = inner_r * math.cos(math.radians(a_mid))
                li_y = inner_r * math.sin(math.radians(a_mid))
                lo_x = (rim_r + 0.08) * math.cos(math.radians(a_mid))
                lo_y = (rim_r + 0.08) * math.sin(math.radians(a_mid))
                lines.append(rf"  \draw[black, thin] ({li_x:.4f},{li_y:.4f}) -- ({lo_x:.4f},{lo_y:.4f});")
                lines.append(
                    rf"  \node[align=center, font={cfg.label_fontsize}] "
                    rf"at ({lx:.4f},{ly:.4f}) {{{s['label']}}};"
                )
            else:
                lx = (cfg.radius * 0.62) * math.cos(math.radians(a_mid))
                ly = (cfg.radius * 0.62) * math.sin(math.radians(a_mid))

                if cfg.label_mode == LabelMode.HORIZONTAL:
                    text_rot = 0.0
                elif cfg.label_mode == LabelMode.TANGENTIAL:
                    tang = (a_mid - 90.0) % 360
                    if 90 < tang < 270:
                        text_rot = tang - 180.0
                    else:
                        text_rot = tang
                else:  # Radial (Standard)
                    rot = a_mid % 360
                    if 90 < rot < 270:
                        text_rot = rot - 180.0
                    else:
                        text_rot = rot

                lines.append(
                    rf"  \node[align=center, rotate={text_rot:.1f}, font={cfg.label_fontsize}, text={tc}] "
                    rf"at ({lx:.4f},{ly:.4f}) {{{s['label']}}};"
                )
            a_start += angles[i]

    # --- Mittelpunkt / Hub ---
    if cfg.center_style == CenterStyle.PUNKT:
        lines.append(r"  \fill[black] (0,0) circle (3pt);")
    elif cfg.center_style == CenterStyle.SCHRAUBE:
        lines.append(rf"  \fill[gray!60, draw=black, line width=0.6pt] (0,0) circle ({cfg.radius * 0.06:.3f}cm);")
        lines.append(rf"  \draw[black, line width=0.5pt] ({-cfg.radius*0.04:.3f},0) -- ({cfg.radius*0.04:.3f},0);")
        lines.append(rf"  \draw[black, line width=0.5pt] (0,{-cfg.radius*0.04:.3f}) -- (0,{cfg.radius*0.04:.3f});")
    elif cfg.center_style == CenterStyle.LAGER:
        lines.append(rf"  \fill[gray!30, draw=black, line width=0.6pt] (0,0) circle ({cfg.radius * 0.09:.3f}cm);")
        lines.append(rf"  \fill[gray!80, draw=black, line width=0.5pt] (0,0) circle ({cfg.radius * 0.055:.3f}cm);")
        lines.append(rf"  \fill[white, draw=black, line width=0.4pt] (0,0) circle ({cfg.radius * 0.025:.3f}cm);")

    # --- Pfeilindikator am Rand ---
    _pointer_angle = {PointerPos.OBEN: 90.0, PointerPos.RECHTS: 0.0, PointerPos.UNTEN: 270.0, PointerPos.LINKS: 180.0}.get(cfg.pointer_pos, 90.0)
    ptr_ax = math.radians(_pointer_angle)
    ptr_tip_r = rim_r + 0.05
    ptr_base_r = rim_r - 0.18
    ptr_w = 0.12
    tip_x = ptr_tip_r * math.cos(ptr_ax)
    tip_y = ptr_tip_r * math.sin(ptr_ax)
    base_x = ptr_base_r * math.cos(ptr_ax)
    base_y = ptr_base_r * math.sin(ptr_ax)
    perp_ax = ptr_ax + math.pi / 2
    bl_x = base_x + ptr_w * math.cos(perp_ax)
    bl_y = base_y + ptr_w * math.sin(perp_ax)
    br_x = base_x - ptr_w * math.cos(perp_ax)
    br_y = base_y - ptr_w * math.sin(perp_ax)

    # --- Glücksrad-Pfeil (Spinner) ---
    if cfg.arrow_style != ArrowStyle.NONE:
        rng_arrow = random.Random(cfg.seed)
        winkel = rng_arrow.uniform(0, 360)
        if cfg.arrow_style == ArrowStyle.IMAGE:
            # Placeholder for image path if not found, usually configured in config.py
            pfeil_path = getattr(config, "GLUCKSRAD_PFEIL_PATH", "GlücksradPfeil.png")
            if isinstance(pfeil_path, Path):
                pfeil_path_latex = pfeil_path.name if pfeil_path.resolve().parent == config.LATEX_FILES_DIR.resolve() else pfeil_path.as_posix()
            else:
                pfeil_path_latex = str(pfeil_path)
            img_width = cfg.radius * 1.33
            lines.append(
                rf"  \node[align=center, rotate={winkel:.4f}] at (0,0) "
                rf" {{ \includegraphics[width={img_width:.2f}cm]{{{pfeil_path_latex}}} }};"
            )
        elif cfg.arrow_style == ArrowStyle.TIKZ:
            ap = cfg.arrow_params
            _pr, _pg, _pb = _hex_to_rgb01(ap.color)
            color_defs.append(rf"\definecolor{{pfeilfarbe}}{{rgb}}{{{_pr:.4f},{_pg:.4f},{_pb:.4f}}}")
            if ap.handdrawn:
                lines.append(
                    rf"  \tikzset{{handdrawn/.style={{decorate,"
                    rf"decoration={{random steps,segment length={ap.segment_length:.1f}mm,amplitude={ap.amplitude:.2f}pt}}}}}}"
                )

            L, sw, cr = ap.length, ap.shaftwidth, ap.circleradius
            wat, hat = ap.widthtip, ap.heighttip
            tww, th, td = ap.tailwingwidth, ap.tailheight, ap.taildrop

            pts = [
                ( sw/2,          0), ( sw/2,          L - hat), ( wat,           L - hat),
                ( 0,             L), (-wat,           L - hat), (-sw/2,          L - hat),
                (-sw/2,         -L + th + td), (-sw/2 - tww,   -L + th), (-sw/2 - tww,   -L),
                ( 0,            -L + td), ( sw/2 + tww,   -L), ( sw/2 + tww,   -L + th),
                ( sw/2,         -L + th + td),
            ]
            pts_str = " -- ".join(f"({x:.4f},{y:.4f})" for x, y in pts)
            hd = "handdrawn, " if ap.handdrawn else ""

            lines.append(rf"  \begin{{scope}}[rotate={winkel:.4f}]")
            lines.append(rf"    \begin{{scope}}[rotate=-90]")
            lines.append(rf"    \draw[black, thin, fill=pfeilfarbe, line join=round, {hd}] {pts_str} -- cycle;")
            lines.append(rf"    \draw[black, thin, fill=pfeilfarbe] (0,0) circle ({cr:.4f}cm);")
            lines.append(r"    \end{scope}")
            lines.append(r"  \end{scope}")

    lines.append(r"\end{tikzpicture}")
    tikz_body = "\n".join(lines)

    return render_latex_document(
        LatexDocumentSpec(
            body=tikz_body,
            class_options=("tikz", "border=8pt"),
            preamble_parts=(
                r"\usepackage{tikz}",
                r"\usepackage{pgf}",
                r"\usepackage{graphicx}",
                r"\usetikzlibrary{shadings,decorations.pathmorphing}",
                font_input(getattr(cfg, "font_family", "Fira")),
                *color_defs,
            ),
        )
    )
