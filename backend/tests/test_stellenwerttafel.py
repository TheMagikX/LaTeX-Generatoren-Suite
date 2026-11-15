# SPDX-License-Identifier: AGPL-3.0-or-later

from models.stellenwerttafel import (
    SeparatorLineStyle,
    StellenwertColumn,
    StellenwertConfig,
    StellenwertGroup,
    StellenwertLayout,
    StellenwertRow,
)
from generators.stellenwerttafel import (
    generate_stellenwerttafel_full_latex,
    generate_stellenwerttafel_latex,
)


def test_empty_active_columns_wraps_tikzpicture():
    cfg = StellenwertConfig(
        columns=[
            StellenwertColumn(id="z", label="Z", active=False),
            StellenwertColumn(id="e", label="E", active=False),
        ]
    )
    tikz = generate_stellenwerttafel_latex(cfg)
    assert r"\begin{tikzpicture}" in tikz
    assert r"\end{tikzpicture}" in tikz
    assert r"\node {Keine Spalten aktiv};" in tikz

    full_tex = generate_stellenwerttafel_full_latex(cfg)
    assert r"\begin{tikzpicture}" in full_tex
    assert r"\end{tikzpicture}" in full_tex
    assert r"\node {Keine Spalten aktiv};" in full_tex


def test_decimal_separator_styles_and_comma():
    cfg = StellenwertConfig(
        columns=[
            StellenwertColumn(id="z", label="Z"),
            StellenwertColumn(id="e", label="E"),
            StellenwertColumn(id="z_dec", label="z"),
        ],
        rows=[
            StellenwertRow(id="r1", values={"z": 1, "e": 2, "z_dec": 3}, active=True, is_placeholder=False),
            StellenwertRow(id="r2", values={}, active=True, is_placeholder=True),
        ],
        decimal_separator_pos=2,
        layout=StellenwertLayout(
            decimal_separator_style=SeparatorLineStyle.DASHED,
            decimal_separator_color="#dc2626",
            show_decimal_comma=True,
        ),
    )
    full_tex = generate_stellenwerttafel_full_latex(cfg)
    assert r"\definecolor{decsepcolor}{rgb}" in full_tex
    assert r"\draw[very thick, dashed, draw=decsepcolor]" in full_tex
    assert full_tex.count("{,};") == 1


def test_group_separator_style_without_header():
    cfg = StellenwertConfig(
        columns=[
            StellenwertColumn(id="t", label="T"),
            StellenwertColumn(id="h", label="H"),
            StellenwertColumn(id="z", label="Z"),
            StellenwertColumn(id="e", label="E"),
            StellenwertColumn(id="z_dec", label="z"),
        ],
        groups=[
            StellenwertGroup(id="g1", label="Tausender", start_col_id="t", end_col_id="t"),
            StellenwertGroup(id="g2", label="Einer", start_col_id="h", end_col_id="e"),
            StellenwertGroup(id="g3", label="Dezimal", start_col_id="z_dec", end_col_id="z_dec"),
        ],
        decimal_separator_pos=4,
        layout=StellenwertLayout(
            show_header=False,
            decimal_separator_style=SeparatorLineStyle.DASHED,
            group_separator_style=SeparatorLineStyle.DOUBLE,
        ),
    )
    tikz = generate_stellenwerttafel_latex(cfg)
    # Boundary at x=1*col_w (1.5) between g1 and g2 gets group separator (double)
    assert r"\draw[thick, double, double distance=1.5pt] (1.5, 0.0) -- (1.5, -1.2);" in tikz
    # Boundary at x=4*col_w (6.0) between g2 and g3 collides with decimal_separator_pos=4 -> decimal separator wins
    assert r"\draw[very thick, dashed] (6.0, 0.0) -- (6.0, -1.2);" in tikz
    assert r"\draw[thick, double, double distance=1.5pt] (6.0," not in tikz
