import { beforeEach, describe, expect, it, vi } from 'vitest'

const canPermission = vi.hoisted(() => vi.fn())
vi.mock('@/stores/permissions', () => ({ permissions: () => ({ can: canPermission }) }))

import { accessAdapter, allowsPermission } from './bundle'

describe('web access adapter', () => {
  beforeEach(() => canPermission.mockReset())

  it('uses server operations for project records', () => {
    const record = { id: 'project-1', allowedOperations: ['detail', 'delete'] }

    expect(accessAdapter.allows({ operation: 'detail', permission: 'view-projects', record })).toBe(true)
    expect(accessAdapter.allows({ operation: 'update', permission: 'manage-projects', record })).toBe(false)
    expect(accessAdapter.allows({ operation: 'delete', permission: 'manage-projects', record })).toBe(true)
    expect(canPermission).not.toHaveBeenCalled()
  })

  it('uses exact declared permissions without record operations', () => {
    canPermission.mockImplementation((permission: string) => permission === 'detail-users' || permission === 'view-users')

    expect(accessAdapter.allows({ operation: 'detail', permission: 'detail-users' })).toBe(true)
    expect(accessAdapter.allows({ operation: 'detail', permission: ['users', 'detail'].join('.') })).toBe(false)
    expect(accessAdapter.allows({ operation: 'list', permission: undefined })).toBe(true)
    expect(allowsPermission('view-users')).toBe(true)
    expect(canPermission).toHaveBeenCalledWith('detail-users')
    expect(canPermission).toHaveBeenCalledWith('users.detail')
  })

  it('accepts the effective /me union for targetless checks', () => {
    const effective = new Set(['view-users', 'create-rtm'])
    canPermission.mockImplementation((permission: string) => effective.has(permission))

    expect(allowsPermission('create-rtm')).toBe(true)
    expect(allowsPermission('view-users')).toBe(true)
    expect(allowsPermission('list-divisions')).toBe(false)
  })

  it('does not infer access from a malformed operations field', () => {
    canPermission.mockReturnValue(false)

    expect(accessAdapter.allows({ operation: 'update', permission: 'manage-projects', record: { allowedOperations: 'update' } })).toBe(false)
    expect(accessAdapter.allows({ operation: 'update', permission: 'manage-projects', record: {} })).toBe(false)
  })
})
