import { describe, expect, it } from 'vitest'
import { mergeDefaultsConfig } from '../mergeDefaultsConfig'

describe('config-meta runtime helpers', () => {
  it('deep merges objects while replacing scalar and array values', () => {
    const base = {
      nested: {
        first: 1,
        second: 2,
      },
      list: [1, 2, 3],
      label: 'base',
    }

    const result = mergeDefaultsConfig(base, {
      nested: {
        second: 9,
      },
      list: [9],
      label: 'override',
    })

    expect(result).toEqual({
      nested: {
        first: 1,
        second: 9,
      },
      list: [9],
      label: 'override',
    })

    expect(base).toEqual({
      nested: {
        first: 1,
        second: 2,
      },
      list: [1, 2, 3],
      label: 'base',
    })
  })

  it('merges explicit app base without mutating source', () => {
    const base: Record<string, any> = { global: { fieldsAlias: { name: 'Name' } }, values: ['base'] }
    const result = mergeDefaultsConfig(base, { global: { fieldsAlias: { code: 'Code' } }, values: ['app'] })

    expect(result).toEqual({
      global: { fieldsAlias: { name: 'Name', code: 'Code' } },
      values: ['app'],
    })
    expect(base).toEqual({ global: { fieldsAlias: { name: 'Name' } }, values: ['base'] })
  })
})
