import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

const distRoot = process.argv[2]

if (!distRoot) {
  throw new Error('Pass dist root path as first argument.')
}

const testSuffixes = ['.spec.', '.test.']

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const targetPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === '__tests__') {
        await rm(targetPath, { recursive: true, force: true })
        continue
      }

      await walk(targetPath)
      continue
    }

    if (!entry.isFile()) continue
    if (testSuffixes.some((suffix) => entry.name.includes(suffix))) {
      await rm(targetPath, { force: true })
    }
  }
}

await walk(distRoot)
