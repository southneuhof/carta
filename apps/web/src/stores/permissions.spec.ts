import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { computed } from 'vue'

import { permissions } from './permissions'

describe('permissions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    permissions().clear()
  })

  it('builds only from an explicit permission array', () => {
    const store = permissions()
    store.build(['stale-permission'])

    expect(store.has('stale-permission')).toBe(true)

    store.build([])

    expect(store.has('stale-permission')).toBe(false)
  })

  it('does not grant permissions without an explicit code', () => {
    expect(permissions().has('view-unlisted-route')).toBe(false)
  })

  it('updates computed consumers when permissions are built or cleared', () => {
    const store = permissions()
    const canViewUsers = computed(() => store.has('view-users'))

    expect(canViewUsers.value).toBe(false)
    store.build(['view-users'])
    expect(canViewUsers.value).toBe(true)
    store.clear()
    expect(canViewUsers.value).toBe(false)
  })
})
