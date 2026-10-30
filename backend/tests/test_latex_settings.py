# SPDX-License-Identifier: AGPL-3.0-or-later

import io
import pathlib
from unittest.mock import patch
from fastapi.testclient import TestClient

import config
from main import app

client = TestClient(app, base_url="http://localhost")


def test_format_latex_input_path(tmp_path):
    """Ensure format_latex_input_path returns relative filenames for known directories and blocks external paths."""
    default_cmd = config.LATEX_FILES_DIR / "commands-default.tex"
    assert config.format_latex_input_path(default_cmd) == r"\input{commands-default.tex}"

    # Custom latex dir file
    custom_file = config.CUSTOM_LATEX_DIR / "my_custom.tex"
    assert config.format_latex_input_path(custom_file) == r"\input{my_custom.tex}"

    # External file outside known dirs must be blocked (never emit absolute host paths)
    external_file = tmp_path / "other_dir" / "external.tex"
    assert config.format_latex_input_path(external_file) == ""


def test_get_latex_settings_does_not_leak_host_paths():
    """Ensure GET /api/settings/latex returns project-relative paths instead of absolute OS paths."""
    res = client.get("/api/settings/latex")
    assert res.status_code == 200
    data = res.json()
    default_file = data["commands"]["default_file"]
    active_file = data["commands"]["active_file"]
    assert default_file == "backend/latex_files/commands-default.tex"
    assert not pathlib.Path(default_file).is_absolute()
    assert not pathlib.Path(active_file).is_absolute()


def test_post_latex_settings_blocks_external_and_non_tex_paths():
    """Ensure POST /api/settings/latex rejects arbitrary filesystem paths and non-tex extensions."""
    # Reject non-tex file extension
    res_ext = client.post("/api/settings/latex", json={"custom_commands_path": "C:/Windows/win.ini"})
    assert res_ext.status_code == 400

    # Reject .tex path outside LATEX_FILES_DIR and CUSTOM_LATEX_DIR
    res_outside = client.post("/api/settings/latex", json={"custom_commands_path": "C:/outside_dir/secret.tex"})
    assert res_outside.status_code == 400


def test_upload_latex_file_commands():
    """Test uploading a custom commands.tex file via API."""
    file_content = b"% My custom commands\n\\newcommand{\\testcmd}{Hallo}"
    file_obj = io.BytesIO(file_content)

    response = client.post(
        "/api/settings/latex/upload",
        files={"file": ("meine_befehle.tex", file_obj, "text/plain")},
        data={"category": "commands"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["filename"] == "meine_befehle.tex"
    assert data["saved_path"] == "presets/custom_latex/meine_befehle.tex"

    # Check file exists on disk
    saved_file = config.PROJECT_ROOT / data["saved_path"]
    assert saved_file.is_file()
    assert saved_file.read_bytes() == file_content

    # Clean up and reset
    if saved_file.exists():
        saved_file.unlink()
    client.post("/api/settings/latex", json={"custom_commands_path": None})


def test_upload_latex_file_invalid_extension():
    """Reject non-tex/sty uploads."""
    response = client.post(
        "/api/settings/latex/upload",
        files={"file": ("malicious.exe", io.BytesIO(b"MZ..."), "application/octet-stream")},
        data={"category": "commands"}
    )
    assert response.status_code == 400
    assert "nur .tex- oder .sty-Dateien" in response.json()["detail"]


def test_upload_latex_file_exceeds_5mb_limit():
    """Reject .tex uploads exceeding 5 MB via bounded stream read."""
    oversized_content = b"a" * (5 * 1024 * 1024 + 10)
    response = client.post(
        "/api/settings/latex/upload",
        files={"file": ("huge.tex", io.BytesIO(oversized_content), "text/plain")},
        data={"category": "commands"},
    )
    assert response.status_code == 400
    assert "maximal 5 MB" in response.json()["detail"]


def test_browse_latex_endpoint():
    """Test browse endpoint returns expected relative path schema."""
    with patch("api.settings._open_native_dialog", return_value="C:/fakepath/commands.tex"):
        response = client.post("/api/settings/latex/browse", json={"title": "Test Title"})
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
        assert "path" in data
        assert data["path"] == "presets/custom_latex/commands.tex"
