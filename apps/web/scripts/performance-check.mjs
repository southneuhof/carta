import assert from 'node:assert/strict'
import { mkdir, mkdtemp } from 'node:fs/promises'
import net from 'node:net'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'
import { build, createServer, preview } from 'vite'

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mode = process.argv[process.argv.indexOf('--mode') + 1]
assert.match(mode ?? '', /^(development|production)$/)
process.chdir(webRoot)

async function openPort() {
  const probe = net.createServer()
  await new Promise((accept, reject) => probe.listen(0, '127.0.0.1', accept).once('error', reject))
  const address = probe.address()
  assert(address && typeof address === 'object')
  await new Promise((accept, reject) => probe.close((error) => (error ? reject(error) : accept())))
  return address.port
}

async function startServer() {
  const port = await openPort()
  if (mode === 'development') {
    const cacheRoot = resolve(webRoot, 'node_modules/.cache')
    await mkdir(cacheRoot, { recursive: true })
    const cacheDir = await mkdtemp(resolve(cacheRoot, 'performance-check-'))
    const server = await createServer({ cacheDir, root: webRoot, server: { host: '127.0.0.1', port, strictPort: true } })
    await server.listen()
    return { close: () => server.close(), origin: `http://127.0.0.1:${port}` }
  }

  await build({ root: webRoot, build: { manifest: true } })
  const server = await preview({ root: webRoot, preview: { host: '127.0.0.1', port, strictPort: true } })
  return {
    close: () => new Promise((accept, reject) => server.httpServer.close((error) => (error ? reject(error) : accept()))),
    origin: `http://127.0.0.1:${port}`,
  }
}

function gate() {
  let release
  const promise = new Promise((accept) => {
    release = accept
  })
  return { promise, release }
}

const identity = {
  data: {
    userId: 'performance-user',
    user: { id: 'performance-user', name: 'Performance Check' },
    roleCodes: [],
    permissions: ['view-users', 'create-users', 'view-roles', 'create-roles', 'view-permissions'],
  },
}
const collection = { data: [], meta: { total: 0, totalPage: 1 } }

async function configureContext(context, origin, options = {}) {
  const { identityGate, identityStatus = 200, fontGate, counters } = options
  await context.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.hostname === 'fonts.googleapis.com') {
      counters.googleFonts += 1
      return route.abort()
    }
    if (url.pathname.endsWith('/me')) {
      if (identityGate) await identityGate.promise
      return route.fulfill({
        status: identityStatus,
        contentType: 'application/json',
        body: JSON.stringify(identityStatus === 200 ? identity : { error: identityStatus === 401 ? 'unauthorized' : 'identity failure' }),
      })
    }
    const isApi = request.resourceType() === 'fetch' || request.resourceType() === 'xhr'
    if (isApi && request.method() !== 'GET') throw new Error(`Unexpected API write: ${request.method()} ${url.pathname}`)
    if (isApi) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(collection) })
    if (url.origin !== origin) return route.fulfill({ status: 204, body: '' })
    if (/\.(?:otf|woff2?)(?:\?|$)/.test(url.pathname) && fontGate) {
      await fontGate.promise
      return route.continue()
    }
    return route.continue()
  })
}

function watchPage(page, counters) {
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) counters.documents += 1
  })
  page.on('pageerror', (error) => counters.errors.push(String(error)))
  page.on('websocket', (socket) => {
    socket.on('framereceived', ({ payload }) => {
      if (String(payload).includes('full-reload')) counters.reloads.push(String(payload))
    })
  })
}

async function waitForText(page, text) {
  await page.getByText(text, { exact: true }).first().waitFor({ state: 'visible' })
  await page.waitForLoadState('networkidle')
}

async function checkRoutes(browser, origin, counters) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await configureContext(context, origin, { counters })
  const page = await context.newPage()
  watchPage(page, counters)
  await page.goto(`${origin}/dashboard`, { waitUntil: 'domcontentloaded' })
  await waitForText(page, 'Dashboard')

  for (const [path, text] of [
    ['/settings/users', 'Users'],
    ['/settings/users/create', 'Create User'],
    ['/settings/roles', 'Roles'],
    ['/settings/roles/create', 'Create Role'],
    ['/settings/permissions', 'Permissions'],
    ['/dashboard', 'Dashboard'],
    ['/settings/users', 'Users'],
  ]) {
    const link = page.locator(`a[href^="${path}"]`).first()
    if (await link.count()) await link.click()
    else
      await page.locator('#app').evaluate((element, nextPath) => {
        return element.__vue_app__.config.globalProperties.$router.push(nextPath)
      }, path)
    await page.waitForURL(`**${path}`)
    await waitForText(page, text)
  }

  await context.close()
  assert.equal(counters.documents, 1, `Expected one document request, got ${counters.documents}`)
  assert.deepEqual(counters.reloads, [])
  assert.deepEqual(counters.errors, [])
}

