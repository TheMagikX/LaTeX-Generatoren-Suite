# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
from core.csv_sanitizer import (
    sanitize_csv_filename,
    validate_csv_content,
    save_csv_dataset,
    list_csv_datasets,
)
import config


def test_sanitize_csv_filename_valid():
    assert sanitize_csv_filename("messung_pendel.csv") == "messung_pendel.csv"
    assert sanitize_csv_filename("Messung-2026.CSV") == "Messung-2026.csv"
    assert sanitize_csv_filename("  daten.csv  ") == "daten.csv"


def test_sanitize_csv_filename_traversal():
    # Slashes und Path-Traversal müssen strikt entfernt werden
    assert sanitize_csv_filename("../../etc/passwd.csv") == "passwd.csv"
    assert sanitize_csv_filename("C:\\Users\\admin\\secret.csv") == "secret.csv"
    assert sanitize_csv_filename("foo/bar/daten.csv") == "daten.csv"


def test_sanitize_csv_filename_invalid_extension():
    with pytest.raises(ValueError, match="ausschließlich Dateien mit der Endung .csv"):
        sanitize_csv_filename("malicious.tex")

    with pytest.raises(ValueError, match="ausschließlich Dateien mit der Endung .csv"):
        sanitize_csv_filename("script.py")


def test_validate_csv_content_valid():
    content = b"x,y\n1.0,2.5\n2.0,5.0\n3.0,7.5\n"
    text, cols, rows = validate_csv_content(content)
    assert cols == ["x", "y"]
    assert rows == 4
    assert "1.0,2.5" in text


def test_validate_csv_content_semicolon():
    content = "zeit;strecke\n0,1;10,5\n0,2;20,8\n".encode("utf-8")
    text, cols, rows = validate_csv_content(content)
    assert cols == ["zeit", "strecke"]
    assert rows == 3


def test_validate_csv_content_empty():
    with pytest.raises(ValueError, match="Datei ist leer"):
        validate_csv_content(b"")


def test_validate_csv_content_null_bytes():
    with pytest.raises(ValueError, match="Binärdaten oder Nullbytes"):
        validate_csv_content(b"x,y\n1,\x002\n")


def test_validate_csv_content_tex_injection():
    with pytest.raises(ValueError, match="Unerlaubte LaTeX-Steuersequenz"):
        validate_csv_content(b"x,y\n1,\\write18{calc.exe}\n")

    with pytest.raises(ValueError, match="Unerlaubte LaTeX-Steuersequenz"):
        validate_csv_content(b"x,y\n1,\\input{/etc/shadow}\n")


def test_save_and_list_csv_dataset(tmp_path, monkeypatch):
    test_datasets_dir = tmp_path / "datasets"
    monkeypatch.setattr(config, "DATASETS_DIR", test_datasets_dir)

    result = save_csv_dataset("test_daten.csv", b"a,b,c\n1,2,3\n4,5,6\n")
    assert result["filename"] == "test_daten.csv"
    assert result["columns"] == ["a", "b", "c"]
    assert result["rows_count"] == 3

    datasets = list_csv_datasets()
    assert len(datasets) == 1
    assert datasets[0]["filename"] == "test_daten.csv"
    assert datasets[0]["columns"] == ["a", "b", "c"]
