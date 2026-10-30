# SPDX-License-Identifier: AGPL-3.0-or-later

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from core.latex_render import (
    compile_latex_to_pdf_bytes,
    pdf_bytes_to_first_image,
    pdf_bytes_to_all_images,
    pil_to_png_bytes,
    pdf_to_svg_bytes,
    pdf_to_all_svg_bytes,
    pdf_bytes_to_separated_pdfs,
    is_svg_converter_available,
)
import logging
import time
import base64
from typing import List

logger = logging.getLogger("generator_suite.compile")
router = APIRouter(prefix="/compile", tags=["Compilation"])

VALID_ENGINES = {"xelatex", "pdflatex"}

class CompileRequest(BaseModel):
    latex: str = Field(..., min_length=1, max_length=500_000)
    dpi: int = Field(default=600, ge=72, le=1200)
    all_pages: bool = False
    engine: str = "xelatex"

class CompileResponse(BaseModel):
    ok: bool
    log: str = ""
    engine: str = "xelatex"
    png_base64: str = ""
    svg_base64: str = ""
    pdf_base64: str = ""
    pages_png_base64: List[str] = []
    pages_svg_base64: List[str] = []
    pages_pdf_base64: List[str] = []
    compile_time: float = 0.0
    convert_time: float = 0.0
    total_backend_time: float = 0.0
    latex_size_bytes: int = 0
    pdf_size_bytes: int = 0
    png_size_bytes: int = 0

@router.post("/", response_model=CompileResponse)
def compile_latex(req: CompileRequest):
    engine = req.engine.lower().strip()
    if engine not in VALID_ENGINES:
        raise HTTPException(
            status_code=400,
            detail=f"Ungültige LaTeX-Engine: '{req.engine}'. Erlaubt sind: {', '.join(sorted(VALID_ENGINES))}",
        )

    t_start = time.perf_counter()
    latex_bytes_len = len(req.latex.encode("utf-8"))
    res = compile_latex_to_pdf_bytes(req.latex, engine=engine)
    if not res.ok:
        total_time = time.perf_counter() - t_start
        return CompileResponse(
            ok=False,
            log=res.log,
            engine=engine,
            compile_time=res.compile_time_s or 0.0,
            total_backend_time=total_time,
            latex_size_bytes=latex_bytes_len,
        )

    try:
        pdf_len = len(res.pdf_bytes) if res.pdf_bytes else 0
        pdf_b64 = base64.b64encode(res.pdf_bytes).decode("utf-8") if res.pdf_bytes else ""

        pages_b64: List[str] = []
        pages_svg_b64: List[str] = []
        pages_pdf_b64: List[str] = []
        png_len = 0
        svg_b64 = ""

        if req.all_pages and res.pdf_bytes:
            images, convert_time = pdf_bytes_to_all_images(res.pdf_bytes, dpi=req.dpi)
            for img in images:
                p_bytes = pil_to_png_bytes(img)
                png_len += len(p_bytes)
                pages_b64.append(base64.b64encode(p_bytes).decode("utf-8"))
            png_b64 = pages_b64[0] if pages_b64 else ""

            if is_svg_converter_available():
                try:
                    svg_list = pdf_to_all_svg_bytes(res.pdf_bytes)
                    pages_svg_b64 = [base64.b64encode(s).decode("utf-8") for s in svg_list]
                except Exception:
                    pass
            svg_b64 = pages_svg_b64[0] if pages_svg_b64 else ""

            try:
                separated_pdfs = pdf_bytes_to_separated_pdfs(res.pdf_bytes)
                pages_pdf_b64 = [base64.b64encode(p).decode("utf-8") for p in separated_pdfs]
            except Exception:
                pages_pdf_b64 = [pdf_b64] if pdf_b64 else []
        else:
            img, convert_time = pdf_bytes_to_first_image(res.pdf_bytes, dpi=req.dpi)
            png_bytes = pil_to_png_bytes(img)
            png_len = len(png_bytes)
            png_b64 = base64.b64encode(png_bytes).decode("utf-8")

            if is_svg_converter_available() and res.pdf_bytes:
                try:
                    svg_bytes = pdf_to_svg_bytes(res.pdf_bytes)
                    svg_b64 = base64.b64encode(svg_bytes).decode("utf-8")
                except Exception:
                    pass

        total_time = time.perf_counter() - t_start

        return CompileResponse(
            ok=True,
            engine=engine,
            png_base64=png_b64,
            svg_base64=svg_b64,
            pdf_base64=pdf_b64,
            pages_png_base64=pages_b64,
            pages_svg_base64=pages_svg_b64,
            pages_pdf_base64=pages_pdf_b64,
            compile_time=res.compile_time_s or 0.0,
            convert_time=convert_time,
            total_backend_time=total_time,
            latex_size_bytes=latex_bytes_len,
            pdf_size_bytes=pdf_len,
            png_size_bytes=png_len,
        )
    except Exception:
        logger.exception("Image/SVG conversion failed during LaTeX compilation")
        raise HTTPException(status_code=500, detail="Die Bildkonvertierung ist fehlgeschlagen.")
