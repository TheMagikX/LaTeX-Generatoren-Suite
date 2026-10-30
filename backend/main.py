# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 C. Meyer

from contextlib import asynccontextmanager
import logging
import os
import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import JSONResponse
from api import compile, generators, presets, ai, settings
import config

logger = logging.getLogger("generator_suite")

_LOOPBACK_ORIGIN_RE = re.compile(r"^http://(localhost|127\.0\.0\.1)(:\d+)?$")
_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
_ALLOWED_SEC_FETCH_SITE = {"", "same-origin", "none"}


class OriginGuardMiddleware(BaseHTTPMiddleware):
    """
    Blocks Cross-Site Request Forgery (CSRF) on state-changing requests.
    Rejects requests with a non-loopback Origin header, disallowed Sec-Fetch-Site header,
    or missing positive proof of same-origin intent (loopback Origin or X-Requested-With: GenSuite).
    """
    async def dispatch(self, request, call_next):
        if request.method not in _SAFE_METHODS:
            origin = request.headers.get("origin")
            sec_fetch_site = request.headers.get("sec-fetch-site", "").strip().lower()
            requested_with = request.headers.get("x-requested-with", "").strip()

            if origin is not None and not _LOOPBACK_ORIGIN_RE.match(origin):
                return JSONResponse(
                    {"detail": "Cross-site request blocked (invalid Origin)."},
                    status_code=403,
                )
            if sec_fetch_site not in _ALLOWED_SEC_FETCH_SITE:
                return JSONResponse(
                    {"detail": f"Cross-site request blocked (Sec-Fetch-Site: {sec_fetch_site})."},
                    status_code=403,
                )
            has_valid_origin = bool(origin and _LOOPBACK_ORIGIN_RE.match(origin))
            has_custom_header = requested_with == "GenSuite"
            if not (has_valid_origin or has_custom_header):
                return JSONResponse(
                    {"detail": "Cross-site request blocked (missing Origin or X-Requested-With header)."},
                    status_code=403,
                )
        return await call_next(request)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # GNU AGPL Startup Banner (Standard GNU Notice)
    banner = f"""
================================================================================
 {config.APP_NAME} v{config.APP_VERSION}
 Copyright (C) 2026 {config.APP_AUTHOR}
 License: {config.APP_LICENSE}
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.
 
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 GNU Affero General Public License for more details.
 
 For license details see COPYING or visit <https://www.gnu.org/licenses/>.
 Source Code: {config.SOURCE_CODE_URL}
================================================================================
"""
    print(banner)
    yield

_enable_docs = os.getenv("ENABLE_API_DOCS", "false").strip().lower() in ("1", "true", "yes")

app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if _enable_docs else None,
    redoc_url=None,
    openapi_url="/openapi.json" if _enable_docs else None,
)

# Block cross-site state-changing requests (CSRF protection)
app.add_middleware(OriginGuardMiddleware)

# Restrict accepted Host headers to loopback by default (mitigates DNS rebinding attacks)
_allowed_hosts = [
    h.strip()
    for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]
app.add_middleware(TrustedHostMiddleware, allowed_hosts=_allowed_hosts)

# Configure CORS (restricted to local loopback origins)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(compile.router, prefix="/api")
app.include_router(generators.router, prefix="/api")
app.include_router(presets.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(settings.router, prefix="/api")

@app.get("/api/system/info")
async def get_system_info():
    """Return application version, license, and AGPL source code availability information."""
    return {
        "name": config.APP_NAME,
        "version": config.APP_VERSION,
        "author": config.APP_AUTHOR,
        "license": config.APP_LICENSE,
        "license_spdx": "AGPL-3.0-or-later",
        "source_code_url": config.SOURCE_CODE_URL,
        "notice": "This program is free software licensed under GNU AGPLv3+. You have the right to access, inspect, and modify the source code."
    }

# Static frontend serving for production / Docker container
dist_path = config.FRONTEND_DIST_DIR
if dist_path.exists() and (dist_path / "index.html").is_file():
    assets_path = dist_path / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    resolved_dist = dist_path.resolve()

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Serve static file if exists and is safely contained within dist_path (prevents directory traversal)
        if full_path:
            try:
                target_file = (dist_path / full_path).resolve()
                if target_file.is_file() and target_file.is_relative_to(resolved_dist):
                    return FileResponse(target_file)
            except (ValueError, RuntimeError):
                pass
        # Otherwise fallback to index.html for client-side routing
        return FileResponse(dist_path / "index.html")
else:
    @app.get("/")
    async def root():
        return {
            "name": config.APP_NAME,
            "version": config.APP_VERSION,
            "status": "running",
            "license": config.APP_LICENSE,
            "source_code_url": config.SOURCE_CODE_URL
        }
