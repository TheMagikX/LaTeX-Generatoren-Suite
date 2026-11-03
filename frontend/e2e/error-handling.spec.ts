import { test, expect } from '@playwright/test'

test.describe('Error Handling - Fehleranzeige & Navigation', () => {
  test('Syntaxfehler provozieren und Fehler-Panel anzeigen', async ({ page }) => {
    await page.goto('/tikzpicture')

    const editor = page.locator('.cm-content')
    await expect(editor).toBeVisible()

    // Fehlerhaften LaTeX-Code eingeben (ungültiges Makro / ungeschlossene Syntax)
    const invalidCode = '\\definitelyInvalidMacro{\n\\draw (0,0);'
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Backspace')
    await page.keyboard.insertText(invalidCode)

    // Kompilieren auslösen
    const compileButton = page.getByRole('button', { name: /Kompilieren/i })
    await compileButton.click()

    // Fehler-Panel muss sichtbar werden
    const errorPanelHeader = page.getByText(/LaTeX Kompilierfehler/i)
    await expect(errorPanelHeader).toBeVisible({ timeout: 25000 })

    // Mindestens eine Fehlermeldung / Log-Zeile muss im Panel sichtbar sein
    const errorCodeElement = page.locator('.bg-error\\/8 code, pre')
    await expect(errorCodeElement.first()).toBeVisible()
    const errorText = await errorCodeElement.first().innerText()
    expect(errorText.length).toBeGreaterThan(0)
  })

  test.fixme('Klick auf Fehler springt im Editor zur betreffenden Zeile', async ({ page }) => {
    // Hinweis nach QA-Vorgabe:
    // Der Produktivcode in LatexErrorPanel besitzt aktuell keinen Click-Handler, der den
    // Cursor im CodeMirror-Editor in die gemeldete Zeile bewegt oder fokussiert.
    // Gemäß Vorgabe wird der Produktivcode nicht modifiziert und dieser Test als test.fixme() markiert.
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

    // Fehler-Panel abwarten
    const errorMsg = page.locator('.bg-error\\/8 code')
    await expect(errorMsg).toBeVisible({ timeout: 25000 })

    // Klick auf die Fehlermeldung in der Log-Ansicht
    await errorMsg.click()

    // Erwartung: Cursor oder aktive Zeile springt zu Zeile 2 im CodeMirror Editor
    const activeLine = page.locator('.cm-activeLine')
    await expect(activeLine).toContainText('\\invalidMacroAtLineTwo')
  })
})
