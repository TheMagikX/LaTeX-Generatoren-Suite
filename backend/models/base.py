# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field


class BaseGeneratorConfig(BaseModel):
    """Gemeinsame Basisklasse für Generator-Konfigurationen."""

    pakete_laden: bool = Field(default=True, description="Ob Standard-Pakete geladen werden sollen")
    command_laden: bool = Field(default=True, description="Ob Standard-Commands geladen werden sollen")
    font_family: str = Field(default="Fira", description="Zu verwendende Schriftart")
