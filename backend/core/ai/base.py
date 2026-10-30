# SPDX-License-Identifier: AGPL-3.0-or-later

import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Literal, Optional, Tuple, Type
from pydantic import BaseModel, Field

logger = logging.getLogger("generator_suite.ai")

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="Rolle des Senders")
    content: str = Field(..., description="Textinhalt der Nachricht")

CHAT_MODE_INSTRUCTION = (
    "\n\n================================================================================\n"
    "KONVERSATIONS- & VERFEINERUNGS-MODUS (CHAT):\n"
    "================================================================================\n"
    "Du agierst als kooperativer Assistent im Dialog mit einer Lehrkraft.\n"
    "Antworte AUSSCHLIESSLICH als valides JSON mit genau folgender Struktur:\n"
    "{\n"
    '  "message": "Kurze, freundliche Bestätigung auf Deutsch (1-2 Sätze), was du eingestellt oder geändert hast.",\n'
    '  "config": { ...vollständige, valide Generator-Konfiguration... }\n'
    "}\n"
    "WICHTIG:\n"
    "- Falls eine bestehende Konfiguration übergeben wurde, behalte alle bestehenden Eigenschaften bei, die nicht geändert werden sollen!\n"
    "- Ändere gezielt nur die vom Nutzer genannten Aspekte.\n"
)

class BaseGeneratorAiHandler(ABC):
    """Abstrakte Basisklasse für KI-Unterstützung eines spezifischen Generators."""

    def __init__(self, generator_id: str, title: str, model_cls: Type[BaseModel]):
        self.generator_id = generator_id
        self.title = title
        self.model_cls = model_cls

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Gibt den systemspezifischen Prompt inklusive Few-Shot-Beispielen zurück."""
        pass

    def get_chat_system_prompt(self) -> str:
        """Gibt den System-Prompt erweitert um die Chat-Instruktionen zurück."""
        return self.get_system_prompt() + CHAT_MODE_INSTRUCTION

    def compress_config_for_context(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Entfernt unkritische Style-/Layout-Defaults aus der Konfiguration,
        damit der Kontext für lokale LLMs schlank und schnell bleibt.
        """
        ignore_keys = {
            "texFilename", "dpi", "grid_color", "axis_color", "border_color",
            "width_cm", "height_cm", "font_family", "style"
        }
        return {k: v for k, v in config.items() if k not in ignore_keys and v is not None}

    def build_messages(
        self,
        prompt: str,
        current_config: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, str]]:
        """Erzeugt die Chat-Messages für die Einmal-Generierung (Legacy prompt-to-config)."""
        user_content = f"Erstelle die {self.title}-Konfiguration als valides JSON für folgende Anforderung:\n{prompt}"
        return [
            {"role": "system", "content": self.get_system_prompt()},
            {"role": "user", "content": user_content}
        ]

    def build_chat_messages(
        self,
        history: List[ChatMessage],
        current_config: Optional[Dict[str, Any]] = None,
        max_turns: int = 6
    ) -> List[Dict[str, str]]:
        """
        Erzeugt eine schlanke Message-Historie für lokale LLMs.
        - Wendet ein Sliding-Window auf die letzten max_turns Nachrichten an.
        - Assistant-Nachrichten enthalten nur ihren Text (keinen JSON-Ballast).
        - Injiziert den aktuellen Generator-Zustand komprimiert, falls Feinheiten angepasst werden.
        """
        system_content = self.get_chat_system_prompt()
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_content}
        ]

        if not history:
            return messages

        # Sliding Window auf die letzten max_turns Nachrichten beschränken
        trimmed_history = history[-max_turns:]

        # Wenn current_config vorhanden ist und es sich um eine Folgeanfrage handelt (oder bereits Konfig vorliegt)
        compact_state = self.compress_config_for_context(current_config) if current_config else None

        for idx, item in enumerate(trimmed_history):
            is_last_user_message = (idx == len(trimmed_history) - 1 and item.role == "user")

            if is_last_user_message and compact_state:
                # Vor der letzten User-Anfrage den aktuellen Zustand als prägnanten Kontext übergeben
                try:
                    state_json = json.dumps(compact_state, ensure_ascii=False)
                    content = (
                        f"[Aktueller Generator-Zustand]\n{state_json}\n\n"
                        f"[Benutzeranweisung]\n{item.content}"
                    )
                except Exception:
                    content = item.content
                messages.append({"role": item.role, "content": content})
            else:
                messages.append({"role": item.role, "content": item.content})

        return messages

    def parse_chat_response(self, raw_data: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """
        Interpretiert die JSON-Antwort des Modells.
        Erkennt sowohl { "message": "...", "config": {...} } als auch reine { ...config... }.
        """
        if isinstance(raw_data, dict):
            # Fall 1: Modell liefert ordnungsgemäß { message, config }
            if "config" in raw_data and isinstance(raw_data["config"], dict):
                msg = str(raw_data.get("message") or "Konfiguration wurde erfolgreich aktualisiert.")
                return msg, raw_data["config"]

            # Fall 2: Modell liefert direkt die Config (z.B. wenn "config" fehlt, aber Generator-Keys vorhanden sind)
            msg = str(raw_data.pop("message", "Konfiguration wurde angepasst."))
            return msg, raw_data

        return "Konfiguration aktualisiert.", {}

    def merge_config(
        self,
        generated_data: Dict[str, Any],
        current_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Kombiniert die generierten Daten mit der Basis-Konfiguration.
        Voreinstellungen aus current_config (z.B. Styles, Schriftarten, Layout-Größen)
        bleiben erhalten, sofern nicht explizit durch die KI überschrieben.
        """
        # Standardkonfiguration als Basis
        base_dict = self.model_cls().model_dump()

        # Behalte optionale Stil-/Layout-Parameter aus der aktuellen Nutzersitzung
        if current_config:
            preserved_keys = [
                "style", "font_family", "dpi", "texFilename",
                "grid_color", "axis_color", "border_color", "width_cm"
            ]
            for pk in preserved_keys:
                if pk in current_config and current_config[pk] is not None:
                    base_dict[pk] = current_config[pk]

        # Überschreibe mit den von der KI generierten Werten
        for key, val in generated_data.items():
            if val is not None:
                base_dict[key] = val

        return base_dict

    def validate_and_finalize(self, merged_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Validiert das Dictionary mit Pydantic und führt ggf. Nachkorrekturen durch."""
        validated = self.model_cls.model_validate(merged_dict)
        return validated.model_dump()
