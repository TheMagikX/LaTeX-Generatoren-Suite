# SPDX-License-Identifier: AGPL-3.0-or-later

import json
import logging
from typing import Any, Dict, List, Optional
import httpx
import config
from core.ai.base import ChatMessage
from core.ai.registry import registry
from core.ai.sanitizer import (
    extract_json_from_llm_response,
    sanitize_llm_json_string,
    recursively_fix_latex_strings
)
from core.ai import gemini_service

logger = logging.getLogger("generator_suite.ai")


async def check_ollama_status() -> Dict[str, Any]:
    """Prüft, ob Ollama unter der konfigurierten URL erreichbar ist, und listet Modelle auf."""
    url = f"{config.OLLAMA_BASE_URL}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                raw_models = data.get("models", [])
                model_names = [m.get("name") for m in raw_models if "name" in m]
                return {
                    "available": True,
                    "url": config.OLLAMA_BASE_URL,
                    "models": model_names,
                    "default_model": config.OLLAMA_DEFAULT_MODEL if config.OLLAMA_DEFAULT_MODEL in model_names else (model_names[0] if model_names else config.OLLAMA_DEFAULT_MODEL),
                }
            return {
                "available": False,
                "url": config.OLLAMA_BASE_URL,
                "models": [],
                "error": f"Ollama HTTP {resp.status_code}",
            }
    except Exception as e:
        return {
            "available": False,
            "url": config.OLLAMA_BASE_URL,
            "models": [],
            "error": str(e),
        }


async def check_ai_status(provider: Optional[str] = None) -> Dict[str, Any]:
    """
    Gibt den Status des aktiven oder angeforderten KI-Providers zurück.
    Beinhaltet Provider-Auswahl, Keys und Modellspezifikationen.
    """
    active_prov = provider or gemini_service.get_active_provider()
    ollama_res = await check_ollama_status()
    gemini_has_key = bool(gemini_service.get_gemini_api_key())
    gemini_masked = gemini_service.get_masked_key()

    if active_prov == "gemini":
        gemini_res = await gemini_service.check_gemini_status()
        return {
            "active_provider": "gemini",
            "available": gemini_res.get("available", False),
            "model": gemini_res.get("model", config.GEMINI_DEFAULT_MODEL),
            "models": config.GEMINI_FALLBACK_MODELS,
            "default_model": config.GEMINI_DEFAULT_MODEL,
            "error": gemini_res.get("error"),
            "has_gemini_key": gemini_has_key,
            "masked_gemini_key": gemini_masked,
            "ollama_available": ollama_res.get("available", False),
            "ollama_models": ollama_res.get("models", []),
        }

    # Default: Ollama
    return {
        "active_provider": "ollama",
        "available": ollama_res.get("available", False),
        "url": ollama_res.get("url"),
        "models": ollama_res.get("models", []),
        "default_model": ollama_res.get("default_model", config.OLLAMA_DEFAULT_MODEL),
        "error": ollama_res.get("error"),
        "has_gemini_key": gemini_has_key,
        "masked_gemini_key": gemini_masked,
        "ollama_available": ollama_res.get("available", False),
    }


