# SPDX-License-Identifier: AGPL-3.0-or-later

import base64

import pytest
from fastapi.testclient import TestClient

import config
from main import app

client = TestClient(app, base_url="http://localhost")

# Minimales gueltiges 1x1-PNG
PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)
PNG_B64 = base64.b64encode(PNG_BYTES).decode()


@pytest.fixture(autouse=True)
def _tmp_presets(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "PRESETS_DIR", tmp_path)
    return tmp_path


def _save(name="USER / Mathe / Parabel"):
    res = client.post(f"/api/presets/arbeitsblatt/{name}", json={"a": 1})
    assert res.status_code == 200


def test_thumbnail_roundtrip_and_detailed_listing(tmp_path):
    _save()
    res = client.put(
        "/api/presets/arbeitsblatt/thumbnail",
        params={"name": "USER / Mathe / Parabel"},
        json={"thumbnail_base64": f"data:image/png;base64,{PNG_B64}"},
    )
    assert res.status_code == 200
    assert (tmp_path / "arbeitsblatt" / "USER" / "Mathe" / "Parabel.thumb.png").read_bytes() == PNG_BYTES

    res = client.get("/api/presets/arbeitsblatt/thumbnail", params={"name": "USER / Mathe / Parabel"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert "max-age" in res.headers["cache-control"]
    assert res.content == PNG_BYTES

    detailed = client.get("/api/presets/arbeitsblatt/detailed").json()
    entry = detailed["USER / Mathe / Parabel"]
    assert entry["config"] == {"a": 1}
    assert entry["has_thumbnail"] is True
    assert isinstance(entry["updated_at"], int)

    # Legacy-Format bleibt unveraendert und enthaelt keine Thumbnails als Preset
    legacy = client.get("/api/presets/arbeitsblatt").json()
    assert legacy == {"USER / Mathe / Parabel": {"a": 1}}


def test_preset_without_thumbnail(tmp_path):
    _save()
    detailed = client.get("/api/presets/arbeitsblatt/detailed").json()
    assert detailed["USER / Mathe / Parabel"]["has_thumbnail"] is False
    res = client.get("/api/presets/arbeitsblatt/thumbnail", params={"name": "USER / Mathe / Parabel"})
    assert res.status_code == 404


def test_thumbnail_for_unknown_preset_is_404():
    res = client.put(
        "/api/presets/arbeitsblatt/thumbnail",
        params={"name": "Gibt / Es / Nicht"},
        json={"thumbnail_base64": PNG_B64},
    )
    assert res.status_code == 404


@pytest.mark.parametrize("bad_name", ["../../evil", "USER/../../evil", "a\\b", "   "])
def test_thumbnail_path_traversal_blocked(bad_name):
    res = client.get("/api/presets/arbeitsblatt/thumbnail", params={"name": bad_name})
    assert res.status_code == 400
    res = client.put(
        "/api/presets/arbeitsblatt/thumbnail",
        params={"name": bad_name},
        json={"thumbnail_base64": PNG_B64},
    )
    assert res.status_code == 400


def test_thumbnail_rejects_invalid_payloads():
    _save("USER / X")
    url = "/api/presets/arbeitsblatt/thumbnail"
    not_png = base64.b64encode(b"GIF89a-not-a-png").decode()
    assert client.put(url, params={"name": "USER / X"}, json={"thumbnail_base64": not_png}).status_code == 400
    assert client.put(url, params={"name": "USER / X"}, json={"thumbnail_base64": "%%%not base64%%%"}).status_code == 400
    assert client.put(url, params={"name": "USER / X"}, json={"thumbnail_base64": "data:image/png;base64"}).status_code == 400
    big = base64.b64encode(PNG_BYTES + b"\0" * (2 * 1024 * 1024)).decode()
    assert client.put(url, params={"name": "USER / X"}, json={"thumbnail_base64": big}).status_code == 413


def test_thumbnail_rejects_invalid_generator():
    res = client.get("/api/presets/custom_latex/thumbnail", params={"name": "x"})
    assert res.status_code == 400


def test_delete_removes_thumbnail(tmp_path):
    _save()
    client.put(
        "/api/presets/arbeitsblatt/thumbnail",
        params={"name": "USER / Mathe / Parabel"},
        json={"thumbnail_base64": PNG_B64},
    )
    thumb = tmp_path / "arbeitsblatt" / "USER" / "Mathe" / "Parabel.thumb.png"
    assert thumb.exists()
    res = client.delete("/api/presets/arbeitsblatt/USER / Mathe / Parabel")
    assert res.status_code == 200
    assert not thumb.exists()
    assert not thumb.with_name("Parabel.json").exists()


def test_download_folder_excludes_thumbnails(tmp_path):
    import io
    import zipfile

    _save()
    client.put(
        "/api/presets/arbeitsblatt/thumbnail",
        params={"name": "USER / Mathe / Parabel"},
        json={"thumbnail_base64": PNG_B64},
    )
    res = client.get("/api/presets/arbeitsblatt/download-folder", params={"folder": "USER"})
    assert res.status_code == 200
    names = zipfile.ZipFile(io.BytesIO(res.content)).namelist()
    assert names == ["Mathe/Parabel.json"]
