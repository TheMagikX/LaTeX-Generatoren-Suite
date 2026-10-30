# SPDX-License-Identifier: AGPL-3.0-or-later

import math
from models.geometrie import GeometrieConfig, TriangleConstructionConfig, QuadrilateralConstructionConfig


def _polygon_area(pts: list) -> float:
    """Shoelace formula for any simple polygon."""
    n = len(pts)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += pts[i][0] * pts[j][1]
        area -= pts[j][0] * pts[i][1]
    return abs(area) / 2.0


def _angle_at_vertex(prev_pt, vertex, next_pt) -> float:
    """Interior angle in degrees at `vertex` between edges from prev_pt and to next_pt."""
    v1 = (prev_pt[0] - vertex[0], prev_pt[1] - vertex[1])
    v2 = (next_pt[0] - vertex[0], next_pt[1] - vertex[1])
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag = math.sqrt(v1[0]**2 + v1[1]**2) * math.sqrt(v2[0]**2 + v2[1]**2)
    if mag < 1e-12:
        return 0.0
    return math.degrees(math.acos(max(-1.0, min(1.0, dot / mag))))


def solve_quadrilateral(cfg: QuadrilateralConstructionConfig) -> tuple[dict | None, str | None]:
    """
    Berechnet die Koordinaten A, B, C, D basierend auf dem Modus.
    A ist immer (0,0), B liegt auf der x-Achse.
    """
    A = (0.0, 0.0)
    mode = cfg.mode

    try:
        if mode == "Rectangle":
            a, b = cfg.a, cfg.b
            B = (a, 0.0)
            C = (a, b)
            D = (0.0, b)
            return {
                "coords": {"A": A, "B": B, "C": C, "D": D},
                "sides": {"a": a, "b": b, "c": a, "d": b},
                "angles": {"alpha": 90, "beta": 90, "gamma": 90, "delta": 90},
                "area": round(a * b, 4),
                "perimeter": round(2 * (a + b), 4),
            }, None

        elif mode == "Parallelogram":
            a, b, alpha_deg = cfg.a, cfg.b, cfg.alpha
            alpha_rad = math.radians(alpha_deg)
            B = (a, 0.0)
            Dx = b * math.cos(alpha_rad)
            Dy = b * math.sin(alpha_rad)
            D = (Dx, Dy)
            C = (Dx + a, Dy)
            return {
                "coords": {"A": A, "B": B, "C": C, "D": D},
                "sides": {"a": a, "b": b, "c": a, "d": b},
                "angles": {"alpha": alpha_deg, "beta": 180 - alpha_deg, "gamma": alpha_deg, "delta": 180 - alpha_deg},
                "area": round(a * b * math.sin(alpha_rad), 4),
                "perimeter": round(2 * (a + b), 4),
            }, None

        elif mode == "Trapezoid":
            a, c, h, offset = cfg.a, cfg.c, cfg.height, cfg.offset_c
            B = (a, 0.0)
            D = (offset, h)
            C = (offset + c, h)
            pts = [A, B, C, D]
            return {
                "coords": {"A": A, "B": B, "C": C, "D": D},
                "sides": {
                    "a": a,
                    "b": math.sqrt((B[0]-C[0])**2 + (B[1]-C[1])**2),
                    "c": c,
                    "d": math.sqrt(D[0]**2 + D[1]**2),
                },
                "angles": {
                    "alpha": round(_angle_at_vertex(D, A, B), 2),
                    "beta":  round(_angle_at_vertex(A, B, C), 2),
                    "gamma": round(_angle_at_vertex(B, C, D), 2),
                    "delta": round(_angle_at_vertex(C, D, A), 2),
                },
                "area": round(_polygon_area(pts), 4),
                "perimeter": round(
                    a + math.sqrt((B[0]-C[0])**2+(B[1]-C[1])**2)
                    + c + math.sqrt(D[0]**2+D[1]**2), 4
                ),
            }, None

        elif mode == "Rhombus":
            a, alpha_deg = cfg.a, cfg.alpha
            alpha_rad = math.radians(alpha_deg)
            B = (a, 0.0)
            Dx = a * math.cos(alpha_rad)
            Dy = a * math.sin(alpha_rad)
            D = (Dx, Dy)
            C = (Dx + a, Dy)
            return {
                "coords": {"A": A, "B": B, "C": C, "D": D},
                "sides": {"a": a, "b": a, "c": a, "d": a},
                "angles": {"alpha": alpha_deg, "beta": 180 - alpha_deg, "gamma": alpha_deg, "delta": 180 - alpha_deg},
                "area": round(a**2 * math.sin(alpha_rad), 4),
                "perimeter": round(4 * a, 4),
            }, None

        elif mode == "Kite":
            a, b, alpha_deg = cfg.a, cfg.b, cfg.alpha
            half_rad = math.radians(alpha_deg / 2)
            Bx = a * math.cos(half_rad)
            By = a * math.sin(half_rad)
            B = (Bx, By)
            D = (Bx, -By)
            inner = b**2 - (a * math.sin(half_rad))**2
            if inner < 0:
                return None, "Seite b ist zu kurz für den gegebenen Winkel α."
            C = (Bx + math.sqrt(inner), 0.0)
            return {
                "coords": {"A": A, "B": B, "C": C, "D": D},
                "sides": {"a": a, "b": b, "c": b, "d": a},
                "angles": {
                    "alpha": alpha_deg,
                    "beta":  round(_angle_at_vertex(A, B, C), 2),
                    "gamma": round(_angle_at_vertex(B, C, D), 2),
                    "delta": round(_angle_at_vertex(C, D, A), 2),
                },
                "area": round(_polygon_area([A, B, C, D]), 4),
                "perimeter": round(2 * (a + b), 4),
            }, None

        elif mode == "FreeQuad":
            A = (cfg.p_ax, cfg.p_ay)
            B = (cfg.p_bx, cfg.p_by)
            C = (cfg.p_cx, cfg.p_cy)
            D = (cfg.p_dx, cfg.p_dy)
            a_len = math.sqrt((B[0]-A[0])**2 + (B[1]-A[1])**2)
            b_len = math.sqrt((C[0]-B[0])**2 + (C[1]-B[1])**2)
            c_len = math.sqrt((D[0]-C[0])**2 + (D[1]-C[1])**2)
            d_len = math.sqrt((A[0]-D[0])**2 + (A[1]-D[1])**2)
            e_len = math.sqrt((C[0]-A[0])**2 + (C[1]-A[1])**2)  # diagonal AC
            f_len = math.sqrt((D[0]-B[0])**2 + (D[1]-B[1])**2)  # diagonal BD
            peri = a_len + b_len + c_len + d_len
            return {
                "coords": {"A": A, "B": B, "C": C, "D": D},
                "sides": {
                    "a": round(a_len, 4), "b": round(b_len, 4),
                    "c": round(c_len, 4), "d": round(d_len, 4),
                },
                "angles": {
                    "alpha": round(_angle_at_vertex(D, A, B), 2),
                    "beta":  round(_angle_at_vertex(A, B, C), 2),
                    "gamma": round(_angle_at_vertex(B, C, D), 2),
                    "delta": round(_angle_at_vertex(C, D, A), 2),
                },
                "diagonals": {"e": round(e_len, 4), "f": round(f_len, 4)},
                "area": round(_polygon_area([A, B, C, D]), 4),
                "perimeter": round(peri, 4),
            }, None

    except Exception as e:
        return None, str(e)

    return None, "Modus nicht implementiert."
