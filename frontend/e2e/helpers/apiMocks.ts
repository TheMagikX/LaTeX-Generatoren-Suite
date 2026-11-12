// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Page } from '@playwright/test'

export const MOCK_PREVIEW_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/**
 * Erzeugt ein realistisches Standalone-LaTeX-Dokument für den TikZ-Generator,
 * sodass findBeginDocumentLine() Zeile 2 liefert und mit extraOffset = 1
 * die Editor-Zeile N exakt auf Dokument-Zeile (N + 3) abgebildet wird.
 */
export function buildMockTikzDocument(userCode: string): string {
  return [
    '\\documentclass[tikz,border=2pt]{standalone}',
    '\\begin{document}',
    '\\begin{tikzpicture}',
    userCode,
    '\\end{tikzpicture}',
    '\\end{document}',
  ].join('\n')
}

export async function mockBackgroundApis(page: Page): Promise<void> {
  await page.route('**/api/ai/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        active_provider: 'gemini',
        has_gemini_key: false,
        masked_gemini_key: null,
        gemini_default_model: 'gemini-2.5-flash',
        gemini_models: [],
      }),
    })
  })

  await page.route('**/api/ai/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, models: [] }),
    })
  })

  await page.route('**/api/settings/updates**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        current_version: '5.1.5',
        check_on_startup: false,
        last_checked: null,
        cached_result: null,
      }),
    })
  })
}

export async function mockTikzCompileSuccess(
  page: Page,
  pngBase64: string = MOCK_PREVIEW_PNG_BASE64
): Promise<void> {
  await mockBackgroundApis(page)

  await page.route('**/api/generators/tikzpicture', async (route) => {
    const reqBody = route.request().postDataJSON() as { code?: string } | null
    const latex = buildMockTikzDocument(reqBody?.code ?? '')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ latex }),
    })
  })

  await page.route('**/api/compile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        engine: 'xelatex',
        png_base64: pngBase64,
        compile_time: 0.12,
        convert_time: 0.04,
        total_backend_time: 0.16,
      }),
    })
  })
}

export async function mockTikzCompileError(
  page: Page,
  errorLineInEditor: number,
  offendingToken: string,
  errorMessage = 'Undefined control sequence.'
): Promise<void> {
  await mockBackgroundApis(page)

  await page.route('**/api/generators/tikzpicture', async (route) => {
    const reqBody = route.request().postDataJSON() as { code?: string } | null
    const latex = buildMockTikzDocument(reqBody?.code ?? '')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ latex }),
    })
  })

  // offset = 2 (\begin{document}) + 1 (\begin{tikzpicture}) = 3
  const docLine = errorLineInEditor + 3
  const log = `! ${errorMessage}\nl.${docLine} ${offendingToken}\nHere is how much of TeX's memory you used:`

  await page.route('**/api/compile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        engine: 'xelatex',
        log,
      }),
    })
  })
}
