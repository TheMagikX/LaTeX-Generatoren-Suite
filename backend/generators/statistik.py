# SPDX-License-Identifier: AGPL-3.0-or-later

import re
import numpy as np
import math
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
from models.statistik import (
    StatistikConfig, StatistikType, DataMode, Orientation, DatasetParams,
    BarChartOptions, BarWidthMode, SummenkurveOptions, ViolinOptions,
)
from core.latex_document import LatexDocumentSpec, font_input, latex_input, render_latex_document

def parse_frequency_data(freq_string: str) -> List[float]:
    """Parse 'value:count' or 'value,count' pairs into an expanded list of floats."""
    result: List[float] = []
    for pair in re.split(r'[;\n]+', freq_string):
        pair = pair.strip()
        if not pair:
            continue
        sep = ':' if ':' in pair else ','
        parts = pair.split(sep, 1)
        if len(parts) != 2:
            continue
        try:
            val = float(parts[0].strip().replace(',', '.'))
            count = int(float(parts[1].strip().replace(',', '.')))
            result.extend([val] * max(count, 0))
        except (ValueError, IndexError):
            continue
    return result


def get_dataset_data(ds) -> List[float]:
    """Return the effective numeric data for a dataset, honouring DataMode."""
    if ds.data_mode == DataMode.FREQUENCY and ds.freq_data_string:
        return parse_frequency_data(ds.freq_data_string)
    return ds.raw_data


def calculate_params(data: List[float]) -> Optional[DatasetParams]:
    if not data or len(data) == 0:
        return None
    
    data_arr = np.array(data)
    data_arr = data_arr[~np.isnan(data_arr)]
    if len(data_arr) == 0:
        return None

    q1, median, q3 = np.percentile(data_arr, [25, 50, 75])
    
    return DatasetParams(
        min=float(np.min(data_arr)),
        q1=float(q1),
        median=float(median),
        q3=float(q3),
        max=float(np.max(data_arr)),
        mean=float(np.mean(data_arr)),
        std_dev=float(np.std(data_arr, ddof=1)) if len(data_arr) > 1 else 0.0,
        variance=float(np.var(data_arr, ddof=1)) if len(data_arr) > 1 else 0.0,
    )

def generate_statistik_latex(config: StatistikConfig) -> str:
    body_parts = [
        rf"\begin{{tikzpicture}}[font=\{config.font_size}]",
    ]

    if config.type == StatistikType.BOXPLOT:
        body_parts.append(generate_boxplot_tikz(config))
    elif config.type == StatistikType.HISTOGRAMM:
        body_parts.append(generate_histogram_tikz(config))
    elif config.type == StatistikType.SAEULENDIAGRAMM:
        body_parts.append(generate_barchart_tikz(config))
    elif config.type == StatistikType.SUMMENKURVE:
        body_parts.append(generate_summenkurve_tikz(config))
    elif config.type == StatistikType.VIOLIN:
        body_parts.append(generate_violin_tikz(config))
    else:
        body_parts.append(generate_histogram_tikz(config))

    body_parts.append(r"\end{tikzpicture}")

    full_tikz = "\n".join(body_parts)
    color_defs = []
    clean_body_lines = []
    for line in full_tikz.splitlines():
        if line.strip().startswith(r"\definecolor"):
            color_defs.append(line.strip())
        else:
            clean_body_lines.append(line)
    clean_body = "\n".join(clean_body_lines)

    return render_latex_document(
        LatexDocumentSpec(
            body=clean_body,
            class_options=("tikz", "border=2mm"),
            preamble_parts=(
                latex_input("Pakete.tex"),
                latex_input("TikZ.tex"),
                latex_input("commands.tex"),
                font_input(config.font_family),
                r"\usepackage{pgfplots}",
                r"\usepgfplotslibrary{statistics}",
                r"\pgfplotsset{compat=1.18}",
                *color_defs,
            ),
        )
    )

def tex_color(color: str) -> str:
    if color.startswith('#') and len(color) == 7:
        r = int(color[1:3], 16)
        g = int(color[3:5], 16)
        b = int(color[5:7], 16)
        return f"{{rgb,255:red,{r}; green,{g}; blue,{b}}}"
    return color

def _apply_axis_ticks(opts: List[str], axis: Any, prefix: str, is_categorical: bool = False, default_min: float = 0, default_max: float = 10):
    if not axis.majorticklabels:
        opts.append(f"{prefix}ticklabels={{}}")
    if not axis.ticks_show:
        opts.append(f"{prefix}tick style={{draw=none}}")

    if axis.tick_mode == "Manuell":
        if axis.tick_list:
            opts.append(f"{prefix}tick={{{axis.tick_list}}}")
    elif not is_categorical: # Automatisch numerical
        step = axis.step if axis.step > 0 else 1.0
        a_min = axis.min if axis.min is not None else default_min
        a_max = axis.max if axis.max is not None else default_max
        opts.append(f"{prefix}tick={{{a_min},{a_min + step},...,{a_max}}}")

def _apply_title(opts: List[str], config: StatistikConfig):
    if hasattr(config, "title_opts") and config.title_opts and config.title_opts.show and config.title_opts.text and config.title_opts.text.strip():
        t_text = config.title_opts.text.strip()
        weight_cmd = ""
        if config.title_opts.font_weight == "bold":
            weight_cmd = r"\bfseries"
        elif config.title_opts.font_weight == "italic":
            weight_cmd = r"\itshape"

        font_size_cmd = config.title_opts.font_size or r"\large"
        font_spec = f"{font_size_cmd}{weight_cmd}"

        title_styles = [f"font={font_spec}"]

        if config.title_opts.color:
            title_styles.append(f"text={tex_color(config.title_opts.color)}")

        if config.title_opts.align == "left":
            title_styles.extend(["at={(0,1)}", "anchor=south west", "align=left"])
        elif config.title_opts.align == "right":
            title_styles.extend(["at={(1,1)}", "anchor=south east", "align=right"])
        else: # center
            title_styles.extend(["at={(0.5,1)}", "anchor=south", "align=center"])

        title_styles.append("yshift=4pt")

        if config.title_opts.custom_style and config.title_opts.custom_style.strip():
            title_styles.append(config.title_opts.custom_style.strip())

        opts.append(f"title={{{t_text}}}")
        opts.append(f"title style={{{', '.join(title_styles)}}}")

