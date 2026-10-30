# SPDX-License-Identifier: AGPL-3.0-or-later

import asyncio
import logging
import os
import pathlib
import shutil
import subprocess
import sys
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

import config
from core.latex_render import validate_latex_source_security
from core.update_checker import check_for_updates

logger = logging.getLogger("generator_suite.settings")

router = APIRouter(prefix="/settings", tags=["Settings"])
_BROWSE_DIALOG_LOCK = asyncio.Lock()


class LatexSettingsPayload(BaseModel):
    custom_commands_path: Optional[str] = Field(None, description="Pfad zur privaten commands.tex")
    custom_packages_path: Optional[str] = Field(None, description="Pfad zur privaten Pakete.tex")
    custom_path: Optional[str] = Field(None, description="Alias für custom_commands_path")
    additional_inputs: Optional[List[str]] = Field(None, description="Liste zusätzlicher .tex Dateipfade")
    custom_sty_packages: Optional[List[str]] = Field(None, description="Liste zusätzlicher .sty Dateipfade")


class BrowsePayload(BaseModel):
    title: Optional[str] = Field("LaTeX-Datei auswählen", description="Fenstertitel für den Dialog")
    filter_pattern: Optional[str] = Field("*.tex;*.sty", description="Dateifilter")


class UpdateSettingsPayload(BaseModel):
    check_on_startup: Optional[bool] = Field(None, description="Automatisch beim Start nach Updates suchen")


def _validate_and_normalize_latex_path(raw_path: str, allowed_suffixes: tuple[str, ...]) -> str:
    """
    Validates that a configured LaTeX file has an allowed extension (.tex / .sty)
    and resides strictly inside LATEX_FILES_DIR or CUSTOM_LATEX_DIR.
    Returns a normalized project-relative display path.
    """
    cleaned = raw_path.strip()
    p = pathlib.Path(cleaned)
    if p.suffix.lower() not in allowed_suffixes:
        raise HTTPException(
            status_code=400,
            detail=f"Ungültige Dateiendung ('{p.suffix}'). Erlaubt sind nur: {', '.join(allowed_suffixes)}",
        )

    resolved = config.resolve_allowed_latex_path(cleaned, allowed_suffixes=allowed_suffixes)
    if resolved is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Aus Sicherheitsgründen dürfen nur Dateien aus dem Projekt- oder custom_latex-Verzeichnis "
                "eingebunden werden. Bitte nutze den Datei-Upload oder den Durchsuchen-Dialog."
            ),
        )
    return config.to_display_path(resolved)


