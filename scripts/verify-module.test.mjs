import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const verifier = fileURLToPath(new URL('./verify-module.mjs', import.meta.url))

function run(t, args, { stageSize = 0 } = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'verify-module-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const callsPath = join(cwd, 'calls.jsonl')
  writeFileSync(join(cwd, 'pnpm'), `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require('node:fs')
const { setTimeout: delay } = require('node:timers/promises')
const args = process.argv.slice(2)
const callsPath = process.env.VERIFY_CALLS
appendFileSync(callsPath, JSON.stringify(args) + '\\n')
if (args[2] === 'build') {
  console.error('API could not build')
  process.exitCode = 3
} else if (args[2] !== 'routes:compile') {
  waitForChecks()
}
async function waitForChecks() {
  const deadline = Date.now() + 4000
  while (readFileSync(callsPath, 'utf8').trim().split('\\n').length < ${stageSize} + 2) {
    if (Date.now() >= deadline) {
      console.error('The remaining checks did not start while this check was running.')
      process.exitCode = 4
      return
    }
    await delay(20)
  }
  if (args[2] !== 'lint') return
  console.log('  3:7  warning  Review this native control against DESIGN.md#controls-and-values.  vue/no-restricted-syntax')
  console.log('  5:7  warning  Review this native control against DESIGN.md#controls-and-values  vue/no-restricted-syntax')
  console.log('  9:7  warning  Review this slot override.  vue/no-restricted-syntax')
  console.log('  2:1  error    Review this native control against DESIGN.md#controls-and-values.  vue/no-restricted-syntax')
}
`, { mode: 0o755 })
  const result = spawnSync(process.execPath, [verifier, ...args], {
    cwd,
    env: { ...process.env, PATH: cwd + delimiter + process.env.PATH, VERIFY_CALLS: callsPath },
    encoding: 'utf8',
    timeout: 12_000,
  })
  assert.ifError(result.error)
  const calls = readFileSync(callsPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  return { ...result, calls, logs: join(cwd, '.local/verification/verify-module') }
}

test('builds before compiling routes, then starts every enabled check before any check finishes', (t) => {
  const runResult = run(t, ['--fast', '--api-test', 'src/auth spec.ts', '--web-test', 'roles.spec.ts'], { stageSize: 5 })
  assert.equal(runResult.status, 1)
  assert.deepEqual(runResult.calls.slice(0, 2), [
    ['--filter', '@southneuhof/api', 'build'],
    ['--filter', '@southneuhof/api', 'routes:compile'],
  ])
  assert.deepEqual(runResult.calls.slice(2).map(JSON.stringify).sort(), [
    ['--filter', '@southneuhof/api', 'test:focused', '--', 'src/auth spec.ts'],
    ['--filter', '@southneuhof/framework-web', 'type-check'],
    ['--filter', '@southneuhof/framework-web', 'lint'],
    ['--filter', '@southneuhof/framework-web', 'test:focused', '--', 'roles.spec.ts'],
    ['run', 'test:surface-architecture'],
  ].map(JSON.stringify).sort())
  assert.match(runResult.stdout, /^\[start\] api-build\n\[fail [\d.]+s\] api-build\n\[start\] routes-compile\n\[pass [\d.]+s\] routes-compile\n/)
  for (const step of ['api-test', 'web-type-check', 'web-lint', 'web-unit', 'surface-architecture']) {
    assert.match(runResult.stdout, new RegExp(`\\[pass [\\d.]+s\\] ${step}\\n`))
  }
  assert.match(runResult.stdout, /api-build\s+FAIL \(3\)/)
  assert.match(runResult.stdout, /Step\s+Result\s+Log[\s\S]+api-build \(last 12 lines\)\nAPI could not build/)
  assert.match(runResult.stdout, /native-control warnings: 2\b/)
  assert.match(readFileSync(join(runResult.logs, 'web-lint.log'), 'utf8'), /Review this slot override/)
})

test('fast mode skips the web unit suite and still runs the focused API test', (t) => {
  const result = run(t, ['--fast', '--api-test', 'users.spec.ts'])
  assert.deepEqual(result.calls.find((args) => args[2] === 'test:focused'),
    ['--filter', '@southneuhof/api', 'test:focused', '--', 'users.spec.ts'])
  assert.equal(result.calls.some((args) => args[2] === 'test:unit'), false)
  assert.match(result.stdout, /web-unit\s+SKIP/)
})

test('fail-fast skips subsequent steps without running them', (t) => {
  const result = run(t, ['--fail-fast'])
  assert.equal(result.status, 1)
  assert.deepEqual(result.calls.map((args) => args[2]), ['build'])
  assert.match(result.stdout, /web-lint\s+SKIP/)
  assert.equal(existsSync(join(result.logs, 'web-lint.log')), false)
})
