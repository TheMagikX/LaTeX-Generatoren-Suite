# SPDX-License-Identifier: AGPL-3.0-or-later

from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
import io
import os
import pathlib
import re
import shutil
import subprocess
import tempfile
import time
from typing import Optional

from pdf2image import convert_from_bytes
from PIL.PngImagePlugin import PngInfo
import config
from core.latex_file_guard import find_violations, get_guard_mode, parse_fls
import logging

logger = logging.getLogger("generator_suite.latex_render")


# Low-Level TeX I/O Primitiven, LuaTeX-Ausführung und Shell-Escape-Befehle
_FORBIDDEN_TEX_PRIMITIVES_RE = re.compile(
    r"\\(?:openin|openout|read|newread|newwrite|write18|immediate\s*\\write|write|"
    r"@@input|InputIfFileExists|IfFileExists|input@path|scantokens|everyeof|"
    r"pdffiledump|pdfmdfivesum|pdfshellescape|xetexpicfile|xetexpdffile|"
    r"directlua|latelua|luaescapestring|luacode|luafunction)(?![A-Za-z@])",
    re.IGNORECASE,
)

# Dynamische Befehls-Konstruktion, Catcode-Manipulation und Hex-Caret-Obfuskation in Kontrollsequenzen
_DYNAMIC_TEX_PRIMITIVES_RE = re.compile(
    r"\\(?:csname|catcode|uppercase|lowercase)(?![A-Za-z@])|\\[A-Za-z@]*\^\^[0-9a-fA-F]{2}",
    re.IGNORECASE,
)

# Überwachte Dateieinbindungsbefehle (müssen in kanonischer Literaldarstellung vorliegen)
_INCLUSION_CMD_TOKEN_RE = re.compile(
    r"\\(input|include|verbatiminput|lstinputlisting|includegraphics|"
    r"includesvg|svginput|includepdf|pgfplotstableread)(?![A-Za-z@])",
    re.IGNORECASE,
)

# Kanonische Klammerform nach dem Befehlsnamen: optional [opts], dann {<literal_path>} ohne {, }, oder \
_CANONICAL_BRACED_ARG_RE = re.compile(
    r"^\s*(?:\[[^\]]*\]\s*)?\{([^{}\\]+)\}",
)

# Kanonische klammerlose Form für \input <literal_path> (darf nicht mit { oder \ beginnen)
_CANONICAL_BRACELESS_INPUT_ARG_RE = re.compile(
    r"^\s+(?![{\\])([^\s%{}\\]+)",
)

# Makro-Indirektion unmittelbar vor einem Einbindungsbefehl (z. B. \let\i\input oder \expandafter\input)
_MACRO_INDIRECTION_PREFIX_RE = re.compile(
    r"\\(?:expandafter|noexpand|meaning|string|(?:let|futurelet)\s*\\[A-Za-z@]+\s*=?|"
    r"(?:e|g|x)?def\s*\\[A-Za-z@]+\s*\{?)\s*$",
    re.IGNORECASE,
)

# \addplot[...] table|file[...] {pfad}
_ADDPLOT_TABLE_OR_FILE_TOKEN_RE = re.compile(
    r"\\addplot3?\s*\+?\s*(?:\[[^\]]*\]\s*)?(?:table|file)(?![A-Za-z@])",
    re.IGNORECASE,
)

_SENSITIVE_PATH_PATTERNS_RE = re.compile(
    r"(?:\.\.[/\\]|[/\\]\.\.|^\.\.$|^[A-Za-z]:[/\\]|^[/\\]|ai_secrets|user_settings|\.env)",
    re.IGNORECASE,
)

_NON_CANONICAL_INCLUSION_MSG = (
    "Sicherheitsrichtlinie: Dateieinbindungen müssen einen direkten, literalen Pfad verwenden "
    "(keine Makros oder verschachtelten Klammern)."
)


def _check_literal_path_security(raw_target: str) -> Optional[str]:
    target_path = raw_target.strip().strip('"').strip("'")
    if not target_path:
        return _NON_CANONICAL_INCLUSION_MSG
    if _SENSITIVE_PATH_PATTERNS_RE.search(target_path):
        return (
            f"Sicherheitsrichtlinie: Unzulässiger Dateipfad in LaTeX-Einbindung ('{target_path}'). "
            "Relative Pfad-Traversals (..) und absolute Systempfade sind blockiert."
        )
    return None


