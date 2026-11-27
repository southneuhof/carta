import { spawn } from 'node:child_process'
import { appendFileSync, closeSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs, stripVTControlCharacters } from 'node:util'

const api = ['--filter', '@southneuhof/api']
const web = ['--filter', '@southneuhof/framework-web']
const options = {
  'api-test': { type: 'string' },
  'skip-api-test': { type: 'boolean' },
  'web-test': { type: 'string' },
  'skip-web-unit': { type: 'boolean' },
  fast: { type: 'boolean' },
  'fail-fast': { type: 'boolean' },
  help: { type: 'boolean' },
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
    console.log('Usage: pnpm verify:module [--api-test <path> | --skip-api-test] [--web-test <path> | --skip-web-unit] [--fast] [--fail-fast]')
    return
  }
  if ((values['api-test'] !== undefined && (values['skip-api-test'] || !values['api-test'].trim())) ||
      (values['web-test'] !== undefined && (values['skip-web-unit'] || !values['web-test'].trim()))) {
    throw new Error('Give a nonempty focused test path or skip the suite.')
  }

  const preparation = [
    ['api-build', [...api, 'build']],
    ['routes-compile', [...api, 'routes:compile']],
  ]
  const skipWebUnit = values['skip-web-unit'] || (values.fast && values['web-test'] === undefined)
  const checks = [
    ['api-test', values['skip-api-test'] ? null : values['api-test'] ? [...api, 'test:focused', '--', values['api-test']] : [...api, 'test']],
    ['web-type-check', [...web, 'type-check']],
    ['web-lint', [...web, 'lint']],
    ['web-unit', skipWebUnit ? null : values['web-test'] ? [...web, 'test:focused', '--', values['web-test']] : [...web, 'test:unit']],
    ['surface-architecture', ['run', 'test:surface-architecture']],
  ]
  const outDir = resolve('.local/verification/verify-module')
  mkdirSync(outDir, { recursive: true })
  const results = []
  const shouldStop = () => values['fail-fast'] && results.some(({ code }) => code)
  for (const [name, command] of preparation) {
    results.push(await runStep([name, shouldStop() ? null : command], outDir))
  }
  const skipChecks = shouldStop()
  results.push(...await Promise.all(checks.map(([name, command]) => runStep([name, skipChecks ? null : command], outDir))))
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
