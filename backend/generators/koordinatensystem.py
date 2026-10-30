# SPDX-License-Identifier: AGPL-3.0-or-later

import re
from models.koordinatensystem import CoordinateSystemConfig, PlotConfig, CSVPlotConfig, ParametricPlotConfig, PointConfig, NodeConfig

def _format_plot_style(p: PlotConfig) -> str:
    parts = []
    c = p.color or "#1e293b"
    if c.startswith("#"):
        parts.append(f"hexcol={c[1:].upper()}")
    elif c.startswith("hexcol="):
        parts.append(c)
    elif c:
        parts.append(c)

    if p.line_width:
        parts.append(p.line_width)

    if p.line_style and p.line_style != "solid":
        parts.append(p.line_style)

    if p.custom_style:
        parts.append(p.custom_style)

    if not parts:
        if p.settings:
            return p.settings
        return "black, thick"

    return ", ".join(parts)

def _format_csv_style(p: CSVPlotConfig) -> str:
    parts = []
    c = p.color or "#1e293b"
    if c.startswith("#"):
        parts.append(f"hexcol={c[1:].upper()}")
    elif c.startswith("hexcol="):
        parts.append(c)
    elif c:
        parts.append(c)

    if p.line_width:
        parts.append(p.line_width)

    if p.line_style and p.line_style != "solid":
        parts.append(p.line_style)

    if p.custom_style:
        parts.append(p.custom_style)

    if not parts:
        if p.style:
            return p.style
        return "black, thick"

    return ", ".join(parts)

def _format_param_style(p: ParametricPlotConfig) -> str:
    parts = []
    c = p.color or "#1e293b"
    if c.startswith("#"):
        parts.append(f"hexcol={c[1:].upper()}")
    elif c.startswith("hexcol="):
        parts.append(c)
    elif c:
        parts.append(c)

    if p.line_width:
        parts.append(p.line_width)

    if p.line_style and p.line_style != "solid":
        parts.append(p.line_style)

    if p.custom_style:
        parts.append(p.custom_style)

    if not parts:
        if p.settings:
            return p.settings
        return "black, thick"

    return ", ".join(parts)

def _clean_mark_style(style_str: str) -> str:
    if not style_str:
        return ""
    color_names = {"black", "darkgray", "gray", "lightgray", "blue", "red", "green", "purple", "violet", "orange", "teal", "cyan", "magenta", "yellow", "white"}
    tokens = [t.strip() for t in style_str.split(",") if t.strip()]
    cleaned = []
    for t in tokens:
        t_low = t.lower()
        if t_low in color_names or t_low.startswith("hexcol=") or t_low.startswith("#") or t_low.startswith("color="):
            continue
        cleaned.append(t)
    return ", ".join(cleaned)

from core.latex_document import PGFPLOTS_FALLBACK_PACKAGES, render_standalone_tikz

def _format_node_opts(n: NodeConfig) -> str:
    parts = []
    c = n.color or "#1e293b"
    if c.startswith("#"):
        parts.append(f"hexcol={c[1:].upper()}")
        parts.append("draw=none")
    elif c.startswith("hexcol="):
        parts.append(c)
        parts.append("draw=none")
    elif c:
        parts.append(c)
        parts.append("draw=none")

    if n.font_size:
        parts.append(f"font={n.font_size}")

    if n.anchor:
        if "=" in n.anchor:
            parts.append(n.anchor)
        elif n.anchor in {"above", "below", "left", "right"}:
            parts.append(n.anchor)
        else:
            parts.append(f"anchor={n.anchor}")

    if n.bg_white:
        parts.append("fill=white")

    if n.custom_opts:
        parts.append(n.custom_opts)

    if not parts and n.opts:
        return n.opts

    return ", ".join(parts)

def _format_point_label_style(pt: PointConfig, pt_col: str) -> str:
    parts = [pt_col, "draw=none"]
    if pt.anchor:
        if "=" in pt.anchor:
            parts.append(pt.anchor)
        elif pt.anchor in {"above", "below", "left", "right"}:
            parts.append(pt.anchor)
        else:
            parts.append(f"anchor={pt.anchor}")
            
    if pt.custom_label_style:
        parts.append(pt.custom_label_style)
        
    if len(parts) == 2 and pt.label_style:
        parts.append(pt.label_style)
        
    return ", ".join(parts)