def validate_latex_source_security(latex: str) -> Optional[str]:
    """Prüft LaTeX-Quellcode auf unsichere Dateizugriffe (Schutz insbesondere für natives Windows/MiKTeX)."""
    if not latex:
        return None
    active_lines = [re.sub(r"(?<!\\)%.*$", "", line) for line in latex.splitlines()]
    cleaned = "\n".join(active_lines)

    if _FORBIDDEN_TEX_PRIMITIVES_RE.search(cleaned):
        return (
            "Sicherheitsrichtlinie: Direkte TeX-Dateizugriffs-, Engine- oder Lua-Primitiven "
            "(\\openin, \\openout, \\read, \\write, \\write18, \\pdffiledump, \\XeTeXpdffile, \\scantokens, \\directlua) sind nicht erlaubt."
        )

    if _DYNAMIC_TEX_PRIMITIVES_RE.search(cleaned):
        return (
            "Sicherheitsrichtlinie: Dynamische TeX-Befehlskonstruktion und Catcode-Manipulation "
            "(\\csname, \\catcode, \\uppercase, \\lowercase, ^^-Hex-Escapes) sind nicht erlaubt."
        )

    for match in _INCLUSION_CMD_TOKEN_RE.finditer(cleaned):
        prefix = cleaned[: match.start()]
        if _MACRO_INDIRECTION_PREFIX_RE.search(prefix):
            return _NON_CANONICAL_INCLUSION_MSG

        cmd_name = match.group(1).lower()
        rest = cleaned[match.end() :]
        braced_match = _CANONICAL_BRACED_ARG_RE.match(rest)
        if braced_match:
            err = _check_literal_path_security(braced_match.group(1))
            if err:
                return err
            continue

        if cmd_name == "input":
            braceless_match = _CANONICAL_BRACELESS_INPUT_ARG_RE.match(rest)
            if braceless_match:
                err = _check_literal_path_security(braceless_match.group(1))
                if err:
                    return err
                continue

        return _NON_CANONICAL_INCLUSION_MSG

    for match in _ADDPLOT_TABLE_OR_FILE_TOKEN_RE.finditer(cleaned):
        rest = cleaned[match.end() :]
        braced_match = _CANONICAL_BRACED_ARG_RE.match(rest)
        if not braced_match:
            return _NON_CANONICAL_INCLUSION_MSG
        err = _check_literal_path_security(braced_match.group(1))
        if err:
            return err

    return None


@dataclass
class LatexRenderResult:
    ok: bool
    log: str
    pdf_bytes: Optional[bytes] = None
    compile_time_s: Optional[float] = None
    convert_time_s: Optional[float] = None

def sanitize_latex_log(text: str, *, tmpdir: Optional[str] = None) -> str:
    """Maskiert lokale Dateisystempfade (Projektverzeichnis, Temp-Ordner, Home-Verzeichnis) im LaTeX-Log."""
    if not text:
        return text
    sanitized = text
    replacements: list[tuple[str, str]] = []

    if tmpdir:
        tmp_path = pathlib.Path(tmpdir).resolve()
        replacements.append((tmp_path.as_posix(), "<tmp>"))
        replacements.append((str(tmp_path), "<tmp>"))

    for path_obj, placeholder in (
        (config.CUSTOM_LATEX_DIR, "<custom_latex>"),
        (config.LATEX_FILES_DIR, "<latex_files>"),
        (config.PRESETS_DIR, "<presets>"),
        (config.USER_DATA_DIR, "<user_data>"),
        (config.PROJECT_ROOT, "<project>"),
        (pathlib.Path.home(), "<user_home>"),
    ):
        try:
            resolved = path_obj.resolve()
            replacements.append((resolved.as_posix(), placeholder))
            replacements.append((str(resolved), placeholder))
        except Exception:
            pass

    for raw_str, placeholder in replacements:
        if raw_str:
            sanitized = re.sub(
                re.escape(raw_str) + r"(?:~\d+)?",
                lambda _, ph=placeholder: ph,
                sanitized,
                flags=re.IGNORECASE,
            )

    # Generischer Fallback für OS-Benutzerpfade (inkl. kleingeschriebener Laufwerksbuchstaben oder Windows 8.3 Kurzpfade)
    sanitized = re.sub(
        r"[A-Za-z]:[/\\]Users[/\\][^/\\\s\"':;()<>]+",
        "<user_home>",
        sanitized,
        flags=re.IGNORECASE,
    )
    sanitized = re.sub(
        r"(?<![A-Za-z0-9_])/(?:Users|home)/[^/\s\"':;()<>]+",
        "<user_home>",
        sanitized,
    )

    return sanitized


