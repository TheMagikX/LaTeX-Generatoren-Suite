# SPDX-License-Identifier: AGPL-3.0-or-later

import numpy as np
from models.koordinatensystem3d import CoordinateSystem3DConfig
from core.geometry3d import (
    calculate_line_line_intersection,
    calculate_line_plane_intersection,
    calculate_plane_plane_intersection,
    calculate_plane_polygon,
    get_camera_dir,
    get_plane_nd,
    get_shape_plane,
    intersect_line_with_bbox,
    is_behind_plane,
    is_point_in_polygon,
    split_segment,
)
from core.latex_document import (
    HEXCOL_TIKZ_KEY,
    LatexDocumentSpec,
    font_input,
    render_latex_document,
    shared_commands_input,
    shared_package_input,
)

def _label_style(axis: str, cfg: CoordinateSystem3DConfig) -> str:
    """Erzeugt den pgfplots-Style-String für eine Achsenbeschriftung."""
    if axis == "x":
        pos = cfg.xlabel_pos
        bg = cfg.xlabel_background
        sep = cfg.xlabel_background_sep
        style_name = "xlabel style"
    elif axis == "y":
        pos = cfg.ylabel_pos
        bg = cfg.ylabel_background
        sep = cfg.ylabel_background_sep
        style_name = "ylabel style"
    else:
        pos = cfg.zlabel_pos
        bg = cfg.zlabel_background
        sep = cfg.zlabel_background_sep
        style_name = "zlabel style"

    at_part = f"at={{({pos})}}, " if pos else ""
    bg_part = ""
    if bg:
        bg_part = f", fill=white, inner sep={sep}pt"

    return f'{style_name}={{{{ {at_part}anchor=center{bg_part} }}}}'

def _format_3d_line_vector_style(color: str, width: float, style: str, arrow: str) -> str:
    parts = []
    if arrow and arrow != "none":
        parts.append(f"-{{{arrow}}}")
    if color:
        if color.startswith("#"):
            parts.append(f"hexcol={color[1:].upper()}")
        elif color.startswith("hexcol="):
            parts.append(color)
        else:
            parts.append(f"color={color}")
    if width:
        parts.append(f"line width={width}pt")
    if style and style != "solid":
        parts.append(style)
    return ", ".join(parts) if parts else "line width=1.2pt"

