# SPDX-License-Identifier: AGPL-3.0-or-later

from fastapi.testclient import TestClient
from main import app

client = TestClient(app, base_url="http://localhost")


def test_arbeitsblatt_execute_endpoint_removed():
    """Ensure the server-side Python exec endpoint (/api/generators/arbeitsblatt/execute) is removed."""
    res = client.post(
        "/api/generators/arbeitsblatt/execute",
        json={"python_code": "x = 1", "random_seed": "42"},
    )
    assert res.status_code in (404, 405)


def test_arbeitsblatt_generate_never_executes_python_on_server():
    """Ensure /api/generators/arbeitsblatt/generate does not execute python_code on the backend."""
    res = client.post(
        "/api/generators/arbeitsblatt/generate",
        json={
            "template_text": r"Ergebnis: {{ x }}",
            "python_code": "raise RuntimeError('Server-side exec must never run!')",
            "variables": {"x": 42, "__unsafe": "filtered"},
            "random_seed": "123",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "Ergebnis: 42" in data["latex_tasks"]
    assert "__unsafe" not in data["variables"]
    assert data["variables"] == {"x": 42}


def test_arbeitsblatt_jinja2_ssti_blocked_by_sandbox():
    """Ensure Jinja2 Server-Side Template Injection (SSTI) payloads are blocked by ImmutableSandboxedEnvironment."""
    ssti_payload = r"{{ ''.__class__.__mro__[1].__subclasses__() }}"
    res = client.post(
        "/api/generators/arbeitsblatt/generate",
        json={
            "template_text": ssti_payload,
            "python_code": "",
            "variables": {},
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "Jinja-Security Error" in data["latex_tasks"]
    assert "Popen" not in data["latex_tasks"]