def _get_latex_status_dict() -> dict:
    settings = config.get_user_settings()
    latex_cfg = settings.get("latex", {})

    # 1. Primary commands.tex status
    cmd_path_str = latex_cfg.get("custom_commands_path")
    cmd_exists = False
    cmd_resolved = None
    if cmd_path_str:
        p = config.resolve_allowed_latex_path(cmd_path_str, allowed_suffixes=(".tex",))
        if p:
            cmd_exists = p.is_file()
            cmd_resolved = config.to_display_path(p)

    active_commands_file = config.to_display_path(config.get_commands_file_path())
    default_commands_file = config.to_display_path(config.COMMANDS_DEFAULT_FILE)

    local_cmd = config.LATEX_FILES_DIR / "commands.tex"
    suggested_local_cmd = config.to_display_path(local_cmd) if local_cmd.is_file() else None

    # 2. Pakete.tex status
    pkg_path_str = latex_cfg.get("custom_packages_path")
    pkg_exists = False
    pkg_resolved = None
    if pkg_path_str:
        p = config.resolve_allowed_latex_path(pkg_path_str, allowed_suffixes=(".tex",))
        if p:
            pkg_exists = p.is_file()
            pkg_resolved = config.to_display_path(p)

    active_packages_file = config.to_display_path(config.get_packages_file_path())
    default_packages_file = config.to_display_path(config.PACKAGES_DEFAULT_FILE)

    local_pkg = config.LATEX_FILES_DIR / "Pakete.tex"
    suggested_local_pkg = config.to_display_path(local_pkg) if local_pkg.is_file() else None

    # 3. Additional inputs status (.tex)
    raw_additionals = latex_cfg.get("additional_inputs", [])
    additional_items = []
    for item in raw_additionals:
        if isinstance(item, str):
            p = config.resolve_allowed_latex_path(item, allowed_suffixes=(".tex",))
            exists = bool(p and p.is_file())
            rel_path = config.to_display_path(p) if p else pathlib.Path(item).name
            additional_items.append({
                "path": rel_path,
                "exists": exists,
                "resolved": rel_path if exists else None,
            })

    # Detect known unversioned .tex files in project folder that could be added
    suggested_additional = []
    for name in ["columntypes.tex", "colorboxen.tex", "TikZ.tex"]:
        local_p = config.LATEX_FILES_DIR / name
        if local_p.is_file():
            rel_p = config.to_display_path(local_p)
            if not any(item["path"] == rel_p for item in additional_items):
                suggested_additional.append({
                    "name": name,
                    "path": rel_p
                })

    # 4. Custom .sty packages status
    raw_sty = latex_cfg.get("custom_sty_packages", [])
    sty_items = []
    for item in raw_sty:
        if isinstance(item, str):
            p = config.resolve_allowed_latex_path(item, allowed_suffixes=(".sty",))
            exists = bool(p and p.is_file())
            rel_path = config.to_display_path(p) if p else pathlib.Path(item).name
            sty_items.append({
                "path": rel_path,
                "exists": exists,
                "resolved": rel_path if exists else None,
            })

    # Suggested local .sty packages (e.g. mygeodreieck.sty)
    suggested_sty = []
    local_geo = config.LATEX_FILES_DIR / "mygeodreieck.sty"
    if local_geo.is_file():
        rel_geo = config.to_display_path(local_geo)
        if not any(item["path"] == rel_geo for item in sty_items):
            suggested_sty.append({
                "name": "mygeodreieck.sty",
                "path": rel_geo
            })

    return {
        "commands": {
            "custom_path": cmd_resolved or cmd_path_str,
            "custom_path_resolved": cmd_resolved,
            "is_custom": bool(cmd_path_str and cmd_exists),
            "file_exists": cmd_exists,
            "active_file": active_commands_file,
            "default_file": default_commands_file,
            "suggested_local_path": suggested_local_cmd,
        },
        "packages": {
            "custom_path": pkg_resolved or pkg_path_str,
            "custom_path_resolved": pkg_resolved,
            "is_custom": bool(pkg_path_str and pkg_exists),
            "file_exists": pkg_exists,
            "active_file": active_packages_file,
            "default_file": default_packages_file,
            "suggested_local_path": suggested_local_pkg,
        },
        "additional_inputs": additional_items,
        "suggested_additional": suggested_additional,
        "custom_sty_packages": sty_items,
        "suggested_sty": suggested_sty,
        # Backward compatibility
        "custom_path": cmd_resolved or cmd_path_str,
        "custom_path_resolved": cmd_resolved,
        "is_custom": bool(cmd_path_str and cmd_exists),
        "file_exists": cmd_exists,
        "active_file": active_commands_file,
        "default_file": default_commands_file,
        "suggested_local_path": suggested_local_cmd,
    }


@router.get("/latex")
async def get_latex_settings():
    """Gibt den aktuellen Status von commands.tex, Pakete.tex, Zusatz-Inputs und .sty-Paketen zurück."""
    return _get_latex_status_dict()


@router.post("/latex")
async def update_latex_settings(payload: LatexSettingsPayload):
    """Aktualisiert commands.tex, Pakete.tex, zusätzliche Inputs und/oder .sty-Pakete."""
    settings = config.get_user_settings()
    if "latex" not in settings or not isinstance(settings["latex"], dict):
        settings["latex"] = {}

    # Handle commands.tex
    if "custom_commands_path" in payload.model_fields_set or "custom_path" in payload.model_fields_set:
        effective_cmd_path = payload.custom_commands_path if "custom_commands_path" in payload.model_fields_set else payload.custom_path
        cleaned_cmd = effective_cmd_path.strip() if effective_cmd_path else None
        if cleaned_cmd:
            settings["latex"]["custom_commands_path"] = _validate_and_normalize_latex_path(
                cleaned_cmd, allowed_suffixes=(".tex",)
            )
        else:
            settings["latex"]["custom_commands_path"] = None

    # Handle Pakete.tex
    if "custom_packages_path" in payload.model_fields_set:
        cleaned_pkg = payload.custom_packages_path.strip() if payload.custom_packages_path else None
        if cleaned_pkg:
            settings["latex"]["custom_packages_path"] = _validate_and_normalize_latex_path(
                cleaned_pkg, allowed_suffixes=(".tex",)
            )
        else:
            settings["latex"]["custom_packages_path"] = None

    # Handle additional_inputs (.tex)
    if "additional_inputs" in payload.model_fields_set and payload.additional_inputs is not None:
        cleaned_additionals = []
        for item in payload.additional_inputs:
            if isinstance(item, str) and item.strip():
                cleaned_additionals.append(
                    _validate_and_normalize_latex_path(item.strip(), allowed_suffixes=(".tex",))
                )
        settings["latex"]["additional_inputs"] = cleaned_additionals

    # Handle custom_sty_packages (.sty)
    if "custom_sty_packages" in payload.model_fields_set and payload.custom_sty_packages is not None:
        cleaned_stys = []
        for item in payload.custom_sty_packages:
            if isinstance(item, str) and item.strip():
                cleaned_stys.append(
                    _validate_and_normalize_latex_path(item.strip(), allowed_suffixes=(".sty",))
                )
        settings["latex"]["custom_sty_packages"] = cleaned_stys

    config.save_user_settings(settings)
    return _get_latex_status_dict()