def _apply_grid(opts: List[str], config: StatistikConfig):
    x_grid = getattr(config.x_axis, "show_grid", False)
    y_grid = getattr(config.y_axis, "show_grid", False)

    if not x_grid and not y_grid:
        opts.append("grid=none")
        return

    if x_grid:
        opts.append("xmajorgrids=true")
        x_style = getattr(config.x_axis, "grid_style", "kaestchen")
        if x_style == "kaestchen":
            opts.append("xminorgrids=true")
            opts.append("minor x tick num=1")
    else:
        opts.append("xmajorgrids=false")
        opts.append("xminorgrids=false")

    if y_grid:
        opts.append("ymajorgrids=true")
        y_style = getattr(config.y_axis, "grid_style", "kaestchen")
        if y_style == "kaestchen":
            opts.append("yminorgrids=true")
            opts.append("minor y tick num=1")
    else:
        opts.append("ymajorgrids=false")
        opts.append("yminorgrids=false")

    opts.append("major grid style={draw=black!25, line width=0.4pt}")
    opts.append("minor grid style={draw=black!15, line width=0.25pt}")
    opts.append("minor tick style={draw=none}")

def compute_boxplot_positions(n: int, box_width: float) -> list[float]:
    if n <= 0:
        return []
    # Return simple equidistant positions: 1.0, 2.0, 3.0, ...
    # The axis scaling (x=1.5cm / y=1.5cm) handles the actual physical distance.
    return [float(i + 1) for i in range(n)]

def generate_boxplot_tikz(config: StatistikConfig) -> str:
    is_horizontal = config.boxplot_opts.orientation == Orientation.HORIZONTAL

    positions = compute_boxplot_positions(len(config.datasets), config.boxplot_opts.box_width)
    pos_str = ",".join(f"{p:.4f}" for p in positions)
    label_str = ",".join(d.name.replace(",", "") for d in config.datasets)

    all_data = [x for ds in config.datasets for x in get_dataset_data(ds)]
    d_min = min(all_data) if all_data else 0.0
    d_max = max(all_data) if all_data else 10.0
    pad = (d_max - d_min) * 0.15 or 1.0

    if is_horizontal:
        xmin_val = config.x_axis.min if config.x_axis.min is not None else 0
        xmax_val = config.x_axis.max if config.x_axis.max is not None else 10
        range_opts = f"xmin={xmin_val}, xmax={xmax_val}"
    else:
        ymin_val = config.y_axis.min if config.y_axis.min is not None else math.floor(d_min - pad)
        ymax_val = config.y_axis.max if config.y_axis.max is not None else math.ceil(d_max + pad)
        range_opts = f"ymin={ymin_val}, ymax={ymax_val}"

    axis_opts = [
        "boxplot/draw direction=x" if is_horizontal else "boxplot/draw direction=y",
        range_opts,
        "axis x line*=bottom, axis y line=none" if is_horizontal else "axis y line*=left, axis x line=none",
        f"xlabel={{{config.x_axis.label}}}",
        f"ylabel={{{config.y_axis.label}}}",
        "enlarge y limits=0.4" if is_horizontal else "enlarge x limits=0.4",
        f"width={config.width_cm}cm",
        f"height={config.height_cm}cm",
        "scale only axis",
    ]

    _apply_axis_ticks(axis_opts, config.x_axis, "x", is_categorical=not is_horizontal, default_min=config.x_axis.min or 0, default_max=config.x_axis.max or 10)
    _apply_axis_ticks(axis_opts, config.y_axis, "y", is_categorical=is_horizontal, default_min=config.y_axis.min or 0, default_max=config.y_axis.max or 10)
    _apply_grid(axis_opts, config)
    _apply_title(axis_opts, config)

    if is_horizontal:
        if config.y_axis.tick_mode == "Automatisch":
            axis_opts.append(f"ytick={{{pos_str}}}")
            axis_opts.append(f"yticklabels={{{label_str}}}")
        if len(config.datasets) > 1:
            axis_opts[2] = "axis x line*=bottom, axis y line=left"
    else:
        if config.x_axis.tick_mode == "Automatisch":
            axis_opts.append(f"xtick={{{pos_str}}}")
            axis_opts.append(f"xticklabels={{{label_str}}}")
        if len(config.datasets) > 1:
            axis_opts[2] = "axis y line*=left, axis x line=bottom"

    axis_opts_str = ',\n    '.join(axis_opts)
    latex = f"\\begin{{axis}}[\n    {axis_opts_str}\n]\n"

    for i, ds in enumerate(config.datasets):
        if ds.data_mode == DataMode.PARAMETERS:
            params = ds.params or DatasetParams(min=0, q1=0, median=0, q3=0, max=0)
        else:
            params = calculate_params(get_dataset_data(ds)) or DatasetParams(min=0, q1=0, median=0, q3=0, max=0)

        boxplot_prepared = [
            f"draw position={positions[i]:.4f}",
            f"lower whisker={params.min}",
            f"lower quartile={params.q1}",
            f"median={params.median}",
            f"upper quartile={params.q3}",
            f"upper whisker={params.max}",
            f"box extend={config.boxplot_opts.box_width}",
        ]

        if config.boxplot_opts.draw_mean and params.mean is not None:
            boxplot_prepared.append(f"average={params.mean}")

        plot_opts = [
            f"color={tex_color(ds.color)}",
            f"boxplot prepared={{{', '.join(boxplot_prepared)}}}"
        ]

        latex += f"    \\addplot+[{', '.join(plot_opts)}] coordinates {{}};\n"

    latex += "\\end{axis}\n"
    return latex

