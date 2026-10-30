# SPDX-License-Identifier: AGPL-3.0-or-later

import re
from typing import Any

def extract_json_from_llm_response(text: str) -> str:
    """Extrahiert das JSON-Objekt aus der Antwort des Sprachmodells, 
    auch wenn Markdown-Codeblöcke oder einleitende/abschließende Texte vorhanden sind."""
    text = text.strip()
    
    # 1. Wenn Markdown-Blöcke vorhanden sind, extrahiere deren Inhalt
    if "```json" in text:
        match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            text = match.group(1).strip()
    elif "```" in text:
        match = re.search(r"```\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            text = match.group(1).strip()
            
    # 2. Suche die äußersten geschweiften Klammern
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        text = text[first_brace:last_brace + 1]

    return text

def sanitize_llm_json_string(text: str) -> str:
    """Repariert typische LaTeX-Backslash-Probleme in vom LLM erzeugten JSON-Strings.
    
    Insbesondere wird verhindert, dass \\frac als Formfeed (\\x0c) oder \\text als Tab (\\t)
    geparst wird, falls das Modell nur einfache Backslashes generiert hat.
    """
    # Häufige LaTeX-Befehle, die mit b, f, n, r, t beginnen und sonst als JSON-Control-Chars gelten:
    text = re.sub(
        r'(?<!\\)\\(frac|text|times|cdot|sqrt|beta|bar|left|right|pm|neq|approx|le|ge|sout|quad|to|alpha|delta|gamma|pi|theta|sigma|omega|large|small|normalsize|tiny|scriptsize|footnotesize|textbf|textit|mathbf|mathit|vec|widehat|overline|underline)',
        r'\\\\\1',
        text
    )
    # Alle weiteren einfachen Backslashes, die keine gültigen JSON-Escapes darstellen:
    text = re.sub(r'(?<!\\)\\(?!["\\/bfnrtu])', r'\\\\', text)
    return text

def recursively_fix_latex_strings(obj: Any) -> Any:
    """Prüft rekursiv alle String-Werte und bereinigt Steuerzeichen wie Formfeed(\\x0c) -> \\frac."""
    if isinstance(obj, str):
        # Falls \x0c (Formfeed) vor 'rac' gelandet ist:
        res = obj.replace("\x0crac", r"\frac")
        res = res.replace("\x0c", r"\f")
        res = res.replace("\x08eta", r"\beta")
        res = res.replace("\x08ar", r"\bar")
        res = res.replace("\x08f", r"\bf")
        res = res.replace("\t", r"\t")
        return res
    elif isinstance(obj, dict):
        return {k: recursively_fix_latex_strings(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [recursively_fix_latex_strings(item) for item in obj]
    return obj
