import { test, expect } from './fixtures'

test('session lifecycle: login, dashboard, reload, logout', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible()
  await page.reload()
  await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible()
  const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:5180'
  const me = await page.request.get(`${apiUrl}/me`)
  expect(me.ok()).toBe(true)
  const identity = (await me.json()).data
  expect(identity.user.email).toBe('admin@example.com')
  expect(identity.roleCodes).toContain('administrator')
  const adminCookies = await page.context().cookies()
  await page.request.post(`${apiUrl}/api/auth/sign-out`, { headers: { Origin: process.env.E2E_WEB_URL ?? 'http://127.0.0.1:5181' } })
  await page.context().clearCookies()
  const after = await page.request.get(`${apiUrl}/me`)
  expect(after.status()).toBe(401)
  expect(adminCookies.length).toBeGreaterThan(0)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/auth\/login/)
})

test('unauthenticated /me is 401', async ({ page }) => {
  const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:5180'
  const response = await page.request.get(`${apiUrl}/me`)
  expect(response.status()).toBe(401)
})
