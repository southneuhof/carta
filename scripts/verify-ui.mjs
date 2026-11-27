import { spawn, spawnSync } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createConnection } from 'node:net'
import { dirname, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs, parseEnv } from 'node:util'

const root = fileURLToPath(new URL('..', import.meta.url))
const apiRoot = resolve(root, 'apps/api')
const webRoot = resolve(root, 'apps/web')
const sizes = { desktop: { width: 1440, height: 900 }, mobile: { width: 375, height: 812 } }
const themes = ['light', 'dark']
const options = {
  config: { type: 'string' },
  out: { type: 'string' },
  'web-url': { type: 'string' },
  'api-url': { type: 'string' },
  'start-servers': { type: 'boolean' },
  preview: { type: 'boolean' },
  login: { type: 'string' },
  routes: { type: 'string' },
  script: { type: 'string' },
  timeout: { type: 'string' },
  help: { type: 'boolean' },
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function account(value) {
  if (!object(value) || typeof value.email !== 'string' || !value.email.trim() || typeof value.password !== 'string' || !value.password) {
    throw new Error('Login requires an email and a password.')
  }
  return { email: value.email, password: value.password }
}

function splitPair(value, delimiter) {
  const index = value.indexOf(delimiter)
  return index < 0 ? [value, ''] : [value.slice(0, index), value.slice(index + 1)]
}

function selection(value, allowed, label) {
  if (!Array.isArray(value) || !value.length || value.some((entry) => !allowed.includes(entry)) || new Set(value).size !== value.length) {
    throw new Error(`${label} must list unique values from ${allowed.join(', ')}.`)
  }
  return value
}

function readEnv(dir) {
  const file = resolve(dir, '.env')
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {}
}

function httpUrl(value, label) {
  if (typeof value !== 'string') throw new Error(`${label} must be an HTTP URL.`)
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`${label} must be an HTTP URL without credentials.`)
  }
  return url
}

function loopback(url) {
  return ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
}

function localPort(value) {
  if (!value) return undefined
  const url = httpUrl(value, 'Local service URL')
  return loopback(url) && url.port ? url.port : undefined
}

