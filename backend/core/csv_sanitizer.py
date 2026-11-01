# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 C. Meyer

import csv
import io
import os
import pathlib
import re
from typing import Any

import config

MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Unerlaubte TeX-Befehle und Steuersequenzen in CSV-Dateien (Schutz vor Code-Injection via TeX)
_FORBIDDEN_CSV_TEX_RE = re.compile(
    r"\\(?:write18|write|openin|openout|read|newread|newwrite|catcode|csname|"
    r"def|edef|gdef|xdef|let|futurelet|input|include|@@input|scantokens|"
    r"directlua|loop|repeat|immediate)(?![a-zA-Z@])",
    re.IGNORECASE,
)


def sanitize_csv_filename(filename: str) -> str:
    """
    Bereinigt den Dateinamen für eine CSV-Datei:
    - Entfernt Pfadkomponenten (Directory-Traversal Schutz)
    - Erlaubt nur alphanumerische Zeichen, Bindestriche, Unterstriche und Punkt
    - Erzwingt die Dateiendung .csv
    """
    if not filename:
        raise ValueError("Dateiname darf nicht leer sein.")

    # Nur den reinen Dateinamen betrachten (Pfadanteile strippen)
    raw_name = pathlib.Path(filename.strip().replace("\\", "/")).name.strip()
    if not raw_name:
        raise ValueError("Ungültiger Dateiname.")

    if not raw_name.lower().endswith(".csv"):
        raise ValueError("Es sind ausschließlich Dateien mit der Endung .csv erlaubt.")

    stem = raw_name[:-4]
    # Unerlaubte Zeichen durch Unterstriche ersetzen
    clean_stem = re.sub(r"[^a-zA-Z0-9_\-]", "_", stem).strip("._-")
    if not clean_stem:
        clean_stem = "dataset"

    clean_filename = f"{clean_stem}.csv"
    target_path = (config.DATASETS_DIR / clean_filename).resolve()
    if not config.is_within_datasets_dir(target_path):
        raise ValueError("Ungültiger Zielpfad für Dateispeicherung.")

    return clean_filename


def validate_csv_content(
    content_bytes: bytes,
    max_size_bytes: int = MAX_CSV_SIZE_BYTES,
) -> tuple[str, list[str], int]:
    """
    Prüft und validiert den Inhalt einer CSV-Datei:
    - Dateigröße
    - Zeichensatz (UTF-8 mit Fallback auf Latin-1), keine Nullbytes / Binärdaten
    - TeX-Injection-Guard
    - CSV-Format / Tabellenstruktur
    Gibt (bereinigter_text, spaltennamen, zeilenanzahl) zurück.
    """
    if len(content_bytes) == 0:
        raise ValueError("Die hochgeladene Datei ist leer.")

    if len(content_bytes) > max_size_bytes:
        raise ValueError(
            f"Datei überschreitet die maximale Größe von {max_size_bytes // (1024 * 1024)} MB."
        )

    # Textdekodierung (UTF-8 bevorzugt, dann Latin-1)
    text: str
    try:
        text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content_bytes.decode("latin-1")
        except Exception:
            raise ValueError("Die Datei konnte nicht als Textdatei (UTF-8 / Latin-1) dekodiert werden.")

    # Nullbyte-Check (Verhindert Binärdateien / TeX-C-String-Truncation)
    if "\0" in text:
        raise ValueError("Binärdaten oder Nullbytes sind in CSV-Dateien nicht erlaubt.")

    # TeX-Injection-Filter
    tex_match = _FORBIDDEN_CSV_TEX_RE.search(text)
    if tex_match:
        raise ValueError(
            f"Sicherheitsrichtlinie: Unerlaubte LaTeX-Steuersequenz gefunden ('{tex_match.group(0)}')."
        )

    # Strukturprüfung & Spaltenerkennung
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        raise ValueError("Die CSV-Datei enthält keine verwertbaren Datenzeilen.")

    # Delimiter raten (Semikolon, Komma, Tab)
    first_line = lines[0]
    delimiter = ","
    if ";" in first_line and first_line.count(";") >= first_line.count(","):
        delimiter = ";"
    elif "\t" in first_line:
        delimiter = "\t"

    try:
        reader = csv.reader(io.StringIO(text), delimiter=delimiter)
        rows = list(reader)
    except Exception as e:
        raise ValueError(f"CSV-Format ungültig oder nicht lesbar: {e}")

    non_empty_rows = [r for r in rows if any(cell.strip() for cell in r)]
    if not non_empty_rows:
        raise ValueError("Keine gültigen Zeilen in der CSV-Datei gefunden.")

    # Spalten aus erster Zeile extrahieren
    header_cells = [col.strip() for col in non_empty_rows[0]]
    columns = [c for c in header_cells if c]

    return text, columns, len(non_empty_rows)


def save_csv_dataset(filename: str, content_bytes: bytes) -> dict[str, Any]:
    """
    Validiert und speichert eine CSV-Datei im Datensatz-Ordner.
    """
    clean_name = sanitize_csv_filename(filename)
    text, columns, row_count = validate_csv_content(content_bytes)

    config.DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    target_path = (config.DATASETS_DIR / clean_name).resolve()
    if not config.is_within_datasets_dir(target_path):
        raise ValueError("Sicherheitsverletzung: Zielpfad liegt außerhalb von datasets.")

    with open(target_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)

    return {
        "filename": clean_name,
        "size_bytes": target_path.stat().st_size,
        "rows_count": row_count,
        "columns": columns,
        "path": config.to_display_path(target_path),
    }


def list_csv_datasets() -> list[dict[str, Any]]:
    """
    Listet alle im Datensatz-Ordner vorhandenen CSV-Dateien mit Metadaten auf.
    """
    config.DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, Any]] = []

    for file_path in sorted(config.DATASETS_DIR.glob("*.csv")):
        if not file_path.is_file():
            continue
        try:
            stat = file_path.stat()
            # Schneller Header-Check (erste Zeile)
            columns: list[str] = []
            rows_count = 0
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                first_line = f.readline().strip()
                if first_line:
                    delim = ";" if ";" in first_line and first_line.count(";") >= first_line.count(",") else ","
                    if "\t" in first_line:
                        delim = "\t"
                    r = csv.reader([first_line], delimiter=delim)
                    columns = [c.strip() for c in next(r, []) if c.strip()]
                    rows_count = 1 + sum(1 for line in f if line.strip())

            results.append({
                "filename": file_path.name,
                "size_bytes": stat.st_size,
                "rows_count": rows_count,
                "columns": columns,
                "modified_at": stat.st_mtime,
                "path": config.to_display_path(file_path),
            })
        except Exception:
            continue

    return results
