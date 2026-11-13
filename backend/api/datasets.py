# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 C. Meyer

import logging
from typing import Any
from fastapi import APIRouter, HTTPException, UploadFile, File

import config
from core.csv_sanitizer import (
    sanitize_csv_filename,
    save_csv_dataset,
    list_csv_datasets,
    MAX_CSV_SIZE_BYTES,
)

logger = logging.getLogger("generator_suite.api.datasets")
router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("", response_model=list[dict[str, Any]])
def get_datasets():
    """Gibt eine Liste aller im Datensatz-Ordner vorhandenen CSV-Dateien zurück."""
    try:
        return list_csv_datasets()
    except Exception as e:
        logger.error(f"Fehler beim Auflisten der Datensätze: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Lesen der Datensätze.")


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Lädt eine neue .csv-Datei hoch, validiert Inhalt und Dateinamen
    und legt sie sicher im Datensatz-Verzeichnis ab.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Kein Dateiname angegeben.")

    try:
        content = await file.read(MAX_CSV_SIZE_BYTES + 1)
        if len(content) > MAX_CSV_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"Datei ist zu groß (maximal {MAX_CSV_SIZE_BYTES // (1024 * 1024)} MB erlaubt).",
            )

        result = save_csv_dataset(file.filename, content)
        return {
            "status": "ok",
            "dataset": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unerwarteter Fehler beim CSV-Upload: {e}")
        raise HTTPException(status_code=500, detail=f"Upload fehlgeschlagen: {e}")


@router.delete("/{filename}")
def delete_dataset(filename: str):
    """Löscht eine CSV-Datei aus dem Datensatz-Verzeichnis."""
    try:
        clean_name = sanitize_csv_filename(filename)
        target = (config.DATASETS_DIR / clean_name).resolve()
        if not config.is_within_datasets_dir(target):
            raise HTTPException(status_code=400, detail="Ungültiger Dateipfad.")

        if not target.is_file():
            raise HTTPException(status_code=404, detail="Datensatz nicht gefunden.")

        target.unlink()
        return {"status": "ok", "deleted": clean_name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fehler beim Löschen des Datensatzes '{filename}': {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Löschen der Datei.")
