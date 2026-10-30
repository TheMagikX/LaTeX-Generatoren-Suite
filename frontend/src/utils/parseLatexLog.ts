// SPDX-License-Identifier: AGPL-3.0-or-later

export interface ErrorAnnotation {
  line: number   // 1-indexed line in the user's code editor
  message: string
}

/**
 * Return the 1-indexed line number of the first \begin{document} in latexCode.
 * Returns 0 when not found.
 */
export function findBeginDocumentLine(latexCode: string): number {
  const lines = latexCode.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('\\begin{document}')) return i + 1
  }
  return 0
}

/**
 * Parse a LaTeX compile log and return per-line error annotations
 * adjusted to the user's editor coordinate space.
 *
 * @param log          Raw LaTeX compiler log from the backend.
 * @param latexCode    Full generated .tex source (used to compute the preamble offset).
 * @param extraOffset  Additional lines to subtract after \begin{document}.
 *                     Use 0 for LatexImage (code follows directly after \begin{document}),
 *                     use 1 for TikZ (there is an extra \begin{tikzpicture} line).
 */
export function parseLatexLog(
  log: string,
  latexCode?: string,
  extraOffset = 0,
): ErrorAnnotation[] {
  if (!log) return []

  const preambleLines = latexCode ? findBeginDocumentLine(latexCode) : 0
  const offset = preambleLines + extraOffset

  const errors: ErrorAnnotation[] = []
  const logLines = log.split('\n')
  const seen = new Set<number>()

  for (let i = 0; i < logLines.length; i++) {
    const raw = logLines[i]

    // LaTeX prints "l.<N> <offending token>" for every error location.
    const m = raw.match(/^l\.(\d+)[\s\\]/)
    if (!m) continue

    const docLine = parseInt(m[1], 10)
    const editorLine = docLine - offset

    if (editorLine < 1 || seen.has(editorLine)) continue
    seen.add(editorLine)

    // Walk backwards to find the "! <message>" line for this error.
    let message = 'LaTeX Fehler'
    for (let j = i - 1; j >= 0 && j >= i - 6; j--) {
      if (logLines[j].startsWith('!')) {
        message = logLines[j].replace(/^!\s*/, '').trim()
        break
      }
    }

    errors.push({ line: editorLine, message })
  }

  return errors
}
