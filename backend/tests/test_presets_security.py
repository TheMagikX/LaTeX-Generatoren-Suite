# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
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


@pytest.mark.parametrize(
    "bad_name",
    [
        "..",
        ".",
        "../ai_secrets",
        "..%2Fai_secrets",
        "..%2F..%2Fai_secrets",
        "..\\ai_secrets",
        "sub/../../ai_secrets",
        ".hidden",
        "sub/.hidden",
        "bad\x00name",
        "bad:name",
    ],
)
def test_presets_rejects_traversal_in_preset_name(bad_name, tmp_path, monkeypatch):
    """Ensure traversal, backslashes, dotfiles, and invalid chars in preset_name are rejected."""
    import config
    from api.presets import _resolve_preset_file
    from fastapi import HTTPException

    monkeypatch.setattr(config, "PRESETS_DIR", tmp_path)

    with pytest.raises(HTTPException) as exc_info:
        _resolve_preset_file("arbeitsblatt", bad_name)
    assert exc_info.value.status_code == 400

    if "\x00" not in bad_name:
        res_post = client.post(f"/api/presets/arbeitsblatt/{bad_name}", json={"a": 1})
        assert res_post.status_code in (400, 404, 405, 422)

        res_del = client.delete(f"/api/presets/arbeitsblatt/{bad_name}")
        assert res_del.status_code in (400, 404, 405, 422)

        res_thumb = client.get("/api/presets/arbeitsblatt/thumbnail", params={"name": bad_name})
        assert res_thumb.status_code in (400, 404, 405, 422)
