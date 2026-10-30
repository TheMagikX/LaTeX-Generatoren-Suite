# SPDX-License-Identifier: AGPL-3.0-or-later

import math
from typing import List, Tuple, Dict
from models.stellenwerttafel import StellenwertConfig, StellenwertMode, TokenStyle, StellenwertColumn, StellenwertRow, StellenwertGroup
from core.latex_document import (
    HEXCOL_TIKZ_KEY,
    LatexDocumentSpec,
    font_input,
    render_latex_document,
    shared_commands_input,
    shared_package_input,
)

def _hex_to_rgb(hex_color: str) -> str:
    """Converts #RRGGBB to r,g,b in [0,1] for TikZ."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        return "0,0,0"
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return f"{r:.3f},{g:.3f},{b:.3f}"

def get_stellenwerttafel_color_defs(cfg: StellenwertConfig) -> list[str]:
    active_cols = [c for c in cfg.columns if c.active]
    defs = []
    for i, col in enumerate(active_cols):
        rgb = _hex_to_rgb(col.color)
        defs.append(rf"\definecolor{{colcolor{i}}}{{rgb}}{{{rgb}}}")

    for g_idx, group in enumerate(cfg.groups):
        rgb = _hex_to_rgb(group.color)
        defs.append(rf"\definecolor{{groupcolor{g_idx}}}{{rgb}}{{{rgb}}}")
    return defs


def generate_stellenwerttafel_latex(cfg: StellenwertConfig, include_colors: bool = False) -> str:
    active_cols = [c for c in cfg.columns if c.active]
    if not active_cols:
        return r"\node {Keine Spalten aktiv};"
    
    col_id_to_idx = {c.id: i for i, c in enumerate(active_cols)}
    all_rows = cfg.rows if cfg.rows else [StellenwertRow(id="default", values={c.id: 0 for c in active_cols})]
    rows = [r for r in all_rows if getattr(r, 'active', True)]

    n_cols = len(active_cols)
    n_rows = len(rows)
    col_w = cfg.layout.col_width
    row_h = cfg.layout.row_height
    label_col_w = col_w * 1.5 if cfg.layout.show_row_labels else 0
    
    has_groups = len(cfg.groups) > 0
    
    if cfg.layout.auto_header_height:
        if cfg.layout.header_vertical:
            max_len = max([len(c.label) for c in active_cols], default=1)
            std_header_h = max(1.0, round(max_len * 0.26 + 0.4, 2))
        else:
            std_header_h = 0.8
    else:
        std_header_h = cfg.layout.header_height

    group_header_h = 0.8 if has_groups else 0.0

    if cfg.layout.show_header:
        header_top = std_header_h + group_header_h
    else:
        header_top = 0.0
    
    lines = []
    if include_colors:
        lines.extend(get_stellenwerttafel_color_defs(cfg))

    lines.append(rf"\begin{{tikzpicture}}[x=1cm, y=1cm, font=\{cfg.font_size}]")

    # ==================== STEP 1: BACKGROUND FILLS (DRAW FIRST) ====================
    group_boundaries = set()
    if cfg.layout.show_header and has_groups:
        for g_idx, group in enumerate(cfg.groups):
            if group.start_col_id in col_id_to_idx and group.end_col_id in col_id_to_idx:
                start_idx = col_id_to_idx[group.start_col_id]
                end_idx = col_id_to_idx[group.end_col_id]
                s_idx, e_idx = min(start_idx, end_idx), max(start_idx, end_idx)
                group_boundaries.add(s_idx)
                group_boundaries.add(e_idx + 1)
                x_start = s_idx * col_w
                width = (e_idx - s_idx + 1) * col_w
                lines.append(rf"  \fill[groupcolor{g_idx}] ({x_start}, {std_header_h}) rectangle ({x_start + width}, {std_header_h + group_header_h});")

    if cfg.layout.show_header:
        if cfg.layout.show_row_labels:
            lines.append(rf"  \fill[gray!10] ({-label_col_w}, 0) rectangle (0, {std_header_h});")

        header_opacity_pct = max(1, min(100, int(getattr(cfg.layout, 'header_bg_opacity', 0.85) * 100)))
        for i, col in enumerate(active_cols):
            x = i * col_w
            lines.append(rf"  \fill[colcolor{i}!{header_opacity_pct}] ({x}, 0) rectangle ({x + col_w}, {std_header_h});")

    if cfg.layout.color_column_rows:
        header_op = getattr(cfg.layout, 'header_bg_opacity', 0.85)
        ratio = getattr(cfg.layout, 'column_bg_opacity_ratio', 0.80)
        row_opacity_pct = max(1, min(100, int(header_op * ratio * 100)))
        for r_idx in range(n_rows):
            y_bottom = -(r_idx + 1) * row_h
            for c_idx in range(n_cols):
                x_base = c_idx * col_w
                lines.append(rf"  \fill[colcolor{c_idx}!{row_opacity_pct}] ({x_base}, {y_bottom}) rectangle ({x_base + col_w}, {y_bottom + row_h});")

    # ==================== STEP 2: TEXT LABELS & CONTENT ====================
    if cfg.layout.show_header and has_groups:
        for g_idx, group in enumerate(cfg.groups):
            if group.start_col_id in col_id_to_idx and group.end_col_id in col_id_to_idx:
                start_idx = col_id_to_idx[group.start_col_id]
                end_idx = col_id_to_idx[group.end_col_id]
                s_idx, e_idx = min(start_idx, end_idx), max(start_idx, end_idx)
                x_start = s_idx * col_w
                width = (e_idx - s_idx + 1) * col_w
                lines.append(rf"  \node[anchor=center, font=\bfseries\small] at ({x_start + width/2}, {std_header_h + group_header_h/2}) {{{group.label}}};")

    if cfg.layout.show_header:
        for i, col in enumerate(active_cols):
            x = i * col_w
            rot_opt = ", rotate=90" if cfg.layout.header_vertical else ""
            lines.append(rf"  \node[anchor=center{rot_opt}, font=\bfseries] at ({x + col_w/2}, {std_header_h/2}) {{{col.label}}};")

    for r_idx, row in enumerate(rows):
        y_bottom = -(r_idx + 1) * row_h
        y_center = y_bottom + row_h/2

        if cfg.layout.show_row_labels and row.label:
            lines.append(rf"  \node[anchor=west, font=\small\itshape] at ({-label_col_w + 0.2}, {y_center}) {{{row.label}}};")

        is_placeholder = getattr(row, 'is_placeholder', False)
        if not is_placeholder:
            for c_idx, col in enumerate(active_cols):
                x_base = c_idx * col_w
                raw_val = row.values.get(col.id)
                
                if cfg.mode in [StellenwertMode.ZIFFERN, StellenwertMode.BEIDES]:
                    if raw_val is not None:
                        if cfg.mode == StellenwertMode.ZIFFERN:
                            lines.append(rf"  \node at ({x_base + col_w/2}, {y_center}) {{{raw_val}}};")
                        else: 
                            lines.append(rf"  \node[gray!50] at ({x_base + col_w/2}, {y_center}) {{{raw_val}}};")

                if cfg.mode in [StellenwertMode.PLAETTCHEN, StellenwertMode.BEIDES]:
                    val = raw_val if raw_val is not None else 0
                    max_per_row = cfg.layout.max_tokens_per_row
                    token_r = cfg.layout.token_size
                    
                    for t in range(val):
                        tr = t // max_per_row
                        tc = t % max_per_row
                        num_rows_tokens = math.ceil(val / max_per_row)
                        row_offset = (row_h - (num_rows_tokens * token_r * 2.5)) / 2
                        col_offset = (col_w - (min(val, max_per_row) * token_r * 2.5)) / 2
                        tx = x_base + col_offset + tc * token_r * 2.5 + token_r
                        ty = y_bottom + row_offset + tr * token_r * 2.5 + token_r
                        
                        if cfg.layout.token_style == TokenStyle.FILLED:
                            lines.append(rf"  \fill[colcolor{c_idx}] ({tx}, {ty}) circle ({token_r});")
                        elif cfg.layout.token_style == TokenStyle.OUTLINE:
                            lines.append(rf"  \draw[colcolor{c_idx}, semithick] ({tx}, {ty}) circle ({token_r});")
                        elif cfg.layout.token_style == TokenStyle.CROSS:
                            lines.append(rf"  \draw[colcolor{c_idx}, semithick] ({tx}-0.7*{token_r}, {ty}-0.7*{token_r}) -- ({tx}+0.7*{token_r}, {ty}+0.7*{token_r});")
                            lines.append(rf"  \draw[colcolor{c_idx}, semithick] ({tx}-0.7*{token_r}, {ty}+0.7*{token_r}) -- ({tx}+0.7*{token_r}, {ty}-0.7*{token_r});")

    # ==================== STEP 3: GRID LINES & BORDERS (DRAW LAST) ====================
    grid_y_top = header_top
    grid_y_bottom = -n_rows * row_h
    grid_x_left = -label_col_w
    grid_x_right = n_cols * col_w
    grid_style = "semithick"

    if cfg.layout.show_grid:
        if cfg.layout.show_row_labels:
            lines.append(rf"  \draw[{grid_style}] (0, {std_header_h if (cfg.layout.show_header and has_groups) else grid_y_top}) -- (0, {grid_y_bottom});")

        for i in range(1, n_cols):
            x = i * col_w
            is_sep = cfg.decimal_separator_pos is not None and i == cfg.decimal_separator_pos
            
            y_line_start = grid_y_top if (i in group_boundaries or is_sep) else (std_header_h if cfg.layout.show_header else 0)
            style = "ultra thick" if is_sep else grid_style
            lines.append(rf"  \draw[{style}] ({x}, {y_line_start}) -- ({x}, {grid_y_bottom});")
        
        if cfg.layout.show_header:
            lines.append(rf"  \draw[{grid_style}] ({grid_x_left}, 0) -- ({grid_x_right}, 0);")
            if has_groups:
                lines.append(rf"  \draw[{grid_style}] (0, {std_header_h}) -- ({grid_x_right}, {std_header_h});")
        
        for j in range(1, n_rows):
            y = -j * row_h
            lines.append(rf"  \draw[{grid_style}] ({grid_x_left}, {y}) -- ({grid_x_right}, {y});")

        if cfg.layout.show_header and has_groups:
            for g_idx, group in enumerate(cfg.groups):
                if group.start_col_id in col_id_to_idx and group.end_col_id in col_id_to_idx:
                    start_idx = col_id_to_idx[group.start_col_id]
                    end_idx = col_id_to_idx[group.end_col_id]
                    s_idx, e_idx = min(start_idx, end_idx), max(start_idx, end_idx)
                    x_start = s_idx * col_w
                    width = (e_idx - s_idx + 1) * col_w
                    lines.append(rf"  \draw[{grid_style}] ({x_start}, {std_header_h}) rectangle ({x_start + width}, {std_header_h + group_header_h});")

        # Outer border
        lines.append(rf"  \draw[{grid_style}] ({grid_x_left}, {grid_y_top}) rectangle ({grid_x_right}, {grid_y_bottom});")

    lines.append(r"\end{tikzpicture}")
    return "\n".join(lines)

def generate_stellenwerttafel_full_latex(cfg: StellenwertConfig) -> str:
    default_pakete = r"\usepackage{tikz}\usepackage{xcolor}"
    color_defs = get_stellenwerttafel_color_defs(cfg)
    body = generate_stellenwerttafel_latex(cfg, include_colors=False)

    return render_latex_document(
        LatexDocumentSpec(
            body=body,
            class_options=("border=5pt",),
            preamble_parts=(
                shared_package_input(bool(cfg.font_family), default_pakete),
                shared_commands_input(True),
                font_input(cfg.font_family),
                HEXCOL_TIKZ_KEY,
                *color_defs,
            ),
            indent_body=True,
        )
    )
