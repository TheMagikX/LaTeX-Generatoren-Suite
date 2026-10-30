# SPDX-License-Identifier: AGPL-3.0-or-later

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from main import app
import api.settings as settings_api
from core.ai import service as ai_service

client = TestClient(app, base_url="http://localhost")


def test_compile_rejects_excessive_or_invalid_dpi():
    """Ensure CompileRequest enforces 72 <= dpi <= 1200 to prevent OOM DoS."""
    res_high = client.post("/api/compile/", json={"latex": r"\documentclass{article}\begin{document}Hi\end{document}", "dpi": 50000})
    assert res_high.status_code == 422

    res_low = client.post("/api/compile/", json={"latex": r"\documentclass{article}\begin{document}Hi\end{document}", "dpi": 10})
    assert res_low.status_code == 422


def test_compile_rejects_oversized_latex_payload():
    """Ensure CompileRequest enforces max_length=500_000 on latex."""
    huge_latex = "a" * 500_001
    res = client.post("/api/compile/", json={"latex": huge_latex, "dpi": 300})
    assert res.status_code == 422


def test_browse_dialog_ignores_arbitrary_title_and_enforces_lock():
    """Ensure /api/settings/latex/browse uses a fixed title and blocks concurrent requests via asyncio.Lock."""
    with patch("api.settings._open_native_dialog", return_value="C:/fakepath/commands.tex") as mock_dlg:
        res = client.post("/api/settings/latex/browse", json={"title": "SPOOFED SYSTEM ALERT"})
        assert res.status_code == 200
        mock_dlg.assert_called_once_with("LaTeX-Datei auswählen")

    async def _hold_lock_and_test():
        async with settings_api._BROWSE_DIALOG_LOCK:
            res_locked = client.post("/api/settings/latex/browse", json={})
            assert res_locked.status_code == 409

    asyncio.run(_hold_lock_and_test())


def test_stop_ollama_uses_exact_pkill_match():
    """Ensure stop_ollama_service uses pkill -x ollama instead of pkill -f ollama on POSIX systems."""
    mock_proc = MagicMock(returncode=0)
    with (
        patch.object(ai_service, "check_ollama_status", new_callable=AsyncMock, return_value={"available": False, "models": []}),
        patch("sys.platform", "linux"),
        patch("subprocess.run", return_value=mock_proc) as mock_run,
    ):
        res = asyncio.run(ai_service.stop_ollama_service(mode="stop_server"))
        assert res["ok"] is True
        mock_run.assert_called_once_with(["pkill", "-x", "ollama"], capture_output=True, text=True)


def test_stop_ollama_endpoint_requires_explicit_body():
    """Ensure POST /api/ai/stop without a JSON body returns 422 instead of defaulting to stop_server."""
    res = client.post("/api/ai/stop")
    assert res.status_code == 422


def test_extract_latex_stdout_excerpt_masks_host_and_tmp_paths(tmp_path):
    """Ensure extract_latex_stdout_excerpt sanitizes project, latex_files, custom_latex, home, and tmpdir paths."""
    import config
    from core.latex_render import extract_latex_stdout_excerpt

    fake_log = (
        f"! LaTeX Error: File not found in {str(config.PROJECT_ROOT)} or {str(tmp_path)}.\n"
        f"({config.LATEX_FILES_DIR.as_posix()}/Pakete-default.tex)\n"
        f"l.12 \\input{{{tmp_path.as_posix()}/main.tex}}\n"
        f"(c:/users/someuser/AppData/Local/Temp/foo.tex)\n"
        f"(C:\\Users\\TESTUS~1\\Documents\\secret.tex)"
    )
    excerpt = extract_latex_stdout_excerpt(fake_log, max_lines=20, tmpdir=str(tmp_path))

    assert "<latex_files>/Pakete-default.tex" in excerpt
    assert "<project>" in excerpt
    assert "<tmp>" in excerpt
    assert "<user_home>/AppData/Local/Temp/foo.tex" in excerpt
    assert "<user_home>\\Documents\\secret.tex" in excerpt
    assert "someuser" not in excerpt
    assert "TESTUS~1" not in excerpt
    assert str(config.PROJECT_ROOT) not in excerpt
    assert config.PROJECT_ROOT.as_posix() not in excerpt
    assert str(tmp_path) not in excerpt
    assert tmp_path.as_posix() not in excerpt


