import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const verifier = fileURLToPath(new URL('./verify-module.mjs', import.meta.url))

function run(t, args) {
  const cwd = mkdtempSync(join(tmpdir(), 'verify-module-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const callsPath = join(cwd, 'calls.jsonl')
  writeFileSync(join(cwd, 'pnpm'), `#!/usr/bin/env node
const args = process.argv.slice(2)
require('node:fs').appendFileSync(process.env.VERIFY_CALLS, JSON.stringify(args) + '\\n')
if (args[2] === 'build') {
  console.error('API could not build')
  process.exitCode = 3
}
if (args[2] === 'lint') {
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
  })
  assert.ifError(result.error)
  const calls = readFileSync(callsPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  return { ...result, calls, logs: join(cwd, '.local/verification/verify-module') }
}

test('continues after a failure, keeps full logs, and counts only native control warnings', (t) => {
  const runResult = run(t, ['--api-test', 'src/auth spec.ts', '--web-test', 'roles.spec.ts'])
  assert.equal(runResult.status, 1)
  assert.deepEqual(runResult.calls, [
    ['--filter', '@southneuhof/api', 'routes:compile'],
    ['--filter', '@southneuhof/api', 'build'],
    ['--filter', '@southneuhof/api', 'test:focused', '--', 'src/auth spec.ts'],
    ['--filter', '@southneuhof/framework-web', 'type-check'],
    ['--filter', '@southneuhof/framework-web', 'lint'],
    ['--filter', '@southneuhof/framework-web', 'test:focused', '--', 'roles.spec.ts'],
    ['run', 'test:surface-architecture'],
  ])
  assert.match(runResult.stdout, /api-build\s+FAIL \(3\)/)
  assert.match(runResult.stdout, /API could not build/)
  assert.match(runResult.stdout, /native-control warnings: 2\b/)
  assert.match(readFileSync(join(runResult.logs, 'web-lint.log'), 'utf8'), /Review this slot override/)
})

test('fail-fast skips subsequent steps without running them', (t) => {
  const result = run(t, ['--fail-fast'])
  assert.equal(result.status, 1)
  assert.deepEqual(result.calls.map((args) => args[2]), ['routes:compile', 'build'])
  assert.match(result.stdout, /web-lint\s+SKIP/)
  assert.equal(existsSync(join(result.logs, 'web-lint.log')), false)
})
