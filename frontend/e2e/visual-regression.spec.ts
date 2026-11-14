import { test, expect } from '@playwright/test'
import { mockTikzCompileSuccess, MOCK_PREVIEW_PNG_BASE64 } from './helpers/apiMocks'

test.describe('Visual Regression - Grafik-Stabilität', () => {
  test.beforeEach(async ({ page }) => {
    await mockTikzCompileSuccess(page, MOCK_PREVIEW_PNG_BASE64)
  })

  test('Snapshot-Vergleich der Vorschau mit stabilem Selektor', async ({ page }) => {
    await page.goto('/tikzpicture')

    const editor = page.locator('.cm-content')
    await expect(editor).toBeVisible()

    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await compileButton.click()

    const preview = page.getByAltText('LaTeX Vorschau')
    await expect(preview).toBeVisible({ timeout: 5000 })
    await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/)

    await preview.evaluate(async (img) => {
      if (img instanceof HTMLImageElement) {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        }
        img.style.width = '240px'
        img.style.height = '240px'
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

    const strictTestIdLocator = page.getByTestId('preview-container')
    await expect(strictTestIdLocator).toBeVisible({ timeout: 5000 })
    await expect(strictTestIdLocator).toHaveAttribute('src', /^data:image\/png;base64,/)

    await strictTestIdLocator.evaluate(async (img) => {
      if (img instanceof HTMLImageElement) {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        }
        img.style.width = '240px'
        img.style.height = '240px'
      }
    })

    await expect(strictTestIdLocator).toHaveScreenshot('default-render.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })
})
