# SPDX-License-Identifier: AGPL-3.0-or-later

import json
import re
from typing import Any, Iterator, Optional

MAX_PROMPT_LENGTH = 10_000

# Steuerzeichen außer \n, \r, \t entfernen
_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

# Eindeutige Prompt-Injection- und Modell-Kontrolltoken-Muster
_PROMPT_INJECTION_RE = re.compile(
    r"<\|(?:im_start|im_end|system|assistant|user|endoftext)\|>|"
    r"<<\s*/?SYS\s*>>|"
    r"\[/?INST\]|"
    r"\b(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|rules|prompts)\b|"
    r"\b(?:ignoriere|vergiss)\s+(?:alle\s+)?(?:vorherigen|obigen|bisherigen)\s+(?:anweisungen|regeln|instruktionen)\b",
    re.IGNORECASE,
)

# Gefährliche TeX-Primitive, LuaTeX-Ausführung, Catcode-Manipulation und Dateieinbindungen (Defense-in-Depth)
_FORBIDDEN_AI_LATEX_RE = re.compile(
    r"\\(?:openin|openout|read|newread|newwrite|write18|immediate\s*\\write|write|"
    r"@@input|InputIfFileExists|IfFileExists|input@path|scantokens|everyeof|"
    r"pdffiledump|pdfmdfivesum|pdfshellescape|xetexpicfile|xetexpdffile|"
    r"directlua|latelua|luaescapestring|luacode|luafunction|"
    r"csname|catcode|uppercase|lowercase|"
    r"input|include|verbatiminput|lstinputlisting|includegraphics|"
    r"includesvg|svginput|includepdf|pgfplotstableread)(?![A-Za-z@])|"
    r"\\[A-Za-z@]*\^\^[0-9a-fA-F]{2}",
    re.IGNORECASE,
)

# LaTeX-/TikZ-Befehle mit Anfangsbuchstaben b, f, n, r, t (kollidieren sonst mit JSON-Escapes)
_LATEX_CONTROL_PREFIX_CMDS = (
    r"bar|begin|beta|bf|big|Big|bigg|Bigg|binom|bmod|boldsymbol|bot|box|boxed|bullet|"
    r"fbox|footnotesize|forall|frac|frown|"
    r"nabla|natural|ne|neg|neq|newline|ni|node|noindent|normalsize|not|notin|nu|num|"
    r"rangle|rceil|Re|rfloor|rho|right|rightarrow|Rightarrow|rightleftharpoons|rm|rotatebox|"
    r"tan|tanh|tau|text|textbf|textit|textrm|textsc|textsf|texttt|theta|Theta|tikz|tikzset|tikzstyle|tilde|times|tiny|to|top|triangle|triangledown|triangleleft|triangleright|tt"
)
_LATEX_CONTROL_PREFIX_RE = re.compile(rf"(?<!\\)\\({_LATEX_CONTROL_PREFIX_CMDS})\b")


def sanitize_user_prompt(prompt: str) -> str:
    """Bereinigt und validiert einen Benutzer-Prompt vor der Weitergabe an ein LLM."""
    if not isinstance(prompt, str):
        raise ValueError("Der Prompt muss eine Zeichenkette sein.")

    cleaned = _CONTROL_CHARS_RE.sub("", prompt).strip()
    if not cleaned:
        raise ValueError("Der Prompt darf nicht leer sein.")

    if len(cleaned) > MAX_PROMPT_LENGTH:
        raise ValueError(
            f"Der Prompt überschreitet die maximal zulässige Länge von {MAX_PROMPT_LENGTH} Zeichen."
        )

    if _PROMPT_INJECTION_RE.search(cleaned):
        raise ValueError(
            "Die Eingabe enthält unzulässige Steuersequenzen oder Prompt-Injection-Muster."
        )

    return cleaned


def validate_no_dangerous_latex(obj: Any) -> Any:
    """Prüft rekursiv alle Strings einer KI-Antwort auf gefährliche TeX-Primitive."""
    if isinstance(obj, str):
        if _FORBIDDEN_AI_LATEX_RE.search(obj):
            raise ValueError(
                "Die KI-Antwort enthält nicht erlaubte LaTeX-Befehle und wurde aus Sicherheitsgründen blockiert."
            )
        return obj
    if isinstance(obj, dict):
        for k, v in obj.items():
            validate_no_dangerous_latex(k)
            validate_no_dangerous_latex(v)
        return obj
    if isinstance(obj, list):
        for item in obj:
            validate_no_dangerous_latex(item)
        return obj
    return obj


