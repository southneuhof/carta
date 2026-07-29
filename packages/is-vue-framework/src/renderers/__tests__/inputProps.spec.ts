import { describe, expect, it } from 'vitest'
import { createInputPropsRegistry } from '../inputProps'

describe('input props registry', () => {
  it('resolves defaults, source, then explicit props without mutation', () => {
    const source = { query: 'north' }
    const explicit = { query: 'private', nested: { explicit: true } }
    const registry = createInputPropsRegistry({
      lookup: { defaults: { dense: true, nested: { defaults: true } }, normalize: (value: typeof source) => ({ query: value.query, load: () => undefined, nested: { source: true } }) },
    })
    expect(registry.resolve('lookup', { source, props: explicit, context: { field: { key: 'sectionId' } } })).toEqual({
      dense: true, query: 'private', load: expect.any(Function), nested: { explicit: true },
    })
    expect(source).toEqual({ query: 'north' })
    expect(explicit).toEqual({ query: 'private', nested: { explicit: true } })
  })

  it('accepts falsy sources and passes explicit props through without a source', () => {
    const registry = createInputPropsRegistry({ flag: { normalize: (value: false | 0) => ({ value }) } })
    expect(registry.resolve('flag', { source: false })).toEqual({ value: false })
    expect(registry.resolve('unknown', { props: { native: true } })).toEqual({ native: true })
  })

  it('rejects missing, async, and non-plain source normalizers with field context', () => {
    const registry = createInputPropsRegistry({
      missing: {},
      async: { normalize: () => Promise.resolve({}) },
      array: { normalize: () => [] as unknown as Record<string, unknown> },
      map: { normalize: () => new Map() as unknown as Record<string, unknown> },
    })
    expect(() => registry.resolve('unknown', { source: {}, context: { field: { key: 'x' } } })).toThrow('unknown')
    expect(() => registry.resolve('missing', { source: {}, context: { field: { key: 'x' } } })).toThrow('missing')
    expect(() => registry.resolve('async', { source: {}, context: { field: { key: 'x' } } })).toThrow('synchronously')
    expect(() => registry.resolve('array', { source: {} })).toThrow('plain object')
    expect(() => registry.resolve('map', { source: {} })).toThrow('plain object')
  })
})