def generate_koordinatensystem3d_latex(cfg: CoordinateSystem3DConfig) -> str:
    azimuthberechnet = 125 - cfg.azimuth

    # Nudge elevation and azimuth to avoid pgfplots projection singularities (eyy=0 error) (2.2)
    # This happens when axes are perfectly aligned with the screen horizontal/vertical
    el = cfg.elevation
    if abs(el) < 0.1: el = 0.1
    if abs(el - 90) < 0.1: el = 89.9

    az = azimuthberechnet
    if abs(az % 90) < 0.1: az += 0.1
    _axis_arrow = (cfg.axis_arrow or "").strip()

    _arrow_suffix = f", -{{{_axis_arrow}}}" if _axis_arrow else ""

    opts = [
        f"width={cfg.width_cm}cm",
        f"unit vector ratio*={{ {cfg.scale_x} {cfg.scale_y} {cfg.scale_z} }}",
        "axis lines=center",
        "axis on top=false",
        f"view={{ {az} }}{{ {el} }}",
        f"xmin={cfg.xmin}, xmax={cfg.xmax}",

        f"ymin={cfg.ymin}, ymax={cfg.ymax}",
        f"zmin={cfg.zmin}, zmax={cfg.zmax}",
        f"axis line style={{line width={cfg.axis_width}pt,draw={cfg.axis_color}{_arrow_suffix}}}",
    ]

    if cfg.ticks_show:
        opts += [
            f"major tick style={{line width={cfg.tick_width}pt,draw={cfg.tick_color}}}",
            "xtick align=inside",
            "ytick align=inside",
            "ztick align=inside",
            f"major tick length={cfg.tick_length}pt",
        ]
        if cfg.minor_ticks:
            opts += [
                "minor tick num=" + str(cfg.minor_tick_num),
                f"minor tick style={{line width={cfg.tick_width}pt,draw={cfg.tick_color}}}",
            ]
    else:
        opts += ["major tick style={draw=none}"]

    if cfg.label_show:
        opts += [
            f"xlabel={{{{{cfg.xlabel}}}}}",
            f"ylabel={{{{{cfg.ylabel}}}}}",
            f"zlabel={{{{{cfg.zlabel}}}}}",
            _label_style("x", cfg),
            _label_style("y", cfg),
            _label_style("z", cfg),
        ]
    else:
        opts += ["xlabel={}", "ylabel={}", "zlabel={}"]

    opts += [
        "enlargelimits=0.05",
        "tick label style={inner sep=4pt}",
        "scaled ticks=false",
        "z buffer=sort",
    ]

    # Ticks pro Achse
    for axis in ["x", "y", "z"]:
        ticklist = getattr(cfg, f"{axis}ticklist")
        ticks = [t.strip() for t in ticklist.split(",") if t.strip()]
        sep = "." if getattr(cfg, f"sep_{axis}") else ""
        prec = getattr(cfg, f"prec_{axis}")
        mult = getattr(cfg, f"mult_{axis}")
        t_format = getattr(cfg, f"tickformat_{axis}")
        suffix = getattr(cfg, f"label_suffix_{axis}")
        
        if cfg.tick_mode == 'Bereich' and ticks:
            opts.append(f"{axis}tick={{{','.join(ticks)}}}")

        if cfg.majorticklabels:
            opts += [
                rf"{axis}ticklabel={{\pgfmathparse{{\tick*{mult}}}\pgfmathprintnumber[fixed, fixed zerofill, precision={prec},use comma]{{\pgfmathresult}}{suffix}}}",
                f"{axis}ticklabel style={{{t_format},/pgf/number format/1000 sep={sep}}}",
            ]
        else:
            opts.append(f"{axis}ticklabel={{\\empty}}")

    # ---------- Punkte ----------
    points_code = []
    for i, pt in enumerate(cfg.points):
        points_code.append(rf"\coordinate (P{i}) at (axis cs:{pt.x},{pt.y},{pt.z});")
        if not pt.show:
            continue
        c = pt.color or "black"
        pt_col = f"hexcol={c[1:].upper()}" if c.startswith("#") else c
        points_code.append(rf"\addplot3[only marks, mark={pt.mark}, {pt_col}, mark size={pt.size}pt] coordinates {{({pt.x},{pt.y},{pt.z})}};")
        clean_lbl = (pt.label or "").strip().strip("$").strip()
        if clean_lbl:
            points_code.append(rf"\node[{pt_col}, anchor={pt.anchor}, draw=none] at (axis cs:{pt.x},{pt.y},{pt.z}){{$ {clean_lbl} $}};")

        # Projektionen auf Grundebenen (2.1)
        p_c = pt.proj_color or "gray!50"
        proj_col = f"hexcol={p_c[1:].upper()}" if p_c.startswith("#") else f"color={p_c}"
        proj_style = f"{proj_col}, {pt.proj_style}"
        if pt.proj_xy:
            points_code.append(rf"\addplot3[{proj_style}] coordinates {{({pt.x},{pt.y},{pt.z}) ({pt.x},{pt.y},0)}};")
        if pt.proj_xz:
            points_code.append(rf"\addplot3[{proj_style}] coordinates {{({pt.x},{pt.y},{pt.z}) ({pt.x},0,{pt.z})}};")
        if pt.proj_yz:
            points_code.append(rf"\addplot3[{proj_style}] coordinates {{({pt.x},{pt.y},{pt.z}) (0,{pt.y},{pt.z})}};")

    # ---------- Occlusion Setup ----------
    # cam_dir muss mit dem un-modifizierten Azimuth (pgfplots-Sicht) berechnet werden
    cam_dir = get_camera_dir(az, el) 
    occluders = []
    for e in cfg.planes:
        if e.show:
            n_raw, d_raw = get_plane_nd(e)
            if np.linalg.norm(n_raw) > 1e-9:
                n_normed = n_raw / np.linalg.norm(n_raw)
                d_normed = float(d_raw) / np.linalg.norm(n_raw)
                
                # Berechne das Polygon für die Ebene, um endliche Occlusion zu haben
                poly_points, _ = calculate_plane_polygon(
                    n_raw[0], n_raw[1], n_raw[2], d_raw,
                    cfg.xmin, cfg.xmax, cfg.ymin, cfg.ymax, cfg.zmin, cfg.zmax,
                )
                if poly_points:
                    poly_verts = [np.array(p) for p in poly_points]
                    occluders.append({'n': n_normed, 'd': d_normed, 'poly': poly_verts})
    for s in cfg.shapes:
        if s.show:
            result = get_shape_plane(s, cfg.points)
            if result:
                n, d, verts = result
                # get_shape_plane liefert bereits normierte n
                occluders.append({'n': n, 'd': d, 'poly': verts})

    # ---------- Spuren ----------
    trails_code = []
    for i, pt in enumerate(cfg.points):
        if not (pt.show and pt.trail):
            continue

        t_c = pt.trail_color or "gray!70"
        trail_col = f"hexcol={t_c[1:].upper()}" if t_c.startswith("#") else f"color={t_c}"
        trail_style = f"{trail_col}, line width={pt.trail_width}pt, {pt.trail_style}, opacity={pt.trail_alpha / 100.0}"
        # Drei Teilstücke: O -> (x,0,0) -> (x,y,0) -> (x,y,z)
        for p1, p2 in [("0,0,0", f"{pt.x},0,0"), (f"{pt.x},0,0", f"{pt.x},{pt.y},0"), (f"{pt.x},{pt.y},0", f"{pt.x},{pt.y},{pt.z}")]:
            trails_code.append(rf"\addplot3[{trail_style}] coordinates {{({p1}) ({p2})}} ;")

        if pt.trail_marks:
            trails_code.append(
                rf"\addplot3[only marks, mark=*, mark size=1.5pt, {trail_col}, opacity={pt.trail_alpha / 100.0}] "
                rf"coordinates {{({pt.x},0,0) ({pt.x},{pt.y},0)}};"
            )

    # ---------- Vektoren ----------
    vectors_behind_code = []
    vectors_front_code = []
    for i, v in enumerate(cfg.vectors):
        if not v.show:
            continue
        arrow_opt = f"-{{{v.arrow}}}" if v.arrow else ""
        node_str = rf" node[{v.label_pos}]{{{v.label}}}" if v.label else ""
        c = v.color or "red"
        v_col = f"hexcol={c[1:].upper()}" if c.startswith("#") else f"color={c}"
        
        A = np.array([v.x1, v.y1, v.z1])
        B = np.array([v.x2, v.y2, v.z2])

        if v.draw_mode == "automatisch":
            segments = split_segment(A, B, occluders, cam_dir)
            for j, (seg_start, seg_end, is_behind) in enumerate(segments):
                style = v.behind_style if is_behind else v.style
                is_last = (j == len(segments) - 1)
                current_arrow = arrow_opt if is_last else ""
                current_node = node_str if is_last else ""
                
                code = (
                    rf"\draw[{current_arrow}, {v_col}, line width={v.width}pt, {style}] "
                    rf"({seg_start[0]},{seg_start[1]},{seg_start[2]}) -- ({seg_end[0]},{seg_end[1]},{seg_end[2]}){current_node};"
                )
                (vectors_behind_code if is_behind else vectors_front_code).append(code)
        else:
            is_behind = (v.draw_mode == "hinten")
            active_style = v.behind_style if is_behind else v.style
            line = (
                rf"\draw[{arrow_opt}, {v_col}, line width={v.width}pt, {active_style}] "
                rf"({v.x1},{v.y1},{v.z1}) -- ({v.x2},{v.y2},{v.z2}){node_str};"
            )
            (vectors_behind_code if is_behind else vectors_front_code).append(line)

    # ---------- Geraden ----------
    lines_behind_code = []
    lines_front_code = []
    for i, g in enumerate(cfg.lines):
        if not g.show:
            continue
        
        P0 = np.array([g.x0, g.y0, g.z0])
        R = np.array([g.rx, g.ry, g.rz])
        
        A = P0 + g.tmin * R
        B = P0 + g.tmax * R
        
        g_c = g.color or "#64748b"
        g_col = f"hexcol={g_c[1:].upper()}" if g_c.startswith("#") else f"color={g_c}"

        if g.draw_mode == "automatisch":
            segments = split_segment(A, B, occluders, cam_dir)
            for seg_start, seg_end, is_behind in segments:
                style = g.behind_style if is_behind else g.style
                code = (
                    rf"\addplot3[{g_col}, line width={g.width}pt, {style}] "
                    rf"coordinates {{({seg_start[0]},{seg_start[1]},{seg_start[2]}) ({seg_end[0]},{seg_end[1]},{seg_end[2]})}};"
                )
                (lines_behind_code if is_behind else lines_front_code).append(code)
        else:
            is_behind = (g.draw_mode == "hinten")
            active_style = g.behind_style if is_behind else g.style
            bucket = lines_behind_code if is_behind else lines_front_code
            bucket.append(
                rf"\addplot3[{g_col}, line width={g.width}pt, {active_style}] coordinates {{({A[0]},{A[1]},{A[2]}) ({B[0]},{B[1]},{B[2]})}};"
            )

        x3, y3, z3 = g.x0 + g.rx, g.y0 + g.ry, g.z0 + g.rz
        bucket = lines_behind_code if (not g.draw_mode == "vorne") else lines_front_code
        if g.rvec_show:
            rvec_style_str = _format_3d_line_vector_style(g.rvec_color, g.rvec_width, g.rvec_style, g.rvec_arrow)
            bucket.append(
                rf"\addplot3[{rvec_style_str}] coordinates {{({g.x0},{g.y0},{g.z0}) ({x3},{y3},{z3})}} node[{g.rvec_label_style}] {{{g.rvec_label}}};"
            )
        if g.svec_show:
            svec_style_str = _format_3d_line_vector_style(g.svec_color, g.svec_width, g.svec_style, g.svec_arrow)
            bucket.append(
                rf"\addplot3[{svec_style_str}] coordinates {{({0},{0},{0}) ({g.x0},{g.y0},{g.z0})}} node[{g.svec_label_style}] {{{g.svec_label}}};"
            )

    # ---------- Ebenen ----------
    planes_code = []
    for i, e in enumerate(cfg.planes):
        if not e.show:
            continue

        n, d = get_plane_nd(e)
        nx, ny, nz = n
        if abs(nx) < 1e-9 and abs(ny) < 1e-9 and abs(nz) < 1e-9:
            continue

        poly_points, centroid = calculate_plane_polygon(
            nx, ny, nz, d,
            cfg.xmin, cfg.xmax, cfg.ymin, cfg.ymax, cfg.zmin, cfg.zmax,
        )
        if not poly_points:
            continue

        e_c = e.color or "#2563eb"
        e_col = f"hexcol={e_c[1:].upper()}" if e_c.startswith("#") else f"color={e_c}"
        fill_opt = "" if e_c.startswith("#") else f", fill={e_c}"
        pattern_opt = f", pattern={e.pattern}" if e.pattern.strip() else ""
        coords_str = " ".join(f"({p[0]},{p[1]},{p[2]})" for p in poly_points)
        num_vertices = len(poly_points)

        planes_code.append(
            rf"\addplot3[patch, patch type=polygon, vertex count={num_vertices}, "
            rf"{e_col}{fill_opt}, opacity={e.alpha / 100.0}{pattern_opt}, "
            rf"draw=none] coordinates {{{coords_str}}};"
        )

        if e.normal_show and centroid is not None:
            n_vec = np.array([nx, ny, nz], dtype=float)
            n_norm = np.linalg.norm(n_vec)
            if n_norm > 1e-9:
                n_unit = n_vec / n_norm
                cx, cy, cz = centroid
                ex, ey, ez = cx + float(n_unit[0]), cy + float(n_unit[1]), cz + float(n_unit[2])
                n_style_str = _format_3d_line_vector_style(e.normal_color, e.normal_width, e.normal_style, e.normal_arrow)
                node_str = f" node[{e.normal_label_pos}] {{{e.normal_label}}}" if (getattr(e, 'normal_label', '') and e.normal_label.strip()) else ""
                planes_code.append(
                    rf"\addplot3[{n_style_str}] coordinates {{({cx},{cy},{cz}) ({ex},{ey},{ez})}}{node_str};"
                )

    # ---------- Schnitte ----------
    intersections_code = []
    for i, inter in enumerate(cfg.intersections):
        if not inter.show:
            continue
            
        if inter.type == "Gerade-Gerade":
            if inter.item1_index < len(cfg.lines) and inter.item2_index < len(cfg.lines):
                g1 = cfg.lines[inter.item1_index]
                g2 = cfg.lines[inter.item2_index]
                pt = calculate_line_line_intersection(g1, g2)
                if pt is not None:
                    intersections_code.append(rf"\addplot3[only marks, mark={inter.mark}, {inter.color}, mark size={inter.size}pt] coordinates {{({pt[0]},{pt[1]},{pt[2]})}};")
                    clean_inter_lbl = (inter.label or "").strip().strip("$").strip()
                    if clean_inter_lbl:
                        intersections_code.append(rf"\node[{inter.color}, anchor=south, draw=none] at (axis cs:{pt[0]},{pt[1]},{pt[2]}){{$ {clean_inter_lbl} $}};")

        elif inter.type == "Gerade-Ebene":
            if inter.item1_index < len(cfg.lines) and inter.item2_index < len(cfg.planes):
                g = cfg.lines[inter.item1_index]
                e = cfg.planes[inter.item2_index]
                pt = calculate_line_plane_intersection(g, e)
                if pt is not None:
                    intersections_code.append(rf"\addplot3[only marks, mark={inter.mark}, {inter.color}, mark size={inter.size}pt] coordinates {{({pt[0]},{pt[1]},{pt[2]})}};")
                    clean_inter_lbl = (inter.label or "").strip().strip("$").strip()
                    if clean_inter_lbl:
                        intersections_code.append(rf"\node[{inter.color}, anchor=south, draw=none] at (axis cs:{pt[0]},{pt[1]},{pt[2]}){{$ {clean_inter_lbl} $}};")

        elif inter.type == "Ebene-Ebene":
            if inter.item1_index < len(cfg.planes) and inter.item2_index < len(cfg.planes):
                e1 = cfg.planes[inter.item1_index]
                e2 = cfg.planes[inter.item2_index]
                res = calculate_plane_plane_intersection(e1, e2)
                if res is not None:
                    x0, r = res
                    clipped = intersect_line_with_bbox(x0[0], x0[1], x0[2], r[0], r[1], r[2], cfg.xmin, cfg.xmax, cfg.ymin, cfg.ymax, cfg.zmin, cfg.zmax)
                    if clipped:
                        p1, p2 = clipped
                        intersections_code.append(rf"\addplot3[{inter.color}, line width={inter.width}pt, {inter.style}] coordinates {{({p1[0]},{p1[1]},{p1[2]}) ({p2[0]},{p2[1]},{p2[2]})}};")

    # ---------- Shapes ----------
    shapes_code = []
    shape_color_defs = []
    for i, s in enumerate(cfg.shapes):
        if not s.show or not s.point_indices:
            continue
        
        valid_indices = [idx for idx in s.point_indices if 0 <= idx < len(cfg.points)]
        if len(valid_indices) < 2:
            continue
            
        coords = []
        for idx in valid_indices:
            pt = cfg.points[idx]
            coords.append(f"({pt.x},{pt.y},{pt.z})")

        vertex_count = len(coords)
            
        coords_str = " ".join(coords)
        color_defs = []
        s_c = s.color or "#1e293b"
        if s_c.startswith("#"):
            color_defs.append(rf"\definecolor{{shapeborder{i}}}{{HTML}}{{{s_c[1:].upper()}}}")
            faceted_col = f"shapeborder{i}"
        else:
            faceted_col = s_c

        fill_opt = ""
        if s.fill_color and s.fill_color != "none":
            s_fc = s.fill_color
            if s_fc.startswith("#"):
                color_defs.append(rf"\definecolor{{shapefill{i}}}{{HTML}}{{{s_fc[1:].upper()}}}")
                fill_col = f"shapefill{i}"
            else:
                fill_col = s_fc
            fill_opt = f", fill={fill_col}, fill opacity={s.fill_alpha / 100.0}"

        draw_opt = f"faceted color={faceted_col}, line width={s.width}pt, {s.style}"
        shape_color_defs.extend(color_defs)
        shapes_code.append(
            rf"\addplot3[patch, patch type=polygon, vertex count={vertex_count}, {draw_opt}{fill_opt}] coordinates {{{coords_str}}};"
        )

    # ---------- Zusammensetzen ----------
    body = "\n    ".join([
        "\\begin{axis}[" + ",\n    ".join(opts) + "]",
        *trails_code,
        *points_code,
        *vectors_behind_code,
        *lines_behind_code,
        *planes_code,
        *shapes_code,
        *vectors_front_code,
        *lines_front_code,
        *intersections_code,
        *(cfg.manual_code.splitlines() if cfg.manual_code else []),
        "\\end{axis}",
    ])

    default_pakete = r"""
\usepackage{tikz}
\usetikzlibrary{arrows.meta}
\usetikzlibrary{patterns}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usepackage{pgfplotstable}
"""
    tikz_body = "\\begin{tikzpicture}\n" + body.strip() + "\n\\end{tikzpicture}"

    return render_latex_document(
        LatexDocumentSpec(
            body=tikz_body,
            class_options=("border=2pt",),
            preamble_parts=(
                shared_package_input(cfg.pakete_laden, default_pakete),
                r"\pgfplotsset{compat=1.18}",
                shared_commands_input(cfg.command_laden),
                font_input(getattr(cfg, "font_family", "Fira")),
                HEXCOL_TIKZ_KEY,
                *shape_color_defs,
            ),
        )
    )
