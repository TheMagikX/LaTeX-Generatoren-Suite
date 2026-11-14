# SPDX-License-Identifier: AGPL-3.0-or-later

from models.stellenwerttafel import StellenwertColumn, StellenwertConfig
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
