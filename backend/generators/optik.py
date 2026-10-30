# SPDX-License-Identifier: AGPL-3.0-or-later

"""
backend/generators/optik.py
============================
Pure-Python logic for the Optik-Generator (geometrische Optik – dünne Linsen).
"""

import math
from typing import List, Dict, Any

from core.latex_document import LatexDocumentSpec, font_input, render_latex_document
from models.optik import OptikConfig, LensConfig


# ---------------------------------------------------------------------------
# Helfer
# ---------------------------------------------------------------------------

def _f4(v: float) -> str:
    """Formatiert Float mit max. 4 Nachkommastellen, ohne trailing zeros."""
    s = f"{v:.4f}".rstrip("0").rstrip(".")
    return s if s else "0"


def _fmt_val(v: float) -> str:
    """Formatiert einen Zahlenwert für Maßpfeil-Beschriftungen (max. 2 Dez.)."""
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return s if s else "0"


def _sorted_lenses(cfg: OptikConfig) -> List[LensConfig]:
    """Liefert die Linsen gefiltert (f != 0) und nach x sortiert."""
    return sorted(
        [L for L in cfg.lenses if L.f != 0],
        key=lambda d: d.x,
    )


# ---------------------------------------------------------------------------
# Optik-Berechnung (Linsengleichung)
# ---------------------------------------------------------------------------

def calculate_images(cfg: OptikConfig, x_start: float = None, y_start: float = None) -> List[Dict[str, Any]]:
    """
    Berechnet iterativ die Zwischen- und Endbilder für ein Mehrlinsen-System.
    """
    lenses = _sorted_lenses(cfg)
    images: List[Dict[str, Any]] = []

    # Bestimme Startwerte
    x_curr = x_start
    y_curr = y_start

    # Default-Fallback (für Metrics-Anzeige des ersten Objekts)
    if x_curr is None:
        if cfg.objects:
            x_curr = cfg.objects[0].x
            y_curr = cfg.objects[0].G
        else:
            x_curr, y_curr = -5.0, 2.0

    for i, L in enumerate(lenses):
        Lx = L.x
        Lf = L.f

        # Telescope-Modus nur für den allerersten Strahlverlauf (wenn von aussen getriggert ohne x_start)
        if cfg.telescope_mode and i == 0 and x_start is None:
            gk = float("inf")
            bk = Lf
            x_new = Lx + bk
            y_new = Lf * math.tan(math.radians(-cfg.alpha))
            mk = float("inf")
            virt = bk < 0
        else:
            gk = Lx - x_curr
            if abs(gk) < 1e-9:
                bk = 0.0
                x_new = Lx
                mk = 1.0
                y_new = y_curr
                virt = False
            else:
                inv_b = 1.0 / Lf - 1.0 / gk
                if abs(inv_b) < 1e-12:
                    bk = float("inf")
                    x_new = float("inf")
                    y_new = float("inf")
                    mk = float("inf")
                    virt = False
                else:
                    bk = 1.0 / inv_b
                    x_new = Lx + bk
                    mk = bk / gk
                    y_new = -mk * y_curr
                    virt = bk < 0

        images.append(
            {
                "x": x_new,
                "y": y_new,
                "b": bk,
                "g": gk,
                "m": mk,
                "virtual": virt,
            }
        )
        x_curr, y_curr = x_new, y_new

    return images


# ---------------------------------------------------------------------------
# TikZ-Code-Generierung
# ---------------------------------------------------------------------------

def generate_optik_latex(cfg: OptikConfig, images: List[Dict[str, Any]]) -> str:
    """
    Erzeugt den vollständigen LaTeX-Standalone-Code für das Optik-Diagramm.
    """
    lenses = _sorted_lenses(cfg)
    tikz = _build_tikz(cfg, lenses)
    return _wrap_document(tikz, cfg)