from core.latex_document import (
    HEXCOL_TIKZ_KEY,
    LatexDocumentSpec,
    font_input,
    render_latex_document,
    shared_commands_input,
    shared_package_input,
)


def solve_triangle(cfg: TriangleConstructionConfig) -> tuple[dict | None, str | None]:
    """
    Berechnet die Koordinaten A, B, C basierend auf dem Modus.
    A ist immer (0,0), B liegt auf der x-Achse.
    Rückgabe: (result_dict, error_msg)
    """
    A = (0.0, 0.0)
    mode = cfg.mode

    try:
        if mode == "SSS":
            a, b, c = cfg.a, cfg.b, cfg.c
            if a + b <= c or a + c <= b or b + c <= a:
                return None, "Dreiecksungleichung verletzt (Seiten zu kurz/lang)."
            cos_alpha = (b**2 + c**2 - a**2) / (2 * b * c)
            alpha_rad = math.acos(cos_alpha)
            B = (c, 0.0)
            Cx = b * math.cos(alpha_rad)
            Cy = b * math.sin(alpha_rad)
            C = (Cx, Cy)
            beta_rad = math.acos((a**2 + c**2 - b**2) / (2 * a * c))
            gamma_rad = math.pi - alpha_rad - beta_rad
            area = _polygon_area([A, B, C])
            return {
                "coords": {"A": A, "B": B, "C": C},
                "sides": {"a": a, "b": b, "c": c},
                "angles": {
                    "alpha": math.degrees(alpha_rad),
                    "beta": math.degrees(beta_rad),
                    "gamma": math.degrees(gamma_rad),
                },
                "area": round(area, 4),
                "perimeter": round(a + b + c, 4),
            }, None

        elif mode == "SWS":
            c = cfg.c
            b = cfg.b
            alpha_deg = cfg.alpha
            alpha_rad = math.radians(alpha_deg)
            B = (c, 0.0)
            Cx = b * math.cos(alpha_rad)
            Cy = b * math.sin(alpha_rad)
            C = (Cx, Cy)
            a = math.sqrt((B[0] - Cx) ** 2 + (B[1] - Cy) ** 2)
            cos_beta = (a**2 + c**2 - b**2) / (2 * a * c)
            cos_beta = max(-1.0, min(1.0, cos_beta))
            beta_rad = math.acos(cos_beta)
            gamma_rad = math.pi - alpha_rad - beta_rad
            area = _polygon_area([A, B, C])
            return {
                "coords": {"A": A, "B": B, "C": C},
                "sides": {"a": a, "b": b, "c": c},
                "angles": {
                    "alpha": alpha_deg,
                    "beta": math.degrees(beta_rad),
                    "gamma": math.degrees(gamma_rad),
                },
                "area": round(area, 4),
                "perimeter": round(a + b + c, 4),
            }, None

        elif mode == "WSW":
            c = cfg.c
            alpha_deg = cfg.alpha
            beta_deg = cfg.beta
            if alpha_deg + beta_deg >= 180:
                return None, "Winkelsumme >= 180°."
            gamma_deg = 180.0 - alpha_deg - beta_deg
            sin_a = math.sin(math.radians(alpha_deg))
            sin_b = math.sin(math.radians(beta_deg))
            sin_g = math.sin(math.radians(gamma_deg))
            a = c * sin_a / sin_g
            b = c * sin_b / sin_g
            alpha_rad = math.radians(alpha_deg)
            B = (c, 0.0)
            Cx = b * math.cos(alpha_rad)
            Cy = b * math.sin(alpha_rad)
            C = (Cx, Cy)
            area = _polygon_area([A, B, C])
            return {
                "coords": {"A": A, "B": B, "C": C},
                "sides": {"a": a, "b": b, "c": c},
                "angles": {"alpha": alpha_deg, "beta": beta_deg, "gamma": gamma_deg},
                "area": round(area, 4),
                "perimeter": round(a + b + c, 4),
            }, None

    except Exception as e:
        return None, str(e)

    return None, "Modus nicht implementiert."


