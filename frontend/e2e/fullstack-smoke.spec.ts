// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, expect } from '@playwright/test'

test.describe('Full-Stack Smoke-Test (@fullstack)', () => {
  test(
    'Koordinatensystem gegen echtes FastAPI- & XeLaTeX-Backend generieren und kompilieren',
    { tag: '@fullstack' },
    async ({ page }) => {
      await page.goto('/koordinatensystem')

      const compileButton = page.getByRole('button', { name: /Kompilieren/i })
      await expect(compileButton).toBeVisible()
      await compileButton.click()

      const previewImage = page.locator('[data-testid="preview-container"]')
      await expect(previewImage).toBeVisible({ timeout: 25000 })

      const src = await previewImage.getAttribute('src')
      expect(src).toMatch(/^data:image\/png;base64,iVBOR/)
    }
  )
})
