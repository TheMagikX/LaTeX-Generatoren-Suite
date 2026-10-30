# SPDX-License-Identifier: AGPL-3.0-or-later

"""
Legacy-Adapter: Leitet auf das modulare core.ai-Paket um.
"""

from typing import Any, Dict, Optional
from core.ai import (
    check_ollama_status,
    stop_ollama_service,
    generate_config_from_prompt,
)
from core.ai.sanitizer import (
    sanitize_llm_json_string,
    recursively_fix_latex_strings,
    extract_json_from_llm_response,
)

async def generate_baumdiagramm_config_from_prompt(
    prompt: str,
    current_config: Optional[Dict[str, Any]] = None,
    model: Optional[str] = None
) -> Dict[str, Any]:
    return await generate_config_from_prompt(
        generator_id="baumdiagramm",
        prompt=prompt,
        current_config=current_config,
        model=model,
    )

__all__ = [
    "check_ollama_status",
    "stop_ollama_service",
    "generate_config_from_prompt",
    "generate_baumdiagramm_config_from_prompt",
    "sanitize_llm_json_string",
    "recursively_fix_latex_strings",
    "extract_json_from_llm_response",
]
