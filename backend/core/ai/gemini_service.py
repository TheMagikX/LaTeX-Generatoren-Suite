# SPDX-License-Identifier: AGPL-3.0-or-later

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx

import config

logger = logging.getLogger("generator_suite.ai.gemini")

_GEMINI_MODEL_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")


def _sanitize_gemini_model(model: Optional[str]) -> str:
    """Validiert den Gemini-Modellnamen vor URL-Interpolation; fällt bei ungültigen Zeichen auf GEMINI_DEFAULT_MODEL zurück."""
    if not model:
        return config.GEMINI_DEFAULT_MODEL
    cleaned = str(model).strip()
    if _GEMINI_MODEL_NAME_RE.match(cleaned):
        return cleaned
    logger.warning(
        "Ungültiger Gemini-Modellname '%s' verworfen; verwende Standardmodell '%s'.",
        cleaned[:64],
        config.GEMINI_DEFAULT_MODEL,
    )
    return config.GEMINI_DEFAULT_MODEL


# --- 1. Secrets Management ---

def get_secrets_file() -> Path:
    return config.AI_SECRETS_FILE


def load_secrets() -> Dict[str, Any]:
    secrets_file = get_secrets_file()
    if not secrets_file.exists():
        return {}
    try:
        return json.loads(secrets_file.read_text(encoding="utf-8"))
    except Exception as e:
        logger.error("Fehler beim Lesen von %s: %s", secrets_file, e)
        return {}


def save_secrets(data: Dict[str, Any]) -> None:
    secrets_file = get_secrets_file()
    existing = load_secrets()
    existing.update(data)
    secrets_file.parent.mkdir(parents=True, exist_ok=True)
    secrets_file.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")
    try:
        os.chmod(secrets_file, 0o600)
    except OSError:
        pass


