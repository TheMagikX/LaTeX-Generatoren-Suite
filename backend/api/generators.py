# SPDX-License-Identifier: AGPL-3.0-or-later

import logging
from fastapi import APIRouter, HTTPException
from models.koordinatensystem import CoordinateSystemConfig
from generators.koordinatensystem import generate_koordinatensystem_latex
from models.koordinatensystem3d import CoordinateSystem3DConfig
from generators.koordinatensystem3d import generate_koordinatensystem3d_latex
from models.baumdiagramm import BaumdiagrammConfig
from generators.baumdiagramm import generate_baumdiagramm_latex
from models.glucksrad import GlucksradConfig
from generators.glucksrad import generate_glucksrad_latex
from models.geometrie import GeometrieConfig
from generators.geometrie import generate_geometrie_latex, solve_triangle, solve_quadrilateral
from models.optik import OptikConfig
from generators.optik import generate_optik_latex, calculate_images
from models.flaschenzug import FlaschenzugConfig
from generators.flaschenzug import generate_flaschenzug_latex
from models.arbeitsblatt import ArbeitsblattConfig
from generators.arbeitsblatt import generate_arbeitsblatt_latex, sanitize_worksheet_variables
from models.latex_image import LatexImageConfig
from generators.latex_image import generate_latex_image_latex
from models.erwartungshorizont import ErwartungshorizontConfig
from generators.erwartungshorizont import generate_erwartungshorizont_latex
from models.tikz_picture import TikzPictureConfig
from generators.tikz_picture import generate_tikz_picture_latex
from models.zahlenstrahl import ZahlenstrahlConfig
from generators.zahlenstrahl import generate_zahlenstrahl_latex
from models.bruch import BruchConfig
from generators.bruch import generate_bruch_latex
from models.schaltplan import SchaltplanConfig
from generators.schaltplan import generate_schaltplan_latex
from models.sitzplan import SitzplanRequest
from generators.sitzplan import solve_sitzplan
from models.strahlenoptik import StrahlenoptikConfig
from generators.strahlenoptik import generate_strahlenoptik_latex
from models.stellenwerttafel import StellenwertConfig
from generators.stellenwerttafel import generate_stellenwerttafel_full_latex
from models.statistik import StatistikConfig, DataMode
from generators.statistik import generate_statistik_latex, calculate_params, get_dataset_data

logger = logging.getLogger("generator_suite.generators")
router = APIRouter(prefix="/generators", tags=["Generators"])

@router.post("/statistik")
async def generate_statistik(cfg: StatistikConfig):
    try:
        latex = generate_statistik_latex(cfg)
        
        results = []
        for ds in cfg.datasets:
            if ds.data_mode == DataMode.PARAMETERS:
                params = ds.params
            else:
                params = calculate_params(get_dataset_data(ds))
            results.append({
                "name": ds.name,
                "params": params.model_dump() if params else None
            })
            
        return {"latex": latex, "results": results}
    except Exception:
        logger.exception("Fehler bei der Generierung (Statistik)")
        raise HTTPException(status_code=500, detail="Fehler bei der Generierung der LaTeX-Vorlage.")

@router.post("/stellenwerttafel")
async def generate_stellenwerttafel(cfg: StellenwertConfig):
    latex = generate_stellenwerttafel_full_latex(cfg)
    return {"latex": latex}

@router.post("/sitzplan")
async def generate_sitzplan(cfg: SitzplanRequest):
    return solve_sitzplan(cfg)

@router.post("/schaltplan")
async def generate_schaltplan(cfg: SchaltplanConfig):
    latex = generate_schaltplan_latex(cfg)
    return {"latex": latex}

@router.post("/bruch")
async def generate_bruch(cfg: BruchConfig):
    return generate_bruch_latex(cfg)

@router.post("/zahlenstrahl")
async def generate_zahlenstrahl(cfg: ZahlenstrahlConfig):
    latex = generate_zahlenstrahl_latex(cfg)
    return {"latex": latex}

@router.post("/lateximage")
async def generate_lateximage(cfg: LatexImageConfig):
    latex = generate_latex_image_latex(cfg)
    return {"latex": latex}

