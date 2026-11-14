# SPDX-License-Identifier: AGPL-3.0-or-later

import asyncio
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

import config
from main import app, serve_spa

client = TestClient(app, base_url="http://localhost")


@pytest.mark.parametrize(
    "traversal_url",
    [
        "/../../secret.txt",
        "/%2e%2e/secret.txt",
        "/%2e%2e/%2e%2e/secret.txt",
        "/..%2fsecret.txt",
        "/..%5csecret.txt",
        "/sub/../../secret.txt",
    ],
)
def test_spa_directory_traversal_prevention(tmp_path, monkeypatch, traversal_url):
    """Ensure HTTP requests and serve_spa cannot traverse outside FRONTEND_DIST_DIR."""
    fake_dist = tmp_path / "dist"
    fake_dist.mkdir(exist_ok=True)
    index_file = fake_dist / "index.html"
    index_file.write_text("<html><body>SPA Index</body></html>", encoding="utf-8")

    asset_file = fake_dist / "test_asset.txt"
    asset_file.write_text("public asset", encoding="utf-8")

    outside_file = tmp_path / "secret.txt"
    outside_file.write_text("SUPER_SECRET_DATA", encoding="utf-8")

    monkeypatch.setattr(config, "FRONTEND_DIST_DIR", fake_dist)

    # 1. Legitimate static asset inside FRONTEND_DIST_DIR is served
    res_asset = client.get("/test_asset.txt")
    assert res_asset.status_code == 200
    assert res_asset.text == "public asset"

    # 2. Client-side route falls back to SPA index.html
    res_spa = client.get("/koordinatensystem")
    assert res_spa.status_code == 200
    assert "SPA Index" in res_spa.text

    # 3. Unknown /api/ subpaths return 404 instead of SPA index.html
    res_api = client.get("/api/nonexistent_endpoint")
    assert res_api.status_code == 404

    # 4. HTTP traversal attempt never leaks outside_file content
    res_traversal = client.get(traversal_url)
    assert res_traversal.status_code in (200, 400, 403, 404)
    assert "SUPER_SECRET_DATA" not in res_traversal.text

    # 5. Direct handler call with raw relative traversal falls back to index.html
    for raw_payload in ("../secret.txt", "../../secret.txt", "..\\secret.txt"):
        file_resp = asyncio.run(serve_spa(raw_payload))
        assert Path(file_resp.path).resolve() == index_file.resolve()
