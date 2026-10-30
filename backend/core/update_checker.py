# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 C. Meyer

import asyncio
from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, Optional, Tuple

import httpx

import config

logger = logging.getLogger("generator_suite.update_checker")

SECURITY_KEYWORDS = [
    "[security]",
    "sicherheitsupdate",
    "security update",
    "security-update",
    "sicherheits-update",
    "cve-",
    "critical fix",
    "security fix",
    "security-fix",
    "security patch",
    "sicherheitspatch",
    "sicherheitswarnung",
]


def parse_semver(v: str) -> Tuple[int, ...]:
    """
    Parses a SemVer string like 'v4.1.0', '4.2', or 'v4.2.0-rc1' into a tuple of ints.
    Pre-release suffixes separated by '-' are stripped for numerical comparison.
    """
    if not v:
        return (0, 0, 0)
    cleaned = v.strip().lstrip("vV")
    main_part = cleaned.split("-")[0]
    nums = [int(n) for n in re.findall(r"\d+", main_part)]
    if not nums:
        return (0, 0, 0)
    while len(nums) < 3:
        nums.append(0)
    return tuple(nums)


def is_newer_version(latest_str: str, current_str: str) -> bool:
    """
    Returns True if latest_str is strictly newer than current_str according to SemVer.
    """
    t_latest = list(parse_semver(latest_str))
    t_current = list(parse_semver(current_str))
    max_len = max(len(t_latest), len(t_current))
    t_latest += [0] * (max_len - len(t_latest))
    t_current += [0] * (max_len - len(t_current))
    return tuple(t_latest) > tuple(t_current)


def is_security_release(title: str, body: str) -> bool:
    """
    Checks whether a release title or body indicates a security update.
    """
    content = f"{title or ''} {body or ''}".lower()
    return any(keyword in content for keyword in SECURITY_KEYWORDS)


