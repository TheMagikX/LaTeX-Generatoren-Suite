# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
from models.zahlenstrahl import ZahlenstrahlConfig
from generators.zahlenstrahl import (
    _fmt_fraction,
    _fmt_decimal,
    _fmt_label,
    generate_zahlenstrahl_latex,
)

def test_fmt_fraction_auto():
    assert _fmt_fraction(0.0) == "0"
    assert _fmt_fraction(1.0) == "1"
    assert _fmt_fraction(-2.0) == "-2"
    assert _fmt_fraction(0.5) == r"$\frac{1}{2}$"
    assert _fmt_fraction(-0.75) == r"$-\frac{3}{4}$"
    assert _fmt_fraction(1.25) == r"$\frac{5}{4}$"

def test_fmt_fraction_mixed():
    assert _fmt_fraction(1.25, style="mixed") == r"$1\frac{1}{4}$"
    assert _fmt_fraction(2.5, style="mixed") == r"$2\frac{1}{2}$"
    assert _fmt_fraction(0.75, style="mixed") == r"$\frac{3}{4}$"
    assert _fmt_fraction(-1.75, style="mixed") == r"$-1\frac{3}{4}$"
    assert _fmt_fraction(3.0, style="mixed") == "3"

def test_fmt_fraction_fixed_denominator():
    assert _fmt_fraction(0.0, style="fixed_denominator", fixed_denom=4) == r"$\frac{0}{4}$"
    assert _fmt_fraction(0.25, style="fixed_denominator", fixed_denom=4) == r"$\frac{1}{4}$"
    assert _fmt_fraction(0.5, style="fixed_denominator", fixed_denom=4) == r"$\frac{2}{4}$"
    assert _fmt_fraction(1.0, style="fixed_denominator", fixed_denom=4) == r"$\frac{4}{4}$"
    assert _fmt_fraction(-0.75, style="fixed_denominator", fixed_denom=4) == r"$-\frac{3}{4}$"

def test_fmt_decimal():
    assert _fmt_decimal(0.0) == "0"
    assert _fmt_decimal(1.5, decimal_separator=",") == "1,5"
    assert _fmt_decimal(-0.25, decimal_separator=".") == "-0.25"
    assert _fmt_decimal(0.1, precision=2, zerofill=True, decimal_separator=",") == "0,10"
    assert _fmt_decimal(1.2345, precision=2, zerofill=True, decimal_separator=",") == "1,23"
    assert _fmt_decimal(2.0, precision=2, zerofill=True, decimal_separator=",") == "2,00"
    assert _fmt_decimal(2.0, precision=2, zerofill=False, decimal_separator=",") == "2"

def test_generate_zahlenstrahl_default_latex():
    cfg = ZahlenstrahlConfig()
    tex = generate_zahlenstrahl_latex(cfg)
    assert r"\begin{tikzpicture}" in tex
    assert r"\end{tikzpicture}" in tex
    assert r"\draw[zsAxis" in tex
    assert r"zsMainTick" in tex

def test_generate_zahlenstrahl_multi_level_ticks():
    cfg = ZahlenstrahlConfig(
        min_val=0,
        max_val=2,
        step_main=1.0,
        step_mid=0.5,
        step_sub=0.1,
        tick_main_h=0.15,
        tick_mid_h=0.10,
        tick_sub_h=0.05,
    )
    tex = generate_zahlenstrahl_latex(cfg)
    assert r"\draw[zsMainTick" in tex
    assert r"\draw[zsMidTick" in tex
    assert r"\draw[zsSubTick" in tex
    # Mid-tick should exist at 0.5 and 1.5, not at 0, 1, 2
    assert "(0.5,0.1) -- (0.5,-0.1)" in tex
    assert "(1.5,0.1) -- (1.5,-0.1)" in tex
    # Sub-tick at 0.1, not at 0.5 or 1.0
    assert "(0.1,0.05) -- (0.1,-0.05)" in tex

def test_generate_zahlenstrahl_fraction_labels():
    cfg = ZahlenstrahlConfig(
        min_val=0,
        max_val=1,
        step_main=0.5,
        step_mid=0.25,
        label_as_fraction=True,
        fraction_style="fixed_denominator",
        fraction_denominator=4,
        label_density="major_and_mid",
    )
    tex = generate_zahlenstrahl_latex(cfg)
    assert r"$\frac{0}{4}$" in tex
    assert r"$\frac{1}{4}$" in tex
    assert r"$\frac{2}{4}$" in tex
    assert r"$\frac{4}{4}$" in tex

def test_generate_zahlenstrahl_hidden_ticks():
    cfg = ZahlenstrahlConfig(
        min_val=0,
        max_val=3,
        step_main=1.0,
        hidden_ticks=[1.0, 2.0],
        hide_style="box",
    )
    tex = generate_zahlenstrahl_latex(cfg)
    assert r"$\Box$" in tex

def test_generate_zahlenstrahl_zoom_multi_level():
    cfg = ZahlenstrahlConfig(
        min_val=0,
        max_val=10,
        zoom_active=True,
        zoom_min=2.0,
        zoom_max=3.0,
        zoom_use_divisions=False,
        zoom_step_main=1.0,
        zoom_step_mid=0.5,
        zoom_step_sub=0.1,
        zoom_show_labels=True,
    )
    tex = generate_zahlenstrahl_latex(cfg)
    assert "scope" in tex
    assert r"\draw[zsMidTick" in tex
    assert r"\draw[zsSubTick" in tex
