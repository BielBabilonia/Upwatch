import { expect, test } from '@playwright/test'

test('creates a monitor and lands on its detail page', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New monitor' }).click()

  const dialog = page.getByRole('dialog', { name: 'New monitor' })
  await dialog.getByLabel('Name').fill('Checkout')
  await dialog.getByLabel('URL').fill('https://checkout.example.com')
  await dialog.getByLabel('Check interval').selectOption('30')
  await dialog.getByRole('button', { name: 'Create monitor' }).click()

  await expect(page.getByText('Monitor “Checkout” created')).toBeVisible()
  await expect(page).toHaveURL(/\/monitors\/mon_\d+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Checkout' })).toBeVisible()
  await expect(page.getByText('Checked every 30s')).toBeVisible()
})

test('shows a monitor detail with chart, uptime and incidents', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Payments gateway/ }).first().click()

  await expect(page.getByRole('heading', { level: 1, name: 'Payments gateway' })).toBeVisible()
  await expect(page.getByRole('img', { name: /Response time chart/ })).toBeVisible()
  await expect(page.getByText('Ongoing', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '7 days' }).click()
  await expect(page).toHaveURL(/range=7d/)
  await expect(page.getByText('One square per 2 hours')).toBeVisible()
})

test('pauses a monitor and deletes it after confirming', async ({ page }) => {
  await page.goto('/monitors/mon_1')
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByText('This monitor is paused. No checks are running.')).toBeVisible()

  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete monitor' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Monitor “Marketing site” deleted')).toBeVisible()
  await expect(page.getByRole('link', { name: /Marketing site/ })).toHaveCount(0)
})
