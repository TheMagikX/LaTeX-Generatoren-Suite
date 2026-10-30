# SPDX-License-Identifier: AGPL-3.0-or-later

from models.erwartungshorizont import ErwartungshorizontConfig
from generators.erwartungshorizont import generate_erwartungshorizont_latex

def test_erwartungshorizont_feste_breite_true():
    cfg = ErwartungshorizontConfig(feste_breite=True)
    latex = generate_erwartungshorizont_latex(cfg)
    assert "\\documentclass[preview,multi=subtask,border=2pt]{standalone}" in latex
    assert "\\newenvironment{subtask}{\\begin{minipage}{15.0cm}}{\\end{minipage}}" in latex
    assert "\\begin{subtask}" in latex
    assert "\\end{subtask}" in latex

def test_erwartungshorizont_feste_breite_false():
    cfg = ErwartungshorizontConfig(feste_breite=False)
    latex = generate_erwartungshorizont_latex(cfg)
    assert "\\documentclass[preview,multi=subtask,border=2pt]{standalone}" in latex
    assert "\\newenvironment{subtask}{\\begin{varwidth}{15.0cm}}{\\end{varwidth}}" in latex
    assert "\\begin{subtask}" in latex
    assert "\\end{subtask}" in latex

def test_erwartungshorizont_fallback_without_subtasks():
    cfg = ErwartungshorizontConfig(code="Normaler Text ohne Teilaufgaben", feste_breite=False)
    latex = generate_erwartungshorizont_latex(cfg)
    assert "\\documentclass[border=2pt,varwidth=15.0cm]{standalone}" in latex
    assert "\\newenvironment{subtask}{}{}" in latex
    assert "Normaler Text ohne Teilaufgaben" in latex
