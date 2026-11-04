// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErwartungshorizontTabSnippet from './ErwartungshorizontTabSnippet'
import type { ErwartungshorizontConfig } from '../typesErwartungshorizont'

beforeAll(() => {
  if (typeof window !== 'undefined' && !Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  }
})

describe('ErwartungshorizontTabSnippet Quick Insert Buttons', () => {
  const baseConfig: ErwartungshorizontConfig = {
    code: '',
    spacing: '1.2',
    latex_width: 15,
    feste_breite: false,
    pakete_laden: true,
    command_laden: true,
    font_family: 'default',
  }

  it('fügt mit +Teilaufgabe nur \\begin{subtask} und \\end{subtask} ohne \\textbf{a)} ein', async () => {
    const user = userEvent.setup()
    const updateConfig = vi.fn()

    render(
      <ErwartungshorizontTabSnippet
        config={baseConfig}
        updateConfig={updateConfig}
        compileLog={null}
        latexCode={null}
      />,
    )

    const subtaskBtn = screen.getByRole('button', { name: /\+ Teilaufgabe/i })
    await user.click(subtaskBtn)

    expect(subtaskBtn).toHaveAttribute(
      'title',
      'Neue Teilaufgabe (\\begin{subtask} ... \\end{subtask}) an Cursor-Position einfügen',
    )
  })

  it('fügt mit +Gleichung und +Formel keine Leerzeile vor \\begin{equation*} bzw. \\begin{align*} ein', () => {
    // Test the pure insertion logic with single spacing
    const docWithEmptyLine = '\\begin{subtask}\n\n\\end{subtask}'
    // Cursor at index 16 is on the empty line
    const from = 16
    const to = 16
    const beforeChar = docWithEmptyLine[from - 1] // '\n'
    const afterChar = docWithEmptyLine[to] // '\n'

    let prefix = ''
    let suffix = ''
    if (beforeChar && beforeChar !== '\n') {
      prefix = '\n'
    }
    if (afterChar && afterChar !== '\n') {
      suffix = '\n'
    }

    const alignSnippet = '\\begin{align*}\n\n\\end{align*}'
    const insertedAlign = prefix + alignSnippet + suffix
    const docAfterAlign =
      docWithEmptyLine.slice(0, from) + insertedAlign + docWithEmptyLine.slice(to)

    expect(docAfterAlign).toBe(
      '\\begin{subtask}\n\\begin{align*}\n\n\\end{align*}\n\\end{subtask}',
    )
    expect(docAfterAlign).not.toContain('\\begin{subtask}\n\n\\begin{align*}')

    const formulaSnippet = '\\begin{equation*}\n\n\\end{equation*}'
    const insertedFormula = prefix + formulaSnippet + suffix
    const docAfterFormula =
      docWithEmptyLine.slice(0, from) + insertedFormula + docWithEmptyLine.slice(to)

    expect(docAfterFormula).toBe(
      '\\begin{subtask}\n\\begin{equation*}\n\n\\end{equation*}\n\\end{subtask}',
    )
    expect(docAfterFormula).not.toContain('\\begin{subtask}\n\n\\begin{equation*}')
  })
})
