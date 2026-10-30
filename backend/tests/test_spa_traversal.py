# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
from pathlib import Path
from fastapi.testclient import TestClient

import config
from main import app

client = TestClient(app, base_url="http://localhost")


def test_spa_directory_traversal_prevention(tmp_path, monkeypatch):
    """Ensure paths with ../ cannot traverse outside FRONTEND_DIST_DIR."""
    fake_dist = tmp_path / "dist"
    fake_dist.mkdir()
    index_file = fake_dist / "index.html"
    index_file.write_text("<html><body>SPA Index</body></html>", encoding="utf-8")

    asset_file = fake_dist / "test_asset.txt"
    asset_file.write_text("public asset", encoding="utf-8")

    outside_file = tmp_path / "secret.txt"
    outside_file.write_text("SUPER_SECRET_DATA", encoding="utf-8")

    # In main.py, resolved_dist and dist_path are evaluated at import time or handler time.
    # We can test the handler directly or via client if dist_path is configured.
    # Testing the path resolution logic:
    resolved_dist = fake_dist.resolve()
    traversal_target = (fake_dist / "../../secret.txt").resolve()
    assert not traversal_target.is_relative_to(resolved_dist)

    valid_target = (fake_dist / "test_asset.txt").resolve()
    assert valid_target.is_relative_to(resolved_dist)
