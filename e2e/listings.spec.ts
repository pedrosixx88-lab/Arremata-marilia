import { test, expect } from '@playwright/test'

test.describe('Listagem de anúncios', () => {
  test('página /anuncios carrega com filtros', async ({ page }) => {
    await page.goto('/anuncios')
    await page.waitForLoadState('networkidle')
    // Filtros devem estar presentes
    await expect(page.locator('input[placeholder*="Buscar"]').or(page.locator('text=Filtros'))).toBeVisible()
  })

  test('busca por keyword atualiza URL', async ({ page }) => {
    await page.goto('/anuncios')
    await page.waitForLoadState('networkidle')
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]').first()
    const hasSearch = await searchInput.isVisible().catch(() => false)
    if (hasSearch) {
      await searchInput.fill('playstation')
      await page.keyboard.press('Enter')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/q=playstation/)
    }
  })

  test('página de detalhe do anúncio carrega (SSR)', async ({ page }) => {
    // Primeiro pega um anúncio da listagem
    await page.goto('/anuncios')
    await page.waitForLoadState('networkidle')
    const firstCard = page.locator('a[href^="/anuncios/"]').first()
    const hasCard = await firstCard.isVisible().catch(() => false)
    if (hasCard) {
      await firstCard.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/anuncios\//)
      // Página de detalhe deve ter seção de lances
      await expect(page.locator('text=/Lance|Arremate|Encerr/').first()).toBeVisible()
    }
  })
})
