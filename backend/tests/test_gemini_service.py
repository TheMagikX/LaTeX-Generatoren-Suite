# SPDX-License-Identifier: AGPL-3.0-or-later

import json
from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
import config
from main import app
from core.ai import gemini_service
from core.ai.gemini_service import format_messages_for_gemini

client = TestClient(app, base_url="http://localhost")


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def temp_secrets_file(tmp_path, monkeypatch):
    test_secrets = tmp_path / "test_ai_secrets.json"
    monkeypatch.setattr(config, "AI_SECRETS_FILE", test_secrets)
    monkeypatch.setattr(gemini_service, "get_secrets_file", lambda: test_secrets)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    yield test_secrets
    if test_secrets.exists():
        test_secrets.unlink()


def test_secrets_management():
    # Initially empty
    assert gemini_service.get_gemini_api_key() is None
    assert gemini_service.get_masked_key() is None
    assert gemini_service.get_active_provider() == "gemini"

    # Set key
    gemini_service.set_gemini_api_key("mock-gemini-fake-secret-key-123456789")
    assert gemini_service.get_gemini_api_key() == "mock-gemini-fake-secret-key-123456789"
    assert gemini_service.get_masked_key() == "••••••••6789"

    # Switch provider
    gemini_service.set_active_provider("ollama")
    assert gemini_service.get_active_provider() == "ollama"

    gemini_service.set_active_provider("gemini")
    assert gemini_service.get_active_provider() == "gemini"


def test_format_messages_for_gemini():
    raw_msgs = [
        {"role": "system", "content": "You are a helpful math assistant."},
        {"role": "user", "content": "Erstelle ein Baumdiagramm."},
        {"role": "assistant", "content": '{"ok": true}'},
        {"role": "user", "content": "Füge eine Stufe hinzu."}
    ]
    formatted = format_messages_for_gemini(raw_msgs)
    # System message is skipped (passed via systemInstruction)
    assert len(formatted) == 3
    assert formatted[0]["role"] == "user"
    assert formatted[0]["parts"][0]["text"] == "Erstelle ein Baumdiagramm."
    assert formatted[1]["role"] == "model"
    assert formatted[1]["parts"][0]["text"] == '{"ok": true}'
    assert formatted[2]["role"] == "user"
    assert formatted[2]["parts"][0]["text"] == "Füge eine Stufe hinzu."


def test_ai_config_endpoints():
    # GET config
    res = client.get("/api/ai/config")
    assert res.status_code == 200
    data = res.json()
    assert "active_provider" in data
    assert data["has_gemini_key"] is False
    assert data["masked_gemini_key"] is None

    # POST save key
    res = client.post("/api/ai/config/gemini-key", json={"api_key": "mock-gemini-secret-sample-key007"})
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["masked_key"] == "••••••••y007"

    # Check updated config
    res = client.get("/api/ai/config")
    assert res.json()["has_gemini_key"] is True
    assert res.json()["masked_gemini_key"] == "••••••••y007"

    # POST switch provider
    res = client.post("/api/ai/config/provider", json={"provider": "gemini"})
    assert res.status_code == 200
    assert res.json()["active_provider"] == "gemini"

    # Status reflects active provider
    with patch("core.ai.gemini_service.check_gemini_status", new_callable=AsyncMock) as mock_gem:
        mock_gem.return_value = {"available": True, "model": "gemini-3.5-flash", "error": None}
        status_res = client.get("/api/ai/status")
        assert status_res.status_code == 200
        s_data = status_res.json()
        assert s_data["active_provider"] == "gemini"
        assert s_data["available"] is True

        # Test POST /api/ai/config/test-gemini with empty JSON body (testing stored key)
        test_res = client.post("/api/ai/config/test-gemini", json={})
        assert test_res.status_code == 200
        assert test_res.json()["available"] is True
        mock_gem.assert_called_with(None)

        # Test POST /api/ai/config/test-gemini with explicit key
        test_res_explicit = client.post("/api/ai/config/test-gemini", json={"api_key": "mock-gemini-other-key-123"})
        assert test_res_explicit.status_code == 200
        mock_gem.assert_called_with("mock-gemini-other-key-123")


@pytest.mark.anyio
async def test_prompt_to_config_gemini_routing():
    from core.ai import service

    gemini_service.set_gemini_api_key("mock-gemini-fake-key-for-test")
    gemini_service.set_active_provider("gemini")

    mock_llm_json = json.dumps({
        "zaehler": 3,
        "nenner": 4,
        "form": "Kreis"
    })

    with patch("core.ai.gemini_service.query_gemini_raw", new_callable=AsyncMock) as mock_raw:
        mock_raw.return_value = mock_llm_json

        res = await service.generate_config_from_prompt(
            generator_id="bruch",
            prompt="Drei Viertel als Kreis"
        )
        assert res["ok"] is True
        assert res["provider_used"] == "gemini"
        assert "config" in res
        assert res["config"]["zaehler"] == 3
        assert res["config"]["nenner"] == 4


@pytest.mark.anyio
async def test_chat_gemini_routing():
    from core.ai import service
    from core.ai.base import ChatMessage

    gemini_service.set_gemini_api_key("mock-gemini-fake-key-for-test")
    gemini_service.set_active_provider("gemini")

    mock_chat_json = json.dumps({
        "message": "Bruch wurde auf 5/8 geändert.",
        "config": {
            "zaehler": 5,
            "nenner": 8,
            "form": "Kreis"
        }
    })

    with patch("core.ai.gemini_service.query_gemini_raw", new_callable=AsyncMock) as mock_raw:
        mock_raw.return_value = mock_chat_json

        res = await service.chat_with_generator(
            generator_id="bruch",
            messages=[ChatMessage(role="user", content="Ändere auf 5/8")],
            current_config={"zaehler": 3, "nenner": 4, "form": "Kreis"}
        )
        assert res["ok"] is True
        assert res["provider_used"] == "gemini"
        assert res["message"] == "Bruch wurde auf 5/8 geändert."
        assert res["config"]["zaehler"] == 5
        assert res["config"]["nenner"] == 8


@pytest.mark.anyio
async def test_query_gemini_raw_sanitizes_model_name_before_url_interpolation():
    from unittest.mock import MagicMock

    gemini_service.set_gemini_api_key("mock-gemini-key-12345678")

    # 1. Unit-level validation of _sanitize_gemini_model
    assert gemini_service._sanitize_gemini_model("gemini-3.5-flash") == "gemini-3.5-flash"
    assert gemini_service._sanitize_gemini_model("gemini-2.0_pro-exp") == "gemini-2.0_pro-exp"
    for bad in ("../../x", "a/b", "model?key=override", "model#frag", "qwen2.5:3b", ""):
        assert gemini_service._sanitize_gemini_model(bad) == config.GEMINI_DEFAULT_MODEL

    # 2. Integration check: httpx.AsyncClient.post receives sanitized default model URL
    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": '{"ok": true}'}]}}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_res) as mock_post:
        out = await gemini_service.query_gemini_raw(
            system_prompt="Sys",
            messages=[{"role": "user", "content": "Hi"}],
            model="../../v1/evil?key=override",
        )
        assert out == '{"ok": true}'
        called_url = mock_post.call_args[0][0]
        assert called_url == f"https://generativelanguage.googleapis.com/v1beta/models/{config.GEMINI_DEFAULT_MODEL}:generateContent"
