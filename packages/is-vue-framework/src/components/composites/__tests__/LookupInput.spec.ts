import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('LookupInput migration boundary', () => {
  it('uses core Table and explicit loaders', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/composites/form-inputs/LookupInput.vue'), 'utf8')
    expect(source).toContain("../../core/Table.vue")
    expect(source).toContain('loadDetail')
    expect(source).toContain('#row-prefix')
    expect(source.match(/#row-actions="\{ record \}"/g)).toHaveLength(1)
    expect(source).not.toMatch(/getAPI|useFrameworkRuntime|list-rowActions/)
  })
})
