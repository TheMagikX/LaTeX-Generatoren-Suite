# SPDX-License-Identifier: AGPL-3.0-or-later

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import logging
import os
import pathlib
import re
import shutil
import subprocess
from typing import Literal

import config

logger = logging.getLogger("generator_suite.latex_file_guard")

GUARD_MODE = os.getenv("LATEX_FILE_ACCESS_GUARD", "enforce")

_KPSEWHICH_VARS: tuple[str, ...] = (
    "TEXMFROOT",
    "TEXMFDIST",
    "TEXMFMAIN",
    "TEXMFLOCAL",
    "TEXMFSYSVAR",
    "TEXMFSYSCONFIG",
    "TEXMFVAR",
    "TEXMFCONFIG",
)

_INITEXMF_ROOT_LINE_RE = re.compile(
    r"^\s*(?:(?:User|Common)(?:Install|Config|Data)|Root\d+)\s*:\s*(.+?)\s*$",
    re.IGNORECASE,
)

_WINDOWS_DRIVE_RE = re.compile(r"^[A-Za-z]:[/\\]")


@dataclass(frozen=True)
class FlsAccess:
    kind: Literal["INPUT", "OUTPUT"]
    path: pathlib.Path


def get_guard_mode() -> str:
    """Returns the active file guard mode ('enforce', 'warn', or 'off')."""
    raw = os.getenv("LATEX_FILE_ACCESS_GUARD", GUARD_MODE).strip().lower()
    if raw in ("enforce", "warn", "off"):
        return raw
    return "enforce"


def _normalize_path(p: str | pathlib.Path) -> pathlib.Path:
    """Resolves a path (without requiring existence) and normalizes OS case."""
    resolved = pathlib.Path(p).resolve(strict=False)
    return pathlib.Path(os.path.normcase(str(resolved)))


def _is_explicit_absolute(raw_path: str) -> bool:
    """Checks whether raw_path is an absolute POSIX or Windows path."""
    if not raw_path:
        return False
    if raw_path.startswith(("/", "\\")):
        return True
    if _WINDOWS_DRIVE_RE.match(raw_path):
        return True
    return pathlib.Path(raw_path).is_absolute()


def _resolve_against(raw_path: str, base_dir: pathlib.Path) -> pathlib.Path:
    """Resolves raw_path against base_dir if relative, handling both slash styles."""
    cleaned = raw_path.strip()
    if os.name != "nt" and "\\" in cleaned:
        cleaned = cleaned.replace("\\", "/")
    if _is_explicit_absolute(cleaned):
        return pathlib.Path(cleaned).resolve(strict=False)
    return (base_dir / cleaned).resolve(strict=False)


def parse_fls(fls_text: str, cwd: pathlib.Path) -> list[FlsAccess]:
    """
    Parses a TeX -recorder (.fls) file content into normalized FlsAccess entries.
    Resolves relative INPUT/OUTPUT paths against the active PWD entry (fallback: cwd).
    """
    pwd = pathlib.Path(cwd).resolve(strict=False)
    accesses: list[FlsAccess] = []

    for raw_line in fls_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("PWD "):
            raw_pwd = line[4:].strip()
            if raw_pwd:
                pwd = _resolve_against(raw_pwd, pathlib.Path(cwd).resolve(strict=False))
        elif line.startswith("INPUT "):
            raw_target = line[6:].strip()
            if raw_target:
                accesses.append(FlsAccess(kind="INPUT", path=_resolve_against(raw_target, pwd)))
        elif line.startswith("OUTPUT "):
            raw_target = line[7:].strip()
            if raw_target:
                accesses.append(FlsAccess(kind="OUTPUT", path=_resolve_against(raw_target, pwd)))

    return accesses


def _split_kpse_paths(raw_output: str) -> list[str]:
    """Extracts individual directory paths from kpsewhich output (strips braces and splits)."""
    text = raw_output.strip().strip("{}")
    if not text:
        return []
    parts: list[str] = []
    for chunk in text.split(","):
        chunk = chunk.strip().strip("{}")
        if not chunk:
            continue
        if os.name == "nt":
            for sub in chunk.split(";"):
                if sub.strip():
                    parts.append(sub.strip())
        else:
            for sub in chunk.split(":"):
                if sub.strip():
                    parts.append(sub.strip())
    return parts


def _is_safe_distribution_root(candidate: pathlib.Path) -> bool:
    """Prevents overly broad directories (filesystem root, user home, project root) from being added as TeX roots."""
    norm = _normalize_path(candidate)
    if norm == _normalize_path(candidate.anchor or "/"):
        return False

    forbidden_exact = [config.PROJECT_ROOT, config.BACKEND_ROOT]
    try:
        forbidden_exact.append(pathlib.Path.home())
    except Exception:
        pass
    for env_name in ("USERPROFILE", "HOME", "LOCALAPPDATA", "APPDATA"):
        val = os.getenv(env_name)
        if val:
            forbidden_exact.append(pathlib.Path(val))

    for forbidden in forbidden_exact:
        try:
            if norm == _normalize_path(forbidden):
                return False
        except Exception:
            continue
    return True


