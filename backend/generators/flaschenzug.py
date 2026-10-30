# SPDX-License-Identifier: AGPL-3.0-or-later

import math
from typing import List, Dict, Optional, Tuple, Any
from models.flaschenzug import FlaschenzugConfig
from core.latex_document import (
    HEXCOL_TIKZ_KEY,
    LatexDocumentSpec,
    font_input,
    render_latex_document,
    shared_commands_input,
    shared_package_input,
    shared_tikz_input,
)

def _find_element(cfg: FlaschenzugConfig, name: str) -> Tuple[Optional[str], Optional[Any]]:
    for p in cfg.pulleys:
        if p.name == name:
            return "pulley", p
    for a in cfg.anchors:
        if a.name == name:
            return "anchor", a
    return None, None

def tangent_point_external(px: float, py: float, cx: float, cy: float, r: float, side="cw") -> Tuple[float, float, float]:
    dx = cx - px
    dy = cy - py
    d = math.hypot(dx, dy)
    if d < r:
        return cx, cy, 0.0
    alpha = math.atan2(dy, dx)
    beta = math.asin(r / d)
    if side == "cw":
        theta = alpha + beta
        tx = cx - r * math.sin(theta)
        ty = cy + r * math.cos(theta)
    else:
        theta = alpha - beta
        tx = cx + r * math.sin(theta)
        ty = cy - r * math.cos(theta)
    return tx, ty, math.degrees(theta)

def tangent_line_two_circles(c1x: float, c1y: float, r1: float, c2x: float, c2y: float, r2: float, side1="cw", side2="cw") -> Tuple[float, float, float, float, float, float]:
    dx = c2x - c1x
    dy = c2y - c1y
    d = math.hypot(dx, dy)
    if d < 1e-9:
        return c1x, c1y, c2x, c2y, 0, 0

    base_angle = math.atan2(dy, dx)

    if side1 == side2:
        dr = r1 - r2
        if abs(d) < abs(dr):
            gamma = 0
        else:
            gamma = math.acos(dr / d) if d > 0 else 0
        if side1 == "cw":
            ang1 = base_angle + gamma
            ang2 = base_angle + gamma
        else:
            ang1 = base_angle - gamma
            ang2 = base_angle - gamma
    else:
        rs = r1 + r2
        if d < rs:
            gamma = 0
        else:
            gamma = math.acos(rs / d) if d > 0 else 0
        if side1 == "cw":
            ang1 = base_angle + gamma
            ang2 = base_angle + gamma + math.pi
        else:
            ang1 = base_angle - gamma
            ang2 = base_angle - gamma - math.pi

    t1x = c1x + r1 * math.cos(ang1 + math.pi / 2)
    t1y = c1y + r1 * math.sin(ang1 + math.pi / 2)
    t2x = c2x + r2 * math.cos(ang2 + math.pi / 2)
    t2y = c2y + r2 * math.sin(ang2 + math.pi / 2)

    return t1x, t1y, t2x, t2y, math.degrees(ang1), math.degrees(ang2)

