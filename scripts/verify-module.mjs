import { spawn } from 'node:child_process'
import { appendFileSync, closeSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { resolve } from 'node:path'
import { parseArgs, stripVTControlCharacters } from 'node:util'

const api = ['--filter', '@southneuhof/api']
const web = ['--filter', '@southneuhof/framework-web']
const options = {
  'api-test': { type: 'string' },
  'skip-api-test': { type: 'boolean' },
  'web-test': { type: 'string' },
  'skip-web-unit': { type: 'boolean' },
  concurrency: { type: 'string' },
  fast: { type: 'boolean' },
  'fail-fast': { type: 'boolean' },
  help: { type: 'boolean' },
}

function resolveConcurrency(raw) {
  if (raw === undefined) return Math.max(1, Math.min(3, Math.floor(availableParallelism() / 2)))
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 1 || String(parsed) !== raw.trim()) {
    throw new Error('Give a positive integer for --concurrency.')
  }
  return parsed
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await worker(items[index])
      }
    }),
  )
  return results
}

function runCommand(command, log) {
  const fd = openSync(log, 'w')
  let child
  try {
    child = spawn('pnpm', command, { stdio: ['ignore', fd, fd] })
  } finally {
    closeSync(fd)
  }
  return new Promise((done) => {
    let error
    child.once('error', (reason) => { error = reason })
    child.once('close', (status, signal) => {
      if (error || signal) appendFileSync(log, `\n${error?.message ?? `Terminated by ${signal}`}\n`)
      done(status ?? 1)
    })
  })
}

function countNativeWarnings(output) {
  return output.split('\n').filter((line) =>
    /^\s*\d+:\d+\s+warning\s+Review this native control against DESIGN\.md#controls-and-values\.?\s+vue\/no-restricted-syntax\s*$/.test(line),
  ).length
}

async function runStep([name, command], outDir) {
  if (!command) return { name, status: 'SKIP', log: '-' }

  const log = `${name}.log`
  const path = resolve(outDir, log)
  const start = performance.now()
  console.log(`[start] ${name}`)
  const code = await runCommand(command, path)
  const seconds = ((performance.now() - start) / 1000).toFixed(1)
  console.log(`[${code ? 'fail' : 'pass'} ${seconds}s] ${name}`)
  const output = code || name === 'web-lint' ? stripVTControlCharacters(readFileSync(path, 'utf8')) : ''
  const detail = name === 'web-lint' ? `; native-control warnings: ${countNativeWarnings(output)}` : ''
  return { name, status: code ? `FAIL (${code})${detail}` : `PASS${detail}`, log, code, output }
}

async function main() {
  const args = process.argv.slice(process.argv[2] === '--' ? 3 : 2)
  const { values } = parseArgs({ args, options })
  if (values.help) {
    console.log('Usage: pnpm verify:module [--api-test <path> | --skip-api-test] [--web-test <path> | --skip-web-unit] [--concurrency <n>] [--fast] [--fail-fast]')
    return
  }
  if ((values['api-test'] !== undefined && (values['skip-api-test'] || !values['api-test'].trim())) ||
      (values['web-test'] !== undefined && (values['skip-web-unit'] || !values['web-test'].trim()))) {
    throw new Error('Give a nonempty focused test path or skip the suite.')
  }
  const concurrency = resolveConcurrency(values.concurrency)

  const preparation = [
    ['api-build', [...api, 'build']],
    ['routes-compile', [...api, 'routes:compile']],
  ]
  const skipWebUnit = values['skip-web-unit'] || (values.fast && values['web-test'] === undefined)
  const checks = [
    ['surface-architecture', ['run', 'test:surface-architecture']],
    ['web-lint', [...web, 'lint']],
    ['web-type-check', [...web, 'type-check']],
    ['api-test', values['skip-api-test'] ? null : values['api-test'] ? [...api, 'test:focused', '--', values['api-test']] : [...api, 'test']],
    ['web-unit', skipWebUnit ? null : values['web-test'] ? [...web, 'test:focused', '--', values['web-test']] : [...web, 'test:unit']],
  ]
  const outDir = resolve('.local/verification/verify-module')
  mkdirSync(outDir, { recursive: true })
  const results = []
  let failed = false
  const shouldStop = () => values['fail-fast'] && failed
  for (const [name, command] of preparation) {
    const result = await runStep([name, shouldStop() ? null : command], outDir)
    if (result.code) failed = true
    results.push(result)
  }
  const checkResults = await runPool(checks, concurrency, async ([name, command]) => {
    const result = await runStep([name, shouldStop() ? null : command], outDir)
    if (result.code) failed = true
    return result
  })
  results.push(...checkResults)
  console.log(`\nLogs: ${outDir}\n`)
  const resultWidth = Math.max(...results.map(({ status }) => status.length), 'Result'.length) + 2
  console.log(`${'Step'.padEnd(22)}${'Result'.padEnd(resultWidth)}Log`)
  for (const { name, status, log } of results) console.log(`${name.padEnd(22)}${status.padEnd(resultWidth)}${log}`)
  for (const { name, code, output } of results) {
    if (!code) continue
    console.log(`\n${name} (last 12 lines)\n${output.trimEnd().split('\n').slice(-12).join('\n')}`)
    process.exitCode = 1
  }
}

try {
  await main()
} catch (error) {
  console.error(`verify:module: ${error.message}`)
  process.exitCode = 1
}
