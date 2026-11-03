import { test, expect } from '@playwright/test'

test.describe('Visual Regression - Grafik-Stabilität', () => {
  test('Snapshot-Vergleich der Vorschau mit stabilem Selektor', async ({ page }) => {
    // 1. TikZ-Editor aufrufen
    await page.goto('/tikzpicture')

    // Standard-Code sicherstellen
    const editor = page.locator('.cm-content')
    await expect(editor).toBeVisible()

    const standardCode = '\\draw[fill=teal!30, draw=teal, very thick] (0,0) circle (1.5cm);'
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Backspace')
    await page.keyboard.insertText(standardCode)

    // 2. Rendern bis zum fertigen Zustand
    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await compileButton.click()

    // Vorschau lokalisieren über stabilen Selektor (img[alt="LaTeX Vorschau"] oder Fallback)
    const preview = page.locator('[data-testid="preview-container"], img[alt="LaTeX Vorschau"]').first()
    await expect(preview).toBeVisible({ timeout: 25000 })

    // Sicherstellen, dass das Bild vollständig decodiert / geladen ist
    await preview.evaluate(async (img) => {
      if (img instanceof HTMLImageElement && !img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve
        })
      }
    })

    // 3. Snapshot-Vergleich
    await expect(preview).toHaveScreenshot('default-render.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })

  test.fixme('Strikter Snapshot-Vergleich auf reinem [data-testid="preview-container"] Selektor', async ({ page }) => {
    // Hinweis nach QA-Vorgabe:
    // Der Produktivcode besitzt aktuell keine data-testid Attribute (data-testid="preview-container" fehlt).
    // Gemäß Vorgabe wird der Produktivcode nicht modifiziert und dieser Test als test.fixme() markiert.
    await page.goto('/tikzpicture')
    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await compileButton.click()

    const strictTestIdLocator = page.locator('[data-testid="preview-container"]')
    await expect(strictTestIdLocator).toBeVisible({ timeout: 5000 })
    await expect(strictTestIdLocator).toHaveScreenshot('default-render.png', { maxDiffPixelRatio: 0.02 })
  })
})
