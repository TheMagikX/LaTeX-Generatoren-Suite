import { test, expect } from '@playwright/test'
import { mockTikzCompileSuccess } from './helpers/apiMocks'

test.describe('Editor Workflow - Kern-Funktionalität', () => {
  test.beforeEach(async ({ page }) => {
    await mockTikzCompileSuccess(page)
  })

  test('Erfolgreicher Render-Flow über Button und Shortcut', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Generatoren/i)

    const tikzLink = page.getByRole('link', { name: /TikZ-Grafik|TikZ/i }).first()
    await expect(tikzLink).toBeVisible()
    await tikzLink.click()

    await expect(page).toHaveURL(/.*tikzpicture/)

    const editor = page.locator('.cm-content')
    await expect(editor).toBeVisible()

    const validCode = '\\draw[thick, fill=blue!20] (0,0) rectangle (2,2);'
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Backspace')
    await page.keyboard.insertText(validCode)
    await expect(editor).toContainText(validCode)

    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await expect(compileButton).toBeVisible()

    await page.keyboard.press('Control+Enter')

    const previewImage = page.locator('[data-testid="preview-container"], img[alt="LaTeX Vorschau"]').first()
    await expect(previewImage).toBeVisible({ timeout: 5000 })
  })

  test('Persistenz bei Neuladen (localStorage)', async ({ page }) => {
    await page.goto('/tikzpicture')

    const editor = page.locator('.cm-content')
    await expect(editor).toBeVisible()

    const uniqueSnippet = '% Persistence-Check-' + Date.now()
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Backspace')
    await page.keyboard.insertText(uniqueSnippet)
    await expect(editor).toContainText(uniqueSnippet)

    // Warten auf LocalStorage-Debounce (useGeneratorHistory + useLocalStorage)
    await expect
      .poll(async () => {
        return await page.evaluate(() => window.localStorage.getItem('ks-tikzpicture') ?? '')
      })
      .toContain(uniqueSnippet)
    await page.reload()

    const reloadedEditor = page.locator('.cm-content')
    await expect(reloadedEditor).toBeVisible()
    await expect(reloadedEditor).toContainText(uniqueSnippet)
  })
})