export function readConfig(args, cwd = process.cwd()) {
  const { values } = parseArgs({ args, options })
  if (values.help) return { help: true }
  const configPath = values.config === undefined ? undefined : resolve(cwd, values.config)
  const base = configPath ? dirname(configPath) : cwd
  const file = configPath ? JSON.parse(readFileSync(configPath, 'utf8')) : {}
  if (!object(file)) throw new Error('The UI verification config must be an object.')
  for (const key of ['webUrl', 'apiUrl', 'outDir', 'script']) {
    if (file[key] !== undefined && (typeof file[key] !== 'string' || !file[key].trim())) {
      throw new Error(`${key} must be a nonempty string.`)
    }
  }
  if (file.startServers !== undefined && typeof file.startServers !== 'boolean') {
    throw new Error('startServers must be a boolean.')
  }

  const apiEnv = readEnv(apiRoot)
  const webEnv = readEnv(webRoot)
  const webUrl = httpUrl(values['web-url'] ?? file.webUrl ??
    `http://127.0.0.1:${localPort(apiEnv.WEB_ORIGIN ?? apiEnv.APP_ORIGIN) ?? webEnv.WEB_PORT ?? 5181}`, 'webUrl')
  const apiUrl = httpUrl(values['api-url'] ?? file.apiUrl ??
    `http://127.0.0.1:${apiEnv.API_PORT ?? localPort(webEnv.VITE_API_BASE_URL ?? webEnv.VITE_API_URL) ?? 5180}`, 'apiUrl')
  const timeout = Number(values.timeout ?? 30_000)
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 2_147_483_647) {
    throw new Error('--timeout must be a positive integer in milliseconds.')
  }

  const viewportSizes = { ...sizes }
  let viewports = Object.keys(sizes)
  if (Array.isArray(file.viewports)) viewports = selection(file.viewports, viewports, 'viewports')
  else if (file.viewports !== undefined) {
    if (!object(file.viewports)) throw new Error('viewports must be a list of names or a map of sizes.')
    for (const [name, size] of Object.entries(file.viewports)) {
      if (!Object.hasOwn(sizes, name) || !object(size) ||
        ![size.width, size.height].every((value) => Number.isSafeInteger(value) && value > 0)) {
        throw new Error(`Invalid viewport size for ${name}.`)
      }
      viewportSizes[name] = { width: size.width, height: size.height }
    }
  }

  const [email, password] = splitPair(values.login ?? '', ':')
  const login = values.login === undefined ? file.login : { email, password }
  const defaultAccount = login === undefined ? undefined : account(login)
  const routeInput = values.routes === undefined ? file.routes ?? [] : values.routes.split(',').map((entry) => {
    const [name, path] = splitPair(entry, '=')
    return { name, path }
  })
  if (!Array.isArray(routeInput)) throw new Error('routes must be an array.')
  const names = new Set()
  const routes = routeInput.map((route) => {
    if (!object(route) || typeof route.name !== 'string' || !/^[a-z\d][a-z\d_-]*$/i.test(route.name) ||
        typeof route.path !== 'string' || !route.path.trim()) {
      throw new Error('Each route needs a file-safe name and a path.')
    }
    const nameKey = route.name.toLowerCase()
    if (names.has(nameKey)) throw new Error(`Duplicate route name ${route.name}.`)
    names.add(nameKey)
    const url = new URL(route.path, webUrl)
    if (url.origin !== webUrl.origin || url.username || url.password) throw new Error(`Route ${route.name} must use the web origin.`)
    const credentials = route.auth === undefined || route.auth === true ? defaultAccount
      : route.auth === false ? undefined : account(route.auth)
    if (route.auth === true && !credentials) throw new Error(`Route ${route.name} requires login credentials.`)
    for (const key of ['waitFor', 'selector']) {
      if (route[key] !== undefined && (typeof route[key] !== 'string' || !route[key].trim())) {
        throw new Error(`Route ${route.name} requires nonempty text for ${key}.`)
      }
    }
    return {
      name: route.name,
      url: url.href,
      credentials,
      waitFor: route.waitFor,
      selector: route.selector,
      viewports: route.viewports === undefined ? viewports : selection(route.viewports, Object.keys(sizes), 'Route viewports'),
      themes: route.themes === undefined ? themes : selection(route.themes, themes, 'Route themes'),
    }
  })
  const script = values.script !== undefined ? resolve(cwd, values.script) : file.script && resolve(base, file.script)
  if (!script && !routes.length) throw new Error('Give at least one route or a workflow script.')
  return {
    webUrl, apiUrl, routes, script, timeout, viewportSizes, defaultAccount,
    outDir: values.out !== undefined ? resolve(cwd, values.out)
      : file.outDir ? resolve(base, file.outDir) : resolve(cwd, '.local/verification/verify-ui'),
    startServers: values['start-servers'] ?? file.startServers,
    explicitWebUrl: values['web-url'] !== undefined || file.webUrl !== undefined,
    preview: values.preview,
  }
}

function port(url) {
  return Number(url.port || (url.protocol === 'https:' ? 443 : 80))
}

function listening(url) {
  return new Promise((done) => {
    const socket = createConnection({ host: url.hostname.replace(/^\[|\]$/g, ''), port: port(url) })
    const finish = (result) => {
      socket.destroy()
      done(result)
    }
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(750, () => finish(false))
  })
}

function runChild(owned, outDir, name, [command, ...args], cwd, env = {}) {
  const log = resolve(outDir, `${name}.log`)
  const fd = openSync(log, 'w')
  let child
  try {
    child = spawn(command, args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: ['ignore', fd, fd] })
  } finally {
    closeSync(fd)
  }
  const processInfo = { child, log }
  processInfo.closed = new Promise((done) => {
    child.once('error', (error) => { processInfo.error = error })
    child.once('close', (code, signal) => {
      processInfo.result = processInfo.error?.message ?? signal ?? code
      done(processInfo.result)
    })
  })
  owned.processes.push(processInfo)
  return processInfo
}

