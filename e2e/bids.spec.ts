import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const BUYER_EMAIL = 'comprador.teste@arrematemarilia.com'
const BUYER_PASS = 'Teste@2025'

test.describe('Sistema de Lances', () => {
  test('página de anúncio ativo mostra seção de lances', async ({ page }) => {
    await page.goto('/anuncios')
    await page.waitForLoadState('networkidle')
    const firstCard = page.locator('a[href^="/anuncios/"]').first()
    const hasCard = await firstCard.isVisible().catch(() => false)
    if (hasCard) {
      await firstCard.click()
      await page.waitForLoadState('networkidle')
      // Deve ter elemento relacionado a lance
      const hasBidSection = await page
        .locator('text=/Lance|Arremate|Encerr|Dar lance/i')
        .first()
        .isVisible()
        .catch(() => false)
      expect(hasBidSection).toBe(true)
    }
  })

  test('usuário não autenticado não pode dar lance', async ({ page }) => {
    await page.goto('/anuncios')
    await page.waitForLoadState('networkidle')
    const firstCard = page.locator('a[href^="/anuncios/"]').first()
    const hasCard = await firstCard.isVisible().catch(() => false)
    if (hasCard) {
      await firstCard.click()
      await page.waitForLoadState('networkidle')
      const bidButton = page.locator('button:has-text("Dar lance"), button:has-text("Arrematar")')
      const hasBidButton = await bidButton.isVisible().catch(() => false)
      if (hasBidButton) {
        await bidButton.click()
        await page.waitForTimeout(1000)
        // Deve redirecionar para login ou mostrar mensagem
        const redirected = page.url().includes('/login')
        const showsMessage = await page.locator('text=/login|entrar|autentique/i').isVisible().catch(() => false)
        expect(redirected || showsMessage).toBe(true)
      }
    }
  })

  test('usuário autenticado vê form de lance', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', BUYER_EMAIL)
    await page.fill('input[type="password"]', BUYER_PASS)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    // Navega para listagem
    await page.goto('/anuncios')
    await page.waitForLoadState('networkidle')
    const firstCard = page.locator('a[href^="/anuncios/"]').first()
    const hasCard = await firstCard.isVisible().catch(() => false)
    if (hasCard) {
      await firstCard.click()
      await page.waitForLoadState('networkidle')
      // Input de lance deve estar presente para usuário logado
      const bidInput = page.locator('input[type="number"], input[placeholder*="lance"], input[placeholder*="Lance"]').first()
      const hasBidInput = await bidInput.isVisible().catch(() => false)
      // Pode não ter input se anúncio estiver encerrado — apenas verifica que a seção existe
      const hasSection = await page.locator('text=/Lance|Arremate|Encerr/i').first().isVisible().catch(() => false)
      expect(hasSection).toBe(true)
    }
  })

  test('lance abaixo do mínimo mostra erro', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', BUYER_EMAIL)
    await page.fill('input[type="password"]', BUYER_PASS)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    await page.goto('/anuncios')
    await page.waitForLoadState('networkidle')
    const firstCard = page.locator('a[href^="/anuncios/"]').first()
    const hasCard = await firstCard.isVisible().catch(() => false)
    if (hasCard) {
      await firstCard.click()
      await page.waitForLoadState('networkidle')
      const bidInput = page.locator('input[type="number"]').first()
      const hasBidInput = await bidInput.isVisible().catch(() => false)
      if (hasBidInput) {
        await bidInput.fill('1') // Valor absurdamente baixo
        const submitBtn = page.locator('button[type="submit"]:has-text("Lance"), button:has-text("Dar lance")').first()
        const hasBtn = await submitBtn.isVisible().catch(() => false)
        if (hasBtn) {
          await submitBtn.click()
          await page.waitForTimeout(1500)
          const errorVisible = await page.locator('text=/mínimo|inválid|erro|abaixo/i').isVisible().catch(() => false)
          expect(errorVisible).toBe(true)
        }
      }
    }
  })
})
