# SPDX-License-Identifier: AGPL-3.0-or-later

from unittest.mock import MagicMock, patch
import config
from core.latex_render import compile_latex_to_pdf_bytes
from models.glucksrad import GlucksradConfig, ArrowStyle
from generators.glucksrad import generate_glucksrad_latex


def test_latex_render_sets_paranoid_file_io_env():
    """Ensure compile_latex_to_pdf_bytes passes openin_any=p, openout_any=p, and -no-shell-escape."""
    mock_proc = MagicMock()
    mock_proc.returncode = 1
    mock_proc.stdout = b"! Emergency stop."

    with patch("core.latex_render.subprocess.run", return_value=mock_proc) as mock_run:
        compile_latex_to_pdf_bytes(r"\documentclass{article}\begin{document}Hi\end{document}")
        assert mock_run.called
        cmd = mock_run.call_args[0][0]
        env = mock_run.call_args[1]["env"]
        assert "-no-shell-escape" in cmd
        assert env.get("openin_any") == "p"
        assert env.get("openout_any") == "p"
        assert "-recorder" in cmd


def test_latex_render_suppresses_error_log_on_fls_violation(tmp_path, monkeypatch):
    """Ensure enforce mode suppresses TeX error stdout excerpt when .fls records a forbidden file access."""
    monkeypatch.setenv("LATEX_FILE_ACCESS_GUARD", "enforce")
    secret_file = tmp_path / "leaked_secret.txt"

    def _fake_run(cmd, cwd=None, **kwargs):
        if cwd is None:
            return MagicMock(returncode=1, stdout="")
        fls_file = config.pathlib.Path(cwd) / "main.fls"
        fls_file.write_text(
            f"PWD {config.pathlib.Path(cwd).as_posix()}\n"
            f"INPUT {secret_file.as_posix()}\n",
            encoding="utf-8",
        )
        proc = MagicMock()
        proc.returncode = 1
        proc.stdout = b"! Undefined control sequence.\nl.1 SUPER_SECRET_CONTENT_12345\n"
        return proc

    with patch("core.latex_render.subprocess.run", side_effect=_fake_run):
        res = compile_latex_to_pdf_bytes(r"\documentclass{article}\begin{document}Hi\end{document}")
        assert res.ok is False
        assert res.pdf_bytes is None
        assert "SUPER_SECRET_CONTENT_12345" not in res.log
        assert "Sicherheitsrichtlinie" in res.log


def test_font_input_path_does_not_leak_absolute_filesystem_path():
    """Ensure get_font_input_path uses relative TeX inputs without exposing absolute server directories."""
    for family in ("Fira", "Inter", "Plus Jakarta Sans"):
        tex = config.get_font_input_path(family)
        assert tex.startswith(r"\input{")
        assert "\\def\\fontdir" not in tex
        assert config.FONTS_DIR.as_posix() not in tex


def test_glucksrad_image_arrow_generates_relative_graphic_path():
    """Ensure Glucksrad IMAGE arrow mode works without NameError and uses relative filename."""
    cfg = GlucksradConfig(arrow_style=ArrowStyle.IMAGE)
    tex = generate_glucksrad_latex(cfg)
    assert r"\includegraphics" in tex
    assert config.LATEX_FILES_DIR.as_posix() not in tex
