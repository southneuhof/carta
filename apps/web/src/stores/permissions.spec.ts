import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const storageGet = vi.hoisted(() => vi.fn())

vi.mock('@southneuhof/utilities/storage', () => ({
  storage: { localStorage: { get: storageGet } },
}))

import { permissions } from './permissions'

describe('permissions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    storageGet.mockImplementation((key: string) => key === 'permissions' ? ['stale-permission'] : { role_id: 2 })
  })

  it('clears stale permissions when rebuilt with an empty array', () => {
    const store = permissions()

    expect(store.has('stale-permission')).toBe(true)

    store.build([])

    expect(store.has('stale-permission')).toBe(false)
  })
})