def _generate_tikz_body(cfg: GeometrieConfig, result: dict) -> str:
    coords = result["coords"]
    sides = result["sides"]
    angles = result["angles"]
    Ax, Ay = coords["A"]
    Bx, By = coords["B"]
    Cx, Cy = coords["C"]
    a_len, b_len, c_len = sides["a"], sides["b"], sides["c"]
    alpha_deg = angles["alpha"]
    beta_deg = angles["beta"]

    el = cfg.elements
    st = cfg.style
    rot = cfg.construction.rotation
    step = cfg.construction.step
    mode = cfg.construction.mode

    code = []

    if rot != 0:
        code.append(f"\\begin{{scope}}[rotate={rot}]")

    # Grid
    if el.others.grid:
        max_x = max(Ax, Bx, Cx) + 1
        max_y = max(Ay, By, Cy) + 1
        min_x = min(Ax, Bx, Cx) - 1
        min_y = min(Ay, By, Cy) - 1
        code.append(
            f"  \\draw[help lines, color=gray!20, step=1] "
            f"({min_x:.1f},{min_y:.1f}) grid ({max_x:.1f},{max_y:.1f});"
        )

    # Coordinate definitions
    code.append("  % Koordinaten")
    code.append(f"  \\coordinate (A) at ({Ax:.3f},{Ay:.3f});")
    code.append(f"  \\coordinate (B) at ({Bx:.3f},{By:.3f});")
    code.append(f"  \\coordinate (C) at ({Cx:.3f},{Cy:.3f});")

    if step == 0:
        # Angle arcs
        if el.angles.show_arcs:
            ang = el.angles
            ma = el.measurements.show_angles
            
            def format_angle_label(orig, value, show_orig, show_val):
                if not show_val:
                    return orig if show_orig else ""
                val_str = rf"{value:.1f}^\circ"
                if not show_orig:
                    return f"${val_str}$"
                if orig.startswith("$") and orig.endswith("$"):
                    return f"${orig[1:-1]} = {val_str}$"
                return f"{orig} ${val_str}$"

            lab_a = format_angle_label(ang.labels.alpha, angles['alpha'], ang.show_labels, ma.alpha)
            lab_b = format_angle_label(ang.labels.beta, angles['beta'], ang.show_labels, ma.beta)
            lab_g = format_angle_label(ang.labels.gamma, angles['gamma'], ang.show_labels, ma.gamma)
            
            code.append("  % Winkel")
            code.append(
                f"  \\pic [draw, hexcol={ang.colors.alpha}, fill opacity={ang.opacities.alpha}, "
                f"text opacity=1, \"{lab_a}\", angle radius={ang.radii.alpha:.0f}mm] {{angle = B--A--C}};"
            )
            code.append(
                f"  \\pic [draw, hexcol={ang.colors.beta}, fill opacity={ang.opacities.beta}, "
                f"text opacity=1, \"{lab_b}\", angle radius={ang.radii.beta:.0f}mm] {{angle = C--B--A}};"
            )
            code.append(
                f"  \\pic [draw, hexcol={ang.colors.gamma}, fill opacity={ang.opacities.gamma}, "
                f"text opacity=1, \"{lab_g}\", angle radius={ang.radii.gamma:.0f}mm] {{angle = A--C--B}};"
            )

        # Triangle fill & stroke with optional live labels for sides
        ms = el.measurements.show_sides
        l_a = rf"$a = {a_len:.1f}\text{{ cm}}$" if ms.a else ""
        l_b = rf"$b = {b_len:.1f}\text{{ cm}}$" if ms.b else ""
        l_c = rf"$c = {c_len:.1f}\text{{ cm}}$" if ms.c else ""
        
        if ms.a or ms.b or ms.c:
            code.append(
                f"  \\draw[{st.line_width}, draw={st.stroke_color}, fill={st.fill_color}, fill opacity={st.fill_opacity}] "
                f"(B) -- node[auto] {{{l_a}}} (C) -- node[auto] {{{l_b}}} (A) -- node[auto] {{{l_c}}} (B) -- cycle;"
            )
        else:
            code.append(
                f"  \\draw[{st.line_width}, draw={st.stroke_color}, fill={st.fill_color}, "
                f"fill opacity={st.fill_opacity}] (A) -- (B) -- (C) -- cycle;"
            )

        code.append("  % Charakteristische Linien")

        # Heights
        hs = el.heights
        for h, from_pt, proj_name, p1, p2 in [
            (hs.hc, "C", "Hc", "A", "B"),
            (hs.ha, "A", "Ha", "B", "C"),
            (hs.hb, "B", "Hb", "A", "C"),
        ]:
            if h.show:
                code.append(f"  \\coordinate ({proj_name}) at ($({p1})!({from_pt})!({p2})$);")
                lbl = h.label if h.show_label else ""
                node = f" node[{h.options}] {{{lbl}}}" if lbl else ""
                code.append(f"  \\draw[{h.style}] ({from_pt}) -- ({proj_name}){node};")
                if h.show_right_angle:
                    code.append(f"  \\pic [draw, angle radius=3mm] {{right angle = {from_pt}--{proj_name}--{p2}}};")

        # Medians
        ms = el.medians
        for m, from_pt, mid in [
            (ms.sc, "C", "$(A)!0.5!(B)$"),
            (ms.sa, "A", "$(B)!0.5!(C)$"),
            (ms.sb, "B", "$(A)!0.5!(C)$"),
        ]:
            if m.show:
                lbl = m.label if m.show_label else ""
                node = f" node[{m.options}] {{{lbl}}}" if lbl else ""
                code.append(f"  \\draw[{m.style}] ({from_pt}) -- ({mid}){node};")

        # Angle bisectors
        ab = el.angle_bisectors
        bisectors = [
            (ab.wa, "A", b_len, Bx, By, c_len, Cx, Cy),
            (ab.wb, "B", a_len, Ax, Ay, c_len, Cx, Cy),
            (ab.wc, "C", a_len, Ax, Ay, b_len, Bx, By),
        ]
        for w, from_pt, w1, x1, y1, w2, x2, y2 in bisectors:
            if w.show:
                Wx = (w1 * x1 + w2 * x2) / (w1 + w2)
                Wy = (w1 * y1 + w2 * y2) / (w1 + w2)
                lbl = w.label if w.show_label else ""
                node = f" node[{w.options}] {{{lbl}}}" if lbl else ""
                code.append(f"  \\draw[{w.style}] ({from_pt}) -- ({Wx:.3f},{Wy:.3f}){node};")

        # Circumcenter for perpendicular bisectors
        D_val = 2 * (Ax * (By - Cy) + Bx * (Cy - Ay) + Cx * (Ay - By))
        if abs(D_val) > 1e-9:
            Ux = (
                (Ax**2 + Ay**2) * (By - Cy)
                + (Bx**2 + By**2) * (Cy - Ay)
                + (Cx**2 + Cy**2) * (Ay - By)
            ) / D_val
            Uy = (
                (Ax**2 + Ay**2) * (Cx - Bx)
                + (Bx**2 + By**2) * (Ax - Cx)
                + (Cx**2 + Cy**2) * (Bx - Ax)
            ) / D_val
        else:
            Ux, Uy = 0.0, 0.0

        ext = "-1cm"
        pb = el.perpendicular_bisectors
        perp_sides = [
            (pb.ma, (Bx + Cx) / 2, (By + Cy) / 2),
            (pb.mb, (Ax + Cx) / 2, (Ay + Cy) / 2),
            (pb.mc, (Ax + Bx) / 2, (Ay + By) / 2),
        ]
        for m, Mx, My in perp_sides:
            if m.show:
                lbl = m.label if m.show_label else ""
                node = f" node[pos=0.5, auto, font=\\tiny] {{{lbl}}}" if lbl else ""
                code.append(
                    f"  \\draw[{m.style}, shorten >={ext}] ({Mx:.3f},{My:.3f}) -- ({Ux:.3f},{Uy:.3f}){node};"
                )

        # Circles
        if el.others.incircle or el.others.circumcircle:
            s = (a_len + b_len + c_len) / 2
            area = math.sqrt(s * (s - a_len) * (s - b_len) * (s - c_len))

            if el.others.incircle and area > 1e-9:
                peri = a_len + b_len + c_len
                Ix = (a_len * Ax + b_len * Bx + c_len * Cx) / peri
                Iy = (a_len * Ay + b_len * By + c_len * Cy) / peri
                r_in = area / s
                code.append(f"  \\draw[dashed, color=blue] ({Ix:.3f},{Iy:.3f}) circle ({r_in:.3f});")
                code.append(f"  \\fill[blue] ({Ix:.3f},{Iy:.3f}) circle (1pt);")

            if el.others.circumcircle and area > 1e-9:
                R = (a_len * b_len * c_len) / (4 * area)
                code.append(f"  \\draw[dashed, color=red] ({Ux:.3f},{Uy:.3f}) circle ({R:.3f});")
                code.append(f"  \\fill[red] ({Ux:.3f},{Uy:.3f}) circle (1pt);")

        # Points
        if el.points.show:
            L = el.points.labels
            code.append("  % Punkte")
            code.append(f"  \\fill (A) circle (1.5pt) node[below left] {{{L.A}}};")
            code.append(f"  \\fill (B) circle (1.5pt) node[below right] {{{L.B}}};")
            code.append(f"  \\fill (C) circle (1.5pt) node[above] {{{L.C}}};")

    else:
        # Construction steps
        L = el.points.labels
        if step >= 1:
            code.append("  % Schritt 1: Grundseite c")
            code.append(f"  \\draw[{st.line_width}, draw={st.stroke_color}] (A) -- (B);")
            code.append(f"  \\fill (A) circle (1.5pt) node[below left] {{{L.A}}};")
            code.append(f"  \\fill (B) circle (1.5pt) node[below right] {{{L.B}}};")

        if mode == "SSS":
            if step >= 2:
                code.append("  % Schritt 2: Kreisbogen um A")
                ang_AC = math.degrees(math.atan2(Cy - Ay, Cx - Ax))
                code.append(f"  \\draw[dashed, gray] (A) ++({ang_AC - 20}:{b_len:.3f}) arc ({ang_AC - 20}:{ang_AC + 20}:{b_len:.3f});")
            if step >= 3:
                code.append("  % Schritt 3: Kreisbogen um B")
                ang_BC_val = math.degrees(math.atan2(Cy - By, Cx - Bx))
                code.append(f"  \\draw[dashed, gray] (B) ++({ang_BC_val - 20}:{a_len:.3f}) arc ({ang_BC_val - 20}:{ang_BC_val + 20}:{a_len:.3f});")
            if step >= 4:
                code.append("  % Schritt 4: Fertiges Dreieck")
                code.append(f"  \\draw[{st.line_width}, draw={st.stroke_color}, fill={st.fill_color}, fill opacity={st.fill_opacity}] (A) -- (B) -- (C) -- cycle;")
                code.append(f"  \\fill (C) circle (1.5pt) node[above] {{{L.C}}};")

        elif mode == "SWS":
            if step >= 2:
                code.append(f"  % Schritt 2: Winkel alpha ({alpha_deg:.1f} Grad)")
                code.append(f"  \\draw[dashed, gray] (A) -- +({alpha_deg:.3f}:{b_len + 1:.3f});")
                code.append(f"  \\pic [draw, \"\", angle radius=10mm] {{angle = B--A--C}};")
            if step >= 3:
                code.append(f"  % Schritt 3: Seite b abtragen")
                code.append(f"  \\draw[{st.line_width}, draw={st.stroke_color}] (A) -- (C);")
                code.append(f"  \\fill (C) circle (1.5pt) node[above] {{{L.C}}};")
            if step >= 4:
                code.append("  % Schritt 4: Fertiges Dreieck")
                code.append(f"  \\draw[{st.line_width}, draw={st.stroke_color}, fill={st.fill_color}, fill opacity={st.fill_opacity}] (A) -- (B) -- (C) -- cycle;")

        elif mode == "WSW":
            if step >= 2:
                code.append(f"  % Schritt 2: Winkel alpha ({alpha_deg:.1f} Grad)")
                code.append(f"  \\draw[dashed, gray] (A) -- +({alpha_deg:.3f}:{b_len + 1:.3f});")
                code.append(f"  \\pic [draw, \"\", angle radius=10mm] {{angle = B--A--C}};")
            if step >= 3:
                code.append(f"  % Schritt 3: Winkel beta ({beta_deg:.1f} Grad)")
                code.append(f"  \\draw[dashed, gray] (B) -- +({180 - beta_deg:.3f}:{a_len + 1:.3f});")
                code.append(f"  \\pic [draw, \"\", angle radius=10mm] {{angle = C--B--A}};")
            if step >= 4:
                code.append("  % Schritt 4: Schnittpunkt C und fertiges Dreieck")
                code.append(f"  \\draw[{st.line_width}, draw={st.stroke_color}, fill={st.fill_color}, fill opacity={st.fill_opacity}] (A) -- (B) -- (C) -- cycle;")
                code.append(f"  \\fill (C) circle (1.5pt) node[above] {{{L.C}}};")

    if rot != 0:
        code.append("\\end{scope}")

    return "\n".join(code)


