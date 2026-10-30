# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 C. Meyer

import os
import pathlib
import json
import logging

logger = logging.getLogger("generator_suite.config")

APP_NAME = "LaTeX-Generatoren-Suite"
APP_VERSION = "5.0.0"
APP_AUTHOR = "C. Meyer"
EXPORT_CREATOR = "Generatoren-Suite"
APP_LICENSE = "GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)"
SOURCE_CODE_URL = os.getenv("SOURCE_CODE_URL", "https://github.com/TheMagikX/LaTeX-Generatoren-Suite")
GITHUB_REPO = os.getenv("GITHUB_REPO", "TheMagikX/LaTeX-Generatoren-Suite")
GITHUB_API_RELEASES_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
UPDATE_CACHE_TTL_SECONDS = int(os.getenv("UPDATE_CACHE_TTL_SECONDS", str(12 * 3600)))

BACKEND_ROOT = pathlib.Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_ROOT.parent
LATEX_FILES_DIR = BACKEND_ROOT / "latex_files"
FONTS_DIR = LATEX_FILES_DIR / "fonts"

# Allow overriding PRESETS_DIR and FRONTEND_DIST_DIR via environment variable
_env_presets = os.getenv("PRESETS_DIR")
PRESETS_DIR = pathlib.Path(_env_presets).resolve() if _env_presets else (PROJECT_ROOT / "presets")

_env_frontend = os.getenv("FRONTEND_DIST_DIR")
FRONTEND_DIST_DIR = pathlib.Path(_env_frontend).resolve() if _env_frontend else (PROJECT_ROOT / "frontend" / "dist")

# AI / Ollama Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_DEFAULT_MODEL = os.getenv("OLLAMA_DEFAULT_MODEL", "qwen2.5:3b")

AI_SECRETS_FILE = pathlib.Path(os.getenv("AI_SECRETS_FILE", PROJECT_ROOT / "ai_secrets.json")).resolve()
GEMINI_DEFAULT_MODEL = os.getenv("GEMINI_DEFAULT_MODEL", "gemini-3-flash-preview")
GEMINI_FALLBACK_MODELS = [
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest",
]

# User Settings (unversioned, stores custom paths and preferences)
USER_SETTINGS_FILE = pathlib.Path(os.getenv("USER_SETTINGS_FILE", PROJECT_ROOT / "user_settings.json")).resolve()
COMMANDS_DEFAULT_FILE = LATEX_FILES_DIR / "commands-default.tex"
PACKAGES_DEFAULT_FILE = LATEX_FILES_DIR / "Pakete-default.tex"
GLUCKSRAD_PFEIL_PATH = LATEX_FILES_DIR / "GlücksradPfeilGeradeNeuTransp.png"
CUSTOM_LATEX_DIR = PRESETS_DIR / "custom_latex"


def is_within_allowed_latex_dirs(path: pathlib.Path) -> bool:
    """Checks whether a path resides inside LATEX_FILES_DIR or CUSTOM_LATEX_DIR."""
    try:
        resolved = path.resolve()
        return (
            resolved.is_relative_to(LATEX_FILES_DIR.resolve())
            or resolved.is_relative_to(CUSTOM_LATEX_DIR.resolve())
        )
    except Exception:
        return False


def resolve_allowed_latex_path(
    raw_path: str | pathlib.Path,
    allowed_suffixes: tuple[str, ...] = (".tex", ".sty"),
) -> pathlib.Path | None:
    """
    Resolves a user-configured LaTeX path (relative to PROJECT_ROOT, CUSTOM_LATEX_DIR,
    LATEX_FILES_DIR, or absolute within those directories) and validates that it stays
    strictly inside LATEX_FILES_DIR or CUSTOM_LATEX_DIR and has an allowed extension.
    """
    if not raw_path:
        return None
    raw_str = str(raw_path).strip()
    if not raw_str:
        return None

    p = pathlib.Path(raw_str)
    if p.suffix.lower() not in allowed_suffixes:
        return None

    # Check direct path, project-relative path, or bare filename in CUSTOM_LATEX_DIR / LATEX_FILES_DIR
    candidates: list[pathlib.Path] = []
    if p.is_absolute():
        candidates.append(p)
    else:
        candidates.append(PROJECT_ROOT / p)
        if len(p.parts) == 1:
            candidates.append(CUSTOM_LATEX_DIR / p.name)
            candidates.append(LATEX_FILES_DIR / p.name)

    for candidate in candidates:
        try:
            resolved = candidate.resolve()
            if is_within_allowed_latex_dirs(resolved):
                return resolved
        except Exception:
            continue
    return None


def to_display_path(path: pathlib.Path) -> str:
    """Returns a privacy-safe project-relative POSIX path without exposing host OS usernames."""
    try:
        resolved = path.resolve()
        if resolved.is_relative_to(PROJECT_ROOT.resolve()):
            return resolved.relative_to(PROJECT_ROOT.resolve()).as_posix()
        if resolved.is_relative_to(PRESETS_DIR.resolve()):
            return f"presets/{resolved.relative_to(PRESETS_DIR.resolve()).as_posix()}"
    except Exception:
        pass
    return path.name