def compute_rope_segments(cfg: FlaschenzugConfig, rope_path: List[Any]) -> List[Dict]:
    if len(rope_path) < 2:
        return []

    commands = []
    contact_points = []
    for i, seg in enumerate(rope_path):
        name = seg.name
        side = seg.side
        etype, elem = _find_element(cfg, name)

        if etype is None:
            continue

        if etype == "anchor":
            contact_points.append({
                "x": elem.x,
                "y": elem.y,
                "is_pulley": False,
                "name": name,
                "side": side,
            })
        else:
            contact_points.append({
                "x": elem.x,
                "y": elem.y,
                "r": elem.radius,
                "is_pulley": True,
                "name": name,
                "side": side,
            })

    if len(contact_points) < 2:
        return []

    tangent_data = []

    for cp in contact_points:
        cp["entry"] = None
        cp["exit"] = None
        cp["entry_angle_rad"] = None
        cp["exit_angle_rad"] = None

    for i in range(len(contact_points) - 1):
        cp1 = contact_points[i]
        cp2 = contact_points[i + 1]
        
        ax, ay = cp1["x"], cp1["y"]
        ra = cp1.get("r", 0.0)
        side_a = cp1.get("side", "cw") if cp1["is_pulley"] else "none"
        
        bx, by = cp2["x"], cp2["y"]
        rb = cp2.get("r", 0.0)
        side_b = cp2.get("side", "cw") if cp2["is_pulley"] else "none"
        
        dx = bx - ax
        dy = by - ay
        d = math.hypot(dx, dy)
        
        if d < 1e-9:
            pt_a = (ax, ay)
            pt_b = (bx, by)
            theta_a = theta_b = 0.0
        else:
            alpha = math.atan2(dy, dx)
            math_side_a = "cw" if side_a == "none" else side_a
            math_side_b = "cw" if side_b == "none" else side_b
            
            if math_side_a == math_side_b:
                ratio = max(-1.0, min(1.0, (ra - rb) / d))
                gamma = math.acos(ratio)
                if math_side_a == "cw":
                    theta_a = alpha + gamma
                    theta_b = alpha + gamma
                else:
                    theta_a = alpha - gamma
                    theta_b = alpha - gamma
            else:
                ratio = max(-1.0, min(1.0, (ra + rb) / d))
                gamma = math.acos(ratio)
                if math_side_a == "cw":
                    theta_a = alpha + gamma
                    theta_b = alpha + gamma - math.pi
                else:
                    theta_a = alpha - gamma
                    theta_b = alpha - gamma + math.pi
                    
            pt_a = (ax + ra * math.cos(theta_a), ay + ra * math.sin(theta_a))
            pt_b = (bx + rb * math.cos(theta_b), by + rb * math.sin(theta_b))
            
        cp1["exit"] = pt_a
        cp1["exit_angle_rad"] = theta_a
        cp2["entry"] = pt_b
        cp2["entry_angle_rad"] = theta_b

    cp_first = contact_points[0]
    if cp_first["is_pulley"] and cp_first["entry"] is None:
        cp_first["entry_angle_rad"] = math.pi / 2
        r = cp_first["r"]
        cp_first["entry"] = (cp_first["x"] + r * math.cos(math.pi / 2),
                             cp_first["y"] + r * math.sin(math.pi / 2))

    cp_last = contact_points[-1]
    if cp_last["is_pulley"] and cp_last["exit"] is None:
        cp_last["exit_angle_rad"] = -math.pi / 2
        r = cp_last["r"]
        cp_last["exit"] = (cp_last["x"] + r * math.cos(-math.pi / 2),
                           cp_last["y"] + r * math.sin(-math.pi / 2))

    for cp in contact_points:
        if not cp["is_pulley"]:
            tangent_data.append({
                "entry": (cp["x"], cp["y"]) if cp["entry"] is None else cp["entry"],
                "exit": (cp["x"], cp["y"]) if cp["exit"] is None else cp["exit"],
                "arc": None,
            })
        else:
            tangent_data.append({
                "entry": cp["entry"],
                "exit": cp["exit"],
                "arc": {
                    "cx": cp["x"], "cy": cp["y"], "r": cp["r"],
                    "start_deg": math.degrees(cp["entry_angle_rad"]),
                    "end_deg": math.degrees(cp["exit_angle_rad"]),
                    "side": cp["side"],
                },
            })

    draw_parts = []
    for i in range(len(tangent_data)):
        td = tangent_data[i]
        if td["arc"] is not None:
            arc = td["arc"]
            start = arc["start_deg"]
            end = arc["end_deg"]
            if arc["side"] == "cw":
                if end > start: end -= 360
            else:
                if end < start: end += 360
            draw_parts.append({
                "type": "arc",
                "start": td["entry"],
                "cx": arc["cx"], "cy": arc["cy"], "r": arc["r"],
                "start_deg": start,
                "end_deg": end,
            })
        if i < len(tangent_data) - 1:
            from_pt = td["exit"]
            to_pt = tangent_data[i + 1]["entry"]
            draw_parts.append({
                "type": "line",
                "from": from_pt,
                "to": to_pt,
            })
    return draw_parts

