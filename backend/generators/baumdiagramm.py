# SPDX-License-Identifier: AGPL-3.0-or-later

import re
from typing import List, Optional, Dict
from fractions import Fraction as _Fraction
from models.baumdiagramm import (
    BaumdiagrammConfig, BaumNodeConfig, TreeMode, 
    GrowDirection, NodeShape, EdgePositioning
)
from core.latex_document import (
    LatexDocumentSpec,
    font_input,
    render_latex_document,
    shared_commands_input,
    shared_package_input,
)

def prob_to_latex(p: float, size_cmd: str = r"\tiny") -> str:
    """Convert a float probability to a LaTeX fraction string, e.g. 0.25 → '\\tiny $\\dfrac{1}{4}$'."""
    try:
        frac = _Fraction(p).limit_denominator(100)
        if frac.denominator == 1:
            inner = str(frac.numerator)
        else:
            inner = f"\\dfrac{{{frac.numerator}}}{{{frac.denominator}}}"
        return f"{size_cmd} ${inner}$" if size_cmd else f"${inner}$"
    except Exception:
        return "?"

def parse_latex_prob(tex: str) -> float | None:
    """Extract a numeric probability from a LaTeX label string."""
    if not tex:
        return None
    # \frac{a}{b}, \dfrac{a}{b}, \tfrac{a}{b}
    m = re.search(r'\\[dt]?frac\{(\d+)\}\{(\d+)\}', tex)
    if m:
        num, den = int(m.group(1)), int(m.group(2))
        return num / den if den != 0 else None
    # plain a/b (not preceded by a backslash)
    m = re.search(r'(?<!\\)\b(\d+)\s*/\s*(\d+)\b', tex)
    if m:
        num, den = int(m.group(1)), int(m.group(2))
        return num / den if den != 0 else None
    # plain decimal or integer in [0, 1]
    m = re.search(r'\b(0(?:\.\d+)?|1(?:\.0+)?|\.\d+)\b', tex)
    if m:
        return float(m.group(1))
    return None

def get_num_children(cfg: BaumdiagrammConfig, node_id: str, current_level: int) -> int:
    if current_level >= cfg.max_depth:
        return 0
    if cfg.mode == TreeMode.symmetric:
        return cfg.branches_global
    else:
        if node_id == "root":
            return cfg.root_node.num_children
        node_cfg = cfg.nodes.get(node_id)
        return node_cfg.num_children if node_cfg else 2

def get_all_paths(cfg: BaumdiagrammConfig, node_id: str, current_level: int) -> List[List[str]]:
    num_kids = get_num_children(cfg, node_id, current_level)
    if num_kids == 0:
        return [[node_id]]
    paths = []
    for k in range(num_kids):
        child_id = f"{k}" if node_id == "root" else f"{node_id}_{k}"
        sub_paths = get_all_paths(cfg, child_id, current_level + 1)
        for p in sub_paths:
            paths.append([node_id] + p)
    return paths

def calc_path_prob(cfg: BaumdiagrammConfig, path: List[str]) -> float | None:
    result = 1.0
    for i, node_id in enumerate(path[1:]):
        node_cfg = cfg.nodes.get(node_id)
        val = None
        if node_cfg:
            val = node_cfg.prob_value
            if val is None:
                val = parse_latex_prob(node_cfg.edge_label)
        
        if val is None:
            # Fallback: estimate from parent's child count
            parent_id = path[i]  # Since we are iterating path[1:], path[i] is the parent
            parent_level = i
            num_sibs = get_num_children(cfg, parent_id, parent_level)
            val = 1.0 / max(num_sibs, 1)
            
        result *= float(val)
    return result

def _extract_draw_color(style: str) -> str:
    """Extract the color value from a TikZ draw= option."""
    m = re.search(r'draw=([^,\]]+)', style)
    if m:
        return m.group(1).strip()
    return "red!70!black"

def get_node_label(node_cfg: BaumNodeConfig, standard_label: str) -> str:
    if getattr(node_cfg, "labelHidden", False):
        return ""
    return (node_cfg.label or "").strip() or standard_label