@router.post("/latex/upload")
async def upload_latex_file(
    file: UploadFile = File(...),
    category: str = Form("commands"),  # "commands" | "packages" | "additional" | "sty"
):
    """
    Lädt eine benutzerdefinierte .tex oder .sty Datei hoch und speichert sie persistent
    im custom_latex Verzeichnis (auch im Docker-Container persistent via Presets-Volume).
    """
    raw_filename = file.filename or "uploaded.tex"
    clean_filename = pathlib.Path(raw_filename).name
    suffix = pathlib.Path(clean_filename).suffix.lower()

    if category == "sty":
        if suffix != ".sty":
            raise HTTPException(status_code=400, detail="Für Pakete sind nur .sty-Dateien erlaubt.")
    else:
        if suffix not in (".tex", ".sty"):
            raise HTTPException(status_code=400, detail="Es sind nur .tex- oder .sty-Dateien erlaubt.")

    config.CUSTOM_LATEX_DIR.mkdir(parents=True, exist_ok=True)
    target_path = (config.CUSTOM_LATEX_DIR / clean_filename).resolve()

    if not target_path.is_relative_to(config.CUSTOM_LATEX_DIR.resolve()):
        raise HTTPException(status_code=400, detail="Ungültiger Dateiname.")

    MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Datei ist zu groß (maximal 5 MB erlaubt).")

    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Die hochgeladene Datei ist keine gültige UTF-8-Textdatei.")

    sec_err = validate_latex_source_security(text_content)
    if sec_err:
        raise HTTPException(status_code=400, detail=sec_err)

    target_path.write_bytes(content)

    # Automatisch in den Einstellungen aktivieren (als relativer Pfad ohne Host-Username)
    settings = config.get_user_settings()
    if "latex" not in settings or not isinstance(settings["latex"], dict):
        settings["latex"] = {}

    target_display = config.to_display_path(target_path)
    if category == "commands":
        settings["latex"]["custom_commands_path"] = target_display
    elif category == "packages":
        settings["latex"]["custom_packages_path"] = target_display
    elif category == "additional":
        current_additionals = settings["latex"].get("additional_inputs", [])
        if target_display not in current_additionals:
            current_additionals.append(target_display)
            settings["latex"]["additional_inputs"] = current_additionals
    elif category == "sty":
        current_stys = settings["latex"].get("custom_sty_packages", [])
        if target_display not in current_stys:
            current_stys.append(target_display)
            settings["latex"]["custom_sty_packages"] = current_stys

    config.save_user_settings(settings)

    return {
        "status": "ok",
        "filename": clean_filename,
        "saved_path": target_display,
        "settings": _get_latex_status_dict(),
    }