def _generate_tikz_quad(cfg: GeometrieConfig, result: dict) -> str:
    coords = result["coords"]
    sides = result["sides"]
    angles = result["angles"]
    Ax, Ay = coords["A"]
    Bx, By = coords["B"]
    Cx, Cy = coords["C"]
    Dx, Dy = coords["D"]

    el = cfg.elements
    st = cfg.style
    rot = cfg.construction.rotation

    code = []
    if rot != 0:
        code.append(f"\\begin{{scope}}[rotate={rot}]")

    code.append("  % Koordinaten")
    code.append(f"  \\coordinate (A) at ({Ax:.3f},{Ay:.3f});")
    code.append(f"  \\coordinate (B) at ({Bx:.3f},{By:.3f});")
    code.append(f"  \\coordinate (C) at ({Cx:.3f},{Cy:.3f});")
    code.append(f"  \\coordinate (D) at ({Dx:.3f},{Dy:.3f});")

    # Angle arcs for quadrilateral
    if el.angles.show_arcs:
        ang = el.angles
        ma = el.measurements.show_angles

        def format_angle_label(orig, value, show_orig, show_val):
            if not show_val:
                return orig if show_orig else ""
            val_str = rf"{value:.1f}^\circ"
            if not show_orig:
                return f"${val_str}$"
            if orig.startswith("$") and orig.endswith("$"):
                return f"${orig[1:-1]} = {val_str}$"
            return f"{orig} ${val_str}$"

        lab_a = format_angle_label(ang.labels.alpha, angles.get('alpha', 0), ang.show_labels, ma.alpha)
        lab_b = format_angle_label(ang.labels.beta, angles.get('beta', 0), ang.show_labels, ma.beta)
        lab_g = format_angle_label(ang.labels.gamma, angles.get('gamma', 0), ang.show_labels, ma.gamma)
        lab_d = format_angle_label(ang.labels.delta, angles.get('delta', 0), ang.show_labels, ma.delta)

        code.append("  % Winkel")
        code.append(f"  \\pic [draw, hexcol={ang.colors.alpha}, fill opacity={ang.opacities.alpha}, \"{lab_a}\", angle radius={ang.radii.alpha:.0f}mm] {{angle = B--A--D}};")
        code.append(f"  \\pic [draw, hexcol={ang.colors.beta}, fill opacity={ang.opacities.beta}, \"{lab_b}\", angle radius={ang.radii.beta:.0f}mm] {{angle = C--B--A}};")
        code.append(f"  \\pic [draw, hexcol={ang.colors.gamma}, fill opacity={ang.opacities.gamma}, \"{lab_g}\", angle radius={ang.radii.gamma:.0f}mm] {{angle = D--C--B}};")
        code.append(f"  \\pic [draw, hexcol={ang.colors.delta}, fill opacity={ang.opacities.delta}, \"{lab_d}\", angle radius={ang.radii.delta:.0f}mm] {{angle = A--D--C}};")

    # Quadrilateral fill & stroke with optional live labels for sides
    ms = el.measurements.show_sides
    l_a = rf"$a = {sides['a']:.1f}\text{{ cm}}$" if ms.a else ""
    l_b = rf"$b = {sides['b']:.1f}\text{{ cm}}$" if ms.b else ""
    l_c = rf"$c = {sides['c']:.1f}\text{{ cm}}$" if ms.c else ""
    l_d = rf"$d = {sides['d']:.1f}\text{{ cm}}$" if ms.d else ""

    if ms.a or ms.b or ms.c or ms.d:
        code.append(
            f"  \\draw[{st.line_width}, draw={st.stroke_color}, fill={st.fill_color}, fill opacity={st.fill_opacity}] "
            f"(A) -- node[below] {{{l_a}}} (B) -- node[right] {{{l_b}}} (C) -- node[above] {{{l_c}}} (D) -- node[left] {{{l_d}}} cycle;"
        )
    else:
        code.append(
            f"  \\draw[{st.line_width}, draw={st.stroke_color}, fill={st.fill_color}, "
            f"fill opacity={st.fill_opacity}] (A) -- (B) -- (C) -- (D) -- cycle;"
        )

    # Height for quadrilaterals (if requested via heights.hc or similar, typically height from C or D to AB)
    if el.heights.hc.show:
        h = el.heights.hc
        code.append(f"  \\coordinate (Hq) at ($(A)!(C)!(B)$);")
        lbl = h.label if h.show_label else ""
        node = f" node[{h.options}] {{{lbl}}}" if lbl else ""
        code.append(f"  \\draw[{h.style}] (C) -- (Hq){node};")
        if h.show_right_angle:
            code.append(f"  \\pic [draw, angle radius=3mm] {{right angle = C--Hq--B}};")

    if el.points.show:
        L = el.points.labels
        code.append("  % Punkte")
        code.append(f"  \\fill (A) circle (1.5pt) node[below left] {{{L.A}}};")
        code.append(f"  \\fill (B) circle (1.5pt) node[below right] {{{L.B}}};")
        code.append(f"  \\fill (C) circle (1.5pt) node[above right] {{{L.C}}};")
        code.append(f"  \\fill (D) circle (1.5pt) node[above left] {{{L.D}}};")

    if rot != 0:
        code.append("\\end{scope}")

    return "\n".join(code)


def generate_geometrie_latex(cfg: GeometrieConfig) -> str:
    if cfg.shape == "Triangle":
        result, error = solve_triangle(cfg.construction)
        if error or result is None:
            tikz_body = f"% Fehler: {error}"
        else:
            tikz_body = _generate_tikz_body(cfg, result)
    else:
        result, error = solve_quadrilateral(cfg.quad_construction)
        if error or result is None:
            tikz_body = f"% Fehler: {error}"
        else:
            tikz_body = _generate_tikz_quad(cfg, result)

    default_pakete = (
        "\\usepackage{tikz}\n"
        "\\usetikzlibrary{calc, angles, quotes, intersections}\n"
        "\\usepackage[utf8]{inputenc}\n"
    )
    body = "\\begin{tikzpicture}\n" + tikz_body.strip() + "\n\\end{tikzpicture}"

    return render_latex_document(
        LatexDocumentSpec(
            body=body,
            class_options=("border=5mm",),
            preamble_parts=(
                shared_package_input(cfg.pakete_laden, default_pakete),
                shared_commands_input(cfg.command_laden),
                font_input(getattr(cfg, "font_family", "Fira")),
                cfg.preamble_add,
                HEXCOL_TIKZ_KEY,
            ),
        )
    )
