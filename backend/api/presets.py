# SPDX-License-Identifier: AGPL-3.0-or-later

import base64
import binascii
import io
import urllib.parse
import zipfile
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel
import config
import json
from typing import Dict, Any

router = APIRouter(prefix="/presets", tags=["Presets"])

MAX_PRESET_BYTES = 1 * 1024 * 1024  # 1 MB Maximum pro Preset-JSON
MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024  # 2 MB Maximum pro Thumbnail-PNG
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
THUMBNAIL_SUFFIX = ".thumb.png"


class ThumbnailSaveRequest(BaseModel):
    thumbnail_base64: str

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

def _thumbnail_path(preset_file: Path) -> Path:
    """Das Thumbnail liegt neben <name>.json als <name>.thumb.png."""
    return preset_file.with_name(preset_file.stem + THUMBNAIL_SUFFIX)


def _decode_thumbnail(payload: str) -> bytes:
    raw = payload.strip()
    if raw.startswith("data:"):
        _, sep, raw = raw.partition(",")
        if not sep:
            raise HTTPException(status_code=400, detail="Invalid thumbnail data URL")
    if len(raw) > (MAX_THUMBNAIL_BYTES * 4) // 3 + 8:
        raise HTTPException(status_code=413, detail="Thumbnail exceeds maximum allowed size (2 MB).")
    try:
        data = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Invalid thumbnail encoding")
    if len(data) > MAX_THUMBNAIL_BYTES:
        raise HTTPException(status_code=413, detail="Thumbnail exceeds maximum allowed size (2 MB).")
    if not data.startswith(PNG_SIGNATURE):
        raise HTTPException(status_code=400, detail="Thumbnail must be a PNG image")
    return data


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

@router.get("/{generator}/detailed")
async def list_presets_detailed(generator: str):
    """Wie list_presets, aber mit Metadaten (has_thumbnail, updated_at) je Preset."""
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
            thumb = _thumbnail_path(p)
            has_thumb = thumb.is_file()
            mtime = max(p.stat().st_mtime, thumb.stat().st_mtime) if has_thumb else p.stat().st_mtime
            presets[name] = {
                "config": json.loads(p.read_text("utf-8")),
                "has_thumbnail": has_thumb,
                "updated_at": int(mtime),
            }
        except Exception:
            continue
    return presets


@router.get("/{generator}/thumbnail")
async def get_preset_thumbnail(generator: str, name: str):
    thumb = _thumbnail_path(_resolve_preset_file(generator, name))
    if not thumb.is_file():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    # Die Client-URL enthaelt ?v=<updated_at>, daher ist langes Caching unkritisch.
    return FileResponse(
        thumb,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=604800, immutable"},
    )


@router.put("/{generator}/thumbnail")
async def save_preset_thumbnail(generator: str, name: str, body: ThumbnailSaveRequest):
    file_path = _resolve_preset_file(generator, name)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Preset not found")
    data = _decode_thumbnail(body.thumbnail_base64)
    _thumbnail_path(file_path).write_bytes(data)
    return {"message": f"Thumbnail for {name} saved successfully"}


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
        thumb = _thumbnail_path(file_path)
        if thumb.is_file():
            thumb.unlink()
        return {"message": f"Preset {name} deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Preset not found")
