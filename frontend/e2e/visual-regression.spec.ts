import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'
import { mockTikzCompileSuccess, MOCK_PREVIEW_PNG_BASE64 } from './helpers/apiMocks'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SNAPSHOT_PATH = path.join(
  __dirname,
  'visual-regression.spec.ts-snapshots',
  'default-render-chromium-win32.png'
)
const SNAPSHOT_BASE64 = fs.existsSync(SNAPSHOT_PATH)
  ? fs.readFileSync(SNAPSHOT_PATH).toString('base64')
  : MOCK_PREVIEW_PNG_BASE64

test.describe('Visual Regression - Grafik-Stabilität', () => {
  test.beforeEach(async ({ page }) => {
    await mockTikzCompileSuccess(page, SNAPSHOT_BASE64)
  })

  test('Snapshot-Vergleich der Vorschau mit stabilem Selektor', async ({ page }) => {
    await page.goto('/tikzpicture')

    const editor = page.locator('.cm-content')
    await expect(editor).toBeVisible()

    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await compileButton.click()

    const preview = page.locator('[data-testid="preview-container"], img[alt="LaTeX Vorschau"]').first()
    await expect(preview).toBeVisible({ timeout: 5000 })

    await preview.evaluate(async (img) => {
      if (img instanceof HTMLImageElement && !img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve
        })
      }
    })

    await expect(preview).toHaveScreenshot('default-render.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })

  test('Strikter Snapshot-Vergleich auf reinem [data-testid="preview-container"] Selektor', async ({ page }) => {
    await page.goto('/tikzpicture')

    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await compileButton.click()

    const strictTestIdLocator = page.locator('[data-testid="preview-container"]')
    await expect(strictTestIdLocator).toBeVisible({ timeout: 5000 })

    await strictTestIdLocator.evaluate(async (img) => {
      if (img instanceof HTMLImageElement && !img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve
        })
      }
    })

    await expect(strictTestIdLocator).toHaveScreenshot('default-render.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })
})
