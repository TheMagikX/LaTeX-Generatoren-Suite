# SPDX-License-Identifier: AGPL-3.0-or-later

import math
from typing import List, Tuple, Optional, Callable
from fractions import Fraction
from models.zahlenstrahl import ZahlenstrahlConfig
from core.latex_document import LatexDocumentSpec, font_input, render_latex_document
from core.math_utils import tikz_color_def

def _fmt_num(val: float) -> str:
    """Format a number cleanly for TikZ."""
    clean = round(val, 8)
    if abs(clean) < 1e-9:
        clean = 0.0
    if clean == int(clean):
        return str(int(clean))
    return f"{clean:g}"

def _fmt_fraction(
    val: float,
    style: str = "auto",
    fixed_denom: Optional[int] = None,
    inline: bool = False
) -> str:
    """Format a number as a LaTeX fraction with didactic options."""
    if abs(val) < 1e-9:
        if style == "fixed_denominator" and fixed_denom and fixed_denom > 0:
            return rf"${0}/{fixed_denom}$" if inline else rf"$\frac{{0}}{{{fixed_denom}}}$"
        return "0"

    sign = "-" if val < -1e-9 else ""
    abs_val = abs(val)

    if style == "fixed_denominator" and fixed_denom and fixed_denom > 0:
        num = round(abs_val * fixed_denom)
        if inline:
            return rf"${sign}{num}/{fixed_denom}$"
        return rf"${sign}\frac{{{num}}}{{{fixed_denom}}}$"

    f = Fraction(abs_val).limit_denominator(120)

    if style == "mixed":
        if f.denominator == 1:
            return f"{sign}{f.numerator}"
        ganze = f.numerator // f.denominator
        rest_num = f.numerator % f.denominator
        if rest_num == 0:
            return f"{sign}{ganze}"
        if ganze == 0:
            return rf"${sign}{rest_num}/{f.denominator}$" if inline else rf"${sign}\frac{{{rest_num}}}{{{f.denominator}}}$"
        return rf"${sign}{ganze}\,{rest_num}/{f.denominator}$" if inline else rf"${sign}{ganze}\frac{{{rest_num}}}{{{f.denominator}}}$"

    # style == "auto" (standard shortened fraction)
    if f.denominator == 1:
        return f"{sign}{f.numerator}"
    if inline:
        return rf"${sign}{f.numerator}/{f.denominator}$"
    return rf"${sign}\frac{{{f.numerator}}}{{{f.denominator}}}$"

def _fmt_decimal(
    val: float,
    precision: Optional[int] = None,
    zerofill: bool = False,
    decimal_separator: str = ","
) -> str:
    """Format a decimal number with precision and zero-fill options."""
    clean_val = round(val, 8)
    if abs(clean_val) < 1e-9:
        clean_val = 0.0

    if precision is not None and precision >= 0:
        if zerofill:
            s = f"{clean_val:.{precision}f}"
        else:
            s = f"{clean_val:.{precision}f}"
            if "." in s:
                s = s.rstrip("0").rstrip(".")
            if s == "-0" or s == "":
                s = "0"
    else:
        if clean_val == int(clean_val):
            s = str(int(clean_val))
        else:
            s = f"{clean_val:g}"

    if s == "-0":
        s = "0"
    return s.replace(".", decimal_separator)

def _fmt_label(val: float, cfg: ZahlenstrahlConfig) -> str:
    """Format a tick value according to configuration (fraction or decimal)."""
    if cfg.label_as_fraction:
        return _fmt_fraction(
            val,
            style=cfg.fraction_style,
            fixed_denom=cfg.fraction_denominator,
            inline=cfg.fraction_inline
        )
    return _fmt_decimal(
        val,
        precision=cfg.decimal_precision,
        zerofill=cfg.decimal_fixed_zerofill,
        decimal_separator=cfg.decimal_separator
    )

_MAX_TICKS = 1000

