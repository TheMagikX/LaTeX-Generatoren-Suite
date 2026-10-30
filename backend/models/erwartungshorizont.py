# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field

DEFAULT_ERWARTUNGSHORIZONT_CODE = r"""% Jede Teilaufgabe wird in eine \begin{subtask} ... \end{subtask} Umgebung gefasst.
% Diese werden automatisch als getrennte, passgenaue Bilder & PDFs exportiert.

\begin{subtask}
\textbf{a)} Erste Ableitung und Nullstellen bestimmen:
\begin{align*}
f(x) &= x^3 - 3x^2 + 4 \\
f'(x) &= 3x^2 - 6x = 3x(x - 2)
\end{align*}
Notwendige Bedingung für Extremstellen: $f'(x_E) = 0 \implies x_1 = 0, \; x_2 = 2$ \hfill [3 BE]
\end{subtask}

\begin{subtask}
\textbf{b)} Art der Extrema mit hinreichender Bedingung:
\[
f''(x) = 6x - 6
\]
\begin{itemize}
    \item $f''(0) = -6 < 0 \implies \text{Hochpunkt bei } H(0 \mid 4)$
    \item $f''(2) = 6 > 0 \implies \text{Tiefpunkt bei } T(2 \mid 0)$
\end{itemize} \hfill [3 BE]
\end{subtask}

\begin{subtask}
\textbf{c)} Bestimmtes Integral der Fläche im Intervall $[0; 2]$:
\[
A = \int_{0}^{2} f(x) \, dx = \left[ \frac{1}{4}x^4 - x^3 + 4x \right]_{0}^{2} = (4 - 8 + 8) - 0 = 4 \, \text{FE}
\] \hfill [4 BE]
\end{subtask}
"""

class ErwartungshorizontConfig(BaseModel):
    code: str = Field(default=DEFAULT_ERWARTUNGSHORIZONT_CODE, description="LaTeX-Code mit subtask-Umgebungen")
    spacing: str = Field(default="onehalfspacing", description="Spacing option (e.g. onehalfspacing)")
    latex_width: float = Field(default=15.0, ge=4.0, le=30.0, description="Breite der Ausgabe in cm")
    feste_breite: bool = Field(default=True, description="Ob alle Teilaufgaben exakt die gleiche feste Breite haben sollen (minipage statt varwidth)")
    pakete_laden: bool = Field(default=True, description="Ob Standard-Pakete geladen werden sollen")
    command_laden: bool = Field(default=True, description="Ob Standard-Commands geladen werden sollen")
    font_family: str = Field(default="Fira", description="Schriftart (Fira, Inter, Plus Jakarta)")
