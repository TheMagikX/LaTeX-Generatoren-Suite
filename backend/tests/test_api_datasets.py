# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
from fastapi.testclient import TestClient

import config
from main import app

client = TestClient(app, base_url="http://localhost", headers={"x-requested-with": "GenSuite"})


@pytest.fixture(autouse=True)
def _tmp_datasets(tmp_path, monkeypatch):
    test_dir = tmp_path / "datasets"
    test_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(config, "DATASETS_DIR", test_dir)
    return test_dir


def test_get_datasets_empty():
    res = client.get("/api/datasets")
    assert res.status_code == 200
    assert res.json() == []


def test_upload_valid_dataset():
    csv_data = b"x,y\n1.0,2.0\n3.0,4.0\n"
    res = client.post(
        "/api/datasets/upload",
        files={"file": ("messung.csv", csv_data, "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["dataset"]["filename"] == "messung.csv"
    assert data["dataset"]["columns"] == ["x", "y"]
    assert data["dataset"]["rows_count"] == 3

    # Liste abrufen
    list_res = client.get("/api/datasets")
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 1
    assert items[0]["filename"] == "messung.csv"


def test_upload_invalid_extension():
    res = client.post(
        "/api/datasets/upload",
        files={"file": ("malicious.tex", b"\\write18{calc}", "text/plain")},
    )
    assert res.status_code == 400
    assert ".csv" in res.json()["detail"]


def test_upload_malicious_tex_injection():
    res = client.post(
        "/api/datasets/upload",
        files={"file": ("evil.csv", b"x,y\n1,\\write18{rm -rf /}\n", "text/csv")},
    )
    assert res.status_code == 400
    assert "Unerlaubte LaTeX-Steuersequenz" in res.json()["detail"]


def test_delete_dataset():
    # Erst hochladen
    csv_data = b"a,b\n1,2\n"
    res = client.post(
        "/api/datasets/upload",
        files={"file": ("to_delete.csv", csv_data, "text/csv")},
    )
    assert res.status_code == 200

    # Löschen
    del_res = client.delete("/api/datasets/to_delete.csv")
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] == "to_delete.csv"

    # Jetzt muss die Liste wieder leer sein
    list_res = client.get("/api/datasets")
    assert list_res.status_code == 200
    assert list_res.json() == []