def generate_histogram_tikz(config: StatistikConfig) -> str:
    bin_width = config.histogram_opts.bin_width if config.histogram_opts.bin_width > 0 else 1.0

    all_data = [x for ds in config.datasets for x in get_dataset_data(ds)]
    xmin_val = config.x_axis.min if config.x_axis.min is not None else 0
    xmax_val = config.x_axis.max if config.x_axis.max is not None else 10
    ymin_val = config.y_axis.min if config.y_axis.min is not None else 0

    max_h = 5.0
    if all_data:
        bins = np.arange(xmin_val, xmax_val + bin_width, bin_width)
        if len(bins) >= 2:
            for ds in config.datasets:
                d_list = get_dataset_data(ds)
                if d_list:
                    h, _ = np.histogram(d_list, bins=bins, density=config.histogram_opts.density)
                    if len(h) > 0:
                        max_h = max(max_h, float(np.max(h)))
    auto_ymax = math.ceil(max_h + 1) if max_h <= 5 else math.ceil(max_h * 1.25)
    ymax_val = config.y_axis.max if config.y_axis.max is not None else auto_ymax

    axis_opts = [
        f"xmin={xmin_val}, xmax={xmax_val}",
        f"ymin={ymin_val}, ymax={ymax_val}",
        "axis x line*=bottom, axis y line=left",
        f"xlabel={{{config.x_axis.label}}}",
        f"ylabel={{{config.y_axis.label or ('Dichte' if config.histogram_opts.density else 'Häufigkeit')}}}",
        f"width={config.width_cm}cm",
        f"height={config.height_cm}cm",
        "scale only axis",
        "ybar interval",
    ]
    
    _apply_axis_ticks(axis_opts, config.x_axis, "x", default_min=xmin_val, default_max=xmax_val)
    _apply_axis_ticks(axis_opts, config.y_axis, "y", default_min=ymin_val, default_max=ymax_val)
    _apply_grid(axis_opts, config)
    _apply_title(axis_opts, config)

    axis_opts_str = ',\n    '.join(axis_opts)
    latex = f"\\begin{{axis}}[\n    {axis_opts_str}\n]\n"
    
    for ds in config.datasets:
        data_list = get_dataset_data(ds)
        if data_list:
            data = np.array(data_list)
            bins = np.arange(xmin_val, xmax_val + bin_width, bin_width)
            if len(bins) < 2:
                 bins = [xmin_val, xmax_val]

            hist, bin_edges = np.histogram(data, bins=bins, density=config.histogram_opts.density)
            
            coords = []
            for j in range(len(hist)):
                coords.append(f"({bin_edges[j]}, {hist[j]})")
            coords.append(f"({bin_edges[-1]}, 0)")
            
            plot_opts = [
                f"fill={tex_color(ds.color)}!20",
                f"draw={tex_color(ds.color)}",
            ]
            latex += f"    \\addplot[{', '.join(plot_opts)}] coordinates {{{' '.join(coords)}}};\n"

    latex += "\\end{axis}\n"
    return latex


def _sanitize_label(label: str) -> str:
    return label.replace(',', '').replace('{', '').replace('}', '').strip()


def _format_coord_lbl(l: str) -> str:
    s = _sanitize_label(l)
    return f"{{{s}}}" if " " in s else s


def _format_num_val(v: float) -> str:
    return f"{int(v)}" if v.is_integer() else f"{v:.4f}".rstrip('0').rstrip('.')


def parse_barchart_data(ds) -> Tuple[List[str], List[float]]:
    """
    Returns (labels, heights) for a dataset in bar chart mode.
    Handles:
    1. Frequency mode:
       'Montag: 3' -> ('Montag', 3)
       'Note 1: 4' -> ('Note 1', 4)
    2. Raw mode:
       - Urliste of items / numbers to count: '1, 2, 2, 3, 2, 5' -> (['1', '2', '3', '5'], [1, 3, 1, 1])
       - Urliste of categories: 'Mo, Di, Di, Mi' -> (['Mo', 'Di', 'Mi'], [1, 2, 1])
       - Direct raw numbers with matching bar_labels_string
    """
    labels: List[str] = []
    values: List[float] = []

    # Case 1: Frequency mode
    if ds.data_mode == DataMode.FREQUENCY and ds.freq_data_string:
        for pair in re.split(r'[;\n]+', ds.freq_data_string):
            pair = pair.strip()
            if not pair:
                continue
            sep = ':' if ':' in pair else ','
            parts = pair.split(sep, 1)
            if len(parts) != 2:
                continue
            lbl = parts[0].strip()
            count_str = parts[1].strip().replace(',', '.')
            try:
                cnt = float(count_str)
            except ValueError:
                continue
            labels.append(lbl)
            values.append(cnt)

        # If user explicitly specified bar_labels_string with matching count, override
        if ds.bar_labels_string and ds.bar_labels_string.strip():
            custom_labels = [_sanitize_label(l) for l in ds.bar_labels_string.split(',') if l.strip()]
            if len(custom_labels) == len(labels):
                labels = custom_labels

        return labels, values

    # Case 2: Raw mode
    if ds.raw_data_string and ds.raw_data_string.strip():
        custom_labels = []
        if ds.bar_labels_string and ds.bar_labels_string.strip():
            custom_labels = [_sanitize_label(l) for l in ds.bar_labels_string.split(',') if l.strip()]

        raw_str = ds.raw_data_string.strip()

        # If custom labels exist and raw_data matches length, treat as direct heights
        if custom_labels and len(ds.raw_data) == len(custom_labels) and len(ds.raw_data) > 0:
            return custom_labels, [float(v) for v in ds.raw_data]

        # Otherwise treat raw input as an Urliste (sample) and count occurrences
        tokens = [t.strip() for t in re.split(r'[,;\n\s]+', raw_str) if t.strip()]
        if tokens:
            all_numeric = True
            parsed_nums = []
            for t in tokens:
                try:
                    num = float(t.replace(',', '.'))
                    parsed_nums.append(num)
                except ValueError:
                    all_numeric = False
                    break

            if all_numeric and parsed_nums:
                counts = Counter(parsed_nums)
                for k in sorted(counts.keys()):
                    lbl_str = str(int(k)) if k.is_integer() else str(k)
                    labels.append(lbl_str)
                    values.append(float(counts[k]))
            else:
                counts = Counter(tokens)
                seen = set()
                for t in tokens:
                    if t not in seen:
                        seen.add(t)
                        labels.append(_sanitize_label(t))
                        values.append(float(counts[t]))

            return labels, values

    # Fallback to ds.raw_data numbers if available
    if ds.raw_data:
        custom_labels = []
        if ds.bar_labels_string and ds.bar_labels_string.strip():
            custom_labels = [_sanitize_label(l) for l in ds.bar_labels_string.split(',') if l.strip()]
        if custom_labels and len(custom_labels) == len(ds.raw_data):
            return custom_labels, [float(v) for v in ds.raw_data]
        return [str(i + 1) for i in range(len(ds.raw_data))], [float(v) for v in ds.raw_data]

    return [], []


