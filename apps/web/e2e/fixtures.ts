import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'dotenv'
import { test as base, expect, type Page } from '@playwright/test'

const repoRoot = resolve(__dirname, '../../..')
const apiRoot = resolve(repoRoot, 'apps/api')

function localEnv() {
  return {
    ...parse(readFileSync(resolve(apiRoot, '.env'))),
    ...parse(readFileSync(resolve(apiRoot, '.env.e2e'))),
  }
}

function prepareE2eState() {
  execFileSync('pnpm', ['--filter', '@southneuhof/api', 'e2e:prepare'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  })
}

async function waitForApi(page: Page) {
  const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:5180'
  await expect
    .poll(async () => (await page.request.get(`${apiUrl}/health`)).ok(), {
      timeout: 30_000,
      message: 'The E2E API health route did not respond.',
    })
    .toBe(true)
}

async function login(page: Page) {
  const env = localEnv()
  const email = env.CARTA_ADMIN_EMAIL
  const password = env.CARTA_ADMIN_PASSWORD
  if (!email || !password) throw new Error('The local administrator credentials are missing.')

  await page.goto('/auth/login')
  await page.getByRole('textbox').first().fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    if (!process.env.SKIP_E2E_PREPARE) prepareE2eState()
    await waitForApi(page)
    await login(page)
    await use(page)
  },
})

export { expect }
