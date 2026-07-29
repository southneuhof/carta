import { describe, expect, it } from 'vitest'
import { builtInFormRenderers } from '@southneuhof/is-vue-framework'
import { inputCatalogKeys, serializeCatalogValue } from './inputCatalogDemo'

describe('public input catalog', () => {
  it('tracks every built-in renderer exactly once', () => {
    expect(new Set(inputCatalogKeys).size).toBe(inputCatalogKeys.length)
    expect([...inputCatalogKeys].sort()).toEqual(Object.keys(builtInFormRenderers).sort())
  })

  it('serializes opaque and circular debug values safely', () => {
    const value: Record<string, unknown> = { map: new Map([['key', 'value']]) }
    value.self = value
    expect(serializeCatalogValue(value)).toContain('[Circular]')
    expect(serializeCatalogValue(value)).toContain('"key": "value"')
  })
})
