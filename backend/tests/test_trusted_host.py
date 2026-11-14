# SPDX-License-Identifier: AGPL-3.0-or-later

from fastapi.testclient import TestClient
from main import app


def test_trusted_host_allows_localhost():
    client = TestClient(app, base_url="http://localhost")
    res = client.get("/api/system/info")
    assert res.status_code == 200


def test_trusted_host_allows_loopback_ip_with_port():
    client = TestClient(app, base_url="http://127.0.0.1:8000")
    res = client.get("/api/system/info")
    assert res.status_code == 200


def test_trusted_host_rejects_external_host_header():
    client = TestClient(app, base_url="http://evil.example")
    res = client.get("/api/system/info")
    assert res.status_code == 400
    assert "Invalid host header" in res.text


def test_origin_guard_rejects_external_origin_on_post():
    client = TestClient(app, base_url="http://localhost")
    res = client.post(
        "/api/settings/latex/upload",
        headers={"Origin": "https://evil.example"},
        files={"file": ("evil.tex", b"\\usepackage{amsmath}", "text/plain")},
    )
    assert res.status_code == 403
    assert "Origin" in res.json()["detail"]


def test_origin_guard_rejects_sec_fetch_site_cross_site():
    client = TestClient(app, base_url="http://localhost")
    res = client.post(
        "/api/ai/stop",
        headers={"Sec-Fetch-Site": "cross-site"},
        json={"mode": "unload_models"},
    )
    assert res.status_code == 403
    assert "Sec-Fetch-Site" in res.json()["detail"]


def test_origin_guard_allows_loopback_origin_on_post(tmp_path, monkeypatch):
    import config

    monkeypatch.setattr(config, "CUSTOM_LATEX_DIR", tmp_path)
    client = TestClient(app, base_url="http://localhost")
    res = client.post(
        "/api/settings/latex/upload",
        headers={"Origin": "http://localhost:5173"},
        files={"file": ("valid_csrf_test.tex", b"\\usepackage{amsmath}\n", "text/plain")},
        data={"category": "commands"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert (tmp_path / "valid_csrf_test.tex").is_file()


def test_origin_guard_rejects_missing_origin_and_custom_header_on_post():
    client = TestClient(app, base_url="http://localhost")
    res = client.post(
        "/api/ai/stop",
        json={"mode": "unload_models"},
    )
    assert res.status_code == 403
    assert "Origin" in res.json()["detail"] or "X-Requested-With" in res.json()["detail"]


def test_origin_guard_rejects_null_origin_on_post():
    client = TestClient(app, base_url="http://localhost")
    res = client.post(
        "/api/ai/stop",
        headers={"Origin": "null", "X-Requested-With": "GenSuite"},
        json={"mode": "unload_models"},
    )
    assert res.status_code == 403
    assert "Origin" in res.json()["detail"]


def test_origin_guard_rejects_sec_fetch_site_same_site_on_post():
    client = TestClient(app, base_url="http://localhost")
    res = client.post(
        "/api/ai/stop",
        headers={"Sec-Fetch-Site": "same-site", "X-Requested-With": "GenSuite"},
        json={"mode": "unload_models"},
    )
    assert res.status_code == 403
    assert "Sec-Fetch-Site" in res.json()["detail"]


def test_origin_guard_allows_x_requested_with_header_without_origin():
    client = TestClient(app, base_url="http://localhost")
    res = client.post(
        "/api/settings/latex",
        headers={"X-Requested-With": "GenSuite"},
        json={"custom_commands_path": None},
    )
    assert res.status_code == 200


def test_default_testclient_has_no_injected_custom_header_and_api_client_fixture_works(api_client):
    import config

    bare_client = TestClient(app, base_url="http://localhost")
    assert "x-requested-with" not in {k.lower() for k in bare_client.headers.keys()}
    res_blocked = bare_client.post("/api/settings/latex", json={"custom_commands_path": None})
    assert res_blocked.status_code == 403

    res_allowed = api_client.post("/api/settings/latex", json={"custom_commands_path": None})
    assert res_allowed.status_code == 200

    assert not config.DATASETS_DIR.resolve().is_relative_to(config.USER_DATA_DIR.resolve())
    assert (config.DATASETS_DIR / "test_messung.csv").is_file()
    assert not config.CUSTOM_LATEX_DIR.resolve().is_relative_to(config.USER_DATA_DIR.resolve())

