# SPDX-License-Identifier: AGPL-3.0-or-later

"""
Zentrale mathematische, Zahlformatierungs- und Farb-Helferfunktionen für LaTeX/TikZ-Generatoren.
"""

from typing import Optional, Tuple


def normalize_hex6(hex_color: str) -> Optional[str]:
    """Normalisiert #RGB/#RRGGBB (mit oder ohne '#') auf 6-stelliges Großbuchstaben-Hex."""
    h = (hex_color or "").strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        return None
    try:
        int(h, 16)
    except ValueError:
        return None
    return h.upper()


def tikz_color_opt(
    color: Optional[str],
    fallback: str = "black",
    prefix_named: str = "",
) -> str:
    """Formatiert eine Farbe (#RGB, #RRGGBB, hexcol=... oder benannt) als sichere TikZ-Option."""
    c = (color or "").strip() or fallback
    if c.startswith("#"):
        h6 = normalize_hex6(c)
        if h6 is not None:
            return f"hexcol={h6}"
        return f"{prefix_named}{fallback}" if prefix_named else fallback
    if c.startswith("hexcol="):
        h6 = normalize_hex6(c[7:])
        return f"hexcol={h6}" if h6 is not None else c
    return f"{prefix_named}{c}" if prefix_named else c


def hex_to_rgb01(
    hex_color: str,
    fallback: Tuple[float, float, float] = (1.0, 1.0, 1.0),
) -> Tuple[float, float, float]:
    """Konvertiert #RRGGBB oder #RGB in (r, g, b) im Bereich [0.0, 1.0]."""
    h = (hex_color or "").lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        return fallback
    try:
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    except (ValueError, IndexError):
        return fallback
    return r / 255.0, g / 255.0, b / 255.0


def hex_to_rgb_csv(
    hex_color: str,
    precision: int = 3,
    fallback: str = "0,0,0",
) -> str:
    """Konvertiert #RRGGBB in einen TikZ-RGB-String 'r,g,b' mit fester Nachkommastellenzahl."""
    h = (hex_color or "").lstrip("#")
    if len(h) != 6:
        return fallback
    try:
        r = int(h[0:2], 16) / 255.0
        g = int(h[2:4], 16) / 255.0
        b = int(h[4:6], 16) / 255.0
    except ValueError:
        return fallback
    return f"{r:.{precision}f},{g:.{precision}f},{b:.{precision}f}"


def tikz_color_def(name: str, hex_color: str, precision: int = 4) -> str:
    """Erzeugt eine LaTeX \\definecolor{name}{rgb}{...} Definition."""
    r, g, b = hex_to_rgb01(hex_color)
    return rf"\definecolor{{{name}}}{{rgb}}{{{r:.{precision}f},{g:.{precision}f},{b:.{precision}f}}}"


def fmt_float(v: float, max_decimals: int = 4) -> str:
    """Formatiert Float mit max. `max_decimals` Nachkommastellen ohne trailing zeros."""
    s = f"{v:.{max_decimals}f}".rstrip("0").rstrip(".")
    return s if (s and s != "-0") else "0"