def is_cache_valid(last_checked_iso: Optional[str], ttl_seconds: int = config.UPDATE_CACHE_TTL_SECONDS) -> bool:
    """
    Returns True if the timestamp is within ttl_seconds from now.
    """
    if not last_checked_iso:
        return False
    try:
        last_dt = datetime.fromisoformat(last_checked_iso.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        diff = (now - last_dt).total_seconds()
        return 0 <= diff < ttl_seconds
    except Exception:
        return False


async def check_for_updates(
    force: bool = False,
    current_version: str = config.APP_VERSION,
    client: Optional[httpx.AsyncClient] = None,
) -> Dict[str, Any]:
    """
    Checks GitHub Releases for a newer version.
    - If force is False and a cached result within TTL exists, returns the cached result.
    - Uses a 3.5s timeout and returns non-crashing error objects on network / rate limit issues.
    """
    settings = config.get_user_settings()
    updates_cfg = settings.get("updates", {})
    cached_result = updates_cfg.get("cached_result")
    last_checked = updates_cfg.get("last_checked")

    # 1. Use cache if valid and not forced
    if (
        not force
        and cached_result
        and is_cache_valid(last_checked)
        and cached_result.get("current_version") == current_version
    ):
        result = dict(cached_result)
        result["from_cache"] = True
        return result

    # 2. Perform GitHub API request
    headers = {
        "User-Agent": "Generator-Suite-App",
        "Accept": "application/vnd.github.v3+json",
    }
    url = config.GITHUB_API_RELEASES_URL

    async def _fetch(c: httpx.AsyncClient) -> httpx.Response:
        return await c.get(url, headers=headers, follow_redirects=True)

    try:
        if client is not None:
            response = await _fetch(client)
        else:
            async with httpx.AsyncClient(timeout=3.5) as http_client:
                response = await _fetch(http_client)

        if response.status_code == 200:
            data = response.json()
            tag_name = data.get("tag_name", "")
            latest_version = tag_name.lstrip("vV").strip()
            name = data.get("name") or tag_name
            body = data.get("body") or ""
            html_url = data.get("html_url") or f"https://github.com/{config.GITHUB_REPO}/releases"
            published_at = data.get("published_at") or ""

            has_update = is_newer_version(latest_version, current_version)
            is_sec = is_security_release(name, body) if has_update else False

            result = {
                "status": "success",
                "current_version": current_version,
                "latest_version": latest_version,
                "has_update": has_update,
                "is_security_update": is_sec,
                "release_name": name,
                "release_url": html_url,
                "release_notes": body,
                "published_at": published_at,
                "from_cache": False,
            }

            # Update cache in user_settings.json
            now_iso = datetime.now(timezone.utc).isoformat()
            updates_cfg["last_checked"] = now_iso
            updates_cfg["cached_result"] = result
            settings["updates"] = updates_cfg
            try:
                config.save_user_settings(settings)
            except Exception as e:
                logger.warning(f"Could not persist update cache to user_settings.json: {e}")

            return result

        if response.status_code == 403:
            logger.warning("GitHub Releases API rate limit reached.")
            return {
                "status": "rate_limited",
                "message": "GitHub API-Ratenlimit erreicht (max. 60 Anfragen/Stunde). Bitte später erneut versuchen.",
                "current_version": current_version,
                "latest_version": (cached_result or {}).get("latest_version"),
                "has_update": (cached_result or {}).get("has_update", False),
                "is_security_update": (cached_result or {}).get("is_security_update", False),
                "release_name": (cached_result or {}).get("release_name"),
                "release_url": (cached_result or {}).get("release_url"),
                "release_notes": (cached_result or {}).get("release_notes", ""),
                "published_at": (cached_result or {}).get("published_at", ""),
                "from_cache": False,
            }

        if response.status_code == 404:
            return {
                "status": "up_to_date",
                "message": "Keine Releases auf GitHub gefunden.",
                "current_version": current_version,
                "latest_version": current_version,
                "has_update": False,
                "is_security_update": False,
                "release_name": None,
                "release_url": f"https://github.com/{config.GITHUB_REPO}/releases",
                "release_notes": "",
                "published_at": "",
                "from_cache": False,
            }

        logger.warning(f"Unexpected HTTP status from GitHub Releases: {response.status_code}")
        return {
            "status": "error",
            "message": f"Unerwarteter Serverstatus von GitHub: HTTP {response.status_code}",
            "current_version": current_version,
            "latest_version": (cached_result or {}).get("latest_version"),
            "has_update": (cached_result or {}).get("has_update", False),
            "is_security_update": (cached_result or {}).get("is_security_update", False),
            "release_name": (cached_result or {}).get("release_name"),
            "release_url": (cached_result or {}).get("release_url"),
            "release_notes": (cached_result or {}).get("release_notes", ""),
            "published_at": (cached_result or {}).get("published_at", ""),
            "from_cache": False,
        }

    except httpx.TimeoutException:
        logger.warning("GitHub update check timed out (offline or slow connection).")
        return {
            "status": "error",
            "message": "Zeitüberschreitung bei der GitHub-Abfrage (Timeout). Bitte Internetverbindung prüfen.",
            "current_version": current_version,
            "latest_version": (cached_result or {}).get("latest_version"),
            "has_update": (cached_result or {}).get("has_update", False),
            "is_security_update": (cached_result or {}).get("is_security_update", False),
            "release_name": (cached_result or {}).get("release_name"),
            "release_url": (cached_result or {}).get("release_url"),
            "release_notes": (cached_result or {}).get("release_notes", ""),
            "published_at": (cached_result or {}).get("published_at", ""),
            "from_cache": False,
        }

    except (httpx.ConnectError, httpx.RequestError) as err:
        logger.warning(f"GitHub connection error: {err}")
        return {
            "status": "error",
            "message": "Keine Verbindung zu GitHub möglich (Offline oder DNS-Problem).",
            "current_version": current_version,
            "latest_version": (cached_result or {}).get("latest_version"),
            "has_update": (cached_result or {}).get("has_update", False),
            "is_security_update": (cached_result or {}).get("is_security_update", False),
            "release_name": (cached_result or {}).get("release_name"),
            "release_url": (cached_result or {}).get("release_url"),
            "release_notes": (cached_result or {}).get("release_notes", ""),
            "published_at": (cached_result or {}).get("published_at", ""),
            "from_cache": False,
        }

    except Exception as exc:
        logger.error(f"Unexpected error checking for updates: {exc}", exc_info=True)
        return {
            "status": "error",
            "message": f"Fehler bei der Update-Prüfung: {str(exc)}",
            "current_version": current_version,
            "latest_version": (cached_result or {}).get("latest_version"),
            "has_update": (cached_result or {}).get("has_update", False),
            "is_security_update": (cached_result or {}).get("is_security_update", False),
            "release_name": (cached_result or {}).get("release_name"),
            "release_url": (cached_result or {}).get("release_url"),
            "release_notes": (cached_result or {}).get("release_notes", ""),
            "published_at": (cached_result or {}).get("published_at", ""),
            "from_cache": False,
        }


def check_for_updates_sync(
    force: bool = False,
    current_version: str = config.APP_VERSION,
) -> Dict[str, Any]:
    """
    Synchronous wrapper around check_for_updates for CLI or testing purposes.
    """
    return asyncio.run(check_for_updates(force=force, current_version=current_version))