def generate_barchart_tikz(config: StatistikConfig) -> str:
    is_vertical = config.barchart_opts.orientation == Orientation.VERTICAL

    # Parse (labels, values) for each dataset
    parsed_datasets = [parse_barchart_data(ds) for ds in config.datasets]

    # Collect all unique labels across all datasets in original encounter order
    all_labels: List[str] = []
    seen = set()
    for labels, _ in parsed_datasets:
        for lbl in labels:
            if lbl not in seen:
                seen.add(lbl)
                all_labels.append(lbl)

    if not all_labels:
        all_labels = ["1"]

    n_cats = len(all_labels)
    n_datasets = max(len(config.datasets), 1)

    # Color definitions management
    color_defs: List[str] = []
    defined_colors: Dict[str, str] = {}
    color_counter = 0

    def get_tex_color_name(raw_col: str) -> str:
        nonlocal color_counter
        if not raw_col:
            return "black"
        if raw_col.startswith('#') and len(raw_col) == 7:
            hex_clean = raw_col[1:].upper()
            if hex_clean in defined_colors:
                return defined_colors[hex_clean]
            name = f"bcol{color_counter}"
            color_counter += 1
            color_defs.append(f"\\definecolor{{{name}}}{{HTML}}{{{hex_clean}}}")
            defined_colors[hex_clean] = name
            return name
        return raw_col

    # Title node helper
    def build_title_code(cx: float, cy: float, w_tot: float) -> str:
        if not (hasattr(config, "title_opts") and config.title_opts and config.title_opts.show and config.title_opts.text and config.title_opts.text.strip()):
            return ""
        t_text = config.title_opts.text.strip()
        weight_cmd = ""
        if config.title_opts.font_weight == "bold":
            weight_cmd = r"\bfseries"
        elif config.title_opts.font_weight == "italic":
            weight_cmd = r"\itshape"
        font_size_cmd = config.title_opts.font_size or r"\large"
        col_name = get_tex_color_name(config.title_opts.color or "#1e293b")

        align = config.title_opts.align or "center"
        if align == "left":
            tx = 0.0
            anchor = "south west"
        elif align == "right":
            tx = w_tot
            anchor = "south east"
        else:
            tx = w_tot / 2.0
            anchor = "south"

        custom = f", {config.title_opts.custom_style.strip()}" if config.title_opts.custom_style and config.title_opts.custom_style.strip() else ""
        return f"    \\node[above=8pt, anchor={anchor}, font={font_size_cmd}{weight_cmd}, text={col_name}, align={align}{custom}] at ({tx:.4f}cm, {cy:.4f}cm) {{{t_text}}};\n"

    width_mode = getattr(config.barchart_opts, "width_mode", BarWidthMode.BOXES)
    show_grid = getattr(config.barchart_opts, "show_grid", True)
    show_values = getattr(config.barchart_opts, "show_values", False)
    vertical_labels = getattr(config.barchart_opts, "vertical_labels", False)
    raw_opacity = getattr(config.barchart_opts, "opacity", 75.0)
    opacity_val = max(0.0, min(1.0, float(raw_opacity if raw_opacity is not None else 75.0) / 100.0))

    if is_vertical:
        # ===== VERTICAL (Säulendiagramm) =====
        all_vals = [v for _, vals in parsed_datasets for v in vals]
        max_val = max(all_vals) if all_vals else 6.0
        ymin_val = config.y_axis.min if config.y_axis.min is not None else 0.0
        step = config.y_axis.step if config.y_axis.step > 0 else 1.0
        # 1 step on Y-axis = 2 Kästchen => delta per box = step / 2
        delta_box = step / 2.0

        steps_needed = math.ceil((max_val - ymin_val) / step) + 1
        auto_ymax = ymin_val + max(1, steps_needed) * step

        if config.y_axis.max is not None and config.y_axis.max > ymin_val:
            target_ymax = config.y_axis.max
        else:
            target_ymax = auto_ymax

        n_boxes_y = max(1, int(math.ceil((target_ymax - ymin_val) / delta_box)))
        # Make sure grid height ends at a full step if user left ymax auto
        if config.y_axis.max is None and n_boxes_y % 2 != 0:
            n_boxes_y += 1

        ymax_val = ymin_val + n_boxes_y * delta_box

        # Kästchen size in cm (strictly quadratic)
        box_size_cm = max(config.height_cm / n_boxes_y, 0.1)

        # Bar width and spacing in boxes
        if width_mode in ("boxes", BarWidthMode.BOXES):
            w_boxes = float(getattr(config.barchart_opts, "bar_width_boxes", 2.0) or 2.0)
            g_boxes = float(getattr(config.barchart_opts, "bar_gap_boxes", 1.0) or 1.0)
            m_boxes = float(getattr(config.barchart_opts, "margin_boxes", 1.0) or 1.0)
        else:
            w_cm = float(config.barchart_opts.bar_width or 0.6)
            g_cm = float(getattr(config.barchart_opts, "bar_gap", 0.4) or 0.4)
            w_boxes = max(round(w_cm / box_size_cm, 2), 0.2)
            g_boxes = max(round(g_cm / box_size_cm, 2), 0.0)
            m_boxes = float(getattr(config.barchart_opts, "margin_boxes", 1.0) or 1.0)

        # Horizontal Kästchen count
        if n_datasets > 1:
            cat_width_boxes = n_datasets * w_boxes
            n_boxes_x = 2 * m_boxes + n_cats * cat_width_boxes + (n_cats - 1) * g_boxes
        else:
            cat_width_boxes = w_boxes
            n_boxes_x = 2 * m_boxes + n_cats * w_boxes + (n_cats - 1) * g_boxes

        n_grid_x = max(1, int(math.ceil(n_boxes_x)))
        total_w_cm = n_grid_x * box_size_cm
        total_h_cm = n_boxes_y * box_size_cm

        lines: List[str] = []

        # 1) Grid (Kästchengitter)
        if show_grid:
            lines.append(f"    % Kästchengitter (1 Schritt = 2 Kästchen, quadratisch)")
            lines.append(f"    \\draw[black!25, line width=0.4pt, step={box_size_cm:.4f}cm] (0, 0) grid ({total_w_cm:.4f}cm, {total_h_cm:.4f}cm);")

        # 2) Bars
        lines.append(f"    % Säulen")
        for j, cat_lbl in enumerate(all_labels):
            if n_datasets > 1:
                cat_start_box = m_boxes + j * (n_datasets * w_boxes + g_boxes)
            else:
                cat_start_box = m_boxes + j * (w_boxes + g_boxes)

            for k, ds in enumerate(config.datasets):
                parsed_labels, parsed_vals = parsed_datasets[k]
                val_map = dict(zip(parsed_labels, parsed_vals))
                val = val_map.get(cat_lbl, 0.0)

                h_box = max(0.0, 2.0 * (val - ymin_val) / step)
                b_left_box = cat_start_box + k * w_boxes
                b_right_box = b_left_box + w_boxes

                x1 = b_left_box * box_size_cm
                x2 = b_right_box * box_size_cm
                y1 = 0.0
                y2 = h_box * box_size_cm

                # Category custom color or dataset base color
                ds_cat_colors = getattr(ds, 'category_colors', {}) or {}
                raw_col = ds_cat_colors.get(cat_lbl, ds.color or '#3b82f6')
                col_name = get_tex_color_name(raw_col)

                if h_box > 0:
                    lines.append(f"    \\draw[fill={col_name}, fill opacity={opacity_val:.2f}, draw={col_name}!90!black, draw opacity=1, line width=0.8pt] ({x1:.4f}cm, {y1:.4f}cm) rectangle ({x2:.4f}cm, {y2:.4f}cm);")

                if show_values and h_box > 0:
                    x_mid = (x1 + x2) / 2.0
                    lines.append(f"    \\node[above=2pt, font=\\small, text=black] at ({x_mid:.4f}cm, {y2:.4f}cm) {{{_format_num_val(val)}}};")

            # Category Label below X-axis
            cat_mid_cm = (cat_start_box + cat_width_boxes / 2.0) * box_size_cm
            san_cat = _sanitize_label(cat_lbl)
            if vertical_labels:
                lines.append(f"    \\node[anchor=east, rotate=90, text=black] at ({cat_mid_cm:.4f}cm, -5pt) {{{san_cat}}};")
            else:
                lines.append(f"    \\node[below=5pt, text=black, align=center] at ({cat_mid_cm:.4f}cm, 0) {{{san_cat}}};")

        # 3) Axes
        lines.append(f"    % Achsen")
        arrow_top_cm = total_h_cm + 0.35
        lines.append(f"    \\draw[-{{Stealth[length=6pt, width=5pt]}}, line width=1.4pt] (0, 0) -- (0, {arrow_top_cm:.4f}cm);")
        lines.append(f"    \\draw[line width=1.4pt] (0, 0) -- ({total_w_cm:.4f}cm, 0);")

        # Y-Axis Ticks & Labels
        n_steps_y = int(n_boxes_y / 2)
        for i in range(n_steps_y + 1):
            cur_val = ymin_val + i * step
            if cur_val > ymax_val + 1e-6:
                break
            y_tick_cm = i * 2.0 * box_size_cm
            if config.y_axis.ticks_show:
                lines.append(f"    \\draw[line width=1.2pt] (-3pt, {y_tick_cm:.4f}cm) -- (3pt, {y_tick_cm:.4f}cm);")
            if config.y_axis.majorticklabels:
                lines.append(f"    \\node[left=4pt, font=\\normalsize, text=black] at (0, {y_tick_cm:.4f}cm) {{{_format_num_val(cur_val)}}};")

        # Axis Titles
        if config.y_axis.label and config.y_axis.label.strip():
            y_offset = "-26pt" if (ymax_val >= 100 or ymin_val <= -10) else "-22pt"
            lines.append(f"    \\node[rotate=90, anchor=south, font=\\normalsize, text=black] at ({y_offset}, {total_h_cm / 2.0:.4f}cm) {{{config.y_axis.label.strip()}}};")
        if config.x_axis.label and config.x_axis.label.strip():
            x_label_dist = "38pt" if vertical_labels else "22pt"
            lines.append(f"    \\node[below={x_label_dist}, font=\\normalsize] at ({total_w_cm / 2.0:.4f}cm, 0) {{{config.x_axis.label.strip()}}};")

        # Title
        title_code = build_title_code(total_w_cm / 2.0, total_h_cm, total_w_cm)
        if title_code:
            lines.append(title_code)

    else:
        # ===== HORIZONTAL (Balkendiagramm) =====
        all_vals = [v for _, vals in parsed_datasets for v in vals]
        max_val = max(all_vals) if all_vals else 6.0
        xmin_val = config.x_axis.min if config.x_axis.min is not None else 0.0
        step = config.x_axis.step if config.x_axis.step > 0 else 1.0
        delta_box = step / 2.0

        steps_needed = math.ceil((max_val - xmin_val) / step) + 1
        auto_xmax = xmin_val + max(1, steps_needed) * step

        if config.x_axis.max is not None and config.x_axis.max > xmin_val:
            target_xmax = config.x_axis.max
        else:
            target_xmax = auto_xmax

        n_boxes_x = max(1, int(math.ceil((target_xmax - xmin_val) / delta_box)))
        if config.x_axis.max is None and n_boxes_x % 2 != 0:
            n_boxes_x += 1

        xmax_val = xmin_val + n_boxes_x * delta_box

        # Kästchen size in cm (strictly quadratic)
        box_size_cm = max(config.width_cm / n_boxes_x, 0.1)

        if width_mode in ("boxes", BarWidthMode.BOXES):
            w_boxes = float(getattr(config.barchart_opts, "bar_width_boxes", 2.0) or 2.0)
            g_boxes = float(getattr(config.barchart_opts, "bar_gap_boxes", 1.0) or 1.0)
            m_boxes = float(getattr(config.barchart_opts, "margin_boxes", 1.0) or 1.0)
        else:
            w_cm = float(config.barchart_opts.bar_width or 0.6)
            g_cm = float(getattr(config.barchart_opts, "bar_gap", 0.4) or 0.4)
            w_boxes = max(round(w_cm / box_size_cm, 2), 0.2)
            g_boxes = max(round(g_cm / box_size_cm, 2), 0.0)
            m_boxes = float(getattr(config.barchart_opts, "margin_boxes", 1.0) or 1.0)

        if n_datasets > 1:
            cat_height_boxes = n_datasets * w_boxes
            n_boxes_y = 2 * m_boxes + n_cats * cat_height_boxes + (n_cats - 1) * g_boxes
        else:
            cat_height_boxes = w_boxes
            n_boxes_y = 2 * m_boxes + n_cats * w_boxes + (n_cats - 1) * g_boxes

        n_grid_y = max(1, int(math.ceil(n_boxes_y)))
        total_w_cm = n_boxes_x * box_size_cm
        total_h_cm = n_grid_y * box_size_cm

        lines = []

        if show_grid:
            lines.append(f"    % Kästchengitter (quadratisch)")
            lines.append(f"    \\draw[black!25, line width=0.4pt, step={box_size_cm:.4f}cm] (0, 0) grid ({total_w_cm:.4f}cm, {total_h_cm:.4f}cm);")

        lines.append(f"    % Balken")
        for j, cat_lbl in enumerate(all_labels):
            # Top-down or bottom-up: bottom-up ordering
            if n_datasets > 1:
                cat_start_box = m_boxes + (n_cats - 1 - j) * (n_datasets * w_boxes + g_boxes)
            else:
                cat_start_box = m_boxes + (n_cats - 1 - j) * (w_boxes + g_boxes)

            for k, ds in enumerate(config.datasets):
                parsed_labels, parsed_vals = parsed_datasets[k]
                val_map = dict(zip(parsed_labels, parsed_vals))
                val = val_map.get(cat_lbl, 0.0)

                w_box_val = max(0.0, 2.0 * (val - xmin_val) / step)
                b_bottom_box = cat_start_box + k * w_boxes
                b_top_box = b_bottom_box + w_boxes

                x1 = 0.0
                x2 = w_box_val * box_size_cm
                y1 = b_bottom_box * box_size_cm
                y2 = b_top_box * box_size_cm

                ds_cat_colors = getattr(ds, 'category_colors', {}) or {}
                raw_col = ds_cat_colors.get(cat_lbl, ds.color or '#3b82f6')
                col_name = get_tex_color_name(raw_col)

                if w_box_val > 0:
                    lines.append(f"    \\draw[fill={col_name}, fill opacity={opacity_val:.2f}, draw={col_name}!90!black, draw opacity=1, line width=0.8pt] ({x1:.4f}cm, {y1:.4f}cm) rectangle ({x2:.4f}cm, {y2:.4f}cm);")

                if show_values and w_box_val > 0:
                    y_mid = (y1 + y2) / 2.0
                    lines.append(f"    \\node[right=2pt, font=\\small, text=black] at ({x2:.4f}cm, {y_mid:.4f}cm) {{{_format_num_val(val)}}};")

            cat_mid_cm = (cat_start_box + cat_height_boxes / 2.0) * box_size_cm
            san_cat = _sanitize_label(cat_lbl)
            if vertical_labels:
                lines.append(f"    \\node[anchor=east, rotate=90, text=black] at (-5pt, {cat_mid_cm:.4f}cm) {{{san_cat}}};")
            else:
                lines.append(f"    \\node[left=5pt, text=black, align=right] at (0, {cat_mid_cm:.4f}cm) {{{san_cat}}};")

        lines.append(f"    % Achsen")
        arrow_right_cm = total_w_cm + 0.35
        lines.append(f"    \\draw[-{{Stealth[length=6pt, width=5pt]}}, line width=1.4pt] (0, 0) -- ({arrow_right_cm:.4f}cm, 0);")
        lines.append(f"    \\draw[line width=1.4pt] (0, 0) -- (0, {total_h_cm:.4f}cm);")

        # X-Axis Ticks & Labels
        n_steps_x = int(n_boxes_x / 2)
        for i in range(n_steps_x + 1):
            cur_val = xmin_val + i * step
            if cur_val > xmax_val + 1e-6:
                break
            x_tick_cm = i * 2.0 * box_size_cm
            if config.x_axis.ticks_show:
                lines.append(f"    \\draw[line width=1.2pt] ({x_tick_cm:.4f}cm, -3pt) -- ({x_tick_cm:.4f}cm, 3pt);")
            if config.x_axis.majorticklabels:
                lines.append(f"    \\node[below=4pt, font=\\normalsize, text=black] at ({x_tick_cm:.4f}cm, 0) {{{_format_num_val(cur_val)}}};")

        if config.x_axis.label and config.x_axis.label.strip():
            lines.append(f"    \\node[anchor=north west, font=\\normalsize] at ({arrow_right_cm:.4f}cm, 0) {{{config.x_axis.label.strip()}}};")
        if config.y_axis.label and config.y_axis.label.strip():
            lines.append(f"    \\node[above=8pt, font=\\normalsize] at (0, {total_h_cm:.4f}cm) {{{config.y_axis.label.strip()}}};")

        title_code = build_title_code(total_w_cm / 2.0, total_h_cm, total_w_cm)
        if title_code:
            lines.append(title_code)

    latex_parts = []
    if color_defs:
        latex_parts.append('\n'.join(color_defs) + '\n')
    latex_parts.append('\n'.join(lines))

    return '\n'.join(latex_parts)


