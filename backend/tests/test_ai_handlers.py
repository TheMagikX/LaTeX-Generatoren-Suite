# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
from core.ai.registry import registry
from core.ai.sanitizer import (
    extract_json_from_llm_response,
    sanitize_llm_json_string,
    recursively_fix_latex_strings
)

EXPECTED_GENERATORS = [
    "baumdiagramm",
    "bruch",
    "glucksrad",
    "zahlenstrahl",
    "stellenwerttafel",
    "koordinatensystem",
    "koordinatensystem3d",
]

def test_all_generators_registered():
    supported = registry.list_supported()
    for gen_id in EXPECTED_GENERATORS:
        assert gen_id in supported, f"Generator '{gen_id}' is not registered in AI registry!"
        handler = registry.get(gen_id)
        assert handler is not None
        assert handler.generator_id == gen_id
        assert len(handler.title) > 0
        prompt = handler.get_system_prompt()
        assert len(prompt) > 100, f"System prompt for '{gen_id}' is too short!"
        assert "BEISPIEL" in prompt or "BEISPIELE" in prompt, f"Missing few-shot examples in '{gen_id}' prompt!"

def test_sanitizer_latex_math_and_control_chars():
    # 1. LaTeX backslashes escaping
    raw_json = r'{"formula": "$\frac{1}{2}$", "beta": "\beta", "vec": "\vec{v}"}'
    sanitized = sanitize_llm_json_string(raw_json)
    assert r"\\frac" in sanitized
    assert r"\\beta" in sanitized
    assert r"\\vec" in sanitized

    # 2. Markdown extraction
    markdown_wrapped = "Hier ist die Konfiguration:\n```json\n{\"test\": 123}\n```\nViele Grüße!"
    extracted = extract_json_from_llm_response(markdown_wrapped)
    assert extracted == '{"test": 123}'

    # 3. Recursive fix for formfeeds (\x0c)
    dirty_dict = {"edge": "\x0crac{3}{4}", "nested": [{"item": "\x08eta"}]}
    fixed = recursively_fix_latex_strings(dirty_dict)
    assert fixed["edge"] == r"\frac{3}{4}"
    assert fixed["nested"][0]["item"] == r"\beta"

def test_bruch_handler_validation():
    handler = registry.get("bruch")
    mock_data = {
        "zaehler": 3,
        "nenner": 4,
        "form": "Kreis",
        "fill_color": "#F39C12",
        "show_label": True
    }
    merged = handler.merge_config(mock_data, current_config={"font_family": "CustomFont"})
    validated = handler.validate_and_finalize(merged)
    assert validated["zaehler"] == 3
    assert validated["nenner"] == 4
    assert validated["form"] == "Kreis"
    assert validated["font_family"] == "CustomFont"

def test_glucksrad_handler_validation():
    handler = registry.get("glucksrad")
    mock_data = {
        "mode": "standard",
        "radius": 3.0,
        "sectors": [
            {"farbe": "#E74C3C", "haeufigkeit": 2, "label": "Rot"},
            {"farbe": "#3498DB", "haeufigkeit": 4, "label": "Blau"}
        ],
        "arrow_style": "TikZ-Pfeil"
    }
    merged = handler.merge_config(mock_data)
    validated = handler.validate_and_finalize(merged)
    assert validated["anzahl"] == 6  # Auto-calculated from 2 + 4
    assert len(validated["sectors"]) == 2

def test_zahlenstrahl_handler_validation():
    handler = registry.get("zahlenstrahl")
    mock_data = {
        "min_val": -5.0,
        "max_val": 5.0,
        "step_main": 1.0,
        "step_sub": 0.5,
        "arrow_type": "<->",
        "points": [
            {"value": 2.5, "type": "kreuz", "label": "P", "visible": True}
        ]
    }
    merged = handler.merge_config(mock_data)
    validated = handler.validate_and_finalize(merged)
    assert validated["min_val"] == -5.0
    assert validated["max_val"] == 5.0
    assert len(validated["points"]) == 1

def test_stellenwert_handler_validation():
    handler = registry.get("stellenwerttafel")
    mock_data = {
        "columns": [
            {"id": "H", "label": "H", "color": "#2563eb", "active": True},
            {"id": "Z", "label": "Z", "color": "#dc2626", "active": True},
            {"id": "E", "label": "E", "color": "#16a34a", "active": True}
        ],
        "rows": [
            {"id": "r1", "label": "123", "values": {"H": 1, "Z": 2, "E": 3}, "active": True}
        ],
        "mode": "Beides",
        "decimal_separator_pos": None
    }
    merged = handler.merge_config(mock_data)
    validated = handler.validate_and_finalize(merged)
    assert len(validated["columns"]) == 3
    assert len(validated["rows"]) == 1