function sessionTargets(pid) {
  if (process.platform === 'win32') return [pid]
  if (process.platform !== 'linux') return [-pid]
  const result = spawnSync('ps', ['-e', '-o', 'pgid=', '-o', 'sid=', '-o', 'stat='], { encoding: 'utf8' })
  if (result.status !== 0) throw result.error ?? new Error('Could not list owned process groups.')
  const targets = result.stdout.trim().split('\n').flatMap((line) => {
    const [group, session, state] = line.trim().split(/\s+/)
    return Number(session) === pid && !state.startsWith('Z') ? [-Number(group)] : []
  })
  return [...new Set(targets)]
}

async function stopChild({ child, closed }) {
  if (!child.pid) return
  const send = (target, signal) => {
    try {
      return process.kill(target, signal)
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
      return false
    }
  }
  const running = () => sessionTargets(child.pid).filter((target) => send(target, 0))
  for (const target of running()) send(target, 'SIGTERM')
  const deadline = Date.now() + 2_000
  let targets = running()
  while (targets.length && Date.now() < deadline) {
    await delay(50)
    targets = running()
  }
  for (const target of targets) send(target, 'SIGKILL')
  await closed
  const killDeadline = Date.now() + 2_000
  while (running().length) {
    if (Date.now() >= killDeadline) throw new Error(`Process session ${child.pid} did not stop.`)
    await delay(50)
  }
}

async function ready(url, service, signal) {
  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) {
    signal.throwIfAborted()
    if (service?.result !== undefined) throw new Error(`Server exited (${service.result}). See ${service.log}.`)
    try {
      const response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.any([signal, AbortSignal.timeout(Math.min(1_000, Math.max(1, deadline - Date.now())))]),
      })
      await response.body?.cancel()
      if (response.status >= 200 && response.status < 400) return
    } catch {
      signal.throwIfAborted()
    }
    await delay(250, undefined, { signal })
  }
  throw new Error(`HTTP readiness timed out at ${url}.${service ? ` See ${service.log}.` : ''}`)
}

async function startServers(config, owned, signal, untilInterrupted) {
  const { webUrl, apiUrl, outDir } = config
  const localDefaults = !config.explicitWebUrl && config.startServers !== false
  const start = new Set()
  if (config.startServers || localDefaults) {
    const urls = [apiUrl, webUrl]
    const bound = await Promise.all(urls.map((url) => loopback(url) && listening(url)))
    for (const [index, url] of urls.entries()) {
      if (config.startServers && bound[index]) throw new Error(`Port in use at ${url.origin}.`)
      if (!(config.startServers || (loopback(url) && !bound[index]))) continue
      if (!loopback(url) || url.protocol !== 'http:' || url.hostname === '[::1]') {
        throw new Error(`Owned servers require a local HTTP URL. Received ${url.origin}.`)
      }
      start.add(url)
    }
  }
  signal.throwIfAborted()
  let api
  let web
  if (start.has(apiUrl)) {
    owned.manifestDir = mkdtempSync(resolve(apiRoot, '.sprindle-ui-'))
    const manifest = resolve(owned.manifestDir, 'routes.mjs')
    const compiler = runChild(owned, outDir, 'routes-compile',
      ['pnpm', '--filter', '@southneuhof/api', 'routes:compile', manifest], root)
    const result = await untilInterrupted(compiler.closed)
    if (result !== 0) throw new Error(`Route compilation failed (${result}). See ${compiler.log}.`)
    const env = { API_PORT: String(port(apiUrl)), BETTER_AUTH_URL: apiUrl.origin, APP_ORIGIN: webUrl.origin, SPRINDLE_ROUTE_MANIFEST: manifest }
    api = runChild(owned, outDir, 'api', [process.execPath, '--env-file-if-exists=.env', '--import', 'tsx', 'src/server.ts'], apiRoot, env)
  }
  if (start.has(webUrl)) {
    web = runChild(owned, outDir, 'web', [
      'pnpm', '--filter', '@southneuhof/framework-web', config.preview ? 'preview' : 'dev',
      '--host', '127.0.0.1', '--port', String(port(webUrl)), '--strictPort',
    ], root, { WEB_PORT: String(port(webUrl)), VITE_API_URL: apiUrl.origin })
  }
  const checks = [ready(webUrl, web, signal)]
  if (api || localDefaults || config.routes.some((route) => route.credentials)) {
    checks.push(ready(new URL('/health', apiUrl), api, signal))
  }
  await Promise.all(checks)
}

