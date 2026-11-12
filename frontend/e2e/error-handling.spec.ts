import { test, expect } from '@playwright/test'
import { mockTikzCompileError } from './helpers/apiMocks'

test.describe('Error Handling - Fehleranzeige & Navigation', () => {
  test('Syntaxfehler provozieren und Fehler-Panel anzeigen', async ({ page }) => {
    await mockTikzCompileError(page, 1, '\\definitelyInvalidMacro{')
    await page.goto('/tikzpicture')

    const editor = page.locator('.cm-content')
    await expect(editor).toBeVisible()

    const invalidCode = '\\definitelyInvalidMacro{\n\\draw (0,0);'
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Backspace')
    await page.keyboard.insertText(invalidCode)

    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await compileButton.click()

    const errorPanelHeader = page.getByText(/LaTeX Kompilierfehler/i)
    await expect(errorPanelHeader).toBeVisible({ timeout: 5000 })

    const errorCodeElement = page.locator('.bg-error\\/8 code, pre')
    await expect(errorCodeElement.first()).toBeVisible()
    const errorText = await errorCodeElement.first().innerText()
    expect(errorText.length).toBeGreaterThan(0)
  })

  test('Klick auf Fehler springt im Editor zur betreffenden Zeile', async ({ page }) => {
    await mockTikzCompileError(page, 2, '\\invalidMacroAtLineTwo')
    await page.goto('/tikzpicture')

    const editor = page.locator('.cm-content')
    await expect(editor).toBeVisible()

    const invalidCode = '% Zeile 1\n\\invalidMacroAtLineTwo\n% Zeile 3'
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Backspace')
    await page.keyboard.insertText(invalidCode)

    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await compileButton.click()

    const errorMsg = page.locator('.bg-error\\/8 code')
    await expect(errorMsg).toBeVisible({ timeout: 5000 })

    await errorMsg.click()

    const activeLine = page.locator('.cm-activeLine')
    await expect(activeLine).toContainText('\\invalidMacroAtLineTwo')
  })
})