def get_edge_label(cfg: BaumdiagrammConfig, node_cfg: BaumNodeConfig, num_kids: int) -> str:
    if getattr(node_cfg, "edgeLabelHidden", False):
        return ""
    if cfg.use_numeric_probs:
        _pv = node_cfg.prob_value
        if _pv is None:
            _pv = round(1.0 / max(num_kids, 1), 6)
        return prob_to_latex(float(_pv))

    default_prob = f"\\tiny $\\dfrac{{1}}{{{num_kids}}}$"
    return node_cfg.edge_label if node_cfg.edge_label else default_prob

def tikz_tree_recurse(cfg: BaumdiagrammConfig, parent_id: str, current_level: int, max_levels: int, edge_style_safe: str, path_so_far=None):
    if path_so_far is None:
        path_so_far = ["root"]

    num_kids = get_num_children(cfg, parent_id, current_level - 1)
    if num_kids == 0:
        return ""

    code = ""
    for k in range(num_kids):
        child_id = f"{k}" if parent_id == "root" else f"{parent_id}_{k}"
        child_path = path_so_far + [child_id]

        node_cfg = cfg.nodes.get(child_id, BaumNodeConfig())
        
        # Default labels logic
        default_lbl = ["K", "Z"][k % 2] if num_kids == 2 else f"A{k+1}"
        node_txt = get_node_label(node_cfg, default_lbl)
        
        edge_txt = get_edge_label(cfg, node_cfg, num_kids)
        
        spec_node_style = (node_cfg.node_style or "").strip()
        spec_edge_style = (node_cfg.edge_style or "").strip()
        node_name = "n" + child_id.replace("_", "-")
        name_part = f"name={node_name}"
        node_opts = f"[{name_part}, {spec_node_style}]" if spec_node_style else f"[{name_part}]"
        
        pos_opts = ""
        if cfg.style.edge_positioning == EdgePositioning.auto:
            pos_opts = ", auto"
        elif cfg.style.edge_positioning == EdgePositioning.outside:
            if k < (num_kids / 2):
                pos_opts = ", auto, swap"
            else:
                pos_opts = ", auto"
        elif cfg.style.edge_positioning == EdgePositioning.inside:
            if k < (num_kids / 2):
                pos_opts = ", auto"
            else:
                pos_opts = ", auto, swap"
        elif cfg.style.edge_positioning == EdgePositioning.on_path:
            pos_opts = ", fill=white"

        full_edge_style = f"{edge_style_safe}{pos_opts}"
        if spec_edge_style:
            full_edge_style += f", {spec_edge_style}"

        edge_code = ""
        if edge_txt and not cfg.style.hide_edge_labels:
            edge_code = f"edge from parent node[{full_edge_style}] {{{edge_txt}}}"
            
        grandchildren_code = ""
        if current_level < max_levels:
            grandchildren_code = tikz_tree_recurse(cfg, child_id, current_level + 1, max_levels, edge_style_safe, child_path)

        if get_num_children(cfg, child_id, current_level) == 0:
            result_txt = cfg.results.get(child_id, "")
            if cfg.show_path_prob_in_result:
                _path_prob = calc_path_prob(cfg, child_path)
                _prob_tex = prob_to_latex(_path_prob) if _path_prob is not None else "?"
                result_txt = f"{result_txt} {_prob_tex}".strip() if result_txt else _prob_tex
            
            if result_txt:
                # NEU: Dem Result-Knoten einen Namen geben, um ihn referenzieren zu können
                res_name = f"res-{child_id.replace('_', '-')}"
                res_opts_list = [f"name={res_name}"]
                if cfg.style_results:
                    res_opts_list.append(cfg.style_results)
                res_opts = "[" + ", ".join(res_opts_list) + "]"
                
                res_dist = cfg.style_result_dist
                grandchildren_code += f"child[level distance={res_dist}cm] {{ node {res_opts} {{{result_txt}}} edge from parent[draw=none] }} "

        code += f"child {{ node {node_opts} {{{node_txt}}} {grandchildren_code} {edge_code} }} "
        
    return code