def extract_latex_stdout_excerpt(
    text: str,
    *,
    max_lines: int = 80,
    tmpdir: Optional[str] = None,
) -> str:
    """
    Kürzt XeLaTeX stdout auf den relevanten Fehlerteil.
    Heuristik:
      - erste Zeile mit '! ' (LaTeX Error)
      - ab dort max_lines Zeilen
      - fallback: letzte max_lines Zeilen
    """
    lines = text.splitlines()

    start = None
    for i, ln in enumerate(lines):
        if ln.startswith("! "):
            start = i
            break

    if start is not None:
        excerpt = "\n".join(lines[start : start + max_lines]).strip()
    else:
        # fallback: Ende von stdout
        tail = lines[-max_lines:] if len(lines) > max_lines else lines
        excerpt = "\n".join(tail).strip()

    return sanitize_latex_log(excerpt, tmpdir=tmpdir)

def first_latex_error_line(text: str) -> str | None:
    for ln in text.splitlines():
        if ln.startswith("! "):
            return ln[2:].strip()
    return None

def compile_latex_to_pdf_bytes(
    latex: str,
    *,
    engine: str = "xelatex",
    tex_filename: str = "main.tex",
    extra_args: tuple[str, ...] = ("-interaction=nonstopmode", "-no-shell-escape", "-recorder"),
) -> LatexRenderResult:
    security_err = validate_latex_source_security(latex)
    if security_err:
        return LatexRenderResult(
            ok=False,
            log=f"! LaTeX Error: {security_err}",
            pdf_bytes=None,
            compile_time_s=0.0,
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        tex_path = os.path.join(tmpdir, tex_filename)
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex)

        # LaTeX-Ressourcenverzeichnis einbinden
        import config
        env = os.environ.copy()
        latex_files_path = config.LATEX_FILES_DIR.as_posix()
        fonts_path = config.FONTS_DIR.as_posix()
        custom_latex_path = config.CUSTOM_LATEX_DIR.as_posix()
        # TEXINPUTS / TTFONTS: . für aktuelles Verzeichnis, dann unser Verzeichnis, dann Custom Latex, dann Standardpfade
        # Windows nutzt ;, Unix nutzt :
        sep = ";" if os.name == "nt" else ":"
        env["TEXINPUTS"] = f".{sep}{latex_files_path}{sep}{custom_latex_path}{sep}{fonts_path}{sep}{sep}"
        env["TTFONTS"] = f".{sep}{fonts_path}{sep}{sep}"
        env["OPENTYPEFONTS"] = f".{sep}{fonts_path}{sep}{sep}"
        env["OSFONTDIR"] = f".{sep}{fonts_path}{sep}{sep}"
        # Restrict TeX file I/O (kpathsea / TeX Live) to prevent arbitrary file read/write via \input or \openout
        env["openin_any"] = "p"
        env["openout_any"] = "p"

        args_list = list(extra_args)
        if "-recorder" not in args_list:
            args_list.append("-recorder")
        cmd = [engine, *args_list, tex_filename]
        t0 = time.perf_counter()
        try:
            proc = subprocess.run(
                cmd,
                cwd=tmpdir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env=env,
                timeout=45,
            )
            compile_time = time.perf_counter() - t0
            out = proc.stdout.decode(errors="replace")
        except subprocess.TimeoutExpired:
            return LatexRenderResult(
                ok=False,
                log="LaTeX-Kompilierung hat das Zeitlimit von 45 Sekunden überschritten (Timeout).",
                pdf_bytes=None,
                compile_time_s=45.0,
            )

        job = pathlib.Path(tex_filename).stem
        fls_path = pathlib.Path(tmpdir) / f"{job}.fls"
        guard_mode = get_guard_mode()
        if guard_mode != "off":
            if fls_path.is_file():
                fls_text = fls_path.read_text(encoding="utf-8", errors="replace")
                accesses = parse_fls(fls_text, pathlib.Path(tmpdir))
                violations = find_violations(accesses, pathlib.Path(tmpdir), engine=engine)
                if violations:
                    sanitized_list = ", ".join(
                        f"{v.kind} {sanitize_latex_log(str(v.path), tmpdir=tmpdir)}"
                        for v in violations
                    )
                    if guard_mode == "warn":
                        logger.warning(
                            "LaTeX file guard (warn): access outside allowed roots: %s",
                            sanitized_list,
                        )
                    else:
                        logger.warning(
                            "LaTeX file guard (enforce): blocked access outside allowed roots: %s",
                            sanitized_list,
                        )
                        first_basename = violations[0].path.name
                        return LatexRenderResult(
                            ok=False,
                            log=(
                                "! LaTeX Error: Sicherheitsrichtlinie: Zugriff auf Datei "
                                f"außerhalb erlaubter Verzeichnisse blockiert ({first_basename})."
                            ),
                            pdf_bytes=None,
                            compile_time_s=compile_time,
                        )
            else:
                if proc.returncode == 0:
                    if guard_mode == "warn":
                        logger.warning(
                            "LaTeX file guard (warn): recorder file (.fls) missing after successful run."
                        )
                    else:
                        logger.warning(
                            "LaTeX file guard (enforce): recorder file (.fls) missing after successful run."
                        )
                        return LatexRenderResult(
                            ok=False,
                            log="! LaTeX Error: Sicherheitsrichtlinie: Recorder-Protokoll (.fls) fehlt nach Kompilierung.",
                            pdf_bytes=None,
                            compile_time_s=compile_time,
                        )
                elif guard_mode == "enforce":
                    err_line = first_latex_error_line(out)
                    safe_err = (
                        f"! {sanitize_latex_log(err_line, tmpdir=tmpdir)}"
                        if err_line
                        else "! LaTeX Error: Kompilierung fehlgeschlagen."
                    )
                    return LatexRenderResult(
                        ok=False,
                        log=safe_err,
                        pdf_bytes=None,
                        compile_time_s=compile_time,
                    )

        if proc.returncode != 0:
            short = extract_latex_stdout_excerpt(out, max_lines=80, tmpdir=tmpdir)
            return LatexRenderResult(ok=False, log=short, pdf_bytes=None, compile_time_s=compile_time)

        job = pathlib.Path(tex_filename).stem
        pdf_path = os.path.join(tmpdir, f"{job}.pdf")
        pdf_bytes = pathlib.Path(pdf_path).read_bytes()

        return LatexRenderResult(ok=True, log="", pdf_bytes=pdf_bytes, compile_time_s=compile_time)

