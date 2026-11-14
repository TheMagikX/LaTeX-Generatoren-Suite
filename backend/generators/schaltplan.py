# SPDX-License-Identifier: AGPL-3.0-or-later

from models.schaltplan import SchaltplanConfig, CircuitNode
from core.latex_document import (
    LatexDocumentSpec,
    font_input,
    render_latex_document,
    sanitize_preamble_addition,
    sanitize_tikz_options,
    shared_commands_input,
    shared_package_input,
)

COMP_TYPES = {
    "Draht (Verbindung)": "short",
    "Widerstand (R)": "R",
    "Widerstand (Veränderbar)": "vR",
    "Kondensator (C)": "C",
    "Elko": "eC",
    "Spule (L)": "cute inductor",
    "Batterie": "battery1",
    "Spannungsquelle (DC)": "battery1",
    "Spannungsquelle (AC)": "sV",
    "Stromquelle": "isource",
    "Lampe": "lamp",
    "Diode": "Do",
    "LED": "leD",
    "Schalter (Offen)": "nos",
    "Schalter (Geschlossen)": "ncs",
    "Schalter (Taster)": "pushbutton",
    "Masse (Ground)": "ground",
    "Voltmeter": "rmeter, t=V",
    "Amperemeter": "rmeter, t=A",
    "Messgerät": "rmeter",
}

def is_junction_node(node: CircuitNode, components: list) -> bool:
    if node.show_dot is not None:
        return bool(node.show_dot)
    count = 0
    for comp in components:
        if comp.from_node == node.name:
            count += 1
        if comp.to_node == node.name:
            count += 1
    return count >= 3

def generate_schaltplan_latex(cfg: SchaltplanConfig) -> str:
    """Generates the full LaTeX document for a circuit diagram."""
    
    # Pre-calculate node coordinates mapping
    coords = {n.name: (n.x, n.y) for n in cfg.nodes}
    
    def get_node_coords(name):
        return coords.get(name, (0.0, 0.0))

    # 1) Generate TikZ body
    opts = []
    setup_code = ""

    if cfg.style_standard == "europe (DIN)":
        opts.append("european")
        setup_code += "  \\ctikzset{voltage=straight}\n"
    else:
        opts.append("american")

    if cfg.style_tikz_opts:
        safe_tikz_opts = sanitize_tikz_options(cfg.style_tikz_opts)
        if safe_tikz_opts:
            opts.append(safe_tikz_opts)

    opts_str = ", ".join(opts)
    code = f"\\begin{{circuitikz}}[{opts_str}, scale={cfg.style_scale}, transform shape]\n"
    code += setup_code

    # Optional Grid
    if cfg.show_grid and cfg.nodes:
        xs = [n.x for n in cfg.nodes]
        ys = [n.y for n in cfg.nodes]
        min_x, max_x = min(xs) - 1, max(xs) + 1
        min_y, max_y = min(ys) - 1, max(ys) + 1
        code += f"  \\draw[help lines, color=gray!30, step=1] ({min_x},{min_y}) grid ({max_x},{max_y});\n"
        code += f"  \\foreach \\x in {{{int(min_x)},...,{int(max_x)}}} \\node[anchor=north, gray!50, font=\\tiny] at (\\x,{min_y}) {{\\x}};\n"
        code += f"  \\foreach \\y in {{{int(min_y)},...,{int(max_y)}}} \\node[anchor=east, gray!50, font=\\tiny] at ({min_x},\\y) {{\\y}};\n"

    # Optional Node Labels
    if cfg.show_node_labels:
        for node in cfg.nodes:
            code += f"  \\node[above right, font=\\footnotesize, blue!60] at ({node.x:g},{node.y:g}) {{{node.name}}};\n"

    # Draw Components
    for comp in cfg.components:
        c_code = COMP_TYPES.get(comp.type_name, "short")
        x1, y1 = get_node_coords(comp.from_node)
        
        if c_code == "ground":
            code += f"  \\draw ({x1:g},{y1:g}) node[ground]{{}};\n"
            continue
            
        x2, y2 = get_node_coords(comp.to_node)
        
        to_opts = []
        if comp.label:
            to_opts.append(f"l={{{comp.label}}}")
        if comp.value:
            to_opts.append(f"a={{{comp.value}}}")
        if comp.style:
            safe_comp_style = sanitize_tikz_options(comp.style)
            if safe_comp_style:
                to_opts.append(safe_comp_style)

        to_opts_str = ", ".join(to_opts)
        p1 = f"{x1:g},{y1:g}"
        p2 = f"{x2:g},{y2:g}"
        
        line = f"  \\draw ({p1}) to[{c_code}"
        if to_opts_str:
            line += f", {to_opts_str}"
        line += f"] ({p2});\n"
        code += line

    # Draw Junction Dots / Nodes
    for node in cfg.nodes:
        if cfg.show_nodes or is_junction_node(node, cfg.components):
            code += f"  \\fill ({node.x:g},{node.y:g}) circle (2pt);\n"

    code += "\\end{circuitikz}"

    default_pakete = r"""\usepackage{tikz}
\usepackage{circuitikz}"""

    preamble_parts = [
        shared_package_input(cfg.pakete_laden, default_pakete),
        shared_commands_input(cfg.command_laden),
        font_input(cfg.font_family),
    ]
    if cfg.preamble_add and cfg.preamble_add.strip():
        safe_preamble = sanitize_preamble_addition(cfg.preamble_add)
        if safe_preamble.strip():
            preamble_parts.append(safe_preamble.strip())

    spec = LatexDocumentSpec(
        body=code,
        class_options=("border=2pt",),
        preamble_parts=tuple(preamble_parts),
    )

    return render_latex_document(spec)
