# SPDX-License-Identifier: AGPL-3.0-or-later

import os
import pathlib
from unittest.mock import MagicMock, patch
import pytest

import config
from core import latex_file_guard
from core.latex_file_guard import FlsAccess, find_violations, get_tex_distribution_roots, parse_fls
from core.latex_render import compile_latex_to_pdf_bytes


def test_parse_fls_resolves_relative_paths_against_pwd(tmp_path):
    pwd_dir = tmp_path / "work_sub"
    pwd_dir.mkdir()
    fls_text = (
        f"PWD {pwd_dir.as_posix()}\n"
        "INPUT main.tex\n"
        "INPUT ./sub/helper.tex\n"
        "OUTPUT main.aux\n"
        "OUTPUT main.pdf\n"
    )
    accesses = parse_fls(fls_text, tmp_path)
    assert len(accesses) == 4
    assert accesses[0] == FlsAccess(kind="INPUT", path=(pwd_dir / "main.tex").resolve(strict=False))
    assert accesses[1] == FlsAccess(kind="INPUT", path=(pwd_dir / "sub" / "helper.tex").resolve(strict=False))
    assert accesses[2] == FlsAccess(kind="OUTPUT", path=(pwd_dir / "main.aux").resolve(strict=False))
    assert accesses[3] == FlsAccess(kind="OUTPUT", path=(pwd_dir / "main.pdf").resolve(strict=False))


def test_parse_fls_handles_windows_and_posix_paths(tmp_path):
    spaced_dir = tmp_path / "Dir With Spaces"
    spaced_dir.mkdir()
    win_style = str(spaced_dir / "file one.tex").replace("/", "\\")
    posix_style = (spaced_dir / "file two.tex").as_posix()

    fls_text = (
        f"PWD {tmp_path.as_posix()}\n"
        f"INPUT {win_style}\n"
        f"INPUT {posix_style}\n"
    )
    accesses = parse_fls(fls_text, tmp_path)
    assert len(accesses) == 2
    assert accesses[0].path == (spaced_dir / "file one.tex").resolve(strict=False)
    assert accesses[1].path == (spaced_dir / "file two.tex").resolve(strict=False)


def test_guard_allows_latex_files_custom_latex_fonts_and_tex_roots(tmp_path, monkeypatch):
    fake_tex_root = tmp_path / "fake_texlive"
    fake_tex_root.mkdir()
    monkeypatch.setenv("LATEX_EXTRA_ALLOWED_ROOTS", str(fake_tex_root))

    work_dir = tmp_path / "job"
    work_dir.mkdir()

    accesses = [
        FlsAccess(kind="INPUT", path=(work_dir / "main.tex").resolve(strict=False)),
        FlsAccess(kind="INPUT", path=(config.LATEX_FILES_DIR / "commands-default.tex").resolve(strict=False)),
        FlsAccess(kind="INPUT", path=(config.CUSTOM_LATEX_DIR / "user.sty").resolve(strict=False)),
        FlsAccess(kind="INPUT", path=(config.FONTS_DIR / "FiraSans-Regular.ttf").resolve(strict=False)),
        FlsAccess(kind="INPUT", path=(fake_tex_root / "texmf-dist" / "tex" / "latex" / "article.cls").resolve(strict=False)),
        FlsAccess(kind="OUTPUT", path=(work_dir / "main.pdf").resolve(strict=False)),
        FlsAccess(kind="OUTPUT", path=(work_dir / "main.aux").resolve(strict=False)),
    ]

    violations = find_violations(accesses, work_dir, engine="xelatex")
    assert violations == []


def test_guard_flags_user_home_files(tmp_path):
    work_dir = tmp_path / "job"
    work_dir.mkdir()
    ssh_key = pathlib.Path.home() / ".ssh" / "id_ed25519"
    ai_secrets = config.PROJECT_ROOT / "ai_secrets.json"

    accesses = [
        FlsAccess(kind="INPUT", path=(work_dir / "main.tex").resolve(strict=False)),
        FlsAccess(kind="INPUT", path=ssh_key.resolve(strict=False)),
        FlsAccess(kind="INPUT", path=ai_secrets.resolve(strict=False)),
    ]

    violations = find_violations(accesses, work_dir, engine="xelatex")
    assert len(violations) == 2
    assert violations[0].path.name == "id_ed25519"
    assert violations[1].path.name == "ai_secrets.json"