def _build_tikz(
    cfg: OptikConfig,
    lenses: List[LensConfig],
) -> str:
    """Erzeugt den TikZ-Code (ohne documentclass-Wrapper)."""

    # --- Achsengrenzen (Points of Interest) ---
    axis_extra = cfg.axis_extra
    poi = []

    for L in lenses:
        poi.append(L.x)
        poi.append(L.x - L.f)
        poi.append(L.x + L.f)

    if cfg.telescope_mode:
        if lenses:
            poi.append(lenses[0].x - abs(lenses[0].f) - 1.0)
            poi.append(lenses[0].x + lenses[0].f)
    else:
        for obj in cfg.objects:
            if not obj.show: continue
            poi.append(obj.x)
            obj_images = calculate_images(cfg, x_start=obj.x, y_start=obj.G)
            for img in obj_images:
                if img["x"] != float("inf"):
                    poi.append(img["x"])

    for src in cfg.light_sources:
        if not src.show: continue
        poi.append(src.x)
        src_images = calculate_images(cfg, x_start=src.x, y_start=src.y)
        for img in src_images:
            if img["x"] != float("inf"):
                poi.append(img["x"])

    if poi:
        x_left = min(poi) - axis_extra
        x_right = max(poi) + axis_extra
        if x_right - x_left < 2.0:
            x_left -= 1.0
            x_right += 1.0
    else:
        x_left, x_right = -5.0, 5.0

    lines = []
    lines.append(r"\begin{tikzpicture}[>=stealth, x=1cm, y=1cm]")

    # ── Linsenfüllung ──
    for L in lenses:
        lh = L.h / 2.0
        lens_type = "Sammellinse" if L.f > 0 else "Zerstreuungslinse"
        if cfg.realistic_lens:
            sag = lh * 0.45
            if lens_type == "Sammellinse":
                lines.append(
                    rf"  \fill[black!10, shift={{({_f4(L.x)},0)}}] (0,{_f4(-lh)}) "
                    rf".. controls ({_f4(-sag)},{_f4(-lh/2)}) and ({_f4(-sag)},{_f4(lh/2)}) .. "
                    rf"(0,{_f4(lh)}) "
                    rf".. controls ({_f4(sag)},{_f4(lh/2)}) and ({_f4(sag)},{_f4(-lh/2)}) .. "
                    rf"(0,{_f4(-lh)}) -- cycle;"
                )
            else:
                lines.append(
                    rf"  \fill[black!10, shift={{({_f4(L.x)},0)}}] ({_f4(-sag)},{_f4(lh)}) "
                    rf"-- ({_f4(sag)},{_f4(lh)}) "
                    rf".. controls (0,{_f4(lh/2)}) and (0,{_f4(-lh/2)}) .. "
                    rf"({_f4(sag)},{_f4(-lh)}) "
                    rf"-- ({_f4(-sag)},{_f4(-lh)}) "
                    rf".. controls (0,{_f4(-lh/2)}) and (0,{_f4(lh/2)}) .. cycle;"
                )

    # ── Achse & Ebenen ──
    lines.append(rf"  \draw[->] ({_f4(x_left)},0) -- ({_f4(x_right)},0);")
    for L in lenses:
        if cfg.show_lens_plane:
            lh = L.h / 2.0
            lines.append(rf"  \draw[dashed, gray!60, thin] ({_f4(L.x)},{_f4(-lh - 0.5)}) -- ({_f4(L.x)},{_f4(lh + 0.5)});")
        F_front, F_back = L.x - L.f, L.x + L.f
        idx = "" if len(lenses) == 1 else f"_{lenses.index(L)+1}"
        lines.append(rf"  \fill ({_f4(F_front)},0) circle (1.5pt) node[below=2pt, font=\scriptsize] {{$F{idx}$}};")
        lines.append(rf"  \fill ({_f4(F_back)},0) circle (1.5pt) node[below=2pt, font=\scriptsize] {{$F'{idx}$}};")

    # Ray Tracing Loop
    ray_defs = []
    
    if cfg.telescope_mode:
        m0 = math.tan(math.radians(-cfg.alpha))
        if lenses:
            L1 = lenses[0]
            lh1 = L1.h / 2.0
            ray_defs.append({"color": "orange", "m0": m0, "y0": lh1 * 0.8, "x0": x_left, "lw": 1.2})
            ray_defs.append({"color": "green!60!black", "m0": m0, "y0": 0.0, "x0": x_left, "lw": 1.2})
            ray_defs.append({"color": "violet", "m0": m0, "y0": -lh1 * 0.8, "x0": x_left, "lw": 1.2})
    else:
        for i, obj in enumerate(cfg.objects):
            if not obj.show: continue
            lines.append(rf"  \draw[->, thick, {obj.color}] ({_f4(obj.x)},0) -- ({_f4(obj.x)},{_f4(obj.G)});")
            if obj.label:
                lines.append(rf"  \node[left, {obj.color}] at ({_f4(obj.x)},{_f4(obj.G / 2)}) {{{obj.label}}};")
            
            obj_images = calculate_images(cfg, x_start=obj.x, y_start=obj.G)
            for k, img in enumerate(obj_images):
                if img["x"] == float("inf"): continue
                is_final = k == len(obj_images) - 1
                style = f"{obj.color}"
                if img["virtual"]: style = f"dashed, {style}"
                lines.append(rf"  \draw[->, thick, {style}] ({_f4(img['x'])},0) -- ({_f4(img['x'])},{_f4(img['y'])});")
            
            if lenses:
                if obj.parallel_ray.show:
                    ray_defs.append({"color": obj.parallel_ray.color, "m0": 0.0, "y0": obj.G, "x0": obj.x, "lw": obj.parallel_ray.width})
                if obj.central_ray.show:
                    denom = lenses[0].x - obj.x
                    m0 = -obj.G / denom if abs(denom) > 1e-9 else 0.0
                    ray_defs.append({"color": obj.central_ray.color, "m0": m0, "y0": obj.G, "x0": obj.x, "lw": obj.central_ray.width})
                if obj.focal_ray.show:
                    F1_front = lenses[0].x - lenses[0].f
                    denom = F1_front - obj.x
                    if abs(denom) > 1e-9:
                        ray_defs.append({"color": obj.focal_ray.color, "m0": -obj.G / denom, "y0": obj.G, "x0": obj.x, "lw": obj.focal_ray.width})

    # Lichtquellen (Punkte)
    for src in cfg.light_sources:
        if not src.show: continue
        # Use first visible ray color for point
        p_color = src.central_ray.color if src.central_ray.show else (src.parallel_ray.color if src.parallel_ray.show else src.focal_ray.color)
        if src.source_size > 0:
            lines.append(rf"  \fill[{p_color}] ({_f4(src.x)},{_f4(src.y)}) circle ({src.source_size}pt);")
        if src.label:
            lines.append(rf"  \node[above, {p_color}] at ({_f4(src.x)},{_f4(src.y)}) {{{src.label}}};")
        
        if lenses:
            if src.parallel_ray.show:
                ray_defs.append({"color": src.parallel_ray.color, "m0": 0.0, "y0": src.y, "x0": src.x, "lw": src.parallel_ray.width})
            if src.central_ray.show:
                denom = lenses[0].x - src.x
                m0 = -src.y / denom if abs(denom) > 1e-9 else 0.0
                ray_defs.append({"color": src.central_ray.color, "m0": m0, "y0": src.y, "x0": src.x, "lw": src.central_ray.width})
            if src.focal_ray.show:
                F1_front = lenses[0].x - lenses[0].f
                denom = F1_front - src.x
                if abs(denom) > 1e-9:
                    ray_defs.append({"color": src.focal_ray.color, "m0": -src.y / denom, "y0": src.y, "x0": src.x, "lw": src.focal_ray.width})

    # Strahlen-Tracing
    for rd in ray_defs:
        xc, yc, m = rd["x0"], rd["y0"], rd["m0"]
        pts = [(xc, yc)]
        virtual_exts = []
        path_images = calculate_images(cfg, x_start=xc, y_start=yc)

        for k, L in enumerate(lenses):
            if L.x <= xc + 1e-9: continue
            xn = L.x
            yn = yc + m * (xn - xc)
            pts.append((xn, yn))
            m_new = m - yn / L.f
            img = path_images[k]
            if img["x"] != float("inf") and img["virtual"]:
                ext_x = xn + (img["x"] - xn) * getattr(cfg, 'virtual_ray_extension', 1.0)
                ext_y = yn + (img["y"] - yn) * getattr(cfg, 'virtual_ray_extension', 1.0)
                virtual_exts.append(((xn, yn), (ext_x, ext_y)))
            xc, yc, m = xn, yn, m_new

        pts.append((x_right, yc + m * (x_right - xc)))
        path_str = " -- ".join([rf"({_f4(p[0])},{_f4(p[1])})" for p in pts])
        lines.append(rf"  \draw[line width={rd['lw']}pt, {rd['color']}] {path_str};")
        for ext in virtual_exts:
            lines.append(rf"  \draw[dashed, line width={rd['lw']}pt, {rd['color']}] ({_f4(ext[0][0])},{_f4(ext[0][1])}) -- ({_f4(ext[1][0])},{_f4(ext[1][1])});")

    # Linsenumriss
    for i, L in enumerate(lenses):
        lh, lt = L.h / 2.0, ("Sammellinse" if L.f > 0 else "Zerstreuungslinse")
        if cfg.realistic_lens:
            sag = lh * 0.45
            if lt == "Sammellinse":
                lines.append(rf"  \draw[thick, shift={{({_f4(L.x)},0)}}] (0,{_f4(-lh)}) .. controls ({_f4(-sag)},{_f4(-lh/2)}) and ({_f4(-sag)},{_f4(lh/2)}) .. (0,{_f4(lh)}) .. controls ({_f4(sag)},{_f4(lh/2)}) and ({_f4(sag)},{_f4(-lh/2)}) .. (0,{_f4(-lh)});")
            else:
                lines.append(rf"  \draw[thick, shift={{({_f4(L.x)},0)}}] ({_f4(-sag)},{_f4(lh)}) -- ({_f4(sag)},{_f4(lh)}) .. controls (0,{_f4(lh/2)}) and (0,{_f4(-lh/2)}) .. ({_f4(sag)},{_f4(-lh)}) -- ({_f4(-sag)},{_f4(-lh)}) .. controls (0,{_f4(-lh/2)}) and (0,{_f4(lh/2)}) .. cycle;")
        else:
            if lt == "Sammellinse":
                lines.append(rf"  \draw[<->, thick, shift={{({_f4(L.x)},0)}}] (0,{_f4(-lh)}) -- (0,{_f4(lh)});")
            else:
                lines.append(rf"  \draw[thick, shift={{({_f4(L.x)},0)}}] (0,{_f4(-lh)}) -- (0,{_f4(lh)});")
                lines.append(rf"  \draw[thick, shift={{({_f4(L.x)},0)}}] (0,{_f4(lh)}) -- (-0.15,{_f4(lh + 0.3)}); \draw[thick, shift={{({_f4(L.x)},0)}}] (0,{_f4(lh)}) -- (0.15,{_f4(lh + 0.3)});")
                lines.append(rf"  \draw[thick, shift={{({_f4(L.x)},0)}}] (0,{_f4(-lh)}) -- (-0.15,{_f4(-lh - 0.3)}); \draw[thick, shift={{({_f4(L.x)},0)}}] (0,{_f4(-lh)}) -- (0.15,{_f4(-lh - 0.3)});")
        idx = "" if len(lenses) == 1 else f"_{i+1}"
        lines.append(rf"  \node[above] at ({_f4(L.x)}, {_f4(lh + 0.2)}) {{$L{idx}$}};")

    # Annotationen (nur für das erste sichtbare Objekt)
    visible_objects = [o for o in cfg.objects if o.show]
    if not cfg.telescope_mode and visible_objects:
        obj = visible_objects[0]
        images = calculate_images(cfg, x_start=obj.x, y_start=obj.G)
        if any([cfg.show_annot_g, cfg.show_annot_b, cfg.show_annot_f, cfg.show_annot_G, cfg.show_annot_B]):
            max_lh = max([L.h / 2.0 for L in lenses]) if lenses else 2.0
            tip_max = max([max_lh + 0.1, obj.G + 0.1] + [abs(img["y"]) + 0.1 for img in images if img["x"] != float("inf")] + [0])
            ann_f_y, ann_gb_y, tick = tip_max, tip_max + 0.6, 0.12
            def _tick(x, y): return rf"  \draw ({_f4(x)},{_f4(y - tick)}) -- ({_f4(x)},{_f4(y + tick)});"
            def _qty(v): return rf"\qty{{{_fmt_val(v)}}}{{cm}}"

            for i, L in enumerate(lenses):
                idx = "" if len(lenses) == 1 else f"_{i+1}"
                if cfg.show_annot_f:
                    fp_x = L.x + L.f
                    lines.append(rf"  \draw[<->] ({_f4(min(L.x, fp_x))},{_f4(ann_f_y)}) -- ({_f4(max(L.x, fp_x))},{_f4(ann_f_y)}) node[midway, above, font=\scriptsize] {{$f{idx} = {_qty(abs(L.f))}$}};")
                    lines.append(_tick(L.x, ann_f_y)); lines.append(_tick(fp_x, ann_f_y))
                if cfg.show_annot_g:
                    okx = obj.x if i == 0 else images[i-1]["x"]
                    if okx != float("inf"):
                        lines.append(rf"  \draw[<->] ({_f4(min(okx, L.x))},{_f4(ann_gb_y)}) -- ({_f4(max(okx, L.x))},{_f4(ann_gb_y)}) node[midway, above, font=\scriptsize] {{$g{idx} = {_qty(abs(L.x - okx))}$}};")
                        lines.append(_tick(okx, ann_gb_y)); lines.append(_tick(L.x, ann_gb_y))
                if cfg.show_annot_b and images[i]["x"] != float("inf"):
                    lines.append(rf"  \draw[<->] ({_f4(min(L.x, images[i]['x']))},{_f4(ann_gb_y + 0.6)}) -- ({_f4(max(L.x, images[i]['x']))},{_f4(ann_gb_y + 0.6)}) node[midway, above, font=\scriptsize] {{$b{idx} = {_qty(abs(images[i]['x'] - L.x))}$}};")
                    lines.append(_tick(L.x, ann_gb_y + 0.6)); lines.append(_tick(images[i]["x"], ann_gb_y + 0.6))

            if cfg.show_annot_G:
                gx = obj.x - 0.45
                lines.append(rf"  \draw[<->] ({_f4(gx)},0) -- ({_f4(gx)},{_f4(obj.G)}) node[midway, left, font=\scriptsize] {{$G = {_qty(obj.G)}$}};")
            if cfg.show_annot_B and images and images[-1]["x"] != float("inf"):
                bx = images[-1]["x"] + 0.45
                lines.append(rf"  \draw[<->] ({_f4(bx)},0) -- ({_f4(bx)},{_f4(images[-1]['y'])}) node[midway, right, font=\scriptsize] {{$B = {_qty(abs(images[-1]['y']))}$}};")

    lines.append(r"\end{tikzpicture}")
    return "\n".join(lines)


def _wrap_document(tikz_body: str, cfg: OptikConfig) -> str:
    """Bettet den TikZ-Code in ein minimales standalone-LaTeX-Dokument ein."""
    return render_latex_document(
        LatexDocumentSpec(
            body=tikz_body,
            class_options=("tikz", "border=6pt"),
            preamble_parts=(
                r"\usepackage{tikz}",
                r"\usetikzlibrary{arrows.meta}",
                r"\usepackage[locale=DE]{siunitx}",
                font_input(getattr(cfg, "font_family", "Fira")),
            ),
        )
    )
