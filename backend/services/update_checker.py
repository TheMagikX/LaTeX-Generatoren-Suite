# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 C. Meyer

"""Compatibility alias for backend.core.update_checker"""
from core.update_checker import (
    SECURITY_KEYWORDS,
    check_for_updates,
    check_for_updates_sync,
    is_cache_valid,
    is_newer_version,
    is_security_release,
    parse_semver,
)

__all__ = [
    "SECURITY_KEYWORDS",
    "check_for_updates",
    "check_for_updates_sync",
    "is_cache_valid",
    "is_newer_version",
    "is_security_release",
    "parse_semver",
]