def _frange(start: float, stop: float, step: float, max_ticks: int = _MAX_TICKS) -> List[float]:
    """Generate a list of floats from start to stop (inclusive)."""
    if step <= 0 or stop < start:
        return []
    expected_steps = (stop - start) / step
    if expected_steps > max_ticks:
        raise ValueError(
            f"Zu viele Teilstriche ({int(expected_steps) + 1} > {max_ticks}). "
            f"Bitte Schrittweite ({step}) vergrößern oder Bereich [{start}, {stop}] verkleinern."
        )
    vals = []
    n = 0
    while True:
        v = round(start + n * step, 10)
        if v > stop + 1e-9:
            break
        if n > max_ticks:
            raise ValueError(
                f"Maximale Anzahl an Teilstrichen ({max_ticks}) überschritten."
            )
        vals.append(v)
        n += 1
    return vals

def _generate_zoom_lens_tikz(
    cfg: ZahlenstrahlConfig,
    th_m: str,
    register_color: Callable[[str, Optional[str]], None],
) -> List[str]:
    """Erzeugt die TikZ-Zeilen für die Lupen-/Zoom-Ansicht des Zahlenstrahls."""
    zoom_lines: List[str] = []
    z_min = cfg.zoom_min
    z_max = cfg.zoom_max
    if z_min > z_max:
        z_min, z_max = z_max, z_min

    z_y = -2.5
    z_scale = cfg.zoom_scale
    z_center = (z_min + z_max) / 2.0

    # Highlight on main axis
    zoom_lines.append(rf"  \draw[zsAxis, dashed, opacity=0.3] ({_fmt_num(z_min)},0.3) -- ({_fmt_num(z_min)},-0.3);")
    zoom_lines.append(rf"  \draw[zsAxis, dashed, opacity=0.3] ({_fmt_num(z_max)},0.3) -- ({_fmt_num(z_max)},-0.3);")
    zoom_lines.append(rf"  \fill[zsAxis, opacity=0.1] ({_fmt_num(z_min)},0.3) rectangle ({_fmt_num(z_max)},-0.3);")

    # Scope for the zoomed axis
    zoom_lines.append(rf"  \begin{{scope}}[yshift={z_y}cm, xshift={_fmt_num(z_center)}cm, xscale={z_scale}]")
    zoom_lines.append(rf"    \begin{{scope}}[xshift=-{_fmt_num(z_center)}cm]")

    # 1. Zoomed Intervals
    if cfg.zoom_show_intervals:
        for i, iv in enumerate(cfg.zoom_intervals):
            if not iv.visible:
                continue
            iv_from, iv_to = iv.start, iv.end
            if iv_from > iv_to:
                iv_from, iv_to = iv_to, iv_from
            if iv_to < z_min or iv_from > z_max:
                continue

            if iv.color and iv.color.startswith("#"):
                iv_cname = f"zsZIvCol{i}"
                register_color(iv_cname, iv.color)
                fill_color = iv_cname
                bound_color = iv_cname
            else:
                fill_color = iv.color or "blue!30"
                bound_color = "zsAxis"

            zoom_lines.append(rf"    \fill[{fill_color}, opacity=0.4] ({_fmt_num(max(iv_from, z_min))},-{th_m}) rectangle ({_fmt_num(min(iv_to, z_max))},{th_m});")
            if z_min <= iv_from <= z_max:
                if iv.left_type == "geschlossen":
                    zoom_lines.append(rf"    \fill[{bound_color}] ({_fmt_num(iv_from)},0) circle (2.5pt);")
                else:
                    zoom_lines.append(rf"    \draw[{bound_color}, thick] ({_fmt_num(iv_from)},0) circle (2.5pt);")
            if z_min <= iv_to <= z_max:
                if iv.right_type == "geschlossen":
                    zoom_lines.append(rf"    \fill[{bound_color}] ({_fmt_num(iv_to)},0) circle (2.5pt);")
                else:
                    zoom_lines.append(rf"    \draw[{bound_color}, thick] ({_fmt_num(iv_to)},0) circle (2.5pt);")

    # 2. Zoomed Ticks Calculation
    if cfg.zoom_use_divisions:
        zs_main_step = (z_max - z_min) / cfg.zoom_divisions_main if cfg.zoom_divisions_main > 0 else 1.0
        zs_mid = None
        zs_sub = zs_main_step / cfg.zoom_divisions_sub if cfg.zoom_divisions_sub > 0 else 0
    else:
        zs_main_step = cfg.zoom_step_main if cfg.zoom_step_main is not None else cfg.step_main
        zs_mid = cfg.zoom_step_mid if cfg.zoom_step_mid is not None else cfg.step_mid
        zs_sub = cfg.zoom_step_sub if cfg.zoom_step_sub is not None else cfg.step_sub

    zs_main_ticks = _frange(z_min, z_max, zs_main_step)
    zs_main_set = {round(v, 8) for v in zs_main_ticks}

    zs_mid_ticks = []
    zs_mid_set = set()
    if zs_mid and zs_mid > 0:
        for t in _frange(z_min, z_max, zs_mid):
            k = round(t, 8)
            if k not in zs_main_set:
                zs_mid_ticks.append(t)
                zs_mid_set.add(k)

    zs_sub_ticks = []
    if zs_sub and zs_sub > 0:
        for t in _frange(z_min, z_max, zs_sub):
            k = round(t, 8)
            if k not in zs_main_set and k not in zs_mid_set:
                zs_sub_ticks.append(t)

    for t in zs_sub_ticks:
        zoom_lines.append(rf"    \draw[zsSubTick, {cfg.tick_sub_width}] ({_fmt_num(t)},{_fmt_num(cfg.tick_sub_h)}) -- ({_fmt_num(t)},-{_fmt_num(cfg.tick_sub_h)});")
    for t in zs_mid_ticks:
        zoom_lines.append(rf"    \draw[zsMidTick, {cfg.tick_mid_width}] ({_fmt_num(t)},{_fmt_num(cfg.tick_mid_h)}) -- ({_fmt_num(t)},-{_fmt_num(cfg.tick_mid_h)});")
    for t in zs_main_ticks:
        zoom_lines.append(rf"    \draw[zsMainTick, {cfg.tick_main_width}] ({_fmt_num(t)},{th_m}) -- ({_fmt_num(t)},-{th_m});")

    # 3. Zoomed Labels
    if cfg.zoom_show_labels:
        z_density = cfg.zoom_label_density or cfg.label_density
        if z_density == "major_and_mid":
            z_labeled = sorted([(t, cfg.tick_main_h) for t in zs_main_ticks] + [(t, cfg.tick_mid_h) for t in zs_mid_ticks], key=lambda x: x[0])
        elif z_density == "all":
            z_labeled = sorted(
                [(t, cfg.tick_main_h) for t in zs_main_ticks] +
                [(t, cfg.tick_mid_h) for t in zs_mid_ticks] +
                [(t, cfg.tick_sub_h) for t in zs_sub_ticks],
                key=lambda x: x[0]
            )
        else:
            z_labeled = [(t, cfg.tick_main_h) for t in zs_main_ticks]

        for t, th in z_labeled:
            lbl = _fmt_label(t, cfg)
            zoom_lines.append(rf"    \node[below, font=\small, zsLabel] at ({_fmt_num(t)},-{_fmt_num(th)}) {{{lbl}}};")

    # 4. Zoomed Axis
    zoom_lines.append(rf"    \draw[zsAxis, {cfg.line_width}] ({_fmt_num(z_min)},0) -- ({_fmt_num(z_max)},0);")

    # 5. Zoomed Marked Points
    if cfg.zoom_show_points:
        for i, pt in enumerate(cfg.zoom_points):
            if not pt.visible:
                continue
            if z_min <= pt.value <= z_max:
                px = pt.value
                pt_color_name = "zsPoint"
                if getattr(pt, "color", None):
                    pt_color_name = f"zsZPtCol{i}"
                    register_color(pt_color_name, pt.color)

                lbl_color_name = "zsLabel"
                if getattr(pt, "label_color", None):
                    lbl_color_name = f"zsZPtLblCol{i}"
                    register_color(lbl_color_name, pt.label_color)

                if pt.type == "offen":
                    zoom_lines.append(rf"    \draw[{pt_color_name}, thick] ({_fmt_num(px)},0) circle (2.5pt);")
                elif pt.type == "gefüllt":
                    zoom_lines.append(rf"    \fill[{pt_color_name}] ({_fmt_num(px)},0) circle (2.5pt);")
                else:  # "kreuz"
                    zoom_lines.append(
                        rf"    \draw[{pt_color_name}, thick] ({_fmt_num(px)},0) +(-2.5pt,-2.5pt) -- +(2.5pt,2.5pt) "
                        rf"({_fmt_num(px)},0) +(-2.5pt,2.5pt) -- +(2.5pt,-2.5pt);"
                    )
                if pt.label.strip():
                    zoom_lines.append(rf"    \node[above, font=\small, {lbl_color_name}] at ({_fmt_num(px)},0.15) {{{pt.label.strip()}}};")

    # 6. Zoomed Pointers
    if cfg.zoom_show_pointers:
        for i, ptr in enumerate(cfg.zoom_pointers):
            if not ptr.visible:
                continue
            if z_min <= ptr.value <= z_max:
                px = ptr.value
                ptr_cname = f"zsPtrZ{i}"
                register_color(ptr_cname, ptr.color or cfg.color_point)

                lbl_cname = ptr_cname
                if getattr(ptr, "label_color", None):
                    lbl_cname = f"zsPtrZLbl{i}"
                    register_color(lbl_cname, ptr.label_color)

                zoom_lines.append(rf"    \draw[->, {cfg.line_width}, color={ptr_cname}, >=Stealth] ({_fmt_num(px)}, 1.0) -- ({_fmt_num(px)}, 0.1);")
                if ptr.label.strip():
                    zoom_lines.append(rf"    \node[above, font=\small, color={lbl_cname}] at ({_fmt_num(px)}, 1.0) {{{ptr.label.strip()}}};")

    # 7. Zoomed Jumps
    if cfg.zoom_show_jumps:
        for i, jump in enumerate(cfg.jumps):
            if not jump.visible:
                continue
            if (z_min <= jump.start <= z_max) or (z_min <= jump.end <= z_max):
                js, je = jump.start, jump.end
                h = 0.4

                jump_cname = "zsJump"
                if getattr(jump, "color", None):
                    jump_cname = f"zsZJumpCol{i}"
                    register_color(jump_cname, jump.color)

                lbl_cname = "zsLabel"
                if getattr(jump, "label_color", None):
                    lbl_cname = f"zsZJumpLbl{i}"
                    register_color(lbl_cname, jump.label_color)

                zoom_lines.append(rf"    \draw[{jump_cname}, {jump.arrow or '->'}, thick] ({_fmt_num(js)},0) .. controls ({_fmt_num(js)},{h}) and ({_fmt_num(je)},{h}) .. ({_fmt_num(je)},0.1);")
                if jump.label.strip():
                    mid = (js + je) / 2.0
                    zoom_lines.append(rf"    \node[above, font=\small, {lbl_cname}] at ({_fmt_num(mid)},{h*0.8}) {{{jump.label.strip()}}};")

    zoom_lines.append(r"    \end{scope}")
    zoom_lines.append(r"  \end{scope}")

    # Connecting dashed lines from main to zoomed axis
    z_left_x_cm = (z_center + (z_min - z_center) * z_scale)
    z_right_x_cm = (z_center + (z_max - z_center) * z_scale)

    zoom_lines.append(rf"  \draw[zsAxis, dashed, opacity=0.3] ({_fmt_num(z_min)},0) -- ({_fmt_num(z_left_x_cm)},{z_y});")
    zoom_lines.append(rf"  \draw[zsAxis, dashed, opacity=0.3] ({_fmt_num(z_max)},0) -- ({_fmt_num(z_right_x_cm)},{z_y});")
    return zoom_lines