def get_user_settings() -> dict:
    """Read user settings from user_settings.json if present."""
    if USER_SETTINGS_FILE.is_file():
        try:
            with open(USER_SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read user_settings.json: {e}")
    return {}


def save_user_settings(data: dict) -> None:
    """Save user settings to user_settings.json."""
    try:
        with open(USER_SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Failed to write user_settings.json: {e}")
        raise


def get_update_settings() -> dict:
    """Get the update-specific settings with defaults."""
    settings = get_user_settings()
    updates = settings.get("updates", {})
    return {
        "check_on_startup": bool(updates.get("check_on_startup", False)),
        "last_checked": updates.get("last_checked", None),
        "cached_result": updates.get("cached_result", None),
    }


def get_commands_file_path() -> pathlib.Path:
    """Returns the resolved Path to the active commands.tex (custom or fallback to default)."""
    settings = get_user_settings()
    custom_path_str = settings.get("latex", {}).get("custom_commands_path")
    if custom_path_str:
        custom_path = resolve_allowed_latex_path(custom_path_str, allowed_suffixes=(".tex",))
        if custom_path and custom_path.is_file():
            return custom_path
        logger.warning("Configured custom_commands_path not found or outside allowed directories. Falling back to default.")

    if COMMANDS_DEFAULT_FILE.is_file():
        return COMMANDS_DEFAULT_FILE

    return LATEX_FILES_DIR / "commands.tex"


def format_latex_input_path(path: pathlib.Path) -> str:
    """Returns \\input{...} using relative filename when in allowed TeX directories (LATEX_FILES_DIR, CUSTOM_LATEX_DIR).
    Refuses to emit absolute filesystem paths outside allowed directories."""
    resolved = path.resolve()
    if not is_within_allowed_latex_dirs(resolved):
        logger.warning(f"Blocked LaTeX input outside allowed directories: {resolved.name}")
        return ""
    if resolved.suffix.lower() not in (".tex", ".sty"):
        logger.warning(f"Blocked LaTeX input with invalid extension: {resolved.name}")
        return ""
    return rf"\input{{{resolved.name}}}"


def get_commands_input_path() -> str:
    """Returns the \\input{...} statement for the active commands file."""
    path = get_commands_file_path()
    return format_latex_input_path(path)


def get_packages_file_path() -> pathlib.Path:
    """Returns the resolved Path to the active Pakete.tex (custom or fallback to default)."""
    settings = get_user_settings()
    custom_path_str = settings.get("latex", {}).get("custom_packages_path")
    if custom_path_str:
        custom_path = resolve_allowed_latex_path(custom_path_str, allowed_suffixes=(".tex",))
        if custom_path and custom_path.is_file():
            return custom_path
        logger.warning("Configured custom_packages_path not found or outside allowed directories. Falling back to default.")

    if PACKAGES_DEFAULT_FILE.is_file():
        return PACKAGES_DEFAULT_FILE

    return LATEX_FILES_DIR / "Pakete.tex"


def get_custom_sty_packages() -> list[pathlib.Path]:
    """Returns list of valid Path objects configured in latex.custom_sty_packages."""
    settings = get_user_settings()
    raw_list = settings.get("latex", {}).get("custom_sty_packages", [])
    paths: list[pathlib.Path] = []
    for item in raw_list:
        if isinstance(item, str) and item.strip():
            p = resolve_allowed_latex_path(item.strip(), allowed_suffixes=(".sty",))
            if p and p.is_file():
                paths.append(p)
            else:
                logger.warning(f"Custom .sty package not found or disallowed: {pathlib.Path(item.strip()).name}")
    return paths


def get_custom_sty_packages_latex() -> str:
    """Returns LaTeX code to input all custom .sty packages."""
    paths = get_custom_sty_packages()
    if not paths:
        return ""
    lines = ["\n% --- Benutzerdefinierte Pakete (.sty) ---", r"\makeatletter"]
    for p in paths:
        inp = format_latex_input_path(p)
        if inp:
            lines.append(inp)
    lines.append(r"\makeatother")
    return "\n".join(lines)


def get_packages_input_path() -> str:
    """Returns the \\input{...} statement for the active packages file plus any custom .sty packages."""
    path = get_packages_file_path()
    base_input = format_latex_input_path(path)
    sty_inputs = get_custom_sty_packages_latex()
    if sty_inputs:
        return f"{base_input}\n{sty_inputs}"
    return base_input


def get_additional_input_paths() -> list[pathlib.Path]:
    """Returns list of valid Path objects configured in latex.additional_inputs."""
    settings = get_user_settings()
    raw_list = settings.get("latex", {}).get("additional_inputs", [])
    paths: list[pathlib.Path] = []
    for item in raw_list:
        if isinstance(item, str) and item.strip():
            p = resolve_allowed_latex_path(item.strip(), allowed_suffixes=(".tex",))
            if p and p.is_file():
                paths.append(p)
            else:
                logger.warning(f"Additional input file not found or disallowed: {pathlib.Path(item.strip()).name}")
    return paths


def get_additional_inputs_latex(fallback_to_defaults: bool = False) -> str:
    """Returns \\input{...} lines for all configured additional inputs."""
    paths = get_additional_input_paths()
    if paths:
        return "\n".join(inp for p in paths if (inp := format_latex_input_path(p)))
    return ""


def get_latex_input_path(filename: str) -> str:
    """Returns \\input{...} path. Reroutes commands and packages if present.
    For other files, returns \\input{...} only if the file exists in LATEX_FILES_DIR or CUSTOM_LATEX_DIR.
    """
    fn_lower = filename.lower()
    if fn_lower in ("commands.tex", "commands-default.tex"):
        return get_commands_input_path()
    if fn_lower in ("pakete.tex", "pakete-default.tex"):
        return get_packages_input_path()

    target = LATEX_FILES_DIR / filename
    if target.is_file():
        return format_latex_input_path(target)
    custom_target = CUSTOM_LATEX_DIR / filename
    if custom_target.is_file():
        return format_latex_input_path(custom_target)
    return ""


def get_font_input_path(font_family: str) -> str:
    if font_family == "Fira":
        return get_latex_input_path("FiraFont.tex")
    elif font_family == "Inter":
        return get_latex_input_path("InterFont.tex")
    elif font_family == "Plus Jakarta Sans":
        return get_latex_input_path("PlusJakartaFont.tex")
    return ""