def format_bytes(num):
    for unit in ["B", "KB", "MB", "GB"]:
        if num < 1024:
            return f"{num:.1f} {unit}"
        num /= 1024
    return f"{num:.1f} TB"

def pdf_bytes_to_first_image(
    pdf_bytes: bytes,
    *,
    dpi: int = 1000,
    use_pdftocairo: bool = True,
):
    """
    Wandelt PDF-bytes nach PIL.Image um (erste Seite).
    Gibt (image, convert_time_s) zurück.
    """
    t0 = time.perf_counter()
    images = convert_from_bytes(pdf_bytes, dpi=dpi, use_pdftocairo=use_pdftocairo)
    convert_time = time.perf_counter() - t0
    return images[0], convert_time


def pdf_bytes_to_all_images(
    pdf_bytes: bytes,
    *,
    dpi: int = 1000,
    use_pdftocairo: bool = True,
) -> tuple[list, float]:
    """
    Wandelt alle Seiten eines PDFs nach PIL.Image um.
    Gibt (images, convert_time_s) zurück.
    """
    t0 = time.perf_counter()
    images = convert_from_bytes(pdf_bytes, dpi=dpi, use_pdftocairo=use_pdftocairo)
    convert_time = time.perf_counter() - t0
    return images, convert_time


def get_default_png_metadata() -> PngInfo:
    """Liefert standardisierte Metadaten für alle PNG-Exporte der Generator-Suite (inkl. Adobe XMP für Windows-Explorer-Details)."""
    meta = PngInfo()
    meta.add_text("Software", f"{config.APP_NAME} v{config.APP_VERSION} ({config.SOURCE_CODE_URL})")
    meta.add_text("Author", config.EXPORT_CREATOR)
    meta.add_text("Creator", config.EXPORT_CREATOR)
    meta.add_text("Copyright", f"Erstellt mit {config.EXPORT_CREATOR}. Code: GNU AGPLv3 (AGPL-3.0-or-later), Presets: CC BY-NC-SA 4.0")
    meta.add_text("License", "Code: GNU AGPLv3 (AGPL-3.0-or-later), Presets: CC BY-NC-SA 4.0")
    meta.add_text("Comment", f"Erstellt mit {config.EXPORT_CREATOR} ({config.SOURCE_CODE_URL}) -- Freie Nutzung fuer Unterricht und Lehre. Kommerzielle Weiterverbreitung mitgelieferter Presets untersagt.")
    meta.add_text("Title", f"{config.APP_NAME} Grafik")
    meta.add_text("Description", f"Erstellt mit {config.EXPORT_CREATOR} (Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0) -- Freie Nutzung fuer Unterricht und Lehre.")

    # Adobe XMP Paket (wird von Windows Explorer Details, Adobe Photoshop, Browsern und ExifTool nativ ausgelesen)
    xmp_packet = f"""<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns:xmp="http://ns.adobe.com/xap/1.0/"
          xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
          xmlns:exif="http://ns.adobe.com/exif/1.0/">
  <rdf:Description rdf:about="">
   <dc:title>
    <rdf:Alt><rdf:li xml:lang="x-default">{config.APP_NAME} Grafik</rdf:li></rdf:Alt>
   </dc:title>
   <dc:creator>
    <rdf:Seq><rdf:li>{config.EXPORT_CREATOR}</rdf:li></rdf:Seq>
   </dc:creator>
   <dc:description>
    <rdf:Alt><rdf:li xml:lang="x-default">Erstellt mit {config.EXPORT_CREATOR} (Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0) -- Freie Nutzung fuer Unterricht und Lehre.</rdf:li></rdf:Alt>
   </dc:description>
   <dc:subject>
    <rdf:Bag>
     <rdf:li>{config.APP_NAME}</rdf:li>
     <rdf:li>LaTeX</rdf:li>
     <rdf:li>TikZ</rdf:li>
     <rdf:li>AGPLv3</rdf:li>
     <rdf:li>CC-BY-NC-SA-4.0</rdf:li>
     <rdf:li>Unterrichtsmaterial</rdf:li>
    </rdf:Bag>
   </dc:subject>
   <dc:rights>
    <rdf:Alt><rdf:li xml:lang="x-default">Erstellt mit {config.EXPORT_CREATOR}. Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0</rdf:li></rdf:Alt>
   </dc:rights>
   <xmp:CreatorTool>{config.APP_NAME} v{config.APP_VERSION}</xmp:CreatorTool>
   <xmpRights:Marked>True</xmpRights:Marked>
   <xmpRights:WebStatement>{config.SOURCE_CODE_URL}</xmpRights:WebStatement>
   <xmpRights:UsageTerms>
    <rdf:Alt><rdf:li xml:lang="x-default">Freie Nutzung fuer Unterricht und Lehre. Nicht-kommerzielle Weiterverbreitung mitgelieferter Presets (CC BY-NC-SA 4.0).</rdf:li></rdf:Alt>
   </xmpRights:UsageTerms>
   <exif:UserComment>
    <rdf:Alt><rdf:li xml:lang="x-default">Erstellt mit {config.EXPORT_CREATOR} (Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0) -- Freie Nutzung fuer Unterricht und Lehre.</rdf:li></rdf:Alt>
   </exif:UserComment>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>"""
    meta.add_itxt("XML:com.adobe.xmp", xmp_packet)
    return meta


