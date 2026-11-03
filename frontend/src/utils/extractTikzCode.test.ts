// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect } from 'vitest'
import { extractTikzCode } from './extractTikzCode.ts'

describe('extractTikzCode', () => {
  it('extrahiert \\begin{tikzpicture} ... \\end{tikzpicture} aus rohem TeX-Code', () => {
    const rawLatex = [
      '\\documentclass{article}',
      '\\usepackage{tikz}',
      '\\begin{document}',
      '\\begin{tikzpicture}[scale=1]',
      '  \\draw (0,0) -- (2,2);',
      '\\end{tikzpicture}',
      '\\end{document}',
    ].join('\n')

    const expected = [
      '\\begin{tikzpicture}[scale=1]',
      '  \\draw (0,0) -- (2,2);',
      '\\end{tikzpicture}',
    ].join('\n')

    expect(extractTikzCode(rawLatex)).toBe(expected)
  })

  it('extrahiert circuitikz-Umgebungen ebenso zuverlässig', () => {
    const rawLatex = [
      '\\documentclass{standalone}',
      '\\usepackage{circuitikz}',
      '\\begin{document}',
      '\\begin{circuitikz}',
      '  \\draw (0,0) to[R] (2,0);',
      '\\end{circuitikz}',
      '\\end{document}',
    ].join('\n')

    const expected = [
      '\\begin{circuitikz}',
      '  \\draw (0,0) to[R] (2,0);',
      '\\end{circuitikz}',
    ].join('\n')

    expect(extractTikzCode(rawLatex)).toBe(expected)
  })

  it('extrahiert Farbdefinitionen (\\definecolor, \\colorlet) vor der TikZ-Umgebung', () => {
    const rawLatex = [
      '\\documentclass{article}',
      '\\usepackage{xcolor}',
      '\\definecolor{mygreen}{RGB}{0,150,0}',
      '\\colorlet{accent}{mygreen!50}',
      '\\begin{document}',
      '\\begin{tikzpicture}',
      '  \\fill[mygreen] (0,0) circle (1);',
      '\\end{tikzpicture}',
      '\\end{document}',
    ].join('\n')

    const result = extractTikzCode(rawLatex)
    expect(result).not.toBeNull()
    expect(result).toContain('\\definecolor{mygreen}{RGB}{0,150,0}')
    expect(result).toContain('\\colorlet{accent}{mygreen!50}')
    expect(result).toContain('\\begin{tikzpicture}')
  })

  it('verbindet mehrere TikZ-Umgebungen mit doppelten Zeilenumbrüchen', () => {
    const rawLatex = [
      '\\documentclass{article}',
      '\\begin{document}',
      '\\begin{tikzpicture}',
      '  \\draw (0,0) -- (1,1);',
      '\\end{tikzpicture}',
      'Text dazwischen',
      '\\begin{tikzpicture}',
      '  \\draw (2,2) -- (3,3);',
      '\\end{tikzpicture}',
      '\\end{document}',
    ].join('\n')

    const result = extractTikzCode(rawLatex)
    expect(result).toBe(
      '\\begin{tikzpicture}\n  \\draw (0,0) -- (1,1);\n\\end{tikzpicture}\n\n\\begin{tikzpicture}\n  \\draw (2,2) -- (3,3);\n\\end{tikzpicture}'
    )
  })

  describe('Robustes Verhalten bei Dokumenten ohne TikZ-Umgebung (Fallback/Nullwert)', () => {
    it('gibt null zurück bei leerem String', () => {
      expect(extractTikzCode('')).toBeNull()
    })

    it('gibt null zurück bei Dokumenten ohne TikZ- oder CircuiTikZ-Umgebung', () => {
      const plainLatex = [
        '\\documentclass{article}',
        '\\begin{document}',
        'Dies ist ein gewöhnliches Dokument ohne TikZ.',
        '\\end{document}',
      ].join('\n')

      expect(extractTikzCode(plainLatex)).toBeNull()
    })

    it('gibt null zurück bei unvollständigen Tags', () => {
      const incomplete = '\\begin{tikzpicture} ohne schließendes tag'
      expect(extractTikzCode(incomplete)).toBeNull()
    })
  })
})