def generate_baumdiagramm_latex(cfg: BaumdiagrammConfig) -> str:
    root_txt = get_node_label(cfg.root_node, "Start")
    root_style = (cfg.root_node.node_style or "").strip()
    root_opts = f"[name=nroot, {root_style}]" if root_style else "[name=nroot]"
    
    nodes_style_safe = (cfg.style.global_node_style or "").replace("\n", " ").strip()
    edges_style_safe = (cfg.style.global_edge_style or "").replace("\n", " ").strip()
    
    children_str = tikz_tree_recurse(cfg, "root", 1, cfg.max_depth, edges_style_safe)
        
    # Level Styles
    level_opts_list = []
    branches_calc = cfg.branches_global if cfg.mode == TreeMode.symmetric else 2 
    
    for l in range(1, cfg.max_depth + 1):
        if cfg.style.manual_sibling_dist_active:
            dist = cfg.style.manual_sibling_distances.get(l, 1.5)
        else:
            dist = cfg.style.sibling_distance_base * (branches_calc ** (cfg.max_depth - l))
            
        dist_s = f"{dist:.2f}"
        ldist_s = f"{cfg.style.level_distance:.2f}"
        level_opts_list.append(f"level {l}/.style={{sibling distance={dist_s}cm, level distance={ldist_s}cm}}")
    
    level_opts_str = ", ".join(level_opts_list)

    grow_opt = f"grow={cfg.style.grow_direction.value}"
    shape_opt = cfg.style.node_shape.value

    # Level Labels
    level_labels_code = ""
    if cfg.level_labels.enabled:
        ll_offset = cfg.level_labels.offset
        ll_style = (cfg.level_labels.style or "").strip()
        ll_opts = f"[{ll_style}]" if ll_style else ""
        
        for l in range(0, cfg.max_depth + 1):
            ll_txt = cfg.level_labels.texts.get(l, "")
            if ll_txt:
                ld = cfg.style.level_distance * l
                
                if cfg.style.grow_direction == GrowDirection.down:
                    coord = f"({ll_offset}, -{ld})"
                elif cfg.style.grow_direction == GrowDirection.up:
                    coord = f"({ll_offset}, {ld})"
                elif cfg.style.grow_direction == GrowDirection.right:
                    coord = f"({ld}, {ll_offset})"
                elif cfg.style.grow_direction == GrowDirection.left:
                    coord = f"(-{ld}, {ll_offset})"
                else:
                    coord = f"(0,0)"
                
                level_labels_code += f"    \\node {ll_opts} at {coord} {{{ll_txt}}};\n"

    # Highlights
    highlight_code = ""
    highlighted_nodes: Dict[str, str] = {}
    default_hl_style = (cfg.style.highlight_style_default or "").strip()
    hl_paths = get_all_paths(cfg, "root", 0)
    for hl_path in hl_paths:
        leaf_id = hl_path[-1]
        hl_cfg = cfg.highlights.get(leaf_id)
        if hl_cfg and hl_cfg.enabled:
            hl_style = (hl_cfg.style or "").strip() or default_hl_style
            node_refs = []
            for node in hl_path:
                if node == "root":
                    node_refs.append("(nroot)")
                else:
                    node_refs.append("(n" + node.replace("_", "-") + ")")
            highlight_code += f"    \\draw[{hl_style}] {' -- '.join(node_refs)};\n"
            text_color = _extract_draw_color(hl_style)
            for i in range(len(hl_path) - 1):
                parent_id = hl_path[i]
                child_id = hl_path[i+1]
                
                # Referenzen für Start und Ziel der Kante bauen
                p_ref = "(nroot)" if parent_id == "root" else f"(n{parent_id.replace('_', '-')})"
                c_ref = f"(n{child_id.replace('_', '-')})"
                
                c_cfg = cfg.nodes.get(child_id, BaumNodeConfig())
                
                edge_txt = get_edge_label(cfg, c_cfg, get_num_children(cfg, parent_id, i))
                
                # auto / swap Positionierung nachbilden
                k = int(child_id.split("_")[-1])
                num_kids = get_num_children(cfg, parent_id, i)
                
                pos_opts = ""
                if cfg.style.edge_positioning == EdgePositioning.auto:
                    pos_opts = "auto"
                elif cfg.style.edge_positioning == EdgePositioning.outside:
                    if k < (num_kids / 2):
                        pos_opts = "auto, swap"
                    else:
                        pos_opts = "auto"
                elif cfg.style.edge_positioning == EdgePositioning.inside:
                    if k < (num_kids / 2):
                        pos_opts = "auto"
                    else:
                        pos_opts = "auto, swap"
                elif cfg.style.edge_positioning == EdgePositioning.on_path:
                    pos_opts = "fill=white"
                
                # Komma nur einfügen, wenn pos_opts einen Wert hat
                pos_str = f", {pos_opts}" if pos_opts else ""
                
                # Highlight-Node über den originalen Pfad legen
                if edge_txt and not cfg.style.hide_edge_labels:
                    highlight_code += (
                        f"    \\path {p_ref} -- node[{edges_style_safe}{pos_str}, text={text_color}, draw=none] "
                        f"{{{edge_txt}}} {c_ref};\n"
                    )
            res_txt = cfg.results.get(leaf_id, "")
            if cfg.show_path_prob_in_result:
                _path_prob = calc_path_prob(cfg, hl_path)
                _prob_tex = prob_to_latex(_path_prob) if _path_prob is not None else "?"
                res_txt = f"{res_txt} {_prob_tex}".strip() if res_txt else _prob_tex
                
            if res_txt:
                res_ref = f"(res-{leaf_id.replace('_', '-')})"
                res_opts_hl = cfg.style_results or ""
                
                # Overlay passgenau über den Result-Knoten legen
                highlight_code += (
                    f"    \\node[{res_opts_hl}, text={text_color}, draw=none, fill=none] "
                    f"at {res_ref} {{{res_txt}}};\n"
                )
            for node in hl_path:
                highlighted_nodes[node] = text_color

    # Text-color overlays
    nodes_style_safe_hl = nodes_style_safe
    for node_id, text_color in highlighted_nodes.items():
        if node_id == "root":
            node_ref = "(nroot)"
            node_text = get_node_label(cfg.root_node, "Start")
        else:
            node_cfg = cfg.nodes.get(node_id, BaumNodeConfig())
            node_ref = "(n" + node_id.replace("_", "-") + ")"
            
            idx_in_parent = int(node_id.split("_")[-1])
            # Wir gehen hier als Fallback von einem Standard-Baum (2 Äste) aus:
            default_node_text = ["K", "Z"][idx_in_parent % 2]
            node_text = get_node_label(node_cfg, default_node_text)
        highlight_code += (
            f"    \\node[{nodes_style_safe_hl}, shape={shape_opt}, text={text_color}, draw=none, fill=none]"
            f" at {node_ref} {{{node_text}}};\n"
        )

    body = f"""
    \\begin{{tikzpicture}}[
        {grow_opt},
        every node/.style={{{nodes_style_safe}, shape={shape_opt}}},
        {level_opts_str}
    ]
    \\node {root_opts} {{{root_txt}}}
    {children_str};
{highlight_code}{level_labels_code}    \\end{{tikzpicture}}
    """
    if getattr(cfg, "width_cm", None) and cfg.width_cm > 0:
        body = f"\\resizebox{{{cfg.width_cm}cm}}{{!}}{{\n{body}\n}}"

    default_pakete = r"""\usepackage[utf8]{inputenc}\usepackage{graphicx}\usepackage{tikz}\usetikzlibrary{trees, calc, shadows, shapes}\usepackage{amsmath, amssymb}"""
    return render_latex_document(
        LatexDocumentSpec(
            body=body,
            class_options=("border=2pt",),
            preamble_parts=(
                shared_package_input(cfg.pakete_laden, default_pakete),
                shared_commands_input(cfg.command_laden),
                font_input(getattr(cfg, "font_family", "Fira")),
                cfg.preamble_add,
            ),
        )
    )