def test_koord2d_handler_validation():
    handler = registry.get("koordinatensystem")
    mock_data = {
        "xmin": -2.0,
        "xmax": 6.0,
        "ymin": -1.0,
        "ymax": 5.0,
        "plots": [
            {"show": True, "func": "0.5*x + 1", "color": "#16a34a", "line_width": "thick"}
        ]
    }
    merged = handler.merge_config(mock_data)
    validated = handler.validate_and_finalize(merged)
    assert validated["xmin"] == -2.0
    assert validated["xmax"] == 6.0
    assert len(validated["plots"]) == 1

def test_koord3d_handler_validation():
    handler = registry.get("koordinatensystem3d")
    mock_data = {
        "xmin": 0.0,
        "xmax": 5.0,
        "ymin": 0.0,
        "ymax": 5.0,
        "zmin": 0.0,
        "zmax": 5.0,
        "points": [
            {"show": True, "x": 1.0, "y": 2.0, "z": 3.0, "label": "P", "proj_xy": True}
        ]
    }
    merged = handler.merge_config(mock_data)
    validated = handler.validate_and_finalize(merged)
    assert len(validated["points"]) == 1
    assert validated["points"][0]["x"] == 1.0

def test_chat_messages_building_and_compression():
    from core.ai.base import ChatMessage
    handler = registry.get("bruch")

    history = [
        ChatMessage(role="user", content="Erstelle einen Bruch mit 3/4"),
        ChatMessage(role="assistant", content="Ich habe den Bruch 3/4 erstellt."),
        ChatMessage(role="user", content="Ändere den Nenner auf 8")
    ]
    current_config = {
        "zaehler": 3,
        "nenner": 4,
        "form": "Kreis",
        "dpi": 300,
        "grid_color": "#000000"
    }

    messages = handler.build_chat_messages(history, current_config=current_config, max_turns=4)
    # 1. System Prompt vorhanden mit CHAT_MODE_INSTRUCTION
    assert messages[0]["role"] == "system"
    assert "KONVERSATIONS-" in messages[0]["content"]

    # 2. Assistant-Nachricht ist schlanker Text ohne JSON
    assert messages[2]["role"] == "assistant"
    assert messages[2]["content"] == "Ich habe den Bruch 3/4 erstellt."

    # 3. Letzte User-Nachricht enthält injizierten, komprimierten Zustand
    last_user = messages[3]
    assert last_user["role"] == "user"
    assert "[Aktueller Generator-Zustand]" in last_user["content"]
    assert "zaehler" in last_user["content"]
    # Unkritische Layout-Parameter wie dpi oder grid_color wurden komprimiert
    assert "grid_color" not in last_user["content"]
    assert "dpi" not in last_user["content"]
    assert "Ändere den Nenner auf 8" in last_user["content"]

def test_chat_response_parsing_with_message_and_fallback():
    handler = registry.get("bruch")

    # Fall 1: Standardformat mit { message, config }
    resp1 = {
        "message": "Nenner auf 8 gesetzt.",
        "config": {"zaehler": 3, "nenner": 8, "form": "Kreis"}
    }
    msg1, cfg1 = handler.parse_chat_response(resp1)
    assert msg1 == "Nenner auf 8 gesetzt."
    assert cfg1["nenner"] == 8

    # Fall 2: Fallback wenn Modell direkt die Config liefert
    resp2 = {
        "zaehler": 5,
        "nenner": 6,
        "form": "Rechteck"
    }
    msg2, cfg2 = handler.parse_chat_response(resp2)
    assert "angepasst" in msg2 or "aktualisiert" in msg2
    assert cfg2["zaehler"] == 5
    assert cfg2["nenner"] == 6

def test_chat_api_endpoint_validation():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app, base_url="http://localhost")

    # 1. Leere Messages ablehnen
    res = client.post("/api/ai/chat", json={
        "generator": "bruch",
        "messages": []
    })
    assert res.status_code == 400

    # 2. Letzte Message ist nicht User
    res2 = client.post("/api/ai/chat", json={
        "generator": "bruch",
        "messages": [{"role": "assistant", "content": "Hallo"}]
    })
    assert res2.status_code == 400

    # 3. Unbekannter Generator
    res3 = client.post("/api/ai/chat", json={
        "generator": "unbekannt",
        "messages": [{"role": "user", "content": "Test"}]
    })
    assert res3.status_code == 400
