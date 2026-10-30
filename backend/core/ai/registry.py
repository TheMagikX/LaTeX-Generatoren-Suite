# SPDX-License-Identifier: AGPL-3.0-or-later

from typing import Dict, List, Optional
from core.ai.base import BaseGeneratorAiHandler
from core.ai.handlers.baumdiagramm import BaumdiagrammAiHandler
from core.ai.handlers.bruch import BruchAiHandler
from core.ai.handlers.glucksrad import GlucksradAiHandler
from core.ai.handlers.zahlenstrahl import ZahlenstrahlAiHandler
from core.ai.handlers.stellenwert import StellenwertAiHandler
from core.ai.handlers.koord2d import Koord2DAiHandler
from core.ai.handlers.koord3d import Koord3DAiHandler

class GeneratorAiRegistry:
    """Zentrale Registrierung für alle generator-spezifischen KI-Handler."""

    def __init__(self):
        self._handlers: Dict[str, BaseGeneratorAiHandler] = {}
        # Standard-Handler registrieren
        self.register(BaumdiagrammAiHandler())
        self.register(BruchAiHandler())
        self.register(GlucksradAiHandler())
        self.register(ZahlenstrahlAiHandler())
        self.register(StellenwertAiHandler())
        self.register(Koord2DAiHandler())
        self.register(Koord3DAiHandler())

    def register(self, handler: BaseGeneratorAiHandler) -> None:
        self._handlers[handler.generator_id] = handler

    def get(self, generator_id: str) -> Optional[BaseGeneratorAiHandler]:
        return self._handlers.get(generator_id)

    def list_supported(self) -> List[str]:
        return list(self._handlers.keys())

# Globale Instanz
registry = GeneratorAiRegistry()