def generate_rope_tikz(draw_parts, rope_style="plain", rope_color="black") -> str:
    if not draw_parts:
        return ""
    style = "seil"
    if rope_color != "black":
        style = f"seil, {rope_color}"
    code = ""
    for part in draw_parts:
        if part["type"] == "line":
            fx, fy = part["from"]
            tx, ty = part["to"]
            if rope_style == "rope":
                code += f"  \\draw[decorate, decoration={{rope}}, {rope_color}, line width=1.5pt] ({fx:.4f},{fy:.4f}) -- ({tx:.4f},{ty:.4f});\n"
            else:
                code += f"  \\draw[{style}] ({fx:.4f},{fy:.4f}) -- ({tx:.4f},{ty:.4f});\n"
        elif part["type"] == "arc":
            sx, sy = part["start"]
            r = part["r"]
            s_deg = part["start_deg"]
            e_deg = part["end_deg"]
            if rope_style == "rope":
                code += f"  \\draw[decorate, decoration={{rope}}, {rope_color}, line width=1.5pt] ({sx:.4f},{sy:.4f}) arc ({s_deg:.2f}:{e_deg:.2f}:{r});\n"
            else:
                code += f"  \\draw[{style}] ({sx:.4f},{sy:.4f}) arc ({s_deg:.2f}:{e_deg:.2f}:{r});\n"
    return code