function chromium() {
  const require = createRequire(resolve(webRoot, 'package.json'))
  let module
  try {
    module = require.resolve('playwright-core')
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error
    module = require.resolve('@playwright/test')
  }
  return require(module).chromium
}

export function isExpectedAnonymousMeConsoleError(text, locationUrl, sawAnonymousMe401) {
  if (!sawAnonymousMe401) return false
  if (typeof text !== 'string' || !text.includes('401')) return false
  if (!locationUrl) return true
  try {
    return new URL(locationUrl).pathname === '/me'
  } catch {
    return false
  }
}

function browserHelpers(browser, config) {
  const pages = new WeakMap()
  const sessions = new Map()
  const watchPage = (page) => {
    if (pages.has(page)) return pages.get(page)
    const issues = []
    let sawAnonymousMe401 = false
    pages.set(page, issues)
    page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`))
    page.on('response', (response) => {
      if (response.status() === 401) {
        try {
          if (new URL(response.url()).pathname === '/me') sawAnonymousMe401 = true
        } catch {}
      }
      if (response.status() >= 500) issues.push(`HTTP ${response.status()}: ${response.url()}`)
    })
    page.on('console', (message) => {
      if (message.type() !== 'error') return
      const text = message.text()
      const locationUrl = message.location?.()?.url ?? ''
      if (isExpectedAnonymousMeConsoleError(text, locationUrl, sawAnonymousMe401)) return
      issues.push(`console.error: ${text}`)
    })
    return issues
  }
  browser.on('context', (context) => context.on('page', watchPage))
  async function newContext(options = {}) {
    const context = await browser.newContext({ baseURL: config.webUrl.href, ...options })
    context.setDefaultTimeout(config.timeout)
    context.setDefaultNavigationTimeout(config.timeout)
    return context
  }
  async function loginContext(credentials = config.defaultAccount) {
    const { email, password } = account(credentials)
    const key = JSON.stringify([email, password])
    if (!sessions.has(key)) {
      sessions.set(key, (async () => {
        const context = await newContext()
        try {
          const endpoint = new URL('/api/auth/sign-in/email', config.apiUrl).href
          const response = await context.request.post(endpoint, {
            data: { email, password },
            headers: { Origin: config.webUrl.origin },
            timeout: config.timeout,
            maxRedirects: 0,
          })
          if (!response.ok() || !(await response.json()).user) throw new Error(`Sign-in failed (HTTP ${response.status()}).`)
          await response.dispose()
          return context
        } catch (error) {
          await context.close()
          throw error
        }
      })())
    }
    return sessions.get(key)
  }
  async function assertPageClean(page) {
    const issues = watchPage(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    const failures = overflow ? [...issues, 'Horizontal page overflow.'] : issues
    if (failures.length) throw new Error(failures.join('\n'))
  }
  return { newContext, loginContext, assertPageClean }
}

async function capture(context, route, config, helpers, result) {
  const { viewport, theme } = result
  const page = await context.newPage()
  try {
    await page.setViewportSize(config.viewportSizes[viewport])
    await page.emulateMedia({ colorScheme: theme })
    await page.addInitScript(({ origin, theme }) => {
      if (location.origin !== origin) return
      localStorage.setItem('colorPreference', JSON.stringify(theme))
      const apply = () => {
        document.documentElement.classList.toggle('light', theme === 'light')
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }
      if (document.documentElement) apply()
      else document.addEventListener('DOMContentLoaded', apply, { once: true })
    }, { origin: config.webUrl.origin, theme })
    const response = await page.goto(route.url, { waitUntil: 'networkidle' })
    if (response?.status() >= 400) throw new Error(`Navigation failed (HTTP ${response.status()}).`)
    const destination = new URL(page.url())
    if (destination.origin !== config.webUrl.origin) throw new Error('The route redirected to another origin.')
    if (route.credentials && destination.pathname === '/auth/login' &&
        new URL(route.url).pathname !== '/auth/login') throw new Error('The route redirected to login.')
    if (route.waitFor) await page.getByText(route.waitFor).first().waitFor({ state: 'visible' })
    if (route.selector) await page.locator(route.selector).first().waitFor({ state: 'visible' })
    const screenshot = `${route.name}-${viewport}-${theme}.png`
    await page.screenshot({ path: resolve(config.outDir, screenshot), fullPage: true })
    result.screenshot = screenshot
    await helpers.assertPageClean(page)
  } finally {
    await page.close()
  }
}

async function verify(config) {
  const { outDir, apiUrl, webUrl } = config
  mkdirSync(outDir, { recursive: true })
  const owned = { processes: [] }
  const report = { webUrl: webUrl.href, apiUrl: apiUrl.href, captures: [], errors: [] }
  const interruption = new AbortController()
  const { signal } = interruption
  const onInterrupt = () => interruption.abort(new Error('Verification interrupted.'))
  const untilInterrupted = async (work) => {
    signal.throwIfAborted()
    let stop
    try {
      return await Promise.race([work, new Promise((_, reject) => {
        stop = () => reject(signal.reason)
        signal.addEventListener('abort', stop, { once: true })
      })])
    } finally {
      signal.removeEventListener('abort', stop)
    }
  }
  process.on('SIGINT', onInterrupt)
  process.on('SIGTERM', onInterrupt)
  let browser
  try {
    await startServers(config, owned, signal, untilInterrupted)
    signal.throwIfAborted()
    browser = await chromium().launch({ timeout: config.timeout })
    signal.throwIfAborted()
    const helpers = browserHelpers(browser, config)
    const anonymous = config.routes.some((route) => !route.credentials) ? await helpers.newContext() : undefined
    for (const route of config.routes) {
      for (const viewport of route.viewports) {
        for (const theme of route.themes) {
          signal.throwIfAborted()
          const result = { route: route.name, viewport, theme }
          try {
            const context = route.credentials ? await untilInterrupted(helpers.loginContext(route.credentials)) : anonymous
            await untilInterrupted(capture(context, route, config, helpers, result))
            result.ok = true
          } catch (error) {
            signal.throwIfAborted()
            result.ok = false
            result.error = error.message
          }
          report.captures.push(result)
        }
      }
    }
    if (config.script) {
      report.workflow = { path: config.script, ok: false }
      const mod = await untilInterrupted(import(pathToFileURL(config.script).href))
      if (typeof mod.default !== 'function') throw new Error('The workflow module must export a default function.')
      await untilInterrupted(mod.default({ browser, ...helpers, webUrl: webUrl.origin, apiUrl: apiUrl.origin, outDir }))
      report.workflow.ok = true
    }
  } catch (error) {
    report.errors.push(error.message)
  } finally {
    const results = await Promise.allSettled([browser?.close(), ...owned.processes.map(stopChild)])
    for (const result of results) if (result.status === 'rejected') report.errors.push(result.reason.message)
    try {
      if (owned.manifestDir) rmSync(owned.manifestDir, { recursive: true, force: true })
    } catch (error) {
      report.errors.push(error.message)
    }
    process.off('SIGINT', onInterrupt)
    process.off('SIGTERM', onInterrupt)
  }
  const failures = report.captures.filter((capture) => !capture.ok).length
  report.ok = failures === 0 && report.errors.length === 0
  const reportPath = resolve(outDir, 'report.json')
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ ok: report.ok, captures: report.captures.length, failures, workflow: report.workflow?.ok, errors: report.errors, report: reportPath }))
  if (!report.ok) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = readConfig(process.argv.slice(process.argv[2] === '--' ? 3 : 2))
    if (config.help) {
      console.log('Usage: pnpm verify:ui [--config <path.json>] [--routes <name=path,...>] [--script <path.mjs>] [--out <dir>] [--web-url <url>] [--api-url <url>] [--start-servers] [--preview] [--login <email:password>] [--timeout <ms>]')
    } else await verify(config)
  } catch (error) {
    console.error(`verify:ui: ${error.message}`)
    process.exitCode = 1
  }
}
