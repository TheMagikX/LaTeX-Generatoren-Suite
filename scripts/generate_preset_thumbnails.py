#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""
Batch-Generator für Preset-Thumbnails.
Durchsucht `user_data/presets/` (oder ein angegebenes Verzeichnis) nach JSON-Presets,
rendert die Grafiken via XeLaTeX / pdftoppm und legt skalierte Thumbnails
(max. 480x360 px, <= 1 MB) als `<name>.thumb.png` ab.

Ausgeschlossen:
- `arbeitsblatt` (wird standardmäßig übersprungen, da dynamische Python-/Pyodide-Ausführung clientseitig erfolgt)
"""

import argparse
import io
import json
import sys
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

# Projekt-Wurzel und Backend zum PYTHONPATH hinzufügen
REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from PIL import Image

from core.latex_render import compile_latex_to_pdf_bytes, pdf_bytes_to_first_image

# Importiere Pydantic-Modelle und LaTeX-Generatoren aus dem Backend
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
from models.erwartungshorizont import ErwartungshorizontConfig
from generators.erwartungshorizont import generate_erwartungshorizont_latex
from models.tikz_picture import TikzPictureConfig
from generators.tikz_picture import generate_tikz_picture_latex
from models.latex_image import LatexImageConfig
from generators.latex_image import generate_latex_image_latex

# Zuordnung der kanonischen Generator-Namen zu (PydanticModel, LaTeXGeneratorFn)
GENERATOR_HANDLERS: Dict[str, Tuple[Any, Callable[[Any], str]]] = {
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
    "erwartungshorizont": (ErwartungshorizontConfig, generate_erwartungshorizont_latex),
    "tikzpicture": (TikzPictureConfig, generate_tikz_picture_latex),
    "lateximage": (LatexImageConfig, generate_latex_image_latex),
}

# Aliase für Generator-Ordnernamen im user_data/presets Verzeichnis
GENERATOR_ALIASES: Dict[str, str] = {
    "koordinatensystem": "koord",
    "koordinatensystem3d": "koord3d",
    "geo": "geometrie",
    "baum": "baumdiagramm",
    "tikz": "tikzpicture",
    "latex": "lateximage",
}

# Standardmäßig ausgeschlossene Generatoren (z.B. arbeitsblatt wegen Pyodide/Client-Worker)
EXCLUDED_GENERATORS = {"arbeitsblatt", "sitzplan"}

MAX_WIDTH = 480
MAX_HEIGHT = 360
MAX_THUMBNAIL_BYTES = 1 * 1024 * 1024  # 1 MB


def canonical_generator_name(raw_name: str) -> str:
    clean = raw_name.strip().lower()
    return GENERATOR_ALIASES.get(clean, clean)


def resize_to_thumbnail(img: Image.Image, max_w: int = MAX_WIDTH, max_h: int = MAX_HEIGHT) -> Image.Image:
    """Skaliert ein PIL Image proportional herunter und bettet es auf weißem Hintergrund ein."""
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        alpha_img = img.convert("RGBA")
        background = Image.new("RGBA", alpha_img.size, (255, 255, 255, 255))
        composite = Image.alpha_composite(background, alpha_img)
        base = composite.convert("RGB")
    else:
        base = img.convert("RGB")

    base.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    return base


def compile_latex_for_thumbnail(latex: str, engine: str = "xelatex") -> bytes:
    """
    Kompiliert LaTeX-Code für Thumbnails über die zentrale Pipeline in `core.latex_render`,
    sodass Pre-Compilation-Security-Filter, `TEXINPUTS`, Prozessbaum-Cleanup und `.fls`-File-Guard
    an einer einzigen Stelle gepflegt werden.
    """
    res = compile_latex_to_pdf_bytes(latex, engine=engine)
    if not res.ok or not res.pdf_bytes:
        log_tail = res.log[-400:].strip() if res.log else "Kein TeX-Log vorhanden."
        raise RuntimeError(f"Kompilierung fehlgeschlagen: {log_tail}")
    return res.pdf_bytes


def render_preset_to_thumbnail(preset_path: Path, generator_key: str, dest_thumb_path: Path) -> None:
    handler_info = GENERATOR_HANDLERS.get(generator_key)
    if not handler_info:
        raise ValueError(f"Kein Handler für Generator '{generator_key}' registriert.")

    model_cls, gen_fn = handler_info

    content = preset_path.read_text(encoding="utf-8")
    data = json.loads(content)

    # Validierung / Pydantic Instanziierung
    config_obj = model_cls(**data)

    # LaTeX-Quellcode generieren
    latex_code = gen_fn(config_obj)
    if not isinstance(latex_code, str) or not latex_code.strip():
        raise ValueError("Generator hat leeren LaTeX-Code geliefert.")

    # PDF kompilieren
    pdf_bytes = compile_latex_for_thumbnail(latex_code)

    # Erstes Bild aus PDF extrahieren (pdftoppm / pdf2image)
    pil_img, _ = pdf_bytes_to_first_image(pdf_bytes, dpi=150)

    # Skalieren auf max 480x360
    thumb_img = resize_to_thumbnail(pil_img, MAX_WIDTH, MAX_HEIGHT)

    # Speichern als PNG (mit Dateigrößen-Check)
    buf = io.BytesIO()
    thumb_img.save(buf, format="PNG", optimize=True)
    thumb_bytes = buf.getvalue()

    if len(thumb_bytes) > MAX_THUMBNAIL_BYTES:
        raise RuntimeError(f"Thumbnail überschreitet maximal erlaubte Größe (1 MB): {len(thumb_bytes)} Bytes")

    dest_thumb_path.write_bytes(thumb_bytes)


def process_preset(
    preset_file: Path,
    presets_root: Path,
    force: bool = False,
) -> Tuple[str, str, Optional[str]]:
    """
    Verarbeitet eine einzelne Preset-JSON.
    Rückgabe: (Status, Pfad-Identifikator, Optionale Fehlermeldung)
    Status: 'OK', 'SKIPPED', 'EXCLUDED', 'ERROR'
    """
    try:
        rel_parts = preset_file.relative_to(presets_root).parts
        if not rel_parts:
            return "ERROR", str(preset_file), "Ungültiger relativer Pfad"
        
        gen_dir_name = rel_parts[0]
        gen_key = canonical_generator_name(gen_dir_name)

        if gen_key in EXCLUDED_GENERATORS or gen_dir_name.lower() in EXCLUDED_GENERATORS:
            return "EXCLUDED", str(preset_file.relative_to(presets_root)), f"Generator '{gen_dir_name}' ist ausgeklammert."

        if gen_key not in GENERATOR_HANDLERS:
            return "ERROR", str(preset_file.relative_to(presets_root)), f"Unbekannter Generator '{gen_dir_name}'."

        thumb_file = preset_file.with_name(f"{preset_file.stem}.thumb.png")
        if thumb_file.exists() and not force:
            return "SKIPPED", str(preset_file.relative_to(presets_root)), "Thumbnail existiert bereits."

        render_preset_to_thumbnail(preset_file, gen_key, thumb_file)
        return "OK", str(preset_file.relative_to(presets_root)), None

    except Exception as exc:
        return "ERROR", str(preset_file.relative_to(presets_root)), str(exc)


def main() -> None:
    parser = argparse.ArgumentParser(description="Batch-Generierung von Preset-Thumbnails")
    parser.add_argument(
        "--presets-dir",
        type=Path,
        default=REPO_ROOT / "user_data" / "presets",
        help="Pfad zum Presets-Verzeichnis (Standard: user_data/presets)",
    )
    parser.add_argument(
        "--generator",
        type=str,
        default=None,
        help="Optional: Nur einen bestimmten Generator bearbeiten (z.B. 'koord', 'tikz')",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Bereits existierende Thumbnails überschreiben und neu generieren",
    )
    args = parser.parse_args()

    presets_root: Path = args.presets_dir.resolve()
    if not presets_root.exists() or not presets_root.is_dir():
        print(f"Fehler: Presets-Verzeichnis '{presets_root}' existiert nicht.")
        sys.exit(1)

    print("=" * 70)
    print("Preset-Thumbnail Batch-Generator")
    print(f"Zielverzeichnis: {presets_root}")
    print(f"Überschreiben (--force): {args.force}")
    if args.generator:
        print(f"Filter Generator: {args.generator}")
    print("=" * 70)

    # Alle JSON-Dateien rekursiv sammeln (keine .broken oder andere Formate)
    all_json_files: List[Path] = sorted(
        [p for p in presets_root.rglob("*.json") if p.is_file() and p.suffix != ".broken"],
        key=lambda p: str(p).lower(),
    )

    if args.generator:
        filter_key = canonical_generator_name(args.generator)
        all_json_files = [
            p for p in all_json_files
            if canonical_generator_name(p.relative_to(presets_root).parts[0]) == filter_key
        ]

    total = len(all_json_files)
    print(f"Gefundene Presets: {total}\n")

    successful: List[str] = []
    skipped: List[Tuple[str, str]] = []
    excluded: List[Tuple[str, str]] = []
    failed: List[Tuple[str, str]] = []

    t_start = time.perf_counter()

    for idx, preset_file in enumerate(all_json_files, 1):
        rel_path = preset_file.relative_to(presets_root)
        print(f"[{idx}/{total}] Verarbeite: {rel_path} ... ", end="", flush=True)

        status, item_path, err_msg = process_preset(preset_file, presets_root, force=args.force)

        if status == "OK":
            print("OK")
            successful.append(item_path)
        elif status == "SKIPPED":
            print(f"Übersprungen ({err_msg})")
            skipped.append((item_path, err_msg or ""))
        elif status == "EXCLUDED":
            print(f"Ausgeklammert ({err_msg})")
            excluded.append((item_path, err_msg or ""))
        else:
            print(f"FEHLER: {err_msg}")
            failed.append((item_path, err_msg or "Unbekannter Fehler"))

    t_elapsed = time.perf_counter() - t_start

    # Abschlussbericht / Log
    print("\n" + "=" * 70)
    print("ZUSAMMENFASSUNG DER BATCH-GENERIERUNG")
    print("=" * 70)
    print(f"Gesamtlaufzeit:       {t_elapsed:.2f} s")
    print(f"Erfolgreich erzeugt:  {len(successful)}")
    print(f"Bereits vorhanden:    {len(skipped)}")
    print(f"Ausgeklammert:        {len(excluded)}")
    print(f"Fehlgeschlagen:       {len(failed)}")

    if failed:
        print("\n--- Fehlgeschlagene Presets (Fehler-Log) ---")
        for item, reason in failed:
            print(f"  • {item}:\n      -> {reason}")
    print("=" * 70)


if __name__ == "__main__":
    main()