def _iter_balanced_json_objects(source: str, start_pos: int = 0) -> Iterator[str]:
    """Durchsucht `source` string-bewusst nach balancierten `{...}`-Objekten."""
    n = len(source)
    i = start_pos
    while i < n:
        if source[i] != "{":
            i += 1
            continue

        depth = 0
        in_string = False
        escape = False
        j = i
        while j < n:
            ch = source[j]
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
            else:
                if ch == '"':
                    in_string = True
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        yield source[i : j + 1]
                        i = j + 1
                        break
            j += 1
        else:
            i += 1


def _is_valid_json_object(candidate: str) -> bool:
    """Prüft, ob ein extrahierter `{...}`-Block (nach Backslash-Sanitisierung) ein JSON-Dict ergibt."""
    for variant in (sanitize_llm_json_string(candidate), candidate):
        try:
            parsed = json.loads(variant)
            if isinstance(parsed, dict):
                return True
        except json.JSONDecodeError:
            continue
    return False


def extract_json_from_llm_response(text: str) -> str:
    """Extrahiert das JSON-Objekt aus der Antwort des Sprachmodells,
    auch wenn Markdown-Codeblöcke, Backticks in Strings oder Prosa mit `{...}` vorhanden sind."""
    stripped = text.strip()
    fallback: Optional[str] = None

    # 1. Bevorzugt innerhalb von Markdown-Codefences suchen (string-bewusst)
    for fence_match in re.finditer(r"```(?:json)?\s*", stripped):
        for candidate in _iter_balanced_json_objects(stripped, fence_match.end()):
            if fallback is None:
                fallback = candidate
            if _is_valid_json_object(candidate):
                return candidate

    # 2. Im gesamten Text nach dem ersten validen JSON-Objekt suchen
    for candidate in _iter_balanced_json_objects(stripped, 0):
        if fallback is None:
            fallback = candidate
        if _is_valid_json_object(candidate):
            return candidate

    return fallback if fallback is not None else stripped


def sanitize_llm_json_string(text: str) -> str:
    """Repariert typische LaTeX-Backslash-Probleme in vom LLM erzeugten JSON-Strings.

    Insbesondere wird verhindert, dass \\frac als Formfeed (\\x0c), \\begin als Backspace (\\x08)
    oder \\text als Tab (\\t) geparst wird, falls das Modell nur einfache Backslashes generiert hat.
    """
    # Häufige LaTeX-Befehle, die mit b, f, n, r, t beginnen und sonst als JSON-Control-Chars gelten:
    text = _LATEX_CONTROL_PREFIX_RE.sub(r"\\\\\1", text)
    # Backslash vor 'u', der KEIN 4-stelliger Hex-Unicode-Escape ist (z. B. \underline, \uparrow):
    text = re.sub(r'(?<!\\)\\u(?![0-9a-fA-F]{4})', r'\\\\u', text)
    # Alle weiteren einfachen Backslashes, die keine gültigen JSON-Escapes darstellen:
    text = re.sub(r'(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', text)
    return text


def recursively_fix_latex_strings(obj: Any) -> Any:
    """Prüft rekursiv alle String-Werte und bereinigt versehentlich entstandene Steuerzeichen
    vor bekannten LaTeX-Befehlssuffixen (z. B. Formfeed(\\x0c) + 'rac' -> \\frac)."""
    if isinstance(obj, str):
        res = re.sub(
            r"\x08(ar|egin|eta|f|ig|inom|mod|oldsymbol|ot|ox|oxed|ullet)\b",
            r"\\b\1",
            obj,
        )
        res = re.sub(r"\x0c(box|ootnotesize|orall|rac|rown)\b", r"\\f\1", res)
        res = re.sub(
            r"\n(abla|atural|e|eg|eq|ewline|i|ode|oindent|ormalsize|ot|otin|u|um)\b",
            r"\\n\1",
            res,
        )
        res = re.sub(
            r"\r(angle|ceil|floor|ho|ight|ightarrow|ightleftharpoons|m|otatebox)\b",
            r"\\r\1",
            res,
        )
        res = re.sub(
            r"\t(an|anh|au|ext|extbf|extit|extrm|extsc|extsf|exttt|heta|ikz|ikzset|ikzstyle|ilde|imes|iny|o|op|riangle|riangledown|riangleleft|riangleright|t)\b",
            r"\\t\1",
            res,
        )
        return res
    elif isinstance(obj, dict):
        return {k: recursively_fix_latex_strings(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [recursively_fix_latex_strings(item) for item in obj]
    return obj

