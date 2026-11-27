import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { isExpectedAnonymousMeConsoleError, readConfig } from './verify-ui.mjs'

function fixture(t, config) {
  const cwd = mkdtempSync(join(tmpdir(), 'verify-ui-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  writeFileSync(join(cwd, 'review.json'), JSON.stringify(config))
  return cwd
}

test('applies CLI overrides without losing the config viewport and workflow', (t) => {
  const cwd = fixture(t, {
    webUrl: 'http://old.test',
    outDir: 'old',
    viewports: ['mobile'],
    login: { email: 'old@example.test', password: 'old' },
    routes: [{ name: 'old', path: '/old' }],
    script: './workflow.mjs',
  })
  const config = readConfig([
    '--config', 'review.json', '--web-url', 'http://new.test', '--out', 'evidence',
    '--login', 'new@example.test:password:with:colons', '--routes', 'list=/list?sort=name',
  ], cwd)

  assert.equal(config.outDir, join(cwd, 'evidence'))
  assert.equal(config.script, join(cwd, 'workflow.mjs'))
  assert.deepEqual(config.routes.map(({ name, url, viewports, credentials }) => ({ name, url, viewports, credentials })), [{
    name: 'list',
    url: 'http://new.test/list?sort=name',
    viewports: ['mobile'],
    credentials: { email: 'new@example.test', password: 'password:with:colons' },
  }])
})

test('keeps anonymous routes separate from default and route-specific accounts', (t) => {
  const login = { email: 'first@example.test', password: 'first' }
  const auth = { email: 'second@example.test', password: 'second' }
  const cwd = fixture(t, {
    login,
    routes: [
      { name: 'public', path: '/public', auth: false },
      { name: 'account', path: '/account', auth: true },
      { name: 'second', path: '/account', auth, themes: ['dark'] },
    ],
  })
  const config = readConfig(['--config', 'review.json'], cwd)

  assert.deepEqual(config.routes.map((route) => route.credentials), [undefined, login, auth])
  assert.deepEqual(config.routes[2].themes, ['dark'])
})

test('defaults to four capture workers and accepts config and CLI overrides', (t) => {
  const cwd = fixture(t, { concurrency: 2, routes: [{ name: 'app', path: '/' }] })
  assert.equal(readConfig(['--routes', 'app=/']).concurrency, 4)
  assert.equal(readConfig(['--config', 'review.json'], cwd).concurrency, 2)
  assert.equal(readConfig(['--config', 'review.json', '--concurrency', '1'], cwd).concurrency, 1)
})

test('rejects capture limits that are not positive whole numbers', (t) => {
  for (const value of ['0', '-1', '1.5', '1e2', 'many', '9007199254740992', '']) {
    assert.throws(() => readConfig(['--routes', 'app=/', `--concurrency=${value}`]), /--concurrency must be a positive integer/)
  }
  const cwd = fixture(t, { concurrency: '2', routes: [{ name: 'app', path: '/' }] })
  assert.throws(() => readConfig(['--config', 'review.json'], cwd), /--concurrency must be a positive integer/)
})

test('rejects cross-origin routes before a browser can send an authenticated request', () => {
  assert.throws(
    () => readConfig(['--web-url', 'http://app.test', '--routes', 'external=//unrelated.test/']),
    /Route external must use the web origin/,
  )
})

test('rejects routes that would write outside or overwrite another route capture', () => {
  assert.throws(() => readConfig(['--routes', '../report=/']), /file-safe name/)
  assert.throws(() => readConfig(['--routes', 'List=/list,list=/other']), /Duplicate route name/)
})

test('ignores expected anonymous /me 401 console errors without hiding other 401 errors', () => {
  const msg = 'Failed to load resource: the server responded with a status of 401 (Unauthorized)'
  assert.equal(isExpectedAnonymousMeConsoleError(msg, 'http://localhost:15280/me', true), true)
  assert.equal(isExpectedAnonymousMeConsoleError(msg, 'http://localhost:15280/me', false), false)
  assert.equal(isExpectedAnonymousMeConsoleError(msg, 'http://localhost:15280/api/incidents', true), false)
  assert.equal(isExpectedAnonymousMeConsoleError('Uncaught TypeError: boom', 'http://localhost:15280/me', true), false)
})

test('cleans up another process group after an owned route compiler fails', {
  skip: process.platform !== 'linux',
}, async (t) => {
  const cwd = fixture(t, {
    startServers: true,
    routes: [{ name: 'app', path: '/' }],
  })
  const verifier = fileURLToPath(new URL('./verify-ui.mjs', import.meta.url))
  const port = async () => {
    const socket = createServer()
    const listening = once(socket, 'listening')
    socket.listen(0, '127.0.0.1')
    await listening
    const { port } = socket.address()
    await new Promise((done, reject) => socket.close((error) => error ? reject(error) : done()))
    return port
  }
  const apiPort = await port()
  const webPort = await port()
  const childPort = await port()
  writeFileSync(join(cwd, 'pnpm'), `#!/usr/bin/env python3
import subprocess
import sys
child = subprocess.Popen([sys.executable, '-c', """
import socket, time
with socket.socket() as server:
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('127.0.0.1', ${childPort}))
    server.listen()
    print('ready', flush=True)
    time.sleep(15)
"""], process_group=0, stdout=subprocess.PIPE)
assert child.stdout.readline() == b'ready\\n'
sys.exit(7)
`, { mode: 0o755 })
  const child = spawn(process.execPath, [
    verifier, '--config', 'review.json',
    '--web-url', `http://127.0.0.1:${webPort}`, '--api-url', `http://127.0.0.1:${apiPort}`,
  ], { cwd, env: { ...process.env, PATH: cwd + delimiter + process.env.PATH }, stdio: ['ignore', 'pipe', 'inherit'] })
  let output = ''
  child.stdout.setEncoding('utf8').on('data', (chunk) => { output += chunk })
  const [code] = await once(child, 'close')
  assert.equal(code, 1)
  assert.match(output, /Route compilation failed \(7\)/)

  const check = createServer()
  const listening = once(check, 'listening')
  check.listen(childPort, '127.0.0.1')
  await listening
  await new Promise((done) => check.close(done))
})