def generate_summenkurve_tikz(config: StatistikConfig) -> str:
    as_percent = config.summenkurve_opts.as_percent
    smooth = config.summenkurve_opts.smooth

    y_max = 100 if as_percent else 1
    y_step = 10 if as_percent else 0.1
    y_label = r"Kum.\ H\"{a}ufigkeit (\%)" if as_percent else r"Kum.\ H\"{a}ufigkeit"

    all_data = [x for ds in config.datasets for x in get_dataset_data(ds)]
    auto_xmin = min(all_data) if all_data else 0
    auto_xmax = max(all_data) if all_data else 10
    xmin_val = config.x_axis.min if config.x_axis.min is not None else auto_xmin
    xmax_val = config.x_axis.max if config.x_axis.max is not None else auto_xmax

    # Defaults for Summenkurve Y-axis if not specified
    y_min_val = config.y_axis.min if config.y_axis.min is not None else 0
    y_max_val = config.y_axis.max if (config.y_axis.max is not None and config.y_axis.max > y_min_val) else y_max

    axis_opts = [
        f"xmin={xmin_val}, xmax={xmax_val}",
        f"ymin={y_min_val}, ymax={y_max_val}",
        "axis x line*=bottom, axis y line=left",
        f"xlabel={{{config.x_axis.label}}}",
        f"ylabel={{{config.y_axis.label or y_label}}}",
        f"width={config.width_cm}cm",
        f"height={config.height_cm}cm",
        "scale only axis",
    ]

    _apply_axis_ticks(axis_opts, config.x_axis, "x", default_min=xmin_val, default_max=xmax_val)
    _apply_axis_ticks(axis_opts, config.y_axis, "y", default_min=y_min_val, default_max=y_max_val)
    _apply_grid(axis_opts, config)
    _apply_title(axis_opts, config)

    axis_opts_str = ',\n    '.join(axis_opts)
    latex = f"\\begin{{axis}}[\n    {axis_opts_str}\n]\n"

    for ds in config.datasets:
        data = get_dataset_data(ds)
        if not data:
            continue

        sorted_arr = np.sort(np.array(data, dtype=float))
        n = len(sorted_arr)
        cumulative = [(i + 1) / n * (100 if as_percent else 1) for i in range(n)]

        plot_opts = [f"color={tex_color(ds.color)}", "thick"]
        if smooth:
            plot_opts.append("smooth")
            all_x = [float(x) for x in sorted_arr]
            all_y = list(cumulative)
        else:
            plot_opts.append("const plot mark right")
            x_step = config.x_axis.step if config.x_axis.step > 0 else 1.0
            start_x = max(float(sorted_arr[0]) - x_step * 0.05, xmin_val)
            all_x = [start_x] + [float(x) for x in sorted_arr]
            all_y = [0.0] + list(cumulative)

        coords = ' '.join(f"({x:.4f},{y:.4f})" for x, y in zip(all_x, all_y))
        latex += f"    \\addplot[{', '.join(plot_opts)}] coordinates {{{coords}}};\n"

    latex += "\\end{axis}\n"
    return latex