async function checkStartup(browser, origin, counters, identityStatus, viewport) {
  const identityGate = gate()
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  await configureContext(context, origin, { counters, identityGate, identityStatus })
  const page = await context.newPage()
  watchPage(page, counters)
  const identityRequest = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith('/me'))
  await page.goto(`${origin}/dashboard`, { waitUntil: 'domcontentloaded' })
  await identityRequest
  await page.locator('[data-app-loading]').waitFor({ state: 'visible' })
  assert.equal(await page.getByText('Dashboard', { exact: true }).count(), 0)
  assert.equal(await page.locator('nav').count(), 0)
  await mkdir(resolve(webRoot, 'test-results'), { recursive: true })
  if (identityStatus !== 500) await page.screenshot({ path: resolve(webRoot, `test-results/performance-loading-${viewport.width}.png`), fullPage: true })
  identityGate.release()

  if (identityStatus === 200) await waitForText(page, 'Dashboard')
  else if (identityStatus === 401) {
    await page.waitForURL('**/auth/login')
    await page.getByRole('button', { name: 'Login' }).waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: resolve(webRoot, 'test-results/performance-login.png'), fullPage: true })
  } else await page.getByRole('alert').waitFor({ state: 'visible' })

  assert.equal(await page.locator('[data-app-loading]').count(), 0)
  if (identityStatus !== 200) assert.equal(await page.getByText('Dashboard', { exact: true }).count(), 0)
  await context.close()
}

async function checkFonts(browser, origin, counters) {
  const fontGate = gate()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await configureContext(context, origin, { counters, fontGate })
  const page = await context.newPage()
  watchPage(page, counters)
  const fontRequest = page.waitForRequest((request) => /Geist.*\.otf(?:\?|$)/.test(new URL(request.url()).pathname))
  await page.goto(`${origin}/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.getByText('Dashboard', { exact: true }).first().waitFor({ state: 'visible' })
  await fontRequest
  assert.equal(await page.getByText('Dashboard', { exact: true }).first().isVisible(), true)
  const displays = await page.evaluate(() => [...document.fonts].filter((face) => face.family.includes('Geist Sans')).map((face) => face.display))
  assert(displays.length > 0, 'Expected Geist Sans font faces')
  assert(
    displays.every((display) => display === 'swap'),
    `Expected swap displays, got ${displays.join(', ')}`
  )
  fontGate.release()
  await page.evaluate(() => document.fonts.ready)
  assert.equal(await page.getByText('Dashboard', { exact: true }).first().isVisible(), true)
  await mkdir(resolve(webRoot, 'test-results'), { recursive: true })
  await page.screenshot({ path: resolve(webRoot, 'test-results/performance-dashboard.png'), fullPage: true })
  await context.close()
}

const server = await startServer()
const browser = await chromium.launch()
const counters = { documents: 0, errors: [], googleFonts: 0, reloads: [] }
try {
  await checkRoutes(browser, server.origin, counters)
  if (mode === 'production') {
    const startupCounters = { documents: 0, errors: [], googleFonts: 0, reloads: [] }
    await checkStartup(browser, server.origin, startupCounters, 200, { width: 390, height: 844 })
    await checkStartup(browser, server.origin, startupCounters, 401, { width: 1440, height: 900 })
    await checkStartup(browser, server.origin, startupCounters, 500, { width: 1440, height: 900 })
    await checkFonts(browser, server.origin, startupCounters)
    counters.errors.push(...startupCounters.errors)
    counters.reloads.push(...startupCounters.reloads)
    counters.googleFonts += startupCounters.googleFonts
  }
  assert.deepEqual(counters.errors, [])
  assert.deepEqual(counters.reloads, [])
  assert.equal(counters.googleFonts, 0)
  console.log(`${mode}: passed; documents=${counters.documents}; fullReloads=${counters.reloads.length}; pageErrors=${counters.errors.length}; googleFonts=${counters.googleFonts}`)
} finally {
  await browser.close()
  await server.close()
}
