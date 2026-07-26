import { describe, expect, it } from 'vitest'
import { list } from '../../routes'
import { defineModel } from '../../model'
import { createMemorySource } from '../memory-source'
import { createTestEntity, testApp } from '../test-entity'

type Item = { id: string; name: string; status: string }

const seed: Item[] = [
  { id: 'a', name: 'Alpha', status: 'active' },
  { id: 'b', name: 'Beta', status: 'active' },
  { id: 'c', name: 'Gamma', status: 'archived' },
]

const context = undefined as never

describe('createMemorySource', () => {
  it('paginates and reports the pre-slice total', async () => {
    const source = createMemorySource<Item>({ rows: seed })
    expect(await source.list({ query: { page: 2, limit: 2 }, context })).toEqual({ data: [seed[2]], total: 3 })
  })

  it('searches string fields case-insensitively', async () => {
    const source = createMemorySource<Item>({ rows: seed })
    expect(await source.list({ query: { search: 'amm' }, context })).toEqual({ data: [seed[2]], total: 1 })
  })

  it('sorts ascending and descending', async () => {
    const source = createMemorySource<Item>({ rows: seed })
    const descending = await source.list({ query: { sort: 'name', order: 'desc' }, context })
    expect(descending.data.map((row) => row.id)).toEqual(['c', 'b', 'a'])
  })

  it('filters on equality', async () => {
    const source = createMemorySource<Item>({ rows: seed })
    expect(await source.list({ query: { status: 'archived' }, context })).toEqual({ data: [seed[2]], total: 1 })
  })

  it('rejects unknown filter keys and sort columns', async () => {
    const source = createMemorySource<Item>({ rows: seed })
    await expect(source.list({ query: { nope: 'x' }, context })).rejects.toThrow('Unknown query parameter "nope".')
    await expect(source.list({ query: { sort: 'nope' }, context })).rejects.toThrow('Unknown sort column "nope".')
  })

  it('creates, reads, updates and deletes', async () => {
    const source = createMemorySource<Item>()

    const created = await source.create({ input: { id: 'a', name: 'Alpha', status: 'active' }, context })
    expect(created).toEqual({ id: 'a', name: 'Alpha', status: 'active' })
    expect(await source.detail({ id: 'a', context })).toEqual(created)

    expect(await source.update({ id: 'a', input: { name: 'Renamed' }, context })).toMatchObject({ name: 'Renamed' })
    expect(await source.update({ id: 'missing', input: {}, context })).toBeNull()

    expect(await source.delete({ id: 'a', context })).toBe(true)
    expect(await source.delete({ id: 'a', context })).toBe(false)
    expect(source.rows).toEqual([])
  })

  it('generates an id when create omits one', async () => {
    const source = createMemorySource<Item>()
    const created = await source.create({ input: { name: 'Alpha', status: 'active' }, context })
    expect(created.id).toMatch(/[0-9a-f-]{36}/)
  })
})

describe('testApp', () => {
  it('serves a model built from a test entity', async () => {
    const model = defineModel({ path: '/items', entity: createTestEntity(), routes: { list: list() } })
    const response = await testApp([model] as const).request('/items/list')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: [], page: 1, limit: 20, total: 0 })
  })
})