@lru_cache(maxsize=4)
def get_tex_distribution_roots(engine: str = "xelatex") -> tuple[pathlib.Path, ...]:
    """
    Dynamically discovers TeX distribution roots (MiKTeX / TeX Live) and system font directories.
    Cached once per process per engine.
    """
    roots: list[pathlib.Path] = []
    seen: set[pathlib.Path] = set()

    def _add(p: str | pathlib.Path) -> None:
        if not p:
            return
        try:
            path_obj = pathlib.Path(str(p).strip()).resolve(strict=False)
            norm = _normalize_path(path_obj)
            if norm not in seen and _is_safe_distribution_root(path_obj):
                seen.add(norm)
                roots.append(path_obj)
        except Exception:
            pass

    # 1. kpsewhich variables (TeX Live primary, MiKTeX partial)
    if shutil.which("kpsewhich"):
        for var in _KPSEWHICH_VARS:
            try:
                proc = subprocess.run(
                    ["kpsewhich", f"-var-value={var}"],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    check=False,
                )
                if proc.returncode == 0 and proc.stdout:
                    for item in _split_kpse_paths(proc.stdout):
                        _add(item)
            except Exception:
                break

    # 2. initexmf --report (MiKTeX primary)
    if shutil.which("initexmf"):
        try:
            proc = subprocess.run(
                ["initexmf", "--report"],
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            if proc.returncode == 0 and proc.stdout:
                for line in proc.stdout.splitlines():
                    m = _INITEXMF_ROOT_LINE_RE.match(line)
                    if m:
                        _add(m.group(1))
        except Exception:
            pass

    # 3. Engine binary location fallback
    engine_bin = shutil.which(engine)
    if engine_bin:
        try:
            bin_path = pathlib.Path(engine_bin).resolve(strict=False)
            parts_lower = [pt.lower() for pt in bin_path.parts]
            if "miktex" in parts_lower:
                idx = parts_lower.index("miktex")
                if idx >= 1:
                    _add(pathlib.Path(*bin_path.parts[:idx]))
            elif "bin" in parts_lower:
                idx = parts_lower.index("bin")
                if idx >= 1:
                    candidate = pathlib.Path(*bin_path.parts[:idx])
                    if _normalize_path(candidate) not in (
                        _normalize_path("/usr"),
                        _normalize_path("/usr/local"),
                    ):
                        _add(candidate)
        except Exception:
            pass

    # 4. System font directories & standard TeX Live paths
    if os.name == "nt":
        windir = os.getenv("WINDIR", r"C:\Windows")
        _add(pathlib.Path(windir) / "Fonts")
        local_appdata = os.getenv("LOCALAPPDATA")
        if local_appdata:
            _add(pathlib.Path(local_appdata) / "Microsoft" / "Windows" / "Fonts")
            # Fallback MiKTeX directories if initexmf was unavailable
            for miktex_sub in ("MiKTeX", os.path.join("Programs", "MiKTeX")):
                cand = pathlib.Path(local_appdata) / miktex_sub
                if cand.is_dir():
                    _add(cand)
        appdata = os.getenv("APPDATA")
        if appdata:
            cand = pathlib.Path(appdata) / "MiKTeX"
            if cand.is_dir():
                _add(cand)
    else:
        for posix_dir in (
            "/usr/share/fonts",
            "/usr/local/share/fonts",
            "/etc/fonts",
            "/var/cache/fontconfig",
            "/usr/share/texlive",
            "/usr/share/texmf",
            "/var/lib/texmf",
            "/etc/texmf",
        ):
            _add(posix_dir)

    logger.debug(
        "Discovered %d TeX/font roots for engine '%s': %s",
        len(roots),
        engine,
        [config.to_display_path(r) for r in roots],
    )
    return tuple(roots)


def get_allowed_input_roots(tmpdir: pathlib.Path, engine: str = "xelatex") -> list[pathlib.Path]:
    """Returns all normalized root directories from which TeX is permitted to read files."""
    raw_roots: list[pathlib.Path] = [
        pathlib.Path(tmpdir),
        config.LATEX_FILES_DIR,
        config.CUSTOM_LATEX_DIR,
        config.FONTS_DIR,
        *get_tex_distribution_roots(engine),
    ]

    extra_env = os.getenv("LATEX_EXTRA_ALLOWED_ROOTS", "").strip()
    if extra_env:
        for part in extra_env.split(os.pathsep):
            if part.strip():
                raw_roots.append(pathlib.Path(part.strip()))

    normalized: list[pathlib.Path] = []
    seen: set[pathlib.Path] = set()
    for r in raw_roots:
        try:
            norm = _normalize_path(r)
            if norm not in seen:
                seen.add(norm)
                normalized.append(norm)
        except Exception:
            continue
    return normalized


def find_violations(
    accesses: list[FlsAccess],
    tmpdir: pathlib.Path,
    engine: str = "xelatex",
) -> list[FlsAccess]:
    """
    Checks all recorded INPUT and OUTPUT file accesses against the security policy:
    - INPUT paths must reside within tmpdir, LATEX_FILES_DIR, CUSTOM_LATEX_DIR, FONTS_DIR,
      discovered TeX distribution / system font roots, or LATEX_EXTRA_ALLOWED_ROOTS.
    - OUTPUT paths must reside strictly within tmpdir.
    """
    tmpdir_norm = _normalize_path(tmpdir)
    allowed_input_norms = get_allowed_input_roots(pathlib.Path(tmpdir), engine=engine)

    violations: list[FlsAccess] = []
    for acc in accesses:
        acc_norm = _normalize_path(acc.path)
        if acc.kind == "OUTPUT":
            if not acc_norm.is_relative_to(tmpdir_norm):
                violations.append(acc)
        else:
            if not any(acc_norm.is_relative_to(root) for root in allowed_input_norms):
                violations.append(acc)

    return violations