def test_latex_source_security_blocks_traversal_and_io_primitives():
    """Ensure validate_latex_source_security and compile_latex_to_pdf_bytes block path traversal and TeX file I/O primitives."""
    from core.latex_render import validate_latex_source_security, compile_latex_to_pdf_bytes
    from models.koordinatensystem import CoordinateSystemConfig, CSVPlotConfig
    from generators.koordinatensystem import generate_koordinatensystem_latex

    # Blocked inputs
    assert validate_latex_source_security(r"\verbatiminput{../../ai_secrets.json}") is not None
    assert validate_latex_source_security(r"\input{C:/Users/admin/secrets.tex}") is not None
    assert validate_latex_source_security(r"\input{/etc/passwd}") is not None
    assert validate_latex_source_security(r"\input ../../ai_secrets.json") is not None
    assert validate_latex_source_security(r"\input /etc/passwd") is not None
    assert validate_latex_source_security(r"\newread\myread \openin\myread=ai_secrets.json") is not None
    assert validate_latex_source_security(r"\immediate\write18{whoami}") is not None
    assert validate_latex_source_security(r"\directlua{os.execute('whoami')}") is not None
    assert validate_latex_source_security(r"\latelua{io.open('ai_secrets.json')}") is not None
    assert validate_latex_source_security(r"\csname openin\endcsname") is not None
    assert validate_latex_source_security(r"\catcode`\@=11") is not None
    assert validate_latex_source_security(r"\^^6fpenin") is not None
    assert validate_latex_source_security(r"\open^^69n") is not None
    assert validate_latex_source_security(r"\addplot table {../../ai_secrets.json};") is not None

    # Allowed normal inputs
    assert validate_latex_source_security(r"\input{commands-default.tex}") is None
    assert validate_latex_source_security(r"\newunicodechar{^^a0}{~}") is None
    assert validate_latex_source_security(r"\includegraphics[width=3cm]{GlücksradPfeilGeradeNeuTransp.png}") is None
    assert validate_latex_source_security(r"% \openin in a comment is ignored") is None

    # Pre-compilation guard returns ok=False without invoking subprocess
    res = compile_latex_to_pdf_bytes(r"\documentclass{article}\begin{document}\input{../../ai_secrets.json}\end{document}")
    assert res.ok is False
    assert "Sicherheitsrichtlinie" in res.log

    # CSVPlotConfig path validation in Koordinatensystem
    cfg = CoordinateSystemConfig(
        csv_plots=[
            CSVPlotConfig(show=True, path="../../ai_secrets.json", xcol="x", ycol="y"),
            CSVPlotConfig(show=True, path="data/messwerte.csv", xcol="t", ycol="s"),
        ]
    )
    rendered = generate_koordinatensystem_latex(cfg)
    assert "ai_secrets.json" not in rendered
    assert "data/messwerte.csv" in rendered


def test_api_docs_disabled_by_default():
    """Ensure Swagger /docs, /redoc, and /openapi.json are disabled by default."""
    assert app.docs_url is None
    assert app.redoc_url is None
    assert app.openapi_url is None

    res_openapi = client.get("/openapi.json")
    # Either 404 or SPA index.html fallback, never a JSON OpenAPI schema
    assert "openapi" not in res_openapi.headers.get("content-type", "")
    if res_openapi.headers.get("content-type", "").startswith("application/json"):
        assert "paths" not in res_openapi.json()


