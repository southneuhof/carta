import { beforeEach, describe, expect, it, vi } from 'vitest'

const hasPermission = vi.hoisted(() => vi.fn())
vi.mock('@/stores/permissions', () => ({ permissions: () => ({ has: hasPermission }) }))

import { accessAdapter, allowsPermission } from './bundle'

describe('web access adapter', () => {
  beforeEach(() => hasPermission.mockReset())

  it('uses server operations for project records', () => {
    const record = { id: 'project-1', allowedOperations: ['detail', 'delete'] }

    expect(accessAdapter.allows({ operation: 'detail', permission: 'view-projects', record })).toBe(true)
    expect(accessAdapter.allows({ operation: 'update', permission: 'manage-projects', record })).toBe(false)
    expect(accessAdapter.allows({ operation: 'delete', permission: 'manage-projects', record })).toBe(true)
    expect(hasPermission).not.toHaveBeenCalled()
  })

  it('uses memory system permissions without record operations', () => {
    hasPermission.mockImplementation((permission: string) => permission === 'show-users' || permission === 'view-users')

    expect(accessAdapter.allows({ operation: 'detail', permission: 'users.detail' })).toBe(true)
    expect(accessAdapter.allows({ operation: 'detail', permission: 'users.update' })).toBe(false)
    expect(accessAdapter.allows({ operation: 'list', permission: undefined })).toBe(true)
    expect(allowsPermission('view-users')).toBe(true)
  })

  it('does not infer access from a malformed operations field', () => {
    hasPermission.mockReturnValue(false)

    expect(accessAdapter.allows({ operation: 'update', permission: 'manage-projects', record: { allowedOperations: 'update' } })).toBe(false)
    expect(accessAdapter.allows({ operation: 'update', permission: 'manage-projects', record: {} })).toBe(false)
  })
})
