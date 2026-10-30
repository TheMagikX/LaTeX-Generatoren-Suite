# SPDX-License-Identifier: AGPL-3.0-or-later

import logging
from typing import Any, Dict, List, Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import config
from core.ai import (
    check_ollama_status,
    check_ai_status,
    stop_ollama_service,
    generate_config_from_prompt,
    chat_with_generator,
    gemini_service,
    ChatMessage,
    registry
)

logger = logging.getLogger("generator_suite.ai")
router = APIRouter(prefix="/ai", tags=["AI"])


class ProviderPayload(BaseModel):
    provider: Literal["gemini", "ollama"] = Field(..., description="'gemini' oder 'ollama'")


class GeminiKeyPayload(BaseModel):
    api_key: Optional[str] = Field(None, description="Google Gemini API-Key aus dem Google AI Studio")


class PromptToConfigRequest(BaseModel):
    generator: str = Field(..., description="ID des Generators, z.B. 'baumdiagramm', 'bruch', 'glucksrad'")
    prompt: str = Field(..., description="Benutzer-Prompt in natürlicher Sprache")
    current_config: Optional[Dict[str, Any]] = Field(None, description="Aktuelle Konfiguration aus dem Frontend")
    model: Optional[str] = Field(None, description="Gewünschtes Modell (Ollama oder Gemini)")
    provider: Optional[Literal["gemini", "ollama"]] = Field(None, description="Expliziter Provider (Standard: aktiver Provider)")


class ChatRequest(BaseModel):
    generator: str = Field(..., description="ID des Generators, z.B. 'baumdiagramm', 'bruch', 'glucksrad'")
    messages: List[ChatMessage] = Field(..., description="Chronologischer Verlauf der Chat-Nachrichten")
    current_config: Optional[Dict[str, Any]] = Field(None, description="Aktuelle Konfiguration aus dem Frontend")
    model: Optional[str] = Field(None, description="Gewünschtes Modell (Ollama oder Gemini)")
    provider: Optional[Literal["gemini", "ollama"]] = Field(None, description="Expliziter Provider (Standard: aktiver Provider)")


class StopOllamaRequest(BaseModel):
    mode: Literal["unload_models", "stop_server"] = Field(
        "unload_models",
        description="'unload_models' oder 'stop_server'",
    )


@router.get("/config")
def get_ai_config():
    """Gibt den aktiven Provider, den maskierten Gemini-Key und verfügbare Gemini-Modelle zurück."""
    return {
        "active_provider": gemini_service.get_active_provider(),
        "has_gemini_key": bool(gemini_service.get_gemini_api_key()),
        "masked_gemini_key": gemini_service.get_masked_key(),
        "gemini_default_model": config.GEMINI_DEFAULT_MODEL,
        "gemini_models": config.GEMINI_FALLBACK_MODELS,
    }


@router.post("/config/provider")
def set_provider(data: ProviderPayload):
    """Wechselt den aktiven Provider zwischen 'gemini' und 'ollama'."""
    gemini_service.set_active_provider(data.provider)
    return {
        "status": "ok",
        "active_provider": data.provider
    }


@router.post("/config/gemini-key")
def save_gemini_key(data: GeminiKeyPayload):
    """Speichert den Gemini API-Schlüssel sicher in ai_secrets.json (gitignoriert)."""
    clean_key = (data.api_key or "").strip()
    if not clean_key:
        raise HTTPException(status_code=400, detail="API-Schlüssel darf nicht leer sein.")
    gemini_service.set_gemini_api_key(clean_key)
    return {
        "status": "ok",
        "masked_key": gemini_service.get_masked_key()
    }


@router.post("/config/test-gemini")
async def test_gemini_connection(data: Optional[GeminiKeyPayload] = None):
    """Testet die Verbindung zur Gemini API (entweder mit übergebenem Key oder gespeichertem Key)."""
    key = data.api_key.strip() if (data and data.api_key and data.api_key.strip()) else None
    try:
        result = await gemini_service.check_gemini_status(key)
        return result
    except Exception:
        logger.exception("Fehler beim Gemini-Verbindungstest")
        return {"available": False, "error": "Fehler beim Verbindungstest zur Gemini API."}


@router.get("/status")
async def get_status():
    """Gibt den Status des aktiven Providers sowie unterstützte Generatoren zurück."""
    status = await check_ai_status()
    status["supported_generators"] = registry.list_supported()
    return status


@router.post("/stop")
async def stop_ollama_endpoint(request: StopOllamaRequest):
    """Beendet den Ollama-Server oder entlädt Modelle aus dem Arbeitsspeicher."""
    return await stop_ollama_service(mode=request.mode)


@router.post("/prompt-to-config")
async def prompt_to_config(request: PromptToConfigRequest):
    """Wandelt einen Prompt in eine strukturierte Generator-Konfiguration um (via aktiver Engine)."""
    if not registry.get(request.generator):
        supported = ", ".join(registry.list_supported())
        raise HTTPException(
            status_code=400,
            detail=f"Generator '{request.generator}' wird aktuell noch nicht unterstützt. Verfügbar: {supported}"
        )

    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Der Prompt darf nicht leer sein.")

    try:
        result = await generate_config_from_prompt(
            generator_id=request.generator,
            prompt=request.prompt,
            current_config=request.current_config,
            model=request.model,
            provider=request.provider
        )
        return result
    except ConnectionError as ce:
        raise HTTPException(status_code=503, detail=str(ce))
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception:
        logger.exception("Unerwarteter Fehler bei KI-Anfrage")
        raise HTTPException(status_code=500, detail="Ein interner Fehler bei der KI-Verarbeitung ist aufgetreten.")


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Interaktiver Konversations-Endpunkt für iterative Verfeinerung.
    Nimmt Chat-Historie und optional aktuellen Zustand entgegen.
    """
    if not registry.get(request.generator):
        supported = ", ".join(registry.list_supported())
        raise HTTPException(
            status_code=400,
            detail=f"Generator '{request.generator}' wird aktuell noch nicht unterstützt. Verfügbar: {supported}"
        )

    if not request.messages:
        raise HTTPException(status_code=400, detail="Die Nachrichtenliste darf nicht leer sein.")

    last_msg = request.messages[-1]
    if last_msg.role != "user" or not last_msg.content.strip():
        raise HTTPException(status_code=400, detail="Die letzte Nachricht muss eine nicht-leere Benutzereingabe sein.")

    try:
        result = await chat_with_generator(
            generator_id=request.generator,
            messages=request.messages,
            current_config=request.current_config,
            model=request.model,
            provider=request.provider
        )
        return result
    except ConnectionError as ce:
        raise HTTPException(status_code=503, detail=str(ce))
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception:
        logger.exception("Unerwarteter Fehler bei KI-Anfrage")
        raise HTTPException(status_code=500, detail="Ein interner Fehler bei der KI-Verarbeitung ist aufgetreten.")
