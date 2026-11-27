import { spawnSync } from 'node:child_process'
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
  'fail-fast': { type: 'boolean' },
  help: { type: 'boolean' },
}

function runStep(command, log) {
  const fd = openSync(log, 'w')
  let result
  try {
    result = spawnSync('pnpm', command, { stdio: ['ignore', fd, fd] })
  } finally {
    closeSync(fd)
  }
  if (result.error || result.signal) {
    appendFileSync(log, `\n${result.error?.message ?? `Terminated by ${result.signal}`}\n`)
  }
  return result.status ?? 1
}

function countNativeWarnings(output) {
  return output.split('\n').filter((line) =>
    /^\s*\d+:\d+\s+warning\s+Review this native control against DESIGN\.md#controls-and-values\.?\s+vue\/no-restricted-syntax\s*$/.test(line),
  ).length
}

function main() {
  const args = process.argv.slice(process.argv[2] === '--' ? 3 : 2)
  const { values } = parseArgs({ args, options })
  if (values.help) {
    console.log('Usage: pnpm verify:module [--api-test <path> | --skip-api-test] [--web-test <path> | --skip-web-unit] [--fail-fast]')
    return
  }
  if ((values['api-test'] !== undefined && (values['skip-api-test'] || !values['api-test'].trim())) ||
      (values['web-test'] !== undefined && (values['skip-web-unit'] || !values['web-test'].trim()))) {
    throw new Error('Give a nonempty focused test path or skip the suite.')
  }

  const steps = [
    ['routes-compile', [...api, 'routes:compile']],
    ['api-build', [...api, 'build']],
    ['api-test', values['skip-api-test'] ? null : values['api-test'] ? [...api, 'test:focused', '--', values['api-test']] : [...api, 'test']],
    ['web-type-check', [...web, 'type-check']],
    ['web-lint', [...web, 'lint']],
    ['web-unit', values['skip-web-unit'] ? null : values['web-test'] ? [...web, 'test:focused', '--', values['web-test']] : [...web, 'test:unit']],
    ['surface-architecture', ['run', 'test:surface-architecture']],
  ]
  const outDir = resolve('.local/verification/verify-module')
  mkdirSync(outDir, { recursive: true })
  const results = []
  let failed = false
  for (const [name, command] of steps) {
    if (!command || (failed && values['fail-fast'])) {
      results.push({ name, status: 'SKIP', log: '-' })
      continue
    }

    const log = `${name}.log`
    const path = resolve(outDir, log)
    const status = runStep(command, path)
    const output = status || name === 'web-lint' ? stripVTControlCharacters(readFileSync(path, 'utf8')) : ''
    const detail = name === 'web-lint' ? `; native-control warnings: ${countNativeWarnings(output)}` : ''
    results.push({ name, status: status ? `FAIL (${status})${detail}` : `PASS${detail}`, log })
    if (status) {
      failed = true
      console.log(`\n${name} (last 12 lines)\n${output.trimEnd().split('\n').slice(-12).join('\n')}`)
    }
  }
  console.log(`\nLogs: ${outDir}\n`)
  const resultWidth = Math.max(...results.map(({ status }) => status.length), 'Result'.length) + 2
  console.log(`${'Step'.padEnd(22)}${'Result'.padEnd(resultWidth)}Log`)
  for (const { name, status, log } of results) console.log(`${name.padEnd(22)}${status.padEnd(resultWidth)}${log}`)
  if (failed) process.exitCode = 1
}

try {
  main()
} catch (error) {
  console.error(`verify:module: ${error.message}`)
  process.exitCode = 1
}