_N_VIOLIN = 80  # KDE evaluation points per violin


def generate_violin_tikz(config: StatistikConfig) -> str:
    try:
        from scipy.stats import gaussian_kde
    except ImportError:
        raise ImportError(
            "Das Violin-Plot-Diagramm benötigt scipy. Bitte 'pip install scipy' ausführen und den Server neu starten."
        )
    is_horizontal = config.violin_opts.orientation == Orientation.HORIZONTAL
    positions = compute_boxplot_positions(len(config.datasets), config.violin_opts.violin_width)
    pos_str = ",".join(f"{p:.4f}" for p in positions)
    label_str = ",".join(d.name.replace(",", "") for d in config.datasets)

    all_data = [x for ds in config.datasets for x in get_dataset_data(ds)]
    if all_data:
        data_min = min(all_data)
        data_max = max(all_data)
        pad = (data_max - data_min) * 0.15 or 1.0
        auto_min = math.floor(data_min - pad)
        auto_max = math.ceil(data_max + pad)
    else:
        auto_min = 0
        auto_max = 10

    if is_horizontal:
        xmin_val = config.x_axis.min if config.x_axis.min is not None else auto_min
        xmax_val = config.x_axis.max if config.x_axis.max is not None else auto_max
        axis_opts = [
            "boxplot/draw direction=x",
            f"xmin={xmin_val}, xmax={xmax_val}",
            "axis x line*=bottom, axis y line=left",
            f"xlabel={{{config.x_axis.label}}}",
            f"ylabel={{{config.y_axis.label}}}",
            "enlarge y limits=0.4",
            f"width={config.width_cm}cm",
            f"height={config.height_cm}cm",
            "scale only axis",
        ]
        if config.y_axis.tick_mode == "Automatisch":
            axis_opts.append(f"ytick={{{pos_str}}}")
            axis_opts.append(f"yticklabels={{{label_str}}}")
        _apply_axis_ticks(axis_opts, config.x_axis, "x", is_categorical=False, default_min=xmin_val, default_max=xmax_val)
        _apply_axis_ticks(axis_opts, config.y_axis, "y", is_categorical=True)
    else:
        ymin_val = config.y_axis.min if config.y_axis.min is not None else auto_min
        ymax_val = config.y_axis.max if config.y_axis.max is not None else auto_max
        axis_opts = [
            "boxplot/draw direction=y",
            f"ymin={ymin_val}, ymax={ymax_val}",
            "axis y line*=left, axis x line=bottom",
            f"ylabel={{{config.y_axis.label}}}",
            f"xlabel={{{config.x_axis.label}}}",
            "enlarge x limits=0.4",
            f"width={config.width_cm}cm",
            f"height={config.height_cm}cm",
            "scale only axis",
        ]
        if config.x_axis.tick_mode == "Automatisch":
            axis_opts.append(f"xtick={{{pos_str}}}")
            axis_opts.append(f"xticklabels={{{label_str}}}")
        _apply_axis_ticks(axis_opts, config.x_axis, "x", is_categorical=True)
        _apply_axis_ticks(axis_opts, config.y_axis, "y", is_categorical=False, default_min=ymin_val, default_max=ymax_val)

    _apply_grid(axis_opts, config)
    _apply_title(axis_opts, config)

    axis_opts_str = ',\n    '.join(axis_opts)
    latex = f"\\begin{{axis}}[\n    {axis_opts_str}\n]\n"

    for i, ds in enumerate(config.datasets):
        data = get_dataset_data(ds)
        if not data or len(data) < 2:
            continue

        arr = np.array(data, dtype=float)
        arr = arr[~np.isnan(arr)]
        if len(arr) < 2:
            continue

        pos = positions[i]
        bw = config.violin_opts.bandwidth if config.violin_opts.bandwidth > 0 else 'scott'
        try:
            kde_fn = gaussian_kde(arr, bw_method=bw)
        except Exception:
            continue

        x_pad = (arr.max() - arr.min()) * 0.05 or 0.5
        x_range = np.linspace(arr.min() - x_pad, arr.max() + x_pad, _N_VIOLIN)
        density = kde_fn(x_range)

        max_d = density.max()
        if max_d == 0:
            continue
        scale = (config.violin_opts.violin_width / 2) / max_d

        x_rev = x_range[::-1]
        d_rev = density[::-1]
        if is_horizontal:
            # Add points at the start and end on the centerline to close the shape perfectly
            upper = [(float(x_range[0]), pos)] + [(float(x), pos + float(d) * scale) for x, d in zip(x_range, density)] + [(float(x_range[-1]), pos)]
            lower = [(float(x_range[-1]), pos)] + [(float(x), pos - float(d) * scale) for x, d in zip(x_rev, d_rev)] + [(float(x_range[0]), pos)]
        else:
            # Add points at the start and end on the centerline to close the shape perfectly
            upper = [(pos, float(x_range[0]))] + [(pos + float(d) * scale, float(x)) for x, d in zip(x_range, density)] + [(pos, float(x_range[-1]))]
            lower = [(pos, float(x_range[-1]))] + [(pos - float(d) * scale, float(x)) for x, d in zip(x_rev, d_rev)] + [(pos, float(x_range[0]))]

        all_coords = upper + lower
        coords_str = ' '.join(f"({c[0]:.4f},{c[1]:.4f})" for c in all_coords)

        fill_opts = [
            f"fill={tex_color(ds.color)}!25",
            f"draw={tex_color(ds.color)}",
            "line width=0.5pt",
        ]
        # Using -- cycle to ensure the path is closed for filling without closing to the axis
        latex += f"    \\addplot[{', '.join(fill_opts)}] coordinates {{{coords_str}}} -- cycle;\n"

        if config.violin_opts.show_inner_box:
            params = calculate_params(list(arr)) or DatasetParams(min=0, q1=0, median=0, q3=0, max=0)
            inner_w = config.violin_opts.violin_width * 0.15
            bp = [
                f"draw position={pos:.4f}",
                f"lower whisker={params.min}",
                f"lower quartile={params.q1}",
                f"median={params.median}",
                f"upper quartile={params.q3}",
                f"upper whisker={params.max}",
                f"box extend={inner_w:.4f}",
            ]
            latex += f"    \\addplot+[color={tex_color(ds.color)}, boxplot prepared={{{', '.join(bp)}}}] coordinates {{}};\n"

    latex += "\\end{axis}\n"
    return latex