def test_export_metadata_uses_neutral_creator_instead_of_app_author():
    """Ensure exported LaTeX, PDF, PNG, and SVG metadata use config.EXPORT_CREATOR ('Generatoren-Suite') instead of config.APP_AUTHOR ('C. Meyer')."""
    import config
    from PIL import Image
    from core.latex_document import COPYRIGHT_COMMENT, HYPERSETUP_BASIC, HYPERSETUP_METADATA
    from core.latex_render import SVG_METADATA_BLOCK, pil_to_png_bytes
    from models.arbeitsblatt import ArbeitsblattConfig
    from generators.arbeitsblatt import generate_arbeitsblatt_latex

    assert config.APP_AUTHOR == "C. Meyer"
    assert config.EXPORT_CREATOR == "Generatoren-Suite"

    for block in (COPYRIGHT_COMMENT, HYPERSETUP_BASIC, HYPERSETUP_METADATA, SVG_METADATA_BLOCK):
        assert config.EXPORT_CREATOR in block
        assert config.APP_AUTHOR not in block

    ab_latex = generate_arbeitsblatt_latex(
        ArbeitsblattConfig(template_text="Aufgabe 1", python_code=""),
        show_solution=False,
        python_vars={},
    )
    assert config.EXPORT_CREATOR in ab_latex
    assert config.SOURCE_CODE_URL in ab_latex
    assert config.APP_AUTHOR not in ab_latex

    for tex_file in config.LATEX_FILES_DIR.glob("*-default.tex"):
        content = tex_file.read_text(encoding="utf-8")
        assert config.APP_AUTHOR not in content

    img = Image.new("RGB", (10, 10), color="white")
    png_bytes = pil_to_png_bytes(img)
    assert config.EXPORT_CREATOR.encode("utf-8") in png_bytes
    assert config.APP_AUTHOR.encode("utf-8") not in png_bytes
    assert config.APP_AUTHOR.encode("utf-16le") not in png_bytes


def test_compile_rejects_lualatex_engine():
    """Ensure POST /api/compile/ rejects lualatex engine with HTTP 400."""
    res = client.post(
        "/api/compile/",
        json={"latex": r"\documentclass{article}\begin{document}Hi\end{document}", "engine": "lualatex"},
    )
    assert res.status_code == 400
    assert "lualatex" in res.json()["detail"].lower()


def test_upload_and_browse_latex_reject_unsafe_tex_files(tmp_path):
    """Ensure /api/settings/latex/upload and /api/settings/latex/browse validate file content against validate_latex_source_security."""
    malicious_tex = b"\\newcommand{\\evil}{\\input ../../ai_secrets.json}\n"
    res_upload = client.post(
        "/api/settings/latex/upload",
        files={"file": ("evil.tex", malicious_tex, "text/plain")},
        data={"category": "commands"},
    )
    assert res_upload.status_code == 400
    assert "Sicherheitsrichtlinie" in res_upload.json()["detail"]

    evil_file = tmp_path / "evil_browse.tex"
    evil_file.write_text(r"\directlua{os.execute('whoami')}", encoding="utf-8")
    with (
        patch("sys.platform", "win32"),
        patch.dict("os.environ", {"IS_DOCKER": ""}, clear=False),
        patch("api.settings._open_native_dialog", return_value=evil_file.as_posix()),
    ):
        res_browse = client.post("/api/settings/latex/browse", json={})
        assert res_browse.status_code == 400
        assert "Sicherheitsrichtlinie" in res_browse.json()["detail"]


def test_save_secrets_enforces_owner_only_permissions(tmp_path):
    """Ensure save_secrets sets 0o600 permissions on ai_secrets.json."""
    from core.ai import gemini_service

    fake_secrets = tmp_path / "ai_secrets.json"
    with (
        patch.object(gemini_service, "get_secrets_file", return_value=fake_secrets),
        patch("os.chmod") as mock_chmod,
    ):
        gemini_service.save_secrets({"gemini_api_key": "mock-gemini-test-key"})
        assert fake_secrets.exists()
        mock_chmod.assert_called_once_with(fake_secrets, 0o600)


