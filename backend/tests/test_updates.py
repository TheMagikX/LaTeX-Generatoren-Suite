# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 C. Meyer

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest
from fastapi.testclient import TestClient

import config
from core.update_checker import (
    check_for_updates,
    is_cache_valid,
    is_newer_version,
    is_security_release,
    parse_semver,
)
from main import app

client = TestClient(app, base_url="http://localhost")


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_parse_semver():
    assert parse_semver("4.1.0") == (4, 1, 0)
    assert parse_semver("v4.2.1") == (4, 2, 1)
    assert parse_semver("V5.0") == (5, 0, 0)
    assert parse_semver("v4.2.0-rc.1") == (4, 2, 0)
    assert parse_semver("4") == (4, 0, 0)
    assert parse_semver("") == (0, 0, 0)
    assert parse_semver("invalid") == (0, 0, 0)


def test_is_newer_version():
    # Newer patch
    assert is_newer_version("v4.1.1", "4.1.0") is True
    # Same version
    assert is_newer_version("v4.1.0", "4.1.0") is False
    assert is_newer_version("4.1.0", "v4.1.0") is False
    # Newer minor
    assert is_newer_version("v4.2.0", "4.1.0") is True
    # Newer major
    assert is_newer_version("v5.0.0", "4.1.0") is True
    # Older version
    assert is_newer_version("v4.0.9", "4.1.0") is False
    # Local is newer than release (e.g. dev branch)
    assert is_newer_version("v4.1.0", "4.2.0") is False


def test_is_security_release():
    assert is_security_release("v4.2.0 - [SECURITY] Patch", "Routine update") is True
    assert is_security_release("v4.2.0", "Kritisches Sicherheitsupdate für den LaTeX-Compiler") is True
    assert is_security_release("v4.2.0", "Fixed vulnerability CVE-2026-9999") is True
    assert is_security_release("v4.2.0 - Critical fix", "Bugfix") is True
    assert is_security_release("v4.2.0 - Security Fix", "Details") is True
    assert is_security_release("v4.2.0", "Neues Feature: 3D-Ansicht verbessert") is False


def test_is_cache_valid():
    now = datetime.now(timezone.utc)
    recent = (now - timedelta(hours=2)).isoformat()
    old = (now - timedelta(hours=14)).isoformat()

    assert is_cache_valid(recent, ttl_seconds=12 * 3600) is True
    assert is_cache_valid(old, ttl_seconds=12 * 3600) is False
    assert is_cache_valid(None) is False
    assert is_cache_valid("invalid-timestamp") is False


@pytest.mark.anyio
async def test_check_for_updates_newer_version(tmp_path):
    mock_settings_file = tmp_path / "user_settings.json"
    with patch("config.USER_SETTINGS_FILE", mock_settings_file):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "tag_name": "v4.2.0",
            "name": "v4.2.0 - Neue Funktionen",
            "body": "- Tolle Neuerungen",
            "html_url": f"https://github.com/{config.GITHUB_REPO}/releases/tag/v4.2.0",
            "published_at": "2026-10-29T18:00:00Z",
        }

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.get = AsyncMock(return_value=mock_response)

        res = await check_for_updates(force=True, current_version="4.1.0", client=mock_client)
        assert res["status"] == "success"
        assert res["has_update"] is True
        assert res["is_security_update"] is False
        assert res["latest_version"] == "4.2.0"
        assert res["current_version"] == "4.1.0"
        assert res["release_name"] == "v4.2.0 - Neue Funktionen"
        assert res["release_url"] == f"https://github.com/{config.GITHUB_REPO}/releases/tag/v4.2.0"


@pytest.mark.anyio
async def test_check_for_updates_security_release(tmp_path):
    mock_settings_file = tmp_path / "user_settings.json"
    with patch("config.USER_SETTINGS_FILE", mock_settings_file):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "tag_name": "v4.1.1",
            "name": "v4.1.1 [SECURITY] Hotfix",
            "body": "Behebt Sicherheitslücke in Filter",
            "html_url": f"https://github.com/{config.GITHUB_REPO}/releases/tag/v4.1.1",
            "published_at": "2026-10-29T20:00:00Z",
        }

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.get = AsyncMock(return_value=mock_response)

        res = await check_for_updates(force=True, current_version="4.1.0", client=mock_client)
        assert res["status"] == "success"
        assert res["has_update"] is True
        assert res["is_security_update"] is True
        assert res["release_url"] == f"https://github.com/{config.GITHUB_REPO}/releases/tag/v4.1.1"