def _open_native_dialog(dialog_title: str = "LaTeX-Datei auswählen") -> Optional[str]:
    """Öffnet den nativen Windows-Dateiauswahldialog über ein isoliertes Tkinter-Subprocess."""
    init_dir = str(config.PROJECT_ROOT)
    if config.LATEX_FILES_DIR.is_dir():
        init_dir = str(config.LATEX_FILES_DIR.resolve())

    script = """
import sys
import pathlib
try:
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    root.focus_force()
    initial_dir = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else None
    title = "LaTeX-Datei auswählen"
    file_path = filedialog.askopenfilename(
        parent=root,
        title=title,
        initialdir=initial_dir,
        filetypes=[
            ("LaTeX-Dateien (*.tex;*.sty)", "*.tex;*.sty"),
            ("Paket-Dateien (*.sty)", "*.sty"),
        ]
    )
    root.destroy()
    if file_path:
        print(pathlib.Path(file_path).resolve().as_posix())
except Exception as e:
    sys.stderr.write(str(e))
"""
    try:
        res = subprocess.run(
            [sys.executable, "-c", script, init_dir, dialog_title],
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=120,
        )
        output = res.stdout.strip()
        if output:
            return output
    except subprocess.TimeoutExpired:
        logger.info("Dateiauswahldialog abgelaufen (Timeout).")
    except Exception as e:
        logger.error(f"Fehler beim Öffnen des Dateiauswahldialogs: {e}")

    return None


@router.post("/latex/browse")
async def browse_latex_file(payload: Optional[BrowsePayload] = None):
    """Öffnet den nativen Windows Explorer / Dateidialog (nur im lokalen Desktop-Betrieb unter Windows)."""
    if sys.platform != "win32" or os.environ.get("IS_DOCKER"):
        return {"path": None, "available": False, "message": "Nativer Dateidialog ist nur im Windows-Desktop-Betrieb verfügbar. Bitte Datei-Upload nutzen."}

    if _BROWSE_DIALOG_LOCK.locked():
        raise HTTPException(status_code=409, detail="Ein Dateiauswahldialog ist bereits geöffnet.")
    title = "LaTeX-Datei auswählen"
    loop = asyncio.get_running_loop()
    async with _BROWSE_DIALOG_LOCK:
        chosen_path = await loop.run_in_executor(None, _open_native_dialog, title)
    if not chosen_path:
        return {"path": None, "available": True}

    p = pathlib.Path(chosen_path)
    if p.suffix.lower() not in (".tex", ".sty"):
        raise HTTPException(status_code=400, detail="Es sind nur .tex- oder .sty-Dateien erlaubt.")

    if p.is_file():
        try:
            file_text = p.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Datei konnte nicht gelesen werden: {e}")

        sec_err = validate_latex_source_security(file_text)
        if sec_err:
            raise HTTPException(status_code=400, detail=sec_err)

    # Falls die ausgewählte Datei außerhalb von LATEX_FILES_DIR / CUSTOM_LATEX_DIR liegt und existiert,
    # kopieren wir sie automatisch nach CUSTOM_LATEX_DIR, damit nur relative TeX-Pfade verwendet werden.
    if config.is_within_allowed_latex_dirs(p):
        return {"path": config.to_display_path(p), "available": True}

    if p.is_file():
        config.CUSTOM_LATEX_DIR.mkdir(parents=True, exist_ok=True)
        dest = (config.CUSTOM_LATEX_DIR / p.name).resolve()
        if dest != p.resolve():
            shutil.copy2(p, dest)
        return {"path": config.to_display_path(dest), "available": True}

    return {"path": config.to_display_path(config.CUSTOM_LATEX_DIR / p.name), "available": True}


@router.get("/updates")
async def get_update_status():
    """Gibt den aktuellen Update-Status und Einstellungen zurück."""
    update_cfg = config.get_update_settings()
    return {
        "status": "success",
        "current_version": config.APP_VERSION,
        "check_on_startup": update_cfg["check_on_startup"],
        "last_checked": update_cfg["last_checked"],
        "cached_result": update_cfg["cached_result"],
    }


@router.post("/updates")
async def update_settings_config(payload: UpdateSettingsPayload):
    """Speichert die Update-Einstellungen (z. B. check_on_startup)."""
    settings = config.get_user_settings()
    updates = settings.get("updates", {})
    if payload.check_on_startup is not None:
        updates["check_on_startup"] = bool(payload.check_on_startup)
    settings["updates"] = updates
    config.save_user_settings(settings)
    return {
        "status": "success",
        "current_version": config.APP_VERSION,
        "check_on_startup": updates.get("check_on_startup", False),
        "last_checked": updates.get("last_checked"),
        "cached_result": updates.get("cached_result"),
    }


@router.post("/updates/check")
async def check_updates(force: bool = False):
    """Prüft GitHub Releases auf Updates (force=True umgeht den 12h-Cache)."""
    result = await check_for_updates(force=force, current_version=config.APP_VERSION)
    return result