async def stop_ollama_service(mode: str = "stop_server") -> Dict[str, Any]:
    """
    Entlädt geladene Modelle aus dem VRAM oder beendet den Ollama-Serverprozess.
    mode: 'unload_models' oder 'stop_server'
    """
    import subprocess
    import sys

    unloaded = []
    # 1. Versuche zuerst, geladene Modelle über die API zu entladen
    try:
        status = await check_ollama_status()
        if status.get("available") and status.get("models"):
            async with httpx.AsyncClient(timeout=4.0) as client:
                for model_name in status["models"]:
                    try:
                        await client.post(
                            f"{config.OLLAMA_BASE_URL}/api/generate",
                            json={"model": model_name, "keep_alive": 0}
                        )
                        unloaded.append(model_name)
                    except Exception:
                        pass
    except Exception as e:
        logger.warning(f"Konnte Modelle vor dem Stoppen nicht entladen: {e}")

    # 2. Wenn 'stop_server' gewünscht ist, Prozess beenden
    if mode == "stop_server":
        killed = False
        try:
            if sys.platform.startswith("win"):
                res = subprocess.run(
                    ["taskkill", "/F", "/IM", "ollama.exe", "/IM", "ollama app.exe"],
                    capture_output=True,
                    text=True
                )
                killed = res.returncode == 0
            else:
                res = subprocess.run(["pkill", "-x", "ollama"], capture_output=True, text=True)
                killed = res.returncode == 0

            return {
                "ok": True,
                "mode": "stop_server",
                "stopped": killed,
                "unloaded_models": unloaded,
                "message": "Ollama-Prozess wurde erfolgreich beendet." if killed else "Ollama-Prozess lief nicht mehr oder wurde bereits beendet."
            }
        except Exception as ex:
            logger.error(f"Fehler beim Beenden des Ollama-Prozesses: {ex}")
            return {
                "ok": False,
                "mode": "stop_server",
                "stopped": False,
                "error": str(ex)
            }

    return {
        "ok": True,
        "mode": "unload_models",
        "stopped": False,
        "unloaded_models": unloaded,
        "message": f"Modelle entladen und Arbeitsspeicher freigegeben ({len(unloaded)} Modelle entladen)."
    }


def _parse_and_sanitize_json_response(raw_text: str, generator_id: str) -> Dict[str, Any]:
    """Bereinigt und parst rohe LLM-Ausgaben (Ollama oder Gemini) zu sicherem JSON."""
    clean_json_str = extract_json_from_llm_response(raw_text)
    sanitized_content = sanitize_llm_json_string(clean_json_str)

    try:
        parsed_json = json.loads(sanitized_content)
    except json.JSONDecodeError:
        try:
            parsed_json = json.loads(clean_json_str)
        except json.JSONDecodeError as jde:
            logger.error(f"Ungültiges JSON vom KI-Modell für '{generator_id}': {jde}\nRohtext: {raw_text[:300]}")
            raise ValueError(f"Das KI-Modell lieferte kein gültiges JSON: {jde}")

    return recursively_fix_latex_strings(parsed_json)


