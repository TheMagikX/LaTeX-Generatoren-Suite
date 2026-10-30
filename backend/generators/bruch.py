# SPDX-License-Identifier: AGPL-3.0-or-later

import math
import random
from typing import Tuple, Set, Optional, Dict
from models.bruch import BruchConfig
from core.latex_document import LatexDocumentSpec, font_input, render_latex_document

def _hex_to_rgb01(hex_color: str) -> Tuple[float, float, float]:
    """Converts #RRGGBB to (r, g, b) in range [0, 1]."""
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return r / 255, g / 255, b / 255

def _color_def(name: str, hex_color: str) -> str:
    r, g, b = _hex_to_rgb01(hex_color)
    return rf"\definecolor{{{name}}}{{rgb}}{{{r:.4f},{g:.4f},{b:.4f}}}"

def _random_filled_indices(n_total: int, n_filled: int, seed: int) -> Set[int]:
    """Returns a reproducible random subset of indices."""
    rng = random.Random(seed)
    return set(rng.sample(range(n_total), min(n_filled, n_total)))

def _get_rect_dim(nenner: int, rows: int) -> Tuple[int, int]:
    """Helper: Returns (rows, cols)."""
    if rows <= 0:
        best_r = 1
        for r in range(1, math.isqrt(nenner) + 1):
            if nenner % r == 0:
                best_r = r
        return best_r, nenner // best_r
    else:
        return rows, math.ceil(nenner / rows)