def pil_to_png_bytes(img) -> bytes:
    buf = io.BytesIO()
    try:
        exif = img.getexif()
        # Standard EXIF Tags
        exif[0x013B] = config.EXPORT_CREATOR  # Artist / Autoren
        exif[0x010E] = f"{config.APP_NAME} Grafik (Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0)"  # ImageDescription
        exif[0x0131] = f"{config.APP_NAME} v{config.APP_VERSION} ({config.SOURCE_CODE_URL})"  # Software / Programm
        exif[0x8298] = f"Erstellt mit {config.EXPORT_CREATOR} (Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0)"  # Copyright

        # Windows XP EXIF Tags (UTF-16LE mit Nullterminator für Windows Explorer Details-Reiter)
        exif[0x9C9B] = f"{config.APP_NAME} Grafik\0".encode("utf-16le")  # XPTitle -> Titel
        exif[0x9C9C] = f"Erstellt mit {config.EXPORT_CREATOR} (Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0). Freie Nutzung fuer Unterricht und Lehre.\0".encode("utf-16le")  # XPComment -> Kommentare
        exif[0x9C9D] = f"{config.EXPORT_CREATOR}\0".encode("utf-16le")  # XPAuthor -> Autoren
        exif[0x9C9E] = f"{config.APP_NAME};LaTeX;TikZ;Unterrichtsmaterial;Mathematik\0".encode("utf-16le")  # XPKeywords -> Tags
        exif[0x9C9F] = f"Unterrichtsmaterialien & Diagramme (CC BY-NC-SA 4.0 / AGPLv3)\0".encode("utf-16le")  # XPSubject -> Betreff

        img.save(buf, format="PNG", pnginfo=get_default_png_metadata(), exif=exif)
    except Exception:
        img.save(buf, format="PNG", pnginfo=get_default_png_metadata())
    return buf.getvalue()