@pytest.mark.compile
def test_fls_recorder_guard_blocks_canary_file_compile(tmp_path, monkeypatch):
    """
    Stage 2 (compile) test for the post-compilation .fls recorder guard in isolation:
    Even if the pre-compilation regex filter is bypassed, the .fls guard blocks reading
    a canary file outside allowed roots and suppresses any leaked content from the log.
    """
    import uuid
    import core.latex_render as lr

    canary_token = f"CANARY-{uuid.uuid4()}"
    canary_file = tmp_path / "canary_secret.tex"
    canary_file.write_text(f"\\textbf{{{canary_token}}}\n\\BoomUndefinedCommand\n", encoding="utf-8")

    monkeypatch.setenv("LATEX_FILE_ACCESS_GUARD", "enforce")
    monkeypatch.setattr(lr, "validate_latex_source_security", lambda _src: None)

    exploit_tex = (
        "\\documentclass{article}\n"
        "\\begin{document}\n"
        f"\\def\\p{{{canary_file.as_posix()}}}\n"
        "\\expandafter\\input\\expandafter{\\p}\n"
        "\\end{document}\n"
    )
    res = lr.compile_latex_to_pdf_bytes(exploit_tex, engine="xelatex")
    assert res.ok is False
    assert res.pdf_bytes is None
    assert canary_token not in res.log
    assert "Sicherheitsrichtlinie" in res.log

    # Positive control: standard allowed input compiles cleanly under enforce
    control_tex = (
        "\\documentclass{article}\n"
        "\\input{commands-default.tex}\n"
        "\\begin{document}\n"
        "Hallo Welt\n"
        "\\end{document}\n"
    )
    res_ok = lr.compile_latex_to_pdf_bytes(control_tex, engine="xelatex")
    assert res_ok.ok is True
    assert res_ok.pdf_bytes is not None


@pytest.mark.parametrize(
    "payload",
    [
        # Macro indirection & non-canonical inclusion forms (HIGH-1)
        r"\let\i\input \i{../../ai_secrets.json}",
        r"\def\p{../../ai_secrets.json}\expandafter\input\expandafter{\p}",
        r"\def\x{\input}\x{../../ai_secrets.json}",
        r"\input{{}/etc/passwd}",
        r"\input{\mysecret}",
        r"\@@input{../../ai_secrets.json}",
        r"\InputIfFileExists{../../ai_secrets.json}{}{}",
        r"\IfFileExists{../../ai_secrets.json}{}{}",
        r"\makeatletter\def\input@path{{../../}}\makeatother\input{ai_secrets.json}",
        r"\scantokens{\input{../../ai_secrets.json}}",
        r"\everyeof{\input{../../ai_secrets.json}}",
        # Engine file-read/write primitives (RT-01)
        r"\pdffiledump offset 0 length 128 {../../ai_secrets.json}",
        r"\pdfmdfivesum file {../../ai_secrets.json}",
        r'\XeTeXpdffile "../../secret.pdf"',
        r'\XeTeXpicfile "C:/Windows/win.ini"',
        r"\newwrite\out\write\out{x}",
        r"\write\myout{deferred_write}",
        # Package inclusions (RT-01)
        r"\includesvg{../../secret.svg}",
        r"\svginput{../../secret.svg}",
        r"\includepdf{C:/secret.pdf}",
        r"\addplot file {../secret.dat};",
        r"\addplot table {\macropath};",
    ],
)
def test_latex_source_security_blocks_macro_bypasses_and_engine_primitives(payload):
    """Ensure Phase 2 regex hardening blocks all macro-indirection and engine-primitive bypasses."""
    from core.latex_render import validate_latex_source_security

    err = validate_latex_source_security(payload)
    assert err is not None, f"Expected payload to be blocked: {payload}"
    assert "Sicherheitsrichtlinie" in err


@pytest.mark.parametrize(
    "valid_snippet",
    [
        r"\input{commands-default.tex}",
        r"\input FiraFont.tex",
        r"\includegraphics[width=3cm]{GlücksradPfeilGeradeNeuTransp.png}",
        r"\addplot table[x=x,y=y] {werte.csv};",
        r"\newunicodechar{^^a0}{~}",
    ],
)
def test_latex_source_security_allows_canonical_inclusions(valid_snippet):
    """Ensure canonical literal inclusions and safe constructs pass validation."""
    from core.latex_render import validate_latex_source_security

    assert validate_latex_source_security(valid_snippet) is None


def test_all_default_latex_files_pass_source_security():
    """Golden-Master check: every backend/latex_files/*.tex file must pass validate_latex_source_security."""
    import config
    from core.latex_render import validate_latex_source_security

    tex_files = list(config.LATEX_FILES_DIR.glob("*.tex"))
    assert len(tex_files) > 0
    for tex_file in tex_files:
        content = tex_file.read_text(encoding="utf-8")
        err = validate_latex_source_security(content)
        assert err is None, f"{tex_file.name} failed security check: {err}"


