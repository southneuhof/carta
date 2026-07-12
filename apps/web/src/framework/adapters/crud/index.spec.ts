import { describe, expect, it } from 'vitest'
import { defineRPCResources } from './index'

type TestClient = {
  items: {
    list: unknown
    detail: unknown
    create: unknown
    update: unknown
    delete: unknown
  }
  partial: {
    list: unknown
    detail: unknown
    update: unknown
  }
  health: { $get: unknown }
}

describe('defineRPCResources', () => {
  it('returns stable inert endpoint names', () => {
    const resources = defineRPCResources<TestClient>()
    expect(resources.items).toBe('items')
    expect(resources.items).toBe(resources.items)
    expect(resources.partial).toBe('partial')
  })

  it('does not expose non-CRUD branches in its type', () => {
    const resources = defineRPCResources<TestClient>()
    // @ts-expect-error health lacks CRUD routes
    void resources.health
  })
})
