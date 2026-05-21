import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('carrega com hero, como funciona, categorias e footer', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Hero
    await expect(page.locator('h1')).toContainText('Compre e venda')
    await expect(page.locator('a[href="/cadastro"]').first()).toBeVisible()

    // Como funciona
    await expect(page.locator('text=Simples. Rápido. Seguro.')).toBeVisible()
    await expect(page.locator('text=01')).toBeVisible()

    // Categorias
    await expect(page.locator('text=Eletrônicos')).toBeVisible()

    // Confiança
    await expect(page.locator('text=Por que confiar?')).toBeVisible()

    // Footer
    await expect(page.locator('text=Termos de uso')).toBeVisible()
  })

  test('navbar sem login mostra "Como funciona", "Entrar" e "Criar conta"', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/como-funciona"]')).toBeVisible()
    await expect(page.locator('a[href="/login"]')).toBeVisible()
    await expect(page.locator('a[href="/cadastro"]').last()).toBeVisible()
  })

  test('página como-funciona carrega seções completas', async ({ page }) => {
    await page.goto('/como-funciona')
    await expect(page.locator('h1')).toContainText('Como funciona')
    await expect(page.locator('text=Para vendedores')).toBeVisible()
    await expect(page.locator('text=Para compradores')).toBeVisible()
    await expect(page.locator('text=Itens proibidos')).toBeVisible()
    await expect(page.locator('text=Perguntas frequentes')).toBeVisible()
  })

  test('onboarding tem 3 steps e progresso animado', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page.locator('text=Bem-vindo ao ArremataMarília')).toBeVisible()
    await expect(page.locator('text=Passo 1 de 3')).toBeVisible()

    await page.click('text=Começar')
    await expect(page.locator('text=Confirme seu e-mail')).toBeVisible()
    await expect(page.locator('text=Passo 2 de 3')).toBeVisible()

    await page.click('text=Já confirmei meu e-mail')
    await expect(page.locator('text=Complete seu perfil')).toBeVisible()
    await expect(page.locator('text=Passo 3 de 3')).toBeVisible()
  })

  test('categorias linkam para /anuncios com filtro correto', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Eletrônicos')
    await expect(page).toHaveURL(/categoria=eletronicos/)
  })
})
