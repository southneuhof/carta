import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appRoot = join(__dirname, '..', '..')
const authenticatedViewsRoot = join(appRoot, 'views', 'authenticated')

function walk(dir: string, acc: string[] = []): string[] {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (full.endsWith('.vue') || full.endsWith('.ts')) acc.push(full)
  }
  return acc
}

describe('calculator exclusion', () => {
  it('menu has no calculator module', () => {
    const menuContent = readFileSync(join(appRoot, 'menu.ts'), 'utf-8')
    expect(menuContent.toLowerCase()).not.toContain('calculatortype')
    expect(menuContent.toLowerCase()).not.toContain('calculator')
  })

  it('standard CRUD views have no calculator path or import', () => {
    const files = walk(authenticatedViewsRoot).filter((file) => {
      const normalized = file.toLowerCase()
      return !normalized.includes('/dashboard/') && !normalized.includes('calculatordetail.vue')
    })

    for (const file of files) {
      expect(file.toLowerCase()).not.toContain('calculator')
      if (!file.includes('__tests__')) {
        const content = readFileSync(file, 'utf-8').toLowerCase()
        expect(content).not.toContain('calculator')
      }
    }
  })
})
