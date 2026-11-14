# SPDX-License-Identifier: AGPL-3.0-or-later

import base64

import pytest
from fastapi.testclient import TestClient

import config
from main import app

client = TestClient(app, base_url="http://localhost", headers={"X-Requested-With": "GenSuite"})

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


def test_broken_presets_excluded_from_detailed(tmp_path):
    _save("USER / Mathe / Gut")
    broken = tmp_path / "arbeitsblatt" / "USER" / "Mathe" / "Defekt.broken"
    broken.write_text('{"bad": true}', encoding="utf-8")
    detailed = client.get("/api/presets/arbeitsblatt/detailed").json()
    assert "USER / Mathe / Gut" in detailed
    assert "USER / Mathe / Defekt" not in detailed


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


def test_compile_latex_for_thumbnail_delegates_to_core_latex_render(monkeypatch):
    import importlib.util
    from pathlib import Path
    from core.latex_render import LatexRenderResult

    script_path = Path(__file__).resolve().parents[2] / "scripts" / "generate_preset_thumbnails.py"
    spec = importlib.util.spec_from_file_location("generate_preset_thumbnails", script_path)
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    calls: list[tuple[str, str]] = []

    def _fake_compile(latex: str, *, engine: str = "xelatex", **_kwargs):
        calls.append((latex, engine))
        return LatexRenderResult(ok=True, log="", pdf_bytes=b"%PDF-1.5-fake")

    monkeypatch.setattr(mod, "compile_latex_to_pdf_bytes", _fake_compile)
    out = mod.compile_latex_for_thumbnail(r"\documentclass{article}\begin{document}Hi\end{document}", engine="xelatex")
    assert out == b"%PDF-1.5-fake"
    assert calls == [(r"\documentclass{article}\begin{document}Hi\end{document}", "xelatex")]

    def _fake_compile_fail(latex: str, *, engine: str = "xelatex", **_kwargs):
        return LatexRenderResult(ok=False, log="! LaTeX Error: Sicherheitsrichtlinie blockiert.", pdf_bytes=None)

    monkeypatch.setattr(mod, "compile_latex_to_pdf_bytes", _fake_compile_fail)
    with pytest.raises(RuntimeError, match="Sicherheitsrichtlinie blockiert"):
        mod.compile_latex_for_thumbnail(r"\input{/etc/passwd}")
