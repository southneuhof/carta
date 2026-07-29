import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const input = (name: string) => readFileSync(resolve(process.cwd(), 'src/components/inputs', name), 'utf8')

describe('explicit option sources', () => {
  it.each(['SelectInput.vue', 'RadioGroupInput.vue', 'CheckboxGroupInput.vue'])('%s has no wired runtime endpoint', (name) => {
    const source = input(name)
    expect(source).toContain('useOptionSource')
    expect(source).not.toMatch(/getAPI|defaultSelectGetData|useFrameworkRuntime/)
  })
})