# -----------------------------------
# SVG-Konvertierung (optional)
# -----------------------------------
@lru_cache(maxsize=1)
def is_svg_converter_available() -> bool:
    """Prüft ob dvisvgm auf dem System installiert ist."""
    return shutil.which("dvisvgm") is not None


SVG_METADATA_BLOCK = f"""<!--
==============================================================================
Erstellt mit der {config.EXPORT_CREATOR} ({config.SOURCE_CODE_URL})
Software:        GNU AGPLv3 (AGPL-3.0-or-later)
Vorlagen/Inhalt: Creative Commons BY-NC-SA 4.0
Nutzungsrechte:  Freie Nutzung und Anpassung für Unterricht und Lehre gestattet.
Hinweis:         Kommerzielle Weiterverbreitung mitgelieferter Presets untersagt.
==============================================================================
-->
<title>{config.APP_NAME} Grafik</title>
<desc>Erstellt mit {config.EXPORT_CREATOR} (Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0) -- Freie Nutzung fuer Unterricht und Lehre.</desc>
<metadata id="generator-suite-metadata">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
           xmlns:dc="http://purl.org/dc/elements/1.1/"
           xmlns:cc="http://creativecommons.org/ns#">
    <cc:Work rdf:about="">
      <dc:title>{config.APP_NAME} Grafik</dc:title>
      <dc:creator>{config.EXPORT_CREATOR}</dc:creator>
      <dc:publisher>{config.APP_NAME} v{config.APP_VERSION} ({config.SOURCE_CODE_URL})</dc:publisher>
      <dc:rights>Erstellt mit {config.EXPORT_CREATOR}. Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0</dc:rights>
      <dc:description>Erstellt mit {config.EXPORT_CREATOR} (Code: AGPL-3.0, Presets: CC BY-NC-SA 4.0) -- Freie Nutzung fuer Unterricht und Lehre.</dc:description>
      <dc:subject>
        <rdf:Bag>
          <rdf:li>{config.APP_NAME}</rdf:li>
          <rdf:li>LaTeX</rdf:li>
          <rdf:li>TikZ</rdf:li>
          <rdf:li>AGPLv3</rdf:li>
          <rdf:li>CC-BY-NC-SA-4.0</rdf:li>
          <rdf:li>Unterrichtsmaterial</rdf:li>
        </rdf:Bag>
      </dc:subject>
      <cc:license rdf:resource="https://creativecommons.org/licenses/by-nc-sa/4.0/"/>
    </cc:Work>
  </rdf:RDF>
</metadata>
"""


