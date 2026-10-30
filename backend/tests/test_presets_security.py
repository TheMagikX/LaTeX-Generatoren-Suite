# SPDX-License-Identifier: AGPL-3.0-or-later

from fastapi.testclient import TestClient
from main import app

client = TestClient(app, base_url="http://localhost")


def test_presets_rejects_custom_latex_generator():
    """Ensure custom_latex cannot be listed, written, or deleted through the Presets API."""
    res_get = client.get("/api/presets/custom_latex")
    assert res_get.status_code == 400

    res_post = client.post("/api/presets/custom_latex/test_file", json={"foo": "bar"})
    assert res_post.status_code == 400

    res_del = client.delete("/api/presets/custom_latex/test_file")
    assert res_del.status_code == 400


def test_presets_rejects_dot_and_hidden_generators():
    """Ensure '.' and hidden/unknown generator names are blocked by the allowlist."""
    from api.presets import _validate_generator_name
    from fastapi import HTTPException
    import pytest

    for invalid_gen in [".", "..", ".git", ".hidden", "custom_latex", "unknown_gen"]:
        with pytest.raises(HTTPException) as exc_info:
            _validate_generator_name(invalid_gen)
        assert exc_info.value.status_code == 400

    for invalid_gen in [".git", ".hidden", "unknown_gen"]:
        res = client.get(f"/api/presets/{invalid_gen}")
        assert res.status_code == 400


def test_presets_enforces_max_payload_size(tmp_path, monkeypatch):
    """Ensure saving a preset larger than 1 MB returns 413 Payload Too Large."""
    import config
    monkeypatch.setattr(config, "PRESETS_DIR", tmp_path)

    huge_payload = {"data": "A" * (1024 * 1024 + 500)}
    res = client.post("/api/presets/arbeitsblatt/huge_preset", json=huge_payload)
    assert res.status_code == 413
    assert "1 MB" in res.json()["detail"]


def test_presets_allows_valid_generator():
    """Ensure allowlisted generators like 'arbeitsblatt' work as expected."""
    res = client.get("/api/presets/arbeitsblatt")
    assert res.status_code == 200
    assert isinstance(res.json(), dict)