async def generate_config_from_prompt(
    generator_id: str,
    prompt: str,
    current_config: Optional[Dict[str, Any]] = None,
    model: Optional[str] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """Sendet den Prompt an den aktiven Provider (Ollama oder Gemini) und erzeugt eine validierte Konfiguration via Handler."""
    handler = registry.get(generator_id)
    if not handler:
        supported = ", ".join(registry.list_supported())
        raise ValueError(f"Generator '{generator_id}' wird nicht unterstützt. Verfügbar: {supported}")

    active_prov = provider or gemini_service.get_active_provider()

    # --- GEMINI CLOUD FLOW ---
    if active_prov == "gemini":
        target_model = model or config.GEMINI_DEFAULT_MODEL
        system_prompt = handler.get_system_prompt()
        messages = [{"role": "user", "content": f"Erstelle die {handler.title}-Konfiguration als valides JSON für folgende Anforderung:\n{prompt}"}]

        try:
            raw_response = await gemini_service.query_gemini_raw(
                system_prompt=system_prompt,
                messages=messages,
                model=target_model,
                temperature=0.1
            )
            parsed_json = _parse_and_sanitize_json_response(raw_response, generator_id)
            merged = handler.merge_config(generated_data=parsed_json, current_config=current_config)
            finalized = handler.validate_and_finalize(merged)

            return {
                "ok": True,
                "config": finalized,
                "model_used": target_model,
                "provider_used": "gemini"
            }
        except Exception as e:
            logger.exception(f"Fehler bei Gemini Prompt-to-Config für '{generator_id}': {e}")
            raise

    # --- OLLAMA LOCAL FLOW ---
    target_model = model or config.OLLAMA_DEFAULT_MODEL
    url = f"{config.OLLAMA_BASE_URL}/api/chat"

    messages = handler.build_messages(prompt=prompt, current_config=current_config)

    payload = {
        "model": target_model,
        "messages": messages,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.1
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise ValueError(f"Ollama meldete HTTP {resp.status_code}: {resp.text}")

            data = resp.json()
            message_content = data.get("message", {}).get("content", "").strip()

            parsed_json = _parse_and_sanitize_json_response(message_content, generator_id)
            merged = handler.merge_config(generated_data=parsed_json, current_config=current_config)
            finalized = handler.validate_and_finalize(merged)

            return {
                "ok": True,
                "config": finalized,
                "model_used": target_model,
                "provider_used": "ollama"
            }

    except httpx.ConnectError:
        raise ConnectionError(
            f"Verbindung zu Ollama unter {config.OLLAMA_BASE_URL} fehlgeschlagen. Bitte stelle sicher, dass Ollama läuft."
        )
    except Exception as e:
        logger.exception(f"Fehler bei der Prompt-to-Config Generierung für '{generator_id}'")
        raise


async def chat_with_generator(
    generator_id: str,
    messages: List[ChatMessage],
    current_config: Optional[Dict[str, Any]] = None,
    model: Optional[str] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Führt einen Multi-Turn Dialog mit Ollama oder Gemini für einen Generator durch.
    Ermöglicht iterative Verfeinerung ohne Kontext-Explosion.
    """
    handler = registry.get(generator_id)
    if not handler:
        supported = ", ".join(registry.list_supported())
        raise ValueError(f"Generator '{generator_id}' wird nicht unterstützt. Verfügbar: {supported}")

    active_prov = provider or gemini_service.get_active_provider()

    # --- GEMINI CLOUD FLOW ---
    if active_prov == "gemini":
        target_model = model or config.GEMINI_DEFAULT_MODEL
        llm_messages = handler.build_chat_messages(
            history=messages,
            current_config=current_config
        )
        system_prompt = handler.get_chat_system_prompt()

        try:
            raw_response = await gemini_service.query_gemini_raw(
                system_prompt=system_prompt,
                messages=llm_messages,
                model=target_model,
                temperature=0.1
            )
            parsed_json = _parse_and_sanitize_json_response(raw_response, generator_id)
            reply_msg, generated_cfg = handler.parse_chat_response(parsed_json)

            merged = handler.merge_config(generated_data=generated_cfg, current_config=current_config)
            finalized = handler.validate_and_finalize(merged)

            return {
                "ok": True,
                "message": reply_msg,
                "config": finalized,
                "model_used": target_model,
                "provider_used": "gemini"
            }
        except Exception as e:
            logger.exception(f"Fehler bei Gemini Chat für '{generator_id}': {e}")
            raise

    # --- OLLAMA LOCAL FLOW ---
    target_model = model or config.OLLAMA_DEFAULT_MODEL
    url = f"{config.OLLAMA_BASE_URL}/api/chat"

    llm_messages = handler.build_chat_messages(
        history=messages,
        current_config=current_config
    )

    payload = {
        "model": target_model,
        "messages": llm_messages,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.1
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise ValueError(f"Ollama meldete HTTP {resp.status_code}: {resp.text}")

            data = resp.json()
            message_content = data.get("message", {}).get("content", "").strip()

            parsed_json = _parse_and_sanitize_json_response(message_content, generator_id)
            reply_msg, generated_cfg = handler.parse_chat_response(parsed_json)

            merged = handler.merge_config(generated_data=generated_cfg, current_config=current_config)
            finalized = handler.validate_and_finalize(merged)

            return {
                "ok": True,
                "message": reply_msg,
                "config": finalized,
                "model_used": target_model,
                "provider_used": "ollama"
            }

    except httpx.ConnectError:
        raise ConnectionError(
            f"Verbindung zu Ollama unter {config.OLLAMA_BASE_URL} fehlgeschlagen. Bitte stelle sicher, dass Ollama läuft."
        )
    except Exception as e:
        logger.exception(f"Fehler im Chat-Modus für '{generator_id}'")
        raise
