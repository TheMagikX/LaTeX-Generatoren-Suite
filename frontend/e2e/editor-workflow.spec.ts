import { test, expect } from '@playwright/test'

test.describe('Editor Workflow - Kern-Funktionalität', () => {
  test('Erfolgreicher Render-Flow über Button und Shortcut', async ({ page }) => {
    // 1. Startseite aufrufen
    await page.goto('/')
    await expect(page).toHaveTitle(/Generatoren/i)

    // Navigiere zum TikZ-Editor über die Dashboard-Kachel
    const tikzLink = page.getByRole('link', { name: /TikZ-Grafik|TikZ/i }).first()
    await expect(tikzLink).toBeVisible()
    await tikzLink.click()

    await expect(page).toHaveURL(/.*tikzpicture/)

    // 2. Editor lokalisieren & gültigen Code eingeben
    const editor = page.locator('.cm-content')
    await expect(editor).toBeVisible()

    const validCode = '\\draw[thick, fill=blue!20] (0,0) rectangle (2,2);'
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Backspace')
    await page.keyboard.insertText(validCode)
    await expect(editor).toContainText(validCode)

    // 3. Compile-Vorgang auslösen
    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await expect(compileButton).toBeVisible()

    // Shortcut Control+Enter auslösen
    await page.keyboard.press('Control+Enter')

    // 4. Prüfen, dass der Ladezustand/Spinner und anschließend das Vorschau-Element sichtbar ist
    const previewImage = page.locator('[data-testid="preview-container"], img[alt="LaTeX Vorschau"]').first()
    await expect(previewImage).toBeVisible({ timeout: 25000 })
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

    // Seite neu laden
    await page.reload()

    // Nach Reload prüfen, ob der geänderte Code noch vorhanden ist
    const reloadedEditor = page.locator('.cm-content')
    await expect(reloadedEditor).toBeVisible()
    await expect(reloadedEditor).toContainText(uniqueSnippet)
  })
})
