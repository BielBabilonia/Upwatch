import { expect, test } from '@playwright/test'

test('public status page shows overall status, services and incidents', async ({ page }) => {
  await page.goto('/status')

  await expect(page.getByRole('heading', { level: 1, name: 'Acme status' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: /outage|operational|degraded/i })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Services' }).getByRole('img', { name: /Public API/ })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Recent incidents' }).getByRole('listitem').first()).toBeVisible()
  // No admin UI on the public page.
  await expect(page.getByRole('button', { name: 'New monitor' })).toHaveCount(0)
})

test('theme and language preferences persist', async ({ page }) => {
  await page.goto('/status')
  await page.getByRole('button', { name: 'Dark' }).click()
  await page.getByRole('button', { name: 'PT' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('heading', { level: 1, name: 'Status da Acme' })).toBeVisible()

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
})
