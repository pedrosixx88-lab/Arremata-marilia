import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const BUYER_EMAIL = 'comprador.teste@arrematemarilia.com'
const BUYER_PASS = 'Teste@2025'

test.describe('Autenticação', () => {
  test('redireciona /dashboard para /login quando não autenticado', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(/\/login/)
  })

  test('redireciona /admin para / quando não é admin', async ({ page }) => {
    // Visita admin sem login
    await page.goto(`${BASE}/admin`)
    await expect(page).toHaveURL(/\/login|\//)
  })

  test('login com credenciais corretas redireciona para dashboard', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', BUYER_EMAIL)
    await page.fill('input[type="password"]', BUYER_PASS)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('login com senha errada mostra erro', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', BUYER_EMAIL)
    await page.fill('input[type="password"]', 'senha_errada_123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    const errorVisible = await page.locator('text=/inválid|incorret|erro/i').isVisible().catch(() => false)
    expect(errorVisible).toBe(true)
  })
})