def __fix_dvisvgm_svg(svg_bytes: bytes) -> bytes:
    import re
    svg_text = svg_bytes.decode('utf-8', errors='replace')
    
    match = re.search(r"viewBox=(['\"])(.*?)\1", svg_text)
    if not match:
        return svg_bytes
        
    parts = match.group(2).split()
    if len(parts) == 4:
        min_x, min_y, w, h = parts
        try:
            min_y_float = float(min_y)
            if min_y_float < 0:
                new_viewbox = f"viewBox={match.group(1)}{min_x} 0 {w} {h}{match.group(1)}"
                svg_text = svg_text.replace(match.group(0), new_viewbox, 1)
                
                offset = -min_y_float
                svg_text = re.sub(
                    r"transform=(['\"])matrix\(1\s+0\s+0\s+-1\s+0\s+0\)\1",
                    rf"transform=\g<1>matrix(1 0 0 -1 0 {offset})\g<1>",
                    svg_text
                )
        except ValueError:
            pass

    # SVG Metadaten nach dem öffnenden <svg ...> Tag einfügen
    if "<svg" in svg_text and "</svg>" in svg_text:
        svg_tag_end = svg_text.find(">")
        if svg_tag_end != -1:
            svg_text = svg_text[:svg_tag_end + 1] + "\n" + SVG_METADATA_BLOCK + svg_text[svg_tag_end + 1:]

    return svg_text.encode('utf-8')

def pdf_to_svg_bytes(pdf_bytes: bytes) -> bytes:
    """
    Konvertiert PDF-Bytes in SVG-Bytes via dvisvgm.
    --no-fonts wandelt Schriften in Pfade → SVG sieht überall gleich aus.
    Korrigiert außerdem den ViewBox-Fehler für breite Kompatibilität.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "input.pdf")
        svg_path = os.path.join(tmpdir, "input.svg")
        pathlib.Path(pdf_path).write_bytes(pdf_bytes)

        subprocess.run(
            ["dvisvgm", "--pdf", "--no-fonts", pdf_path, "-o", svg_path],
            cwd=tmpdir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=True,
        )
        raw_svg = pathlib.Path(svg_path).read_bytes()
        return __fix_dvisvgm_svg(raw_svg)


def pdf_to_all_svg_bytes(pdf_bytes: bytes) -> list[bytes]:
    """
    Konvertiert alle Seiten eines mehrseitigen PDFs in einzelne SVG-Bytes via dvisvgm (-p 1-).
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "input.pdf")
        pathlib.Path(pdf_path).write_bytes(pdf_bytes)

        subprocess.run(
            ["dvisvgm", "--pdf", "--no-fonts", "-p", "1-", "-o", os.path.join(tmpdir, "page-%p.svg"), pdf_path],
            cwd=tmpdir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=True,
        )

        svg_files = sorted(
            [f for f in os.listdir(tmpdir) if f.startswith("page-") and f.endswith(".svg")],
            key=lambda name: int(name.replace("page-", "").replace(".svg", "")) if name.replace("page-", "").replace(".svg", "").isdigit() else 0
        )
        results: list[bytes] = []
        for svg_file in svg_files:
            raw = pathlib.Path(os.path.join(tmpdir, svg_file)).read_bytes()
            results.append(__fix_dvisvgm_svg(raw))
        return results


@lru_cache(maxsize=1)
def is_pdf_separator_available() -> bool:
    """Prüft ob pdfseparate auf dem System installiert ist."""
    return shutil.which("pdfseparate") is not None


def pdf_bytes_to_separated_pdfs(pdf_bytes: bytes) -> list[bytes]:
    """
    Zerlegt ein mehrseitiges PDF in einzelne Einzelseiten-PDF-Bytes.
    Verwendet pdfseparate (aus Poppler / MiKTeX).
    """
    if not is_pdf_separator_available():
        return [pdf_bytes]

    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "input.pdf")
        pathlib.Path(pdf_path).write_bytes(pdf_bytes)

        try:
            subprocess.run(
                ["pdfseparate", pdf_path, os.path.join(tmpdir, "page-%d.pdf")],
                cwd=tmpdir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                check=True,
            )
            pdf_files = sorted(
                [f for f in os.listdir(tmpdir) if f.startswith("page-") and f.endswith(".pdf")],
                key=lambda name: int(name.replace("page-", "").replace(".pdf", "")) if name.replace("page-", "").replace(".pdf", "").isdigit() else 0
            )
            return [pathlib.Path(os.path.join(tmpdir, f)).read_bytes() for f in pdf_files]
        except Exception:
            return [pdf_bytes]