@pytest.mark.anyio
async def test_check_for_updates_rate_limited(tmp_path):
    mock_settings_file = tmp_path / "user_settings.json"
    with patch("config.USER_SETTINGS_FILE", mock_settings_file):
        mock_response = MagicMock()
        mock_response.status_code = 403

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.get = AsyncMock(return_value=mock_response)

        res = await check_for_updates(force=True, current_version="4.1.0", client=mock_client)
        assert res["status"] == "rate_limited"
        assert "Ratenlimit" in res["message"]


@pytest.mark.anyio
async def test_check_for_updates_network_timeout(tmp_path):
    mock_settings_file = tmp_path / "user_settings.json"
    with patch("config.USER_SETTINGS_FILE", mock_settings_file):
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.get = AsyncMock(side_effect=httpx.TimeoutException("Timeout"))

        res = await check_for_updates(force=True, current_version="4.1.0", client=mock_client)
        assert res["status"] == "error"
        assert "Timeout" in res["message"]
        assert res["has_update"] is False


@pytest.mark.anyio
async def test_check_for_updates_caching(tmp_path):
    mock_settings_file = tmp_path / "user_settings.json"
    with patch("config.USER_SETTINGS_FILE", mock_settings_file):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "tag_name": "v4.2.0",
            "name": "v4.2.0 Release",
            "body": "Update notes",
            "html_url": f"https://github.com/{config.GITHUB_REPO}/releases/tag/v4.2.0",
            "published_at": "2026-10-29T18:00:00Z",
        }

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.get = AsyncMock(return_value=mock_response)

        # First check (fetch & cache)
        res1 = await check_for_updates(force=False, current_version="4.1.0", client=mock_client)
        assert res1["from_cache"] is False
        assert mock_client.get.call_count == 1

        # Second check without force: must use cache, no second HTTP call
        res2 = await check_for_updates(force=False, current_version="4.1.0", client=mock_client)
        assert res2["from_cache"] is True
        assert res2["latest_version"] == "4.2.0"
        assert mock_client.get.call_count == 1

        # Third check with force=True: must fetch fresh
        res3 = await check_for_updates(force=True, current_version="4.1.0", client=mock_client)
        assert res3["from_cache"] is False
        assert mock_client.get.call_count == 2


def test_api_endpoints_update_settings(tmp_path):
    mock_settings_file = tmp_path / "user_settings.json"
    with patch("config.USER_SETTINGS_FILE", mock_settings_file):
        # 1. GET initial update settings
        res = client.get("/api/settings/updates")
        assert res.status_code == 200
        data = res.json()
        assert data["check_on_startup"] is False
        assert data["current_version"] == config.APP_VERSION

        # 2. POST update settings (opt-in check_on_startup)
        res_post = client.post("/api/settings/updates", json={"check_on_startup": True})
        assert res_post.status_code == 200
        data_post = res_post.json()
        assert data_post["check_on_startup"] is True

        # 3. GET verify persistence
        res_get2 = client.get("/api/settings/updates")
        assert res_get2.status_code == 200
        assert res_get2.json()["check_on_startup"] is True


@pytest.mark.anyio
async def test_check_for_updates_custom_repo(tmp_path):
    """Ensure check_for_updates respects a dynamically configured GITHUB_REPO."""
    mock_settings_file = tmp_path / "user_settings.json"
    custom_repo = "CustomOwner/CustomRepo"
    with patch("config.USER_SETTINGS_FILE", mock_settings_file), \
         patch("config.GITHUB_REPO", custom_repo), \
         patch("config.GITHUB_API_RELEASES_URL", f"https://api.github.com/repos/{custom_repo}/releases/latest"):

        mock_response = MagicMock()
        mock_response.status_code = 404

        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.get = AsyncMock(return_value=mock_response)

        res = await check_for_updates(force=True, current_version="4.1.0", client=mock_client)
        assert res["release_url"] == f"https://github.com/{custom_repo}/releases"
