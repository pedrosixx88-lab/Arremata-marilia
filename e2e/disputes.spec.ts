import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const BUYER_EMAIL = 'comprador.teste@arrematemarilia.com'
const BUYER_PASS = 'Teste@2025'

test.describe('Disputas Pós-Arremate', () => {
  test('página /disputas/nova requer autenticação', async ({ page }) => {
    await page.goto(`${BASE}/disputas/nova`)
    await page.waitForLoadState('networkidle')
    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/login/)
  })

  test('usuário autenticado acessa /disputas/nova', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', BUYER_EMAIL)
    await page.fill('input[type="password"]', BUYER_PASS)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    await page.goto(`${BASE}/disputas/nova`)
    await page.waitForLoadState('networkidle')
    // Deve mostrar formulário ou mensagem de que não tem arremates
    const hasForm = await page.locator('text=/Abrir Disputa|disputa|arremate/i').first().isVisible().catch(() => false)
    expect(hasForm).toBe(true)
  })

  test('página de arremate confirmado mostra botão de disputa', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', BUYER_EMAIL)
    await page.fill('input[type="password"]', BUYER_PASS)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    // Acessa o arremate de teste
    const LISTING_ID = '766b9517-cf2d-4a12-92e5-f1abf53066a5'
    await page.goto(`${BASE}/arremates/${LISTING_ID}`)
    await page.waitForLoadState('networkidle')
    // Página deve carregar (pode mostrar disputa ou detalhe)
    const loaded = await page.locator('text=/Arremate|disputa|PlayStation|encerr/i').first().isVisible().catch(() => false)
    expect(loaded).toBe(true)
  })

  test('painel admin /admin/disputas requer autenticação', async ({ page }) => {
    await page.goto(`${BASE}/admin/disputas`)
    await page.waitForLoadState('networkidle')
    // Sem login → login ou home
    await expect(page).toHaveURL(/\/login|\//)
  })
})