def generate_koordinatensystem_latex(cfg: CoordinateSystemConfig) -> str:
    # --- PGFPLOTS CONSTRUCTION ---

    # 1. Deklaration von Funktionen für Wiederverwendung (z.B. in Steigungsdreiecken, Tangenten)
    declared_functions = []
    for i, p in enumerate(cfg.plots):
        if not (p.func and p.show):
            continue
        any_slope_active = any(s.show for s in p.slopes)
        any_tangent_active = any(t.show for t in p.tangents)
        if any_slope_active or any_tangent_active:
            func_body = re.sub(r'\bx\b', r'\\x', p.func)
            declared_functions.append(f"func_{i}(\\x)={func_body};")

    declare_opts = f"declare function={{{' '.join(declared_functions)}}}" if declared_functions else ""

    # 2. Basis-Optionen für die Axis-Umgebung
    axis_extras_clean = cfg.axis_extras.strip().lstrip(",").strip() if cfg.axis_extras else ""
    axis_extras = f", {axis_extras_clean}" if axis_extras_clean else ""
    opts = [
        f"width={cfg.width_cm}cm",
        f"unit vector ratio*={cfg.scale_x} {cfg.scale_y}",
        "scale only axis", "clip=true",
        f"xmin={cfg.xmin}, xmax={cfg.xmax}", f"ymin={cfg.ymin}, ymax={cfg.ymax}",
        "axis lines=center", f"axis line style={{line width={cfg.axis_width}pt,draw={cfg.axis_color}{axis_extras}}}",
    ]
    if declare_opts:
        opts.append(declare_opts)

    if cfg.xlog:
        opts.append("xmode=log")
    if cfg.ylog:
        opts.append("ymode=log")

    # 3. Ticks Logic
    tausendertrennerx = "." if cfg.sep_x else ""
    fracanzeige_x = "frac" if cfg.xtickfrac else ""
    if cfg.tick_mode == "Manuell" and cfg.x_tick_pos_manuell:
        xticks_manual = [s.strip() for s in cfg.x_tick_pos_manuell.split(",") if s.strip()]
        if xticks_manual:
            opts.append(f"xtick={{{','.join(xticks_manual)}}}")
    elif cfg.tick_mode == "Bereich" and cfg.xticklist:
        xticks = [t.strip() for t in cfg.xticklist.split(",") if t.strip()]
        if xticks:
            opts.append(f"xtick={{{','.join(xticks)}}}")

    if cfg.majorticklabels:
        if cfg.tick_mode == "Manuell" and cfg.x_tick_pos_manuell and cfg.x_tick_label_manuell:
            x_lab = [s.strip() for s in cfg.x_tick_label_manuell.split(",") if s.strip()]
            if x_lab:
                opts.append(f"xticklabels={{{','.join(x_lab)}}}")
        else:
            opts += [
                rf"xticklabel={{\pgfmathparse{{\tick*{cfg.mult_x}}}\pgfmathprintnumber[fixed, fixed zerofill, precision={cfg.prec_x},use comma,{fracanzeige_x}]{{\pgfmathresult}}{cfg.label_suffix_x}}}",
                f"xticklabel style={{{cfg.xtickformat},/pgf/number format/1000 sep={tausendertrennerx}}}",
            ]
    else:
        opts.append("xticklabel={\\empty}")

    tausendertrennery = "." if cfg.sep_y else ""
    fracanzeige_y = "frac" if cfg.ytickfrac else ""
    if cfg.tick_mode == "Manuell" and cfg.y_tick_pos_manuell:
        yticks_manual = [s.strip() for s in cfg.y_tick_pos_manuell.split(",") if s.strip()]
        if yticks_manual:
            opts.append(f"ytick={{{','.join(yticks_manual)}}}")
    elif cfg.tick_mode == "Bereich" and cfg.yticklist:
        yticks = [t.strip() for t in cfg.yticklist.split(",") if t.strip()]
        if yticks:
            opts.append(f"ytick={{{','.join(yticks)}}}")

    if cfg.majorticklabels:
        if cfg.tick_mode == "Manuell" and cfg.y_tick_pos_manuell and cfg.y_tick_label_manuell:
            y_lab = [s.strip() for s in cfg.y_tick_label_manuell.split(",") if s.strip()]
            if y_lab:
                opts.append(f"yticklabels={{{','.join(y_lab)}}}")
        else:
            opts += [
                rf"yticklabel={{\pgfmathparse{{\tick*{cfg.mult_y}}}\pgfmathprintnumber[fixed, fixed zerofill, precision={cfg.prec_y},use comma,{fracanzeige_y}]{{\pgfmathresult}}{cfg.label_suffix_y}}}",
                f"yticklabel style={{{cfg.ytickformat},/pgf/number format/1000 sep={tausendertrennery}}}",
            ]
    else:
        opts.append("yticklabel={\\empty}")

    tick_extras_clean = cfg.tick_extras.strip().lstrip(",").strip() if cfg.tick_extras else ""
    tick_extras = f", {tick_extras_clean}" if tick_extras_clean else ""
    opts.append(f"major tick style={{line width={cfg.tick_width}pt,draw={cfg.tick_color}{tick_extras}}}" if cfg.ticks_show else "major tick style={draw=none}")

    if cfg.label_show:
        xlab_bg = f",fill=white,inner sep={cfg.xlabel_background_sep}pt" if cfg.xlabel_background else ""
        ylab_bg = f",fill=white,inner sep={cfg.ylabel_background_sep}pt" if cfg.ylabel_background else ""
        yrot = "rotate=90" if cfg.ylabel_rot else ""
        yanch = "north east" if cfg.ylabel_rot else "west"
        opts += [
            f"xlabel={{{cfg.xlabel}}}",
            f"every axis x label/.style={{at={{(axis description cs:{cfg.xlabel_pos})}}, anchor=east}}",
            f"ylabel={{{cfg.ylabel}}}",
            f"every axis y label/.style={{at={{(axis description cs:{cfg.ylabel_pos})}}, anchor={yanch}}}",
            f"x label style={{{xlab_bg}}}",
            f"y label style={{ {ylab_bg},{yrot} }}",
        ]

    opts += [
        "xmajorgrids=true", "ymajorgrids=true", "xminorgrids=true", "yminorgrids=true",
        f"minor x tick num={cfg.minor_x}", f"minor y tick num={cfg.minor_y}",
        "minor tick style={draw=none}", "major tick length=8pt",
    ]

    if cfg.grid_show:
        major_extras_clean = cfg.grid_major_extras.strip().lstrip(",").strip() if cfg.grid_major_extras else ""
        major_extras = f", {major_extras_clean}" if major_extras_clean else ""
        minor_extras_clean = cfg.grid_minor_extras.strip().lstrip(",").strip() if cfg.grid_minor_extras else ""
        minor_extras = f", {minor_extras_clean}" if minor_extras_clean else ""
        opts += [
            f"major grid style={{line width={cfg.grid_major_width}pt, draw={cfg.grid_major_color}{major_extras}}}",
            f"minor grid style={{line width={cfg.grid_minor_width}pt, draw={cfg.grid_minor_color}{minor_extras}, blend mode=darken}}",
        ]
    else:
        opts.append("grid=none")

    # 4. Plot Contents Assembly
    csv_cmds = []
    for p in cfg.csv_plots:
        if not p.show:
            continue
        path = p.path.replace("\\", "/").strip()
        if not (path and p.xcol and p.ycol):
            continue
        # Sicherheitsvalidierung gegen Path-Traversal und LaTeX-Injection
        if (
            ".." in path.split("/")
            or any(ch in path for ch in ("{", "}", "$", "%", "\\"))
            or not path.lower().endswith((".csv", ".txt", ".dat"))
        ):
            continue

        base_style = _format_csv_style(p)
        style_parts = [base_style, f"restrict y to domain={cfg.ymin}:{cfg.ymax}"]

        if p.only_marks:
            style_parts.append("only marks")
            style_parts.append(f"mark={p.marker_symbol}")
            style_parts.append(f"mark size={p.marker_size}pt")

        table_opts = [f"x={p.xcol}", f"y={p.ycol}", f"col sep={p.sep}"]
        if p.read_comma:
            table_opts.append("/pgf/number format/read comma as period")

        csv_cmds.append(fr"\addplot[{', '.join(style_parts)}] table[{','.join(table_opts)}] {{{path}}};")

    curve_cmds = []
    shade_under_cmds = []
    shade_between_cmds = []
    slope_cmds = []

    for i, p in enumerate(cfg.plots):
        if not (p.func and p.show):
            continue

        px_min = p.xmin if p.xmin is not None else cfg.xmin
        px_max = p.xmax if p.xmax is not None else cfg.xmax

        curve_name = f"curve{i}"
        lbl_snip = ""
        if p.label_text:
            lbl_snip = rf" node[pos={p.label_pos}, {p.label_style}] {{{p.label_text}}}"

        plot_style = _format_plot_style(p)
        curve_cmds.append(rf"\addplot[{plot_style}, name path={curve_name}, domain={px_min}:{px_max}, samples={cfg.samples}, restrict y to domain={cfg.ymin}:{cfg.ymax}] {{{p.func}}}{lbl_snip};")

        # Shades (Unter Kurve)
        for j, s in enumerate(p.shades):
            if not s.show:
                continue

            a = s.a if s.a is not None else px_min
            b = s.b if s.b is not None else px_max
            pat_str = f", pattern={s.pattern}" if s.pattern != "none" else ""

            base = f"base{i}_{j}"
            shade_under_cmds += [
                rf"\path[name path={base}] (axis cs:{px_min},0) -- (axis cs:{px_max},0);",
                rf"\addplot[fill={s.fill}{pat_str}, draw={s.draw}, fill opacity={s.alpha}, forget plot] fill between[of={curve_name} and {base}, soft clip={{domain={a}:{b}}}];"
            ]

        # Between (Zwischen zwei Kurven)
        for j, b in enumerate(p.betweens):
            if not b.show:
                continue
            
            val_a = b.a if b.a is not None else px_min
            val_b = b.b if b.b is not None else px_max

            shade_between_cmds.append(rf"\addplot[fill={b.fill}, draw={b.draw}, fill opacity={b.alpha}, forget plot] fill between[of={curve_name} and curve{b.other_index}, soft clip={{domain={val_a}:{val_b}}}];")

        # Slopes (Steigungsdreiecke)
        for j, sl in enumerate(p.slopes):
            if not sl.show:
                continue

            cA = f"(axis cs: {sl.x0}, {{func_{i}({sl.x0})}})"
            cB = f"(axis cs: {sl.x0+sl.dx}, {{func_{i}({sl.x0})}})"
            cC = f"(axis cs: {sl.x0+sl.dx}, {{func_{i}({sl.x0+sl.dx})}})"
            slope_cmds.append(rf"\draw[{sl.style}] {cA} -- {cB} -- {cC} -- cycle;")

            if sl.label_show:
                slope_cmds.append(rf"\node[below, {sl.label_style}] at ($ {cA}!0.5!{cB} $) {{{sl.label_x}}};")
                slope_cmds.append(rf"\node[right, {sl.label_style}] at ($ {cB}!0.5!{cC} $) {{{sl.label_y}}};")

        # Tangents/Normals
        for j, ta in enumerate(p.tangents):
            if not ta.show:
                continue
            
            x0 = ta.x0
            txmin = ta.xmin if ta.xmin is not None else cfg.xmin
            txmax = ta.xmax if ta.xmax is not None else cfg.xmax
            
            eps = 0.001
            # Numerical derivative at x0
            m_expr = f"(func_{i}(({x0})+{eps}) - func_{i}(({x0})-{eps})) / (2*{eps})"
            y0_expr = f"func_{i}({x0})"
            
            if ta.is_normal:
                # Normal: y = -1/m * (x - x0) + y0
                func_expr = f"(-1 / (({m_expr}) + 0.0000001)) * (x - ({x0})) + ({y0_expr})"
            else:
                # Tangent: y = m * (x - x0) + y0
                func_expr = f"({m_expr}) * (x - ({x0})) + ({y0_expr})"
            
            lbl = ""
            if ta.label_show and ta.label_text:
                lbl = f" node[pos={ta.label_pos}, above, sloped, font=\\small] {{{ta.label_text}}}"
            
            curve_cmds.append(rf"\addplot[{ta.style}, domain={txmin}:{txmax}, samples=2, forget plot] {{{func_expr}}}{lbl};")

    node_cmds = []
    for j, n in enumerate(cfg.nodes):
        if not n.show:
            continue
        name = f"ann{j}"
        node_style = _format_node_opts(n)
        node_cmds.append(rf"\node ({name})[{node_style}] at (axis cs:{n.x},{n.y}) {{{n.text}}};")
        if n.arrow:
            if n.dx != 0 or n.dy != 0:
                node_cmds[-1] = rf"\node ({name})[{node_style}] at ($ (axis cs:{{ {n.x} + {n.dx} }},{{ {n.y} + {n.dy} }})$) {{{n.text}}};"
            node_cmds.append(rf"\draw[{n.arrow_style}] ({name}) -- (axis cs:{n.x},{n.y});")
        if n.marker:
            node_cmds.append(rf"\addplot[{n.mark_style}, mark size={n.mark_size}pt] coordinates {{({n.x},{n.y})}};")

    point_cmds = []
    for i, pt in enumerate(cfg.points):
        point_cmds.append(rf"\coordinate (P{i}) at (axis cs:{pt.x},{pt.y});")
        if not pt.show:
            continue
        c = pt.color or "#1e293b"
        pt_col = f"hexcol={c[1:].upper()}" if c.startswith("#") else c
        
        # Clean any redundant color tokens from mark_style
        cleaned_style = _clean_mark_style(pt.mark_style)
        style_parts = ["only marks", f"mark={pt.mark}"]
        if cleaned_style:
            style_parts.append(cleaned_style)
        style_parts.append(pt_col)
        style_parts.append(f"mark size={pt.size}pt")
        
        point_cmds.append(rf"\addplot[{', '.join(style_parts)}] coordinates {{({pt.x},{pt.y})}};")
        node_style = _format_point_label_style(pt, pt_col)
        point_cmds.append(rf"\node[{node_style}] at (axis cs:{pt.x},{pt.y}) {{$ {pt.label} $}};")

    param_cmds = []
    for i, pp in enumerate(cfg.parametric_plots):
        if not pp.show:
            continue
        if pp.x_t and pp.y_t:
            param_style = _format_param_style(pp)
            lbl = ""
            if pp.label_show and pp.label_text:
                lbl = rf" node[pos={pp.label_pos}, {pp.label_style}] {{{pp.label_text}}}"
            param_cmds.append(rf"\addplot[{param_style}, domain={pp.tmin}:{pp.tmax}, samples={cfg.samples}, variable=t] ({{{pp.x_t}}},{{{pp.y_t}}}){lbl};")

    # Manueller TikZ-Code einfügen
    manual_cmds = [cfg.manual_code] if cfg.manual_code else []

    # Final Assembly
    cmds = curve_cmds + param_cmds + csv_cmds + shade_under_cmds + shade_between_cmds + slope_cmds + point_cmds + node_cmds + manual_cmds
    body = "\\begin{axis}[" + ",\n    ".join(opts) + "]\n    " + "\n    ".join(cmds) + "\n\\end{axis}"

    return render_standalone_tikz(
        body,
        font_family=getattr(cfg, "font_family", "Fira"),
        include_shared_packages=cfg.pakete_laden,
        include_commands=cfg.command_laden,
        fallback_packages=PGFPLOTS_FALLBACK_PACKAGES,
    )