@router.post("/erwartungshorizont")
async def generate_erwartungshorizont(cfg: ErwartungshorizontConfig):
    latex = generate_erwartungshorizont_latex(cfg)
    return {"latex": latex}

@router.post("/tikzpicture")
async def generate_tikzpicture(cfg: TikzPictureConfig):
    latex = generate_tikz_picture_latex(cfg)
    return {"latex": latex}

@router.post("/arbeitsblatt/generate")
async def generate_arbeitsblatt(cfg: ArbeitsblattConfig):
    vars = sanitize_worksheet_variables(cfg.variables)
    exec_error = None
    seed = cfg.random_seed

    latex_tasks = generate_arbeitsblatt_latex(cfg, show_solution=False, python_vars=vars)
    latex_solutions = generate_arbeitsblatt_latex(cfg, show_solution=True, python_vars=vars)
    
    return {
        "latex_tasks": latex_tasks,
        "latex_solutions": latex_solutions,
        "variables": vars,
        "error": exec_error,
        "seed": seed
    }

@router.post("/koordinatensystem")
async def generate_koordinatensystem(cfg: CoordinateSystemConfig):
    latex = generate_koordinatensystem_latex(cfg)
    return {"latex": latex}

@router.post("/koordinatensystem3d")
async def generate_koordinatensystem3d(cfg: CoordinateSystem3DConfig):
    latex = generate_koordinatensystem3d_latex(cfg)
    return {"latex": latex}

@router.post("/baumdiagramm")
async def generate_baumdiagramm(cfg: BaumdiagrammConfig):
    latex = generate_baumdiagramm_latex(cfg)
    return {"latex": latex}

@router.post("/glucksrad")
async def generate_glucksrad(cfg: GlucksradConfig):
    latex = generate_glucksrad_latex(cfg)
    return {"latex": latex}

@router.post("/geometrie")
async def generate_geometrie(cfg: GeometrieConfig):
    if cfg.shape == "Triangle":
        result, error = solve_triangle(cfg.construction)
    else:
        result, error = solve_quadrilateral(cfg.quad_construction)
    latex = generate_geometrie_latex(cfg)
    solved = None
    if result:
        solved = {
            "sides": {k: round(v, 4) for k, v in result["sides"].items()},
            "angles": {k: round(v, 2) for k, v in result["angles"].items()},
        }
        if "diagonals" in result:
            solved["diagonals"] = result["diagonals"]
        if "area" in result:
            solved["area"] = result["area"]
        if "perimeter" in result:
            solved["perimeter"] = result["perimeter"]
    return {"latex": latex, "solved": solved, "error": error}

@router.post("/optik")
async def generate_optik(cfg: OptikConfig):
    """
    Berechnet das Linsensystem und gibt den LaTeX-Code sowie die
    berechneten Bildwerte (b, B, Abbildungsmaßstab, virtuell/reell)
    zurück, damit die Frontend-UI sie direkt darstellen kann.
    """
    images = calculate_images(cfg)
    latex = generate_optik_latex(cfg, images)

    # Serialisiere Inf-Werte für JSON
    def _safe(v):
        if v == float("inf") or v == float("-inf"):
            return None
        return v

    metrics = [
        {
            "x": _safe(img["x"]),
            "y": _safe(img["y"]),
            "b": _safe(img["b"]),
            "g": _safe(img["g"]),
            "m": _safe(img["m"]),
            "virtual": img["virtual"],
        }
        for img in images
    ]

    return {"latex": latex, "metrics": metrics}

@router.post("/flaschenzug")
async def generate_flaschenzug(cfg: FlaschenzugConfig):
    latex = generate_flaschenzug_latex(cfg)
    return {"latex": latex}

@router.post("/strahlenoptik")
async def generate_strahlenoptik(cfg: StrahlenoptikConfig):
    try:
        latex = generate_strahlenoptik_latex(cfg)
        return {"latex": latex}
    except Exception:
        logger.exception("Fehler bei der Generierung (Strahlenoptik)")
        raise HTTPException(status_code=500, detail="Fehler bei der Generierung der LaTeX-Vorlage.")