def generate_flaschenzug_latex(cfg: FlaschenzugConfig) -> str:
    opts = [f"scale={cfg.global_opts.style_scale}", "transform shape"]
    if cfg.global_opts.tikz_opts:
        opts.append(cfg.global_opts.tikz_opts)
    opts_str = ", ".join(opts)

    code = f"\\begin{{tikzpicture}}[{opts_str}]\n"

    all_xs = [p.x for p in cfg.pulleys] + [a.x for a in cfg.anchors]
    all_ys = [p.y for p in cfg.pulleys] + [a.y for a in cfg.anchors]

    if cfg.global_opts.preview_grid and all_xs:
        min_x, max_x = min(all_xs) - 1, max(all_xs) + 1
        min_y, max_y = min(all_ys) - 1, max(all_ys) + 1
        code += f"  \\draw[help lines, color=gray!30, step=1] ({min_x},{min_y}) grid ({max_x},{max_y});\n"

    if cfg.environment.show_boden:
        bx = -cfg.environment.boden_width / 2
        code += f"  \\draw[boden] ({bx:.2f},{cfg.environment.boden_y:.2f}) rectangle ++({cfg.environment.boden_width:.2f},-0.3);\n"

    if cfg.environment.show_decke:
        dx = -cfg.environment.decke_width / 2
        code += f"  \\fill[pattern=north east lines] ({dx:.2f},{cfg.environment.decke_y:.2f}) rectangle ++({cfg.environment.decke_width:.2f},0.3);\n"
        code += f"  \\draw[thick] ({dx:.2f},{cfg.environment.decke_y:.2f}) -- ++({cfg.environment.decke_width:.2f},0);\n"

    for rope in cfg.ropes:
        draw_parts = compute_rope_segments(cfg, rope.path)
        code += generate_rope_tikz(
            draw_parts,
            rope_style=rope.style,
            rope_color=rope.color,
        )

    for m in cfg.masses:
        etype, elem = _find_element(cfg, m.ref)
        if not elem:
            continue
        ref_x = elem.x
        ref_y = elem.y
        length = m.length
        
        if etype == "pulley":
            pr = elem.radius
            if m.relation == "Links":
                start_x, start_y = ref_x - pr, ref_y
            elif m.relation == "Rechts":
                start_x, start_y = ref_x + pr, ref_y
            else:
                start_x, start_y = ref_x, ref_y
        else:
            start_x, start_y = ref_x, ref_y
            
        mass_y = start_y - length
        code += f"  \\halterungseil{{({start_x:g},{start_y:g})}}{{-90}}{{{length:g}}};\n"
        code += f"  \\node[masse, minimum width=0.6cm, minimum height=0.6cm] at ({start_x:g},{mass_y:g}) {{{m.label}}};\n"

    for a in cfg.anchors:
        if a.shape == "Kreis":
            code += f"  \\fill[black] ({a.x:g},{a.y:g}) circle ({a.size:g}pt);\n"
        elif a.shape == "Rechteck":
            code += f"  \\fill[black] ({a.x:g},{a.y:g}) ++(-{a.size:g}pt, -{a.size:g}pt) rectangle ++({a.size*2:g}pt, {a.size*2:g}pt);\n"

    for p in cfg.pulleys:
        code += f"  \\pic at ({p.x:g},{p.y:g}) {{Rolle={p.radius:g}}};\n"

    # Halterungen im Vordergrund
    for hm in cfg.manual_mounts:
        mx1, my1 = hm.x1, hm.y1
        mx2, my2 = hm.x2, hm.y2
        
        dx = mx2 - mx1
        dy = my2 - my1
        angle = math.degrees(math.atan2(dy, dx))
        length = math.hypot(dx, dy)
        
        if hm.type == "Einseitig":
            code += f"  \\pic at ({mx1:g},{my1:g}) {{HalterungEinseitig={angle:g}:{length:g}}};\n"
        elif hm.type == "Zweiseitig":
            code += f"  \\pic at ({mx1:g},{my1:g}) {{HalterungZweiseitig={angle:g}:{length:g}}};\n"

    for p in cfg.pulleys:
        if p.mount == "Einseitig":
            code += f"  \\pic at ({p.x:g},{p.y:g}) {{HalterungEinseitig={p.mount_angle:g}:{p.mount_length:g}}};\n"
        elif p.mount == "Zweiseitig":
            code += f"  \\pic at ({p.x:g},{p.y:g}) {{HalterungZweiseitig={p.mount_angle:g}:{p.mount_length:g}}};\n"

    label_pos_vectors = {
        "above": (0.0, 1.0),
        "above right": (0.7071, 0.7071),
        "right": (1.0, 0.0),
        "below right": (0.7071, -0.7071),
        "below": (0.0, -1.0),
        "below left": (-0.7071, -0.7071),
        "left": (-1.0, 0.0),
        "above left": (-0.7071, 0.7071),
    }

    for p in cfg.pulleys:
        if cfg.global_opts.show_labels and p.label:
            pos_key = p.label_pos if p.label_pos in label_pos_vectors else "above right"
            dx, dy = label_pos_vectors[pos_key]
            lx = p.x + dx * p.radius
            ly = p.y + dy * p.radius
            code += f"  \\node[{pos_key}, font=\\footnotesize] at ({lx:g},{ly:g}) {{{p.label}}};\n"

    for a in cfg.anchors:
        if cfg.global_opts.show_labels and a.label:
            code += f"  \\node[above right, font=\\footnotesize] at ({a.x:g},{a.y:g}) {{{a.label}}};\n"

    for f in cfg.forces:
        pos = None
        if f.ref_type in ("pulley", "anchor"):
            etype, elem = _find_element(cfg, f.ref_name)
            if elem:
                pos = (elem.x, elem.y)
        elif f.ref_type == "mass":
            for m in cfg.masses:
                if m.name == f.ref_name:
                    etype, elem = _find_element(cfg, m.ref)
                    if elem:
                        pos = (elem.x, elem.y - m.length)
                    break

        if pos:
            px_f, py_f = pos
            node_str = f" node[pos=1.1] {{{f.label}}}" if f.label else ""
            code += f"  \\draw[-latex, {f.color}, thick] ({px_f:.4f},{py_f:.4f}) -- ++({f.angle:.1f}:{f.magnitude:.3f}){node_str};\n"

    code += "\\end{tikzpicture}"

    # Standard-Pakete (falls nicht aus Datei geladen)
    default_pakete = r"""\usepackage{pgfplots}
    \pgfplotsset{compat=1.18}
    \usepgfplotslibrary{fillbetween}
    \usepackage{tikz}
    \usetikzlibrary{angles,quotes,intersections,decorations.softclip}
    \usepackage{siunitx}
    \sisetup{locale=DE}"""

    return render_latex_document(
        LatexDocumentSpec(
            body=code,
            class_options=("border=2pt",),
            preamble_parts=(
                shared_package_input(getattr(cfg, "pakete_laden", True), default_pakete),
                shared_commands_input(getattr(cfg, "command_laden", True)),
                font_input(getattr(cfg, "font_family", "Fira")),
                shared_tikz_input(getattr(cfg, "use_tikz", True)),
                HEXCOL_TIKZ_KEY,
            ),
            indent_body=True,
        )
    )
