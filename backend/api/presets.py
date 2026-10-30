# SPDX-License-Identifier: AGPL-3.0-or-later

import io
import urllib.parse
import zipfile
from fastapi import APIRouter, HTTPException, Response
from pathlib import Path
import config
import json
from typing import Dict, Any

router = APIRouter(prefix="/presets", tags=["Presets"])

MAX_PRESET_BYTES = 1 * 1024 * 1024  # 1 MB Maximum pro Preset-JSON

ALLOWED_GENERATORS: frozenset[str] = frozenset({
    "arbeitsblatt",
    "baum",
    "baumdiagramm",
    "bruch",
    "erwartungshorizont",
    "flaschenzug",
    "geo",
    "geometrie",
    "glucksrad",
    "koord",
    "koordinatensystem",
    "koord3d",
    "koordinatensystem3d",
    "latex",
    "lateximage",
    "optik",
    "schaltplan",
    "sitzplan",
    "statistik",
    "stellenwerttafel",
    "strahlenoptik",
    "tikz",
    "tikzpicture",
    "zahlenstrahl",
})


def _validate_generator_name(generator: str) -> Path:
    clean = generator.strip().lower()
    if clean not in ALLOWED_GENERATORS:
        raise HTTPException(status_code=400, detail=f"Invalid generator name: '{generator}'")
    return config.PRESETS_DIR / clean

def _resolve_preset_file(generator: str, name: str) -> Path:
    base_dir = _validate_generator_name(generator)
    clean_path = name.replace(" / ", "/").strip()
    parts = [p.strip() for p in clean_path.split("/") if p.strip() and p.strip() != "."]
    if not parts:
        raise HTTPException(status_code=400, detail="Invalid preset name")

    for part in parts:
        if part == ".." or "\\" in part:
            raise HTTPException(status_code=400, detail="Invalid preset name")

    filename = parts[-1] + ".json"
    target_dir = base_dir.joinpath(*parts[:-1]) if len(parts) > 1 else base_dir
    file_path = target_dir / filename

    try:
        file_path.resolve().relative_to(base_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid preset path")

    return file_path

@router.get("/{generator}")
async def list_presets(generator: str):
    base_dir = _validate_generator_name(generator)
    if not base_dir.exists():
        return {}
    
    presets = {}
    for p in sorted(base_dir.rglob("*.json"), key=lambda p: str(p).lower()):
        if p.suffix == ".broken":
            continue
        try:
            rel = p.relative_to(base_dir)
            name = " / ".join(rel.with_suffix("").parts)
            presets[name] = json.loads(p.read_text("utf-8"))
        except Exception:
            continue
    return presets

@router.get("/{generator}/download-folder")
async def download_preset_folder(generator: str, folder: str = ""):
    base_dir = _validate_generator_name(generator)
    if not base_dir.exists():
        raise HTTPException(status_code=404, detail="Generator presets directory not found")
    
    clean_path = folder.replace(" / ", "/").strip()
    parts = [p.strip() for p in clean_path.split("/") if p.strip() and p.strip() != "."]
    
    # Check for path traversal attempt
    for part in parts:
        if part == ".." or "\\" in part:
            raise HTTPException(status_code=400, detail="Invalid folder path")
    
    target_dir = base_dir.joinpath(*parts) if parts else base_dir
    
    # Ensure target_dir is inside base_dir
    try:
        target_dir.resolve().relative_to(base_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder path")

    if not target_dir.exists() or not target_dir.is_dir():
        raise HTTPException(status_code=404, detail="Folder not found")
    
    json_files = [p for p in target_dir.rglob("*.json") if p.suffix != ".broken" and p.is_file()]
    if not json_files:
        raise HTTPException(status_code=404, detail="No presets found in this folder")
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for json_file in json_files:
            rel_path = json_file.relative_to(target_dir)
            zip_file.write(json_file, arcname=str(rel_path.as_posix()))
    
    zip_buffer.seek(0)
    
    folder_slug = "_".join(parts) if parts else "all"
    safe_filename = f"presets_{generator}_{folder_slug}.zip"
    encoded_filename = urllib.parse.quote(safe_filename)
    
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"; filename*=UTF-8\'\'{encoded_filename}',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.post("/{generator}/{name:path}")
async def save_preset(generator: str, name: str, data: Dict[str, Any]):
    file_path = _resolve_preset_file(generator, name)
    serialized = json.dumps(data, ensure_ascii=False, indent=2)
    if len(serialized.encode("utf-8")) > MAX_PRESET_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Preset payload exceeds maximum allowed size (1 MB).",
        )
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(serialized, "utf-8")
    return {"message": f"Preset {name} saved successfully"}

@router.delete("/{generator}/{name:path}")
async def delete_preset(generator: str, name: str):
    file_path = _resolve_preset_file(generator, name)
    if file_path.exists() and file_path.is_file():
        file_path.unlink()
        return {"message": f"Preset {name} deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Preset not found")