def generate_zahlenstrahl_latex(cfg: ZahlenstrahlConfig) -> str:
    """Generates the full TikZ code for a number line."""
    lines = []

    # Calculate x_scale (cm per unit) from width_cm
    span = abs(cfg.max_val - cfg.min_val)
    if span <= 0:
        span = 1.0
    if cfg.width_cm is not None and cfg.width_cm > 0:
        x_scale = cfg.width_cm / span
    elif cfg.x_scale is not None and cfg.x_scale > 0:
        x_scale = cfg.x_scale
    else:
        x_scale = 12.0 / span

    # Color definitions
    color_defs: list[str] = []
    defined_color_names: set[str] = set()

    def register_color(name: str, hex_val: str | None):
        if not hex_val or name in defined_color_names:
            return
        val = hex_val.strip()
        if not val:
            return
        defined_color_names.add(name)
        if val.startswith("#"):
            color_defs.append(tikz_color_def(name, val))
        else:
            color_defs.append(rf"\colorlet{{{name}}}{{{val}}}")

    base_colors = {
        "zsAxis":     cfg.color_axis,
        "zsMainTick": cfg.color_main_tick,
        "zsMidTick":  cfg.color_mid_tick or cfg.color_main_tick,
        "zsSubTick":  cfg.color_sub_tick,
        "zsLabel":    cfg.color_label,
        "zsPoint":    cfg.color_point,
        "zsJump":     cfg.color_jump,
    }
    for cname, chex in base_colors.items():
        register_color(cname, chex)

    # tikzpicture opening
    lines.append(r"\begin{tikzpicture}[x=" + _fmt_num(x_scale) + r"cm, y=1cm]")

    draw_start = cfg.min_val - cfg.padding
    draw_end = cfg.max_val + cfg.padding

    # 1) Intervals (at the bottom)
    for i, iv in enumerate(cfg.intervals):
        if not iv.visible:
            continue
        iv_from = iv.start
        iv_to = iv.end
        if iv_from == iv_to:
            continue
        if iv_from > iv_to:
            iv_from, iv_to = iv_to, iv_from

        if iv.color and iv.color.startswith("#"):
            iv_cname = f"zsIvCol{i}"
            register_color(iv_cname, iv.color)
            fill_color = iv_cname
            bound_color = iv_cname
        else:
            fill_color = iv.color or "blue!30"
            bound_color = "zsAxis"

        tick_h = cfg.tick_main_h
        lines.append(
            rf"  \fill[{fill_color}, opacity=0.4] "
            rf"({_fmt_num(iv_from)},{-tick_h}) rectangle ({_fmt_num(iv_to)},{tick_h});"
        )

        # Interval boundaries
        if iv.left_type == "geschlossen":
            lines.append(rf"  \fill[{bound_color}] ({_fmt_num(iv_from)},0) circle (2.5pt);")
        else:
            lines.append(rf"  \draw[{bound_color}, thick] ({_fmt_num(iv_from)},0) circle (2.5pt);")

        if iv.right_type == "geschlossen":
            lines.append(rf"  \fill[{bound_color}] ({_fmt_num(iv_to)},0) circle (2.5pt);")
        else:
            lines.append(rf"  \draw[{bound_color}, thick] ({_fmt_num(iv_to)},0) circle (2.5pt);")

    # 2) Calculate Multi-Level Ticks (Partitioning to prevent duplicates)
    main_ticks = _frange(cfg.min_val, cfg.max_val, cfg.step_main)
    main_set = {round(v, 8) for v in main_ticks}

    mid_ticks = []
    mid_set = set()
    if cfg.step_mid is not None and cfg.step_mid > 0:
        for t in _frange(cfg.min_val, cfg.max_val, cfg.step_mid):
            k = round(t, 8)
            if k not in main_set:
                mid_ticks.append(t)
                mid_set.add(k)

    sub_ticks = []
    if cfg.step_sub is not None and cfg.step_sub > 0:
        for t in _frange(cfg.min_val, cfg.max_val, cfg.step_sub):
            k = round(t, 8)
            if k not in main_set and k not in mid_set:
                sub_ticks.append(t)

    # 3) Draw Sub-ticks (Level 2)
    th_s = _fmt_num(cfg.tick_sub_h)
    for t in sub_ticks:
        lines.append(
            rf"  \draw[zsSubTick, {cfg.tick_sub_width}] ({_fmt_num(t)},{th_s}) -- ({_fmt_num(t)},-{th_s});"
        )

    # 4) Draw Mid-ticks (Level 1)
    th_mid = _fmt_num(cfg.tick_mid_h)
    for t in mid_ticks:
        lines.append(
            rf"  \draw[zsMidTick, {cfg.tick_mid_width}] ({_fmt_num(t)},{th_mid}) -- ({_fmt_num(t)},-{th_mid});"
        )

    # 5) Draw Main-ticks (Level 0)
    th_m = _fmt_num(cfg.tick_main_h)
    for t in main_ticks:
        ts = _fmt_num(t)
        lines.append(rf"  \draw[zsMainTick, {cfg.tick_main_width}] ({ts},{th_m}) -- ({ts},-{th_m});")

    # 6) Labels (with density control and hidden tick blanks)
    if cfg.show_labels:
        ticks_to_label: List[Tuple[float, float]] = []
        if cfg.label_density == "major_and_mid":
            all_major_mid = sorted(
                [(t, cfg.tick_main_h) for t in main_ticks] +
                [(t, cfg.tick_mid_h) for t in mid_ticks],
                key=lambda x: x[0]
            )
            ticks_to_label = all_major_mid
        elif cfg.label_density == "all":
            all_ticks = sorted(
                [(t, cfg.tick_main_h) for t in main_ticks] +
                [(t, cfg.tick_mid_h) for t in mid_ticks] +
                [(t, cfg.tick_sub_h) for t in sub_ticks],
                key=lambda x: x[0]
            )
            ticks_to_label = all_ticks
        elif cfg.label_density == "every_nth":
            all_ticks = sorted(
                [(t, cfg.tick_main_h) for t in main_ticks] +
                [(t, cfg.tick_mid_h) for t in mid_ticks] +
                [(t, cfg.tick_sub_h) for t in sub_ticks],
                key=lambda x: x[0]
            )
            step = max(1, cfg.label_every_nth)
            ticks_to_label = all_ticks[::step]
        else:  # "major_only"
            ticks_to_label = [(t, cfg.tick_main_h) for t in main_ticks]

        hidden_set = {round(v, 8) for v in cfg.hidden_ticks}
        for t, th in ticks_to_label:
            ts = _fmt_num(t)
            th_str = _fmt_num(th)
            if round(t, 8) in hidden_set:
                lbl = r"$\Box$" if cfg.hide_style == "box" else r"\underline{\quad}"
            else:
                lbl = _fmt_label(t, cfg)
            lines.append(
                rf"  \node[below, font=\small, zsLabel] at ({ts},-{th_str}) {{{lbl}}};"
            )

    # 7) Main Axis (Arrow)
    lines.append(
        rf"  \draw[zsAxis, {cfg.line_width}, {cfg.arrow_type}] "
        rf"({_fmt_num(draw_start)},0) -- ({_fmt_num(draw_end)},0);"
    )

    # 8) Marked Points
    for i, pt in enumerate(cfg.points):
        if not pt.visible:
            continue
        px = pt.value
        typ = pt.type
        label = pt.label.strip()

        pt_color_name = "zsPoint"
        if getattr(pt, "color", None):
            pt_color_name = f"zsPtCol{i}"
            register_color(pt_color_name, pt.color)

        lbl_color_name = "zsLabel"
        if getattr(pt, "label_color", None):
            lbl_color_name = f"zsPtLblCol{i}"
            register_color(lbl_color_name, pt.label_color)

        if typ == "offen":
            lines.append(rf"  \draw[{pt_color_name}, thick] ({_fmt_num(px)},0) circle (2.5pt);")
        elif typ == "gefüllt":
            lines.append(rf"  \fill[{pt_color_name}] ({_fmt_num(px)},0) circle (2.5pt);")
        else:  # "kreuz"
            lines.append(
                rf"  \draw[{pt_color_name}, thick] ({_fmt_num(px)},0) +(-2.5pt,-2.5pt) -- +(2.5pt,2.5pt) "
                rf"({_fmt_num(px)},0) +(-2.5pt,2.5pt) -- +(2.5pt,-2.5pt);"
            )
        if label:
            lines.append(
                rf"  \node[above, font=\small, {lbl_color_name}] at ({_fmt_num(px)},0.15) {{{label}}};"
            )

    # 9) Pointers (Vertical arrows pointing down)
    for i, ptr in enumerate(cfg.pointers):
        if not ptr.visible:
            continue
        px = ptr.value
        label = ptr.label.strip()
        ptr_cname = f"zsPtr{i}"
        register_color(ptr_cname, ptr.color or cfg.color_point)

        lbl_cname = ptr_cname
        if getattr(ptr, "label_color", None):
            lbl_cname = f"zsPtrLbl{i}"
            register_color(lbl_cname, ptr.label_color)

        lines.append(rf"  \draw[->, {cfg.line_width}, color={ptr_cname}, >=Stealth] ({_fmt_num(px)}, 1.0) -- ({_fmt_num(px)}, 0.1);")
        if label:
            lines.append(rf"  \node[above, font=\small, color={lbl_cname}] at ({_fmt_num(px)}, 1.0) {{{label}}};")

    # 10) Jumps (Arcs)
    if cfg.jumps:
        out_a = float(cfg.jump_out_angle) % 360.0
        if math.cos(math.radians(out_a)) > 0.0:
            out_a = (180.0 - out_a) % 360.0
        if abs(out_a - 90.0) < 1.0:
            out_a = 91.0
        elif abs(out_a - 270.0) < 1.0:
            out_a = 269.0
        in_a = 180.0 - out_a
        out_a_rad = math.radians(out_a)
        in_a_rad = math.radians(in_a)
        cos_diff = math.cos(in_a_rad) - math.cos(out_a_rad)
        if cos_diff < 1e-6:
            cos_diff = 1e-6

        for i, jump in enumerate(cfg.jumps):
            if not jump.visible:
                continue
            jstart = jump.start
            jend   = jump.end
            jlabel = jump.label.strip()
            jstyle = jump.style or "arc"
            jarrow = jump.arrow or "->"

            jump_cname = "zsJump"
            if getattr(jump, "color", None):
                jump_cname = f"zsJumpCol{i}"
                register_color(jump_cname, jump.color)

            lbl_cname = "zsLabel"
            if getattr(jump, "label_color", None):
                lbl_cname = f"zsJumpLbl{i}"
                register_color(lbl_cname, jump.label_color)

            span = jend - jstart
            if span == 0:
                continue

            mid = (jstart + jend) / 2.0

            if jstyle == "arc":
                span_cm = abs(span) * x_scale
                radius_cm = min(500.0, span_cm / cos_diff)
                radius_str = _fmt_num(round(radius_cm, 6))
                apex_y = radius_cm * (1.0 - math.sin(out_a_rad))

                if span > 0:
                    lines.append(
                        rf"  \draw[{jump_cname}, {jarrow}, thick] ({_fmt_num(jstart)},0) "
                        rf"arc ({_fmt_num(out_a)}:{_fmt_num(in_a)}:{radius_str}cm);"
                    )
                else:
                    lines.append(
                        rf"  \draw[{jump_cname}, {jarrow}, thick] ({_fmt_num(jstart)},0) "
                        rf"arc ({_fmt_num(in_a)}:{_fmt_num(out_a)}:{radius_str}cm);"
                    )
                label_y = apex_y

            elif jstyle == "square":
                h = 0.6
                lines.append(
                    rf"  \draw[{jump_cname}, {jarrow}, thick] ({_fmt_num(jstart)},0) -- ({_fmt_num(jstart)},{h}) -- ({_fmt_num(jend)},{h}) -- ({_fmt_num(jend)},0.1);"
                )
                label_y = h

            else:  # straight
                h = 0.4
                lines.append(
                    rf"  \draw[{jump_cname}, {jarrow}, thick] ({_fmt_num(jstart)},0) .. controls ({_fmt_num(jstart)},{h}) and ({_fmt_num(jend)},{h}) .. ({_fmt_num(jend)},0.1);"
                )
                label_y = h * 0.8

            if jlabel:
                lines.append(
                    rf"  \node[above, font=\small, {lbl_cname}] at ({_fmt_num(mid)},{_fmt_num(round(label_y, 4))}) "
                    rf"{{{jlabel}}};"
                )

    # 11) Zoom (Magnifying Glass)
    if cfg.zoom_active:
        lines.extend(_generate_zoom_lens_tikz(cfg, th_m, register_color))

    lines.append(r"\end{tikzpicture}")

    return render_latex_document(
        LatexDocumentSpec(
            body="\n".join(lines),
            class_options=("tikz", "border=4pt"),
            preamble_parts=(
                r"\usepackage{tikz}",
                r"\usepackage{amssymb}",
                r"\usetikzlibrary{arrows.meta}",
                font_input(getattr(cfg, "font_family", "Fira")),
                *color_defs,
            ),
        )
    )
