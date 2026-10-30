# SPDX-License-Identifier: AGPL-3.0-or-later

import glob
import json
import os
from pathlib import Path
from typing import Any, Callable, Dict, Tuple
import pytest

from models.koordinatensystem import CoordinateSystemConfig
from generators.koordinatensystem import generate_koordinatensystem_latex
from models.koordinatensystem3d import CoordinateSystem3DConfig
from generators.koordinatensystem3d import generate_koordinatensystem3d_latex
from models.bruch import BruchConfig
from generators.bruch import generate_bruch_latex
from models.geometrie import GeometrieConfig
from generators.geometrie import generate_geometrie_latex
from models.baumdiagramm import BaumdiagrammConfig
from generators.baumdiagramm import generate_baumdiagramm_latex
from models.glucksrad import GlucksradConfig
from generators.glucksrad import generate_glucksrad_latex
from models.statistik import StatistikConfig
from generators.statistik import generate_statistik_latex
from models.optik import OptikConfig
from generators.optik import generate_optik_latex, calculate_images
from models.strahlenoptik import StrahlenoptikConfig
from generators.strahlenoptik import generate_strahlenoptik_latex
from models.flaschenzug import FlaschenzugConfig
from generators.flaschenzug import generate_flaschenzug_latex
from models.schaltplan import SchaltplanConfig
from generators.schaltplan import generate_schaltplan_latex
from models.stellenwerttafel import StellenwertConfig
from generators.stellenwerttafel import generate_stellenwerttafel_full_latex
from models.zahlenstrahl import ZahlenstrahlConfig
from generators.zahlenstrahl import generate_zahlenstrahl_latex
from models.arbeitsblatt import ArbeitsblattConfig
from generators.arbeitsblatt import generate_arbeitsblatt_latex, sanitize_worksheet_variables
from models.erwartungshorizont import ErwartungshorizontConfig
from generators.erwartungshorizont import generate_erwartungshorizont_latex
from models.sitzplan import SitzplanRequest
from generators.sitzplan import solve_sitzplan
from models.tikz_picture import TikzPictureConfig
from generators.tikz_picture import generate_tikz_picture_latex
from models.latex_image import LatexImageConfig
from generators.latex_image import generate_latex_image_latex
from core.latex_render import compile_latex_to_pdf_bytes

GENERATOR_HANDLERS: Dict[str, Tuple[Any, Callable[[Any], Any]]] = {
    "koord": (CoordinateSystemConfig, generate_koordinatensystem_latex),
    "koord3d": (CoordinateSystem3DConfig, generate_koordinatensystem3d_latex),
    "bruch": (BruchConfig, lambda cfg: generate_bruch_latex(cfg)["latex"]),
    "geometrie": (GeometrieConfig, generate_geometrie_latex),
    "baumdiagramm": (BaumdiagrammConfig, generate_baumdiagramm_latex),
    "glucksrad": (GlucksradConfig, generate_glucksrad_latex),
    "statistik": (StatistikConfig, generate_statistik_latex),
    "optik": (OptikConfig, lambda cfg: generate_optik_latex(cfg, calculate_images(cfg))),
    "strahlenoptik": (StrahlenoptikConfig, generate_strahlenoptik_latex),
    "flaschenzug": (FlaschenzugConfig, generate_flaschenzug_latex),
    "schaltplan": (SchaltplanConfig, generate_schaltplan_latex),
    "stellenwerttafel": (StellenwertConfig, generate_stellenwerttafel_full_latex),
    "zahlenstrahl": (ZahlenstrahlConfig, generate_zahlenstrahl_latex),
    "arbeitsblatt": (ArbeitsblattConfig, lambda cfg: generate_arbeitsblatt_latex(cfg, False, sanitize_worksheet_variables(cfg.variables))),
    "erwartungshorizont": (ErwartungshorizontConfig, generate_erwartungshorizont_latex),
    "sitzplan": (SitzplanRequest, solve_sitzplan),
    "tikzpicture": (TikzPictureConfig, generate_tikz_picture_latex),
    "lateximage": (LatexImageConfig, generate_latex_image_latex),
}

PRESET_DIR = Path(__file__).parent / "test_presets"


def get_all_preset_files():
    pattern = str(PRESET_DIR / "**" / "*.json")
    files = sorted(glob.glob(pattern, recursive=True))
    return [Path(f) for f in files]


def resolve_generator_key(preset_path: Path) -> str:
    # First check parent directory name
    parent_name = preset_path.parent.name
    if parent_name in GENERATOR_HANDLERS:
        return parent_name
    # Then check file prefix
    prefix = preset_path.stem.split("_")[0]
    if prefix in GENERATOR_HANDLERS:
        return prefix
    raise KeyError(f"Konnte Generator nicht ermitteln fuer Preset '{preset_path}' (Parent: '{parent_name}', Prefix: '{prefix}')")


ALL_PRESETS = get_all_preset_files()


@pytest.mark.parametrize("preset_path", ALL_PRESETS, ids=[p.stem for p in ALL_PRESETS])
def test_preset_generation(preset_path: Path):
    """
    Stufe 1 (Schnell): Validiert das Preset-JSON gegen das Pydantic-Model und
    überprüft, dass die LaTeX-Generierungslogik fehlerfrei durchläuft.
    """
    gen_key = resolve_generator_key(preset_path)
    model_cls, gen_fn = GENERATOR_HANDLERS[gen_key]

    with open(preset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Pydantic-Schema Validierung
    cfg = model_cls(**data)

    # 2. Generierung ausführen
    output = gen_fn(cfg)

    # 3. Assertions
    if gen_key == "sitzplan":
        assert output is not None
        assert hasattr(output, "assignment")
        assert len(output.assignment) > 0
    else:
        assert isinstance(output, str)
        assert len(output.strip()) > 50
        assert r"\documentclass" in output or r"\begin{tikzpicture}" in output


@pytest.mark.compile
@pytest.mark.parametrize("preset_path", ALL_PRESETS, ids=[p.stem for p in ALL_PRESETS])
def test_preset_compilation(preset_path: Path):
    """
    Stufe 2 (Vollständige LaTeX-Kompilierung):
    Kompiliert den erzeugten LaTeX-Code mit der realen TeX-Engine (XeLaTeX)
    zu einer PDF und bricht mit TeX-Fehlermeldung ab, wenn die Kompilierung scheitert.
    """
    gen_key = resolve_generator_key(preset_path)
    if gen_key == "sitzplan":
        pytest.skip("Sitzplan-Generator erzeugt JSON-Daten und kein LaTeX.")

    model_cls, gen_fn = GENERATOR_HANDLERS[gen_key]

    with open(preset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cfg = model_cls(**data)
    latex_code = gen_fn(cfg)

    # Echte Kompilierung ausführen
    res = compile_latex_to_pdf_bytes(latex_code, engine="xelatex")
    error_tail = res.log[-1000:] if res.log else "Kein Log vorhanden."
    assert res.ok is True, f"Kompilierung fehlgeschlagen für '{preset_path.name}'. TeX Log:\n{error_tail}"
    assert res.pdf_bytes is not None and len(res.pdf_bytes) > 0