def _gcd(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return a

def build_rechteck(
    zaehler: int,
    nenner: int,
    fill_color: str,
    border_color: str,
    seed: int,
    rows: int = 0,
    show_label: bool = True,
    label_override: Optional[str] = None,
    target_w: Optional[float] = None,
    target_h: Optional[float] = None,
    split_factor: int = 1,
    split_mode: str = "Horizontal",
    split_highlight: bool = True,
    border_width: float = 0.6,
    fill_pattern: str = "solid",
) -> str:
    actual_rows, cols = _get_rect_dim(nenner, rows)
    
    if target_w is not None and target_h is not None:
        cell_w = target_w / cols
        cell_h = target_h / actual_rows
    else:
        cell_w = 1.0
        cell_h = 1.0

    filled = _random_filled_indices(nenner, zaehler, seed)

    lines = []
    lines.append(_color_def("FillCol", fill_color))
    lines.append(_color_def("BorderCol", border_color))
    lines.append(r"\begin{tikzpicture}")

    # 1. Draw all fills
    idx = 0
    for row in range(actual_rows):
        for col in range(cols):
            if idx >= nenner:
                break
            x0 = col * cell_w
            y0 = (actual_rows - 1 - row) * cell_h
            x1, y1 = x0 + cell_w, y0 + cell_h
            coords = rf"({x0:.4f},{y0:.4f}) rectangle ({x1:.4f},{y1:.4f})"
            if idx in filled and fill_pattern != "solid":
                lines.append(rf"  \fill[pattern={fill_pattern}, pattern color=FillCol] {coords};")
            else:
                fill = "FillCol" if idx in filled else "white"
                lines.append(rf"  \fill[{fill}] {coords};")
            idx += 1

    # 2. Draw all border lines
    idx = 0
    for row in range(actual_rows):
        for col in range(cols):
            if idx >= nenner:
                break
            x0 = col * cell_w
            y0 = (actual_rows - 1 - row) * cell_h
            x1, y1 = x0 + cell_w, y0 + cell_h
            lines.append(
                rf"  \draw[BorderCol, line width={border_width:.2f}pt] ({x0:.4f},{y0:.4f}) rectangle ({x1:.4f},{y1:.4f});"
            )
            idx += 1

    if split_factor > 1:
        line_style = f"draw=red, line width=1.0pt" if split_highlight else f"draw=BorderCol, line width={border_width:.2f}pt"
        idx2 = 0
        for row in range(actual_rows):
            for col in range(cols):
                if idx2 >= nenner:
                    break
                x0 = col * cell_w
                y0 = (actual_rows - 1 - row) * cell_h
                x1, y1 = x0 + cell_w, y0 + cell_h
                
                if split_mode == "Horizontal":
                    for i in range(1, split_factor):
                        y_line = y0 + i * (cell_h / float(split_factor))
                        lines.append(rf"  \draw[{line_style}] ({x0:.4f},{y_line:.4f}) -- ({x1:.4f},{y_line:.4f});")
                else: 
                    for i in range(1, split_factor):
                        x_line = x0 + i * (cell_w / float(split_factor))
                        lines.append(rf"  \draw[{line_style}] ({x_line:.4f},{y0:.4f}) -- ({x_line:.4f},{y1:.4f});")
                
                idx2 += 1

    if show_label:
        total_w = cols * cell_w
        label_text = label_override if label_override else rf"\dfrac{{{zaehler}}}{{{nenner}}}"
        lines.append(
            rf"  \node[below=4pt, font=\large] at ({total_w/2:.4f},0) {{${label_text}$}};"
        )

    lines.append(r"\end{tikzpicture}")
    return "\n".join(lines)

def build_kreis(
    zaehler: int,
    nenner: int,
    fill_color: str,
    border_color: str,
    seed: int,
    show_label: bool = True,
    label_override: Optional[str] = None,
    split_factor: int = 1,
    split_highlight: bool = True,
    border_width: float = 0.6,
    fill_pattern: str = "solid",
) -> str:
    filled = _random_filled_indices(nenner, zaehler, seed)
    radius = 2.0

    lines = []
    lines.append(_color_def("FillCol", fill_color))
    lines.append(_color_def("BorderCol", border_color))
    lines.append(r"\begin{tikzpicture}")

    if nenner == 1:
        if 0 in filled and fill_pattern != "solid":
            lines.append(rf"  \fill[pattern={fill_pattern}, pattern color=FillCol] (0,0) circle ({radius}cm);")
        else:
            fill = "FillCol" if 0 in filled else "white"
            lines.append(rf"  \fill[{fill}] (0,0) circle ({radius}cm);")
        lines.append(rf"  \draw[BorderCol, line width={border_width:.2f}pt] (0,0) circle ({radius}cm);")
        if split_factor > 1:
            line_style = f"draw=red, line width=1.0pt" if split_highlight else f"draw=BorderCol, line width={border_width:.2f}pt"
            angle_step = 360.0 / split_factor
            for i in range(split_factor):
                a_sub = 90.0 - i * angle_step
                sx_sub = radius * math.cos(math.radians(a_sub))
                sy_sub = radius * math.sin(math.radians(a_sub))
                lines.append(rf"  \draw[{line_style}] (0,0) -- ({sx_sub:.6f},{sy_sub:.6f});")
    else:
        angle_step = 360.0 / nenner
        for i in range(nenner):
            a_start = 90.0 - i * angle_step
            a_end = a_start - angle_step
            sx = radius * math.cos(math.radians(a_start))
            sy = radius * math.sin(math.radians(a_start))
            arc_path = rf"(0,0) -- ({sx:.6f},{sy:.6f}) arc ({a_start:.4f}:{a_end:.4f}:{radius}cm) -- cycle"
            if i in filled and fill_pattern != "solid":
                lines.append(rf"  \fill[pattern={fill_pattern}, pattern color=FillCol] {arc_path};")
            else:
                fill = "FillCol" if i in filled else "white"
                lines.append(rf"  \fill[{fill}] {arc_path};")
            
        for i in range(nenner):
            a_start = 90.0 - i * angle_step
            sx = radius * math.cos(math.radians(a_start))
            sy = radius * math.sin(math.radians(a_start))
            lines.append(
                rf"  \draw[BorderCol, line width={border_width:.2f}pt] (0,0) -- ({sx:.6f},{sy:.6f});"
            )

            if split_factor > 1:
                line_style = f"draw=red, line width=1.0pt" if split_highlight else f"draw=BorderCol, line width={border_width:.2f}pt"
                sub_step = angle_step / float(split_factor)
                for j in range(1, split_factor):
                    a_sub = a_start - j * sub_step
                    sx_sub = radius * math.cos(math.radians(a_sub))
                    sy_sub = radius * math.sin(math.radians(a_sub))
                    lines.append(rf"  \draw[{line_style}] (0,0) -- ({sx_sub:.6f},{sy_sub:.6f});")

        lines.append(rf"  \draw[BorderCol, line width={border_width:.2f}pt] (0,0) circle ({radius}cm);")

    if show_label:
        label_text = label_override if label_override else rf"\dfrac{{{zaehler}}}{{{nenner}}}"
        lines.append(
            rf"  \node[below=6pt, font=\large] at (0,-{radius:.2f}) {{${label_text}$}};"
        )

    lines.append(r"\end{tikzpicture}")
    return "\n".join(lines)

def build_mixed_rechteck(
    zaehler: int,
    nenner: int,
    fill_color: str,
    border_color: str,
    seed: int,
    rows: int = 0,
    show_label: bool = True,
    label_override: Optional[str] = None,
    border_width: float = 0.6,
    fill_pattern: str = "solid",
) -> str:
    """Draws `whole` fully-filled rectangles plus one partial remainder rectangle."""
    whole = zaehler // nenner
    remainder = zaehler % nenner
    num_shapes = whole + (1 if remainder > 0 else 0)

    actual_rows, cols = _get_rect_dim(nenner, rows)
    shape_w = cols * 1.0
    gap = 0.3

    lines = []
    lines.append(_color_def("FillCol", fill_color))
    lines.append(_color_def("BorderCol", border_color))
    lines.append(r"\begin{tikzpicture}")

    for i in range(whole):
        x_off = i * (shape_w + gap)
        inner = _tikz_inner(build_rechteck(nenner, nenner, fill_color, border_color, seed + i, rows, False, border_width=border_width, fill_pattern=fill_pattern))
        lines.append(rf"  \begin{{scope}}[shift={{({x_off:.4f},0)}}]")
        lines.append(inner)
        lines.append(r"  \end{scope}")

    if remainder > 0:
        x_off = whole * (shape_w + gap)
        inner = _tikz_inner(build_rechteck(remainder, nenner, fill_color, border_color, seed, rows, False, border_width=border_width, fill_pattern=fill_pattern))
        lines.append(rf"  \begin{{scope}}[shift={{({x_off:.4f},0)}}]")
        lines.append(inner)
        lines.append(r"  \end{scope}")

    if show_label:
        total_w = num_shapes * shape_w + (num_shapes - 1) * gap
        if label_override:
            label_text = label_override
        elif remainder == 0:
            label_text = str(whole)
        else:
            label_text = rf"{whole}\dfrac{{{remainder}}}{{{nenner}}}"
        lines.append(rf"  \node[below=4pt, font=\large] at ({total_w / 2:.4f},0) {{${label_text}$}};")

    lines.append(r"\end{tikzpicture}")
    return "\n".join(lines)


def build_mixed_kreis(
    zaehler: int,
    nenner: int,
    fill_color: str,
    border_color: str,
    seed: int,
    show_label: bool = True,
    label_override: Optional[str] = None,
    border_width: float = 0.6,
    fill_pattern: str = "solid",
) -> str:
    """Draws `whole` fully-filled circles plus one partial remainder circle."""
    whole = zaehler // nenner
    remainder = zaehler % nenner
    num_shapes = whole + (1 if remainder > 0 else 0)

    radius = 2.0
    spacing = radius * 2 + 0.5

    lines = []
    lines.append(_color_def("FillCol", fill_color))
    lines.append(_color_def("BorderCol", border_color))
    lines.append(r"\begin{tikzpicture}")

    for i in range(whole):
        cx = i * spacing
        inner = _tikz_inner(build_kreis(nenner, nenner, fill_color, border_color, seed + i, False, border_width=border_width, fill_pattern=fill_pattern))
        lines.append(rf"  \begin{{scope}}[shift={{({cx:.4f},0)}}]")
        lines.append(inner)
        lines.append(r"  \end{scope}")

    if remainder > 0:
        cx = whole * spacing
        inner = _tikz_inner(build_kreis(remainder, nenner, fill_color, border_color, seed, False, border_width=border_width, fill_pattern=fill_pattern))
        lines.append(rf"  \begin{{scope}}[shift={{({cx:.4f},0)}}]")
        lines.append(inner)
        lines.append(r"  \end{scope}")

    if show_label:
        center_x = (num_shapes - 1) * spacing / 2
        if label_override:
            label_text = label_override
        elif remainder == 0:
            label_text = str(whole)
        else:
            label_text = rf"{whole}\dfrac{{{remainder}}}{{{nenner}}}"
        lines.append(rf"  \node[below=6pt, font=\large] at ({center_x:.4f},-{radius:.2f}) {{${label_text}$}};")

    lines.append(r"\end{tikzpicture}")
    return "\n".join(lines)


def build_full_latex(tikz_body: str, font_family: str = "Fira") -> str:
    color_defs = []
    body_lines = []
    for line in tikz_body.splitlines():
        if line.strip().startswith(r"\definecolor"):
            color_defs.append(line.strip())
        else:
            body_lines.append(line)
    clean_body = "\n".join(body_lines).strip()
    return render_latex_document(
        LatexDocumentSpec(
            body=clean_body,
            class_options=("tikz", "border=8pt"),
            preamble_parts=(
                r"\usepackage{tikz}",
                r"\usetikzlibrary{positioning, patterns}",
                r"\usepackage{amsmath}",
                font_input(font_family),
                *color_defs,
            ),
        )
    )

def _tikz_inner(tikz_code: str) -> str:
    result = []
    for line in tikz_code.splitlines():
        s = line.strip()
        if s.startswith(r"\begin{tikzpicture}") or s.startswith(r"\end{tikzpicture}") or s.startswith(r"\definecolor"):
            continue
        result.append(line)
    return "\n".join(result)

def build_side_by_side_latex(
    tikz_a: str,
    tikz_b: str,
    arrow_label: str,
    fill_color: str,
    border_color: str,
    form: str,
    nenner_a: int,
    rows: int,
    font_family: str = "Fira",
) -> str:
    r_f, g_f, b_f = _hex_to_rgb01(fill_color)
    r_b, g_b, b_b = _hex_to_rgb01(border_color)
    color_defs = (
        rf"\definecolor{{FillCol}}{{rgb}}{{{r_f:.4f},{g_f:.4f},{b_f:.4f}}}" + "\n"
        + rf"\definecolor{{BorderCol}}{{rgb}}{{{r_b:.4f},{g_b:.4f},{b_b:.4f}}}" + "\n"
    )

    inner_a = _tikz_inner(tikz_a)
    inner_b = _tikz_inner(tikz_b)

    if form == "Kreis":
        right_edge_a, arrow_x, shift_bx, mid_y = 2.0, 3.5, 7.0, 0.0
    else:
        _, cols = _get_rect_dim(nenner_a, rows)
        width_a = cols * 1.0
        arrow_x, shift_bx = width_a + 1.5, width_a + 3.0
        actual_rows, _ = _get_rect_dim(nenner_a, rows)
        mid_y = (actual_rows * 1.0) / 2.0

    body = (
        r"\begin{tikzpicture}" + "\n"
        + r"  \begin{scope}" + "\n" + inner_a + "\n" + r"  \end{scope}" + "\n"
        + rf"  \node[font=\LARGE] at ({arrow_x:.2f},{mid_y:.2f}) {{$\Longrightarrow$}};" + "\n"
        + rf"  \node[font=\normalsize] at ({arrow_x:.2f},{mid_y + 0.9:.2f}) {{${arrow_label}$}};" + "\n"
        + rf"  \begin{{scope}}[shift={{({shift_bx:.2f},0)}}]" + "\n" + inner_b + "\n" + r"  \end{scope}" + "\n"
        + r"\end{tikzpicture}"
    )

    return render_latex_document(
        LatexDocumentSpec(
            body=body,
            class_options=("tikz", "border=10pt"),
            preamble_parts=(
                r"\usepackage{tikz}",
                r"\usetikzlibrary{positioning, patterns}",
                r"\usepackage{amsmath}",
                font_input(font_family),
                color_defs,
            ),
        )
    )

def generate_bruch_latex(cfg: BruchConfig) -> Dict[str, str]:
    res = {}
    font_family = getattr(cfg, "font_family", "Fira")
    
    bw = cfg.border_width
    fp = cfg.fill_pattern
    use_mixed = cfg.mixed_number and cfg.zaehler > cfg.nenner

    # 1. Main visual
    if use_mixed:
        if cfg.form == "Kreis":
            main_tikz = build_mixed_kreis(cfg.zaehler, cfg.nenner, cfg.fill_color, cfg.border_color, cfg.seed, cfg.show_label, label_override=cfg.label_override, border_width=bw, fill_pattern=fp)
        else:
            main_tikz = build_mixed_rechteck(cfg.zaehler, cfg.nenner, cfg.fill_color, cfg.border_color, cfg.seed, cfg.rect_rows, cfg.show_label, label_override=cfg.label_override, border_width=bw, fill_pattern=fp)
    elif cfg.form == "Kreis":
        main_tikz = build_kreis(cfg.zaehler, cfg.nenner, cfg.fill_color, cfg.border_color, cfg.seed, cfg.show_label, label_override=cfg.label_override, border_width=bw, fill_pattern=fp)
    else:
        main_tikz = build_rechteck(cfg.zaehler, cfg.nenner, cfg.fill_color, cfg.border_color, cfg.seed, cfg.rect_rows, cfg.show_label, label_override=cfg.label_override, border_width=bw, fill_pattern=fp)

    res["latex"] = build_full_latex(main_tikz, font_family)

    # 2. Extending (Erweitern)
    if cfg.show_erweitern:
        ez, en = cfg.zaehler * cfg.erweiter_faktor, cfg.nenner * cfg.erweiter_faktor
        orig_r, orig_c = _get_rect_dim(cfg.nenner, cfg.rect_rows)
        orig_w, orig_h = orig_c * 1.0, orig_r * 1.0

        if cfg.form == "Kreis":
            tikz_a = build_kreis(cfg.zaehler, cfg.nenner, cfg.fill_color, cfg.border_color, cfg.seed, True, rf"\dfrac{{{cfg.zaehler}}}{{{cfg.nenner}}}", border_width=bw, fill_pattern=fp)
            tikz_b = build_kreis(cfg.zaehler, cfg.nenner, cfg.fill_color, cfg.border_color, cfg.seed, True, rf"\dfrac{{{ez}}}{{{en}}}", split_factor=cfg.erweiter_faktor, split_highlight=(cfg.split_style == "Hervorgehoben"), border_width=bw, fill_pattern=fp)
        else:
            tikz_a = build_rechteck(cfg.zaehler, cfg.nenner, cfg.fill_color, cfg.border_color, cfg.seed, cfg.rect_rows, True, rf"\dfrac{{{cfg.zaehler}}}{{{cfg.nenner}}}", border_width=bw, fill_pattern=fp)
            tikz_b = build_rechteck(cfg.zaehler, cfg.nenner, cfg.fill_color, cfg.border_color, cfg.seed, cfg.rect_rows, True, rf"\dfrac{{{ez}}}{{{en}}}", target_w=orig_w, target_h=orig_h, split_factor=cfg.erweiter_faktor, split_mode=cfg.split_mode, split_highlight=(cfg.split_style == "Hervorgehoben"), border_width=bw, fill_pattern=fp)

        res["erweitern_latex"] = build_side_by_side_latex(tikz_a, tikz_b, rf"\times {cfg.erweiter_faktor}", cfg.fill_color, cfg.border_color, cfg.form, cfg.nenner, cfg.rect_rows, font_family)

    # 3. Reducing (Kürzen)
    if cfg.show_kuerzen:
        g = _gcd(abs(cfg.zaehler), cfg.nenner) if cfg.zaehler != 0 else cfg.nenner
        kz, kn = cfg.zaehler // g, cfg.nenner // g
        orig_r, orig_c = _get_rect_dim(kn, cfg.rect_rows)
        orig_w, orig_h = orig_c * 1.0, orig_r * 1.0

        if cfg.form == "Kreis":
            tikz_a = build_kreis(kz, kn, cfg.fill_color, cfg.border_color, cfg.seed, True, rf"\dfrac{{{cfg.zaehler}}}{{{cfg.nenner}}}", split_factor=g, split_highlight=False, border_width=bw, fill_pattern=fp)
            tikz_b = build_kreis(kz, kn, cfg.fill_color, cfg.border_color, cfg.seed, True, rf"\dfrac{{{kz}}}{{{kn}}}", border_width=bw, fill_pattern=fp)
        else:
            tikz_a = build_rechteck(kz, kn, cfg.fill_color, cfg.border_color, cfg.seed, cfg.rect_rows, True, rf"\dfrac{{{cfg.zaehler}}}{{{cfg.nenner}}}", target_w=orig_w, target_h=orig_h, split_factor=g, split_mode=cfg.split_mode, split_highlight=False, border_width=bw, fill_pattern=fp)
            tikz_b = build_rechteck(kz, kn, cfg.fill_color, cfg.border_color, cfg.seed, cfg.rect_rows, True, rf"\dfrac{{{kz}}}{{{kn}}}", target_w=orig_w, target_h=orig_h, border_width=bw, fill_pattern=fp)

        res["kuerzen_latex"] = build_side_by_side_latex(tikz_a, tikz_b, rf"\div {g}", cfg.fill_color, cfg.border_color, cfg.form, kn, cfg.rect_rows, font_family)

    return res