def test_guard_flags_dotdot_normalization(tmp_path):
    work_dir = tmp_path / "nested" / "job"
    work_dir.mkdir(parents=True)
    secret_outside = tmp_path / "secret.txt"
    secret_outside.write_text("TOP_SECRET", encoding="utf-8")

    fls_text = (
        f"PWD {work_dir.as_posix()}\n"
        "INPUT ../../secret.txt\n"
    )
    accesses = parse_fls(fls_text, work_dir)
    violations = find_violations(accesses, work_dir, engine="xelatex")
    assert len(violations) == 1
    assert violations[0].path == secret_outside.resolve(strict=False)


def test_guard_flags_prefix_lookalike_dirs(tmp_path):
    work_dir = tmp_path / "job"
    work_dir.mkdir()
    lookalike_dir = config.LATEX_FILES_DIR.parent / f"{config.LATEX_FILES_DIR.name}_evil"
    lookalike_file = (lookalike_dir / "x.tex").resolve(strict=False)

    accesses = [FlsAccess(kind="INPUT", path=lookalike_file)]
    violations = find_violations(accesses, work_dir, engine="xelatex")
    assert len(violations) == 1
    assert violations[0].path == lookalike_file


def test_guard_flags_output_outside_tmpdir(tmp_path):
    work_dir = tmp_path / "job"
    work_dir.mkdir()
    outside_out = (config.LATEX_FILES_DIR / "evil_overwrite.tex").resolve(strict=False)

    accesses = [
        FlsAccess(kind="INPUT", path=(work_dir / "main.tex").resolve(strict=False)),
        FlsAccess(kind="OUTPUT", path=outside_out),
    ]
    violations = find_violations(accesses, work_dir, engine="xelatex")
    assert len(violations) == 1
    assert violations[0].kind == "OUTPUT"
    assert violations[0].path == outside_out


def test_guard_modes_off_warn_enforce(tmp_path, monkeypatch, caplog):
    forbidden_target = (tmp_path / "outside_secret.txt").resolve(strict=False)

    def _fake_run(cmd, cwd, **kwargs):
        fls_file = pathlib.Path(cwd) / "main.fls"
        fls_file.write_text(
            f"PWD {pathlib.Path(cwd).as_posix()}\n"
            f"INPUT {forbidden_target.as_posix()}\n"
            "OUTPUT main.pdf\n",
            encoding="utf-8",
        )
        pdf_file = pathlib.Path(cwd) / "main.pdf"
        pdf_file.write_bytes(b"%PDF-1.4 dummy")
        proc = MagicMock()
        proc.returncode = 0
        proc.stdout = b"Output written on main.pdf."
        return proc

    with patch("core.latex_render.subprocess.run", side_effect=_fake_run):
        # 1. off mode -> succeeds without warning
        monkeypatch.setenv("LATEX_FILE_ACCESS_GUARD", "off")
        caplog.clear()
        res_off = compile_latex_to_pdf_bytes(r"\documentclass{article}\begin{document}Hi\end{document}")
        assert res_off.ok is True
        assert res_off.pdf_bytes == b"%PDF-1.4 dummy"

        # 2. warn mode -> succeeds and logs a warning
        monkeypatch.setenv("LATEX_FILE_ACCESS_GUARD", "warn")
        caplog.clear()
        with caplog.at_level("WARNING", logger="generator_suite.latex_render"):
            res_warn = compile_latex_to_pdf_bytes(r"\documentclass{article}\begin{document}Hi\end{document}")
        assert res_warn.ok is True
        assert any("LaTeX file guard (warn)" in rec.message for rec in caplog.records)

        # 3. enforce mode -> fails closed with no PDF bytes
        monkeypatch.setenv("LATEX_FILE_ACCESS_GUARD", "enforce")
        caplog.clear()
        res_enf = compile_latex_to_pdf_bytes(r"\documentclass{article}\begin{document}Hi\end{document}")
        assert res_enf.ok is False
        assert res_enf.pdf_bytes is None
        assert "Sicherheitsrichtlinie" in res_enf.log
        assert "outside_secret.txt" in res_enf.log


def test_roots_detection_survives_missing_tools(monkeypatch):
    get_tex_distribution_roots.cache_clear()
    try:
        monkeypatch.setattr(latex_file_guard.shutil, "which", lambda _name: None)
        roots = get_tex_distribution_roots("xelatex")
        assert isinstance(roots, tuple)
    finally:
        get_tex_distribution_roots.cache_clear()
