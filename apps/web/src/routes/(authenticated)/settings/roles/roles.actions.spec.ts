import { beforeEach, describe, expect, it, vi } from 'vitest'

const update = vi.hoisted(() => vi.fn())
vi.mock('@/framework/rpc', () => ({ rpc: { roles: { update: { ':id': { $patch: update } } } } }))

const { rolesActions } = await import('./roles.actions')

describe('role update action', () => {
  beforeEach(() => update.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) }))

  it('does not send immutable realm', async () => {
    await rolesActions.update('role-1', { realm: 'system', name: 'Editor' } as never)
    expect(update).toHaveBeenCalledWith({ param: { id: 'role-1' }, json: { name: 'Editor' } })
  })
})
