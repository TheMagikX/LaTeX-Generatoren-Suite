# SPDX-License-Identifier: AGPL-3.0-or-later

import pathlib
import shutil
import pytest
from starlette.testclient import TestClient as _StarletteTestClient

import config


@pytest.fixture
def api_client():
    """Expliziter TestClient mit gesetztem X-Requested-With-Header fuer reguläre API-Tests."""
    from main import app

    return _StarletteTestClient(
        app,
        base_url="http://localhost",
        headers={"X-Requested-With": "GenSuite"},
    )


@pytest.fixture(scope="session", autouse=True)
def _ensure_test_datasets(tmp_path_factory):
    isolated_datasets = tmp_path_factory.mktemp("datasets")
    test_data_dir = pathlib.Path(__file__).parent / "test_data"
    if test_data_dir.is_dir():
        for f in test_data_dir.glob("*.csv"):
            shutil.copy2(f, isolated_datasets / f.name)
    mp = pytest.MonkeyPatch()
    mp.setattr(config, "DATASETS_DIR", isolated_datasets)
    yield
    mp.undo()


@pytest.fixture(autouse=True)
def _isolate_user_settings(tmp_path, monkeypatch):
    """
    Isoliert USER_SETTINGS_FILE und CUSTOM_LATEX_DIR fuer jeden Testlauf auf temporaere Pfade,
    sodass echte Benutzerdaten niemals durch Tests ueberschrieben oder geloescht werden.
    """
    fake_settings_file = tmp_path / "user_settings.json"
    fake_custom_latex_dir = tmp_path / "isolated_custom_latex"
    fake_custom_latex_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(config, "USER_SETTINGS_FILE", fake_settings_file)
    monkeypatch.setattr(config, "CUSTOM_LATEX_DIR", fake_custom_latex_dir)