def get_gemini_api_key() -> Optional[str]:
    secrets = load_secrets()
    key = secrets.get("gemini_api_key")
    if key and str(key).strip():
        return str(key).strip()
    env_key = os.getenv("GEMINI_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
    return None


def set_gemini_api_key(api_key: str) -> None:
    save_secrets({"gemini_api_key": api_key.strip()})


def get_active_provider() -> str:
    """Gibt 'gemini' oder 'ollama' zurück (Default: 'gemini')."""
    secrets = load_secrets()
    return secrets.get("active_provider", "gemini")


def set_active_provider(provider: str) -> None:
    if provider in ("gemini", "ollama"):
        save_secrets({"active_provider": provider})


def get_masked_key() -> Optional[str]:
    key = get_gemini_api_key()
    if not key or len(key) < 8:
        return None
    return f"••••••••{key[-4:]}"


# --- 2. Verbindungstest mit Modell-Fallback & Header-Auth ---

async def check_gemini_status(api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Überprüft die Verbindung zur Google Gemini API per x-goog-api-key Header.
    Probiert automatisch Fallback-Modelle durch.
    """
    key = api_key or get_gemini_api_key()
    if not key:
        return {"available": False, "error": "Kein API-Schlüssel hinterlegt."}

    headers = {"x-goog-api-key": key}
    last_error = "Gemini API antwortete nicht."

    models_to_try = config.GEMINI_FALLBACK_MODELS

    async with httpx.AsyncClient(timeout=12.0) as client:
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            payload = {
                "contents": [{"parts": [{"text": "Antworte nur: OK"}]}],
                "generationConfig": {"maxOutputTokens": 5}
            }
            try:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    return {
                        "available": True,
                        "model": model,
                        "models": config.GEMINI_FALLBACK_MODELS,
                        "default_model": model,
                        "error": None
                    }
                elif res.status_code in (401, 403) or (res.status_code == 400 and "API_KEY" in res.text.upper()):
                    try:
                        err = res.json().get("error", {}).get("message", "Zugriff verweigert.")
                    except Exception:
                        err = res.text[:150]
                    return {"available": False, "error": f"Ungültiger Schlüssel: {err}"}
                elif res.status_code == 429:
                    try:
                        err = res.json().get("error", {}).get("message", "Kontingent überschritten.")
                    except Exception:
                        err = res.text[:150]
                    last_error = f"Google Gemini Kontingent / Rate-Limit überschritten (HTTP 429 bei {model}): {err}"
                    continue
                elif res.status_code in (400, 404, 503):
                    # Modell existiert für diesen Key nicht oder temporär überlastet -> nächstes Modell
                    last_error = f"HTTP {res.status_code} bei Modell {model}: {res.text[:100]}"
                    continue
                else:
                    last_error = f"HTTP {res.status_code}: {res.text[:100]}"
            except Exception as e:
                last_error = f"Verbindungsfehler: {e}"
                continue

    return {"available": False, "error": last_error}


# --- 3. Chat / Query Gemini mit strukturierter JSON-Antwort ---

def format_messages_for_gemini(messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """
    Wandelt Rollen ('user', 'assistant') in Gemini-taugliche Contents ('user', 'model') um
    und stellt sicher, dass abwechselnde Rollen eingehalten werden.
    """
    gemini_contents: List[Dict[str, Any]] = []

    for msg in messages:
        role = msg.get("role", "user")
        if role == "system":
            continue  # System-Prompt wird über systemInstruction übergeben
        gemini_role = "model" if role == "assistant" else "user"
        content_text = msg.get("content", "").strip()
        if not content_text:
            continue

        if gemini_contents and gemini_contents[-1]["role"] == gemini_role:
            # Gleiche Rolle zusammenführen
            gemini_contents[-1]["parts"][0]["text"] += f"\n\n{content_text}"
        else:
            gemini_contents.append({
                "role": gemini_role,
                "parts": [{"text": content_text}]
            })

    # Gemini erfordert mindestens eine Content-Nachricht von 'user'
    if not gemini_contents:
        gemini_contents.append({"role": "user", "parts": [{"text": "Start"}]})
    elif gemini_contents[0]["role"] != "user":
        gemini_contents.insert(0, {"role": "user", "parts": [{"text": "Kontext bereitgestellt."}]})

    return gemini_contents


async def query_gemini_raw(
    system_prompt: str,
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.1,
    timeout: float = 30.0
) -> str:
    """
    Führt einen Request gegen die Gemini API aus (mit Fallback auf Folgemodelle).
    Gibt den rohen String-Inhalt der Antwort zurück.
    """
    key = get_gemini_api_key()
    if not key:
        raise ValueError("Kein Google Gemini API-Schlüssel hinterlegt.")

    headers = {"x-goog-api-key": key}
    gemini_contents = format_messages_for_gemini(messages)

    preferred_model = _sanitize_gemini_model(model)
    models_to_try = [preferred_model] + [m for m in config.GEMINI_FALLBACK_MODELS if m != preferred_model]

    last_error: Optional[Exception] = None

    async with httpx.AsyncClient(timeout=timeout) as client:
        for target_model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent"
            payload: Dict[str, Any] = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": gemini_contents,
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": temperature,
                }
            }

            try:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text_part = next((p["text"] for p in parts if "text" in p), "")
                        return text_part
                    raise ValueError("Gemini lieferte keine Antwort-Kandidaten zurück.")
                elif res.status_code in (401, 403) or (res.status_code == 400 and "API_KEY" in res.text.upper()):
                    try:
                        err_msg = res.json().get("error", {}).get("message", "API-Key Authentifizierungsfehler")
                    except Exception:
                        err_msg = res.text[:150]
                    raise ValueError(f"Gemini API-Fehler (Ungültiger Schlüssel): {err_msg}")
                elif res.status_code == 429:
                    try:
                        err_msg = res.json().get("error", {}).get("message", "Rate-Limit oder Quota überschritten.")
                    except Exception:
                        err_msg = res.text[:150]
                    logger.warning("Gemini Modell %s meldete 429 Quota: %s. Probiere Fallback-Modell...", target_model, err_msg)
                    last_error = ValueError(f"Google Gemini Quota überschritten (HTTP 429 bei {target_model}): {err_msg}")
                    continue
                else:
                    logger.warning("Gemini Modell %s meldete Status %s: %s", target_model, res.status_code, res.text[:120])
                    last_error = ValueError(f"HTTP {res.status_code}: {res.text[:100]}")
                    continue
            except httpx.RequestError as req_err:
                logger.warning("Netzwerkfehler bei Gemini Modell %s: %s", target_model, req_err)
                last_error = req_err
                continue

    if last_error:
        raise last_error
    raise ValueError("Gemini API lieferte keine erfolgreiche Antwort.")
