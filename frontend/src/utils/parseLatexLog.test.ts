// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect } from 'vitest'
import { parseLatexLog, findBeginDocumentLine } from './parseLatexLog.ts'

describe('parseLatexLog', () => {
  describe('findBeginDocumentLine', () => {
    it('findet die 1-basierte Zeilennummer von \\begin{document}', () => {
      const latex = [
        '\\documentclass{article}',
        '\\usepackage{tikz}',
        '\\begin{document}',
        'Hello World',
        '\\end{document}',
      ].join('\n')

      expect(findBeginDocumentLine(latex)).toBe(3)
    })

    it('gibt 0 zurück, wenn \\begin{document} nicht vorhanden ist', () => {
      const latex = '\\draw (0,0) -- (1,1);'
      expect(findBeginDocumentLine(latex)).toBe(0)
    })

    it('ignoriert auskommentierte Zeilen wie % \\begin{document} beim Auffinden relevanter Dokumentzeilen', () => {
      const latex = [
        '\\documentclass{article}',
        '% Beispiel: \\begin{document}',
        '\\usepackage{amsmath}',
        '\\begin{document}',
        'Inhalt',
        '\\end{document}',
      ].join('\n')

      expect(findBeginDocumentLine(latex)).toBe(4)
    })

    it('ignoriert Inline-Kommentare mit % \\begin{document} und erkennt Kommentare nach \\begin{document}', () => {
      const latex = [
        '\\documentclass{article}',
        '\\usepackage{tikz} % hier noch kein \\begin{document}',
        '\\begin{document} % Dokument startet hier',
        'Inhalt',
        '\\end{document}',
      ].join('\n')

      expect(findBeginDocumentLine(latex)).toBe(3)
    })
  })

  describe('parseLatexLog Fehlerextraktion und Zeilenberechnung', () => {
    it('gibt ein leeres Array zurück bei leerem Log', () => {
      expect(parseLatexLog('')).toEqual([])
    })

    it('erkennt typische TeX-Fehlermeldungen wie "! LaTeX Error:..."', () => {
      const log = [
        '! LaTeX Error: Environment nonexistent undefined.',
        '',
        'See the LaTeX manual or LaTeX Companion for explanation.',
        'Type  H <return>  for immediate help.',
        ' ...',
        '',
        'l.12 \\begin{nonexistent}',
        '                        ',
      ].join('\n')

      const errors = parseLatexLog(log)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toEqual({
        line: 12,
        message: 'LaTeX Error: Environment nonexistent undefined.',
      })
    })

    it('erkennt TeX-Fehler mit "! Undefined control sequence."', () => {
      const log = [
        '! Undefined control sequence.',
        'l.8 \\unknowncommand',
      ].join('\n')

      const errors = parseLatexLog(log)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toEqual({
        line: 8,
        message: 'Undefined control sequence.',
      })
    })

    it('berechnet die korrekte Zeilennummer für den Code-Editor unter Berücksichtigung des Preambel-Offsets', () => {
      const latexCode = [
        '\\documentclass{article}',
        '\\usepackage{tikz}',
        '\\begin{document}', // Zeile 3
        '\\node at (0,0) {Test};', // Zeile 4 im Dokument = Zeile 1 im Editor
        '\\badcmd', // Zeile 5 im Dokument = Zeile 2 im Editor
        '\\end{document}',
      ].join('\n')

      const log = [
        '! Undefined control sequence.',
        'l.5 \\badcmd',
      ].join('\n')

      // preambleLines = 3, extraOffset = 0 -> editorLine = 5 - 3 = 2
      const errors = parseLatexLog(log, latexCode, 0)
      expect(errors).toHaveLength(1)
      expect(errors[0].line).toBe(2)
      expect(errors[0].message).toBe('Undefined control sequence.')
    })

    it('berücksichtigt extraOffset (z.B. für TikZ-Umgebungen)', () => {
      const latexCode = [
        '\\documentclass{standalone}',
        '\\usepackage{tikz}',
        '\\begin{document}', // Zeile 3
        '\\begin{tikzpicture}', // Zeile 4 (extraOffset = 1)
        '\\draw (0,0) -- (1,1);', // Zeile 5 = Zeile 1 im Editor
        '\\errornode', // Zeile 6 = Zeile 2 im Editor
        '\\end{tikzpicture}',
        '\\end{document}',
      ].join('\n')

      const log = [
        '! Undefined control sequence.',
        'l.6 \\errornode',
      ].join('\n')

      // preambleLines = 3, extraOffset = 1 -> offset = 4 -> editorLine = 6 - 4 = 2
      const errors = parseLatexLog(log, latexCode, 1)
      expect(errors).toHaveLength(1)
      expect(errors[0].line).toBe(2)
    })

    it('verwendet Fallback "LaTeX Fehler", wenn keine !-Zeile im Fenster vorhanden ist', () => {
      const log = [
        'Some info line 1',
        'Some info line 2',
        'Some info line 3',
        'Some info line 4',
        'Some info line 5',
        'Some info line 6',
        'Some info line 7',
        'l.10 \\someproblem',
      ].join('\n')

      const errors = parseLatexLog(log)
      expect(errors).toHaveLength(1)
      expect(errors[0].line).toBe(10)
      expect(errors[0].message).toBe('LaTeX Fehler')
    })

    it('ignoriert Zeilen mit editorLine < 1', () => {
      const latexCode = [
        '\\documentclass{article}',
        '\\begin{document}', // Zeile 2
        'Body',
      ].join('\n')

      // Fehler in Zeile 1 der Präambel: docLine (1) - offset (2) = -1 < 1
      const log = [
        '! LaTeX Error: File not found.',
        'l.1 \\usepackage{missing}',
      ].join('\n')

      const errors = parseLatexLog(log, latexCode)
      expect(errors).toHaveLength(0)
    })

    it('dedupliziert mehrere Fehlereinträge auf derselben Editor-Zeile', () => {
      const log = [
        '! First error',
        'l.10 \\foo',
        '! Second error',
        'l.10 \\foo',
      ].join('\n')

      const errors = parseLatexLog(log)
      expect(errors).toHaveLength(1)
      expect(errors[0].line).toBe(10)
      expect(errors[0].message).toBe('First error')
    })
  })
})
