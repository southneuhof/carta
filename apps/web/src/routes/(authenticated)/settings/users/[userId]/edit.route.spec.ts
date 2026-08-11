import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ detail: vi.fn(), update: vi.fn(), confirm: vi.fn() }))

vi.stubGlobal('confirm', mocks.confirm)
vi.mock('@/framework/rpc', () => ({
  rpc: {
    users: {
      detail: { ':id': { $get: mocks.detail } },
      update: { ':id': { $patch: mocks.update } },
    },
  },
}))

const { userOperations } = await import('../users.operations')

const updateInput = { name: 'Updated user', username: 'updated-user', statusCode: 'non_active' as const }

beforeEach(() => {
  mocks.detail.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'u1', statusCode: 'active' } }) })
  mocks.update.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'u1', ...updateInput } }) })
  mocks.confirm.mockReset()
})

describe('user edit status confirmation', () => {
  it('keeps the form operation cancelled when the administrator declines', async () => {
    mocks.confirm.mockReturnValue(false)

    await expect(userOperations.update!('u1', updateInput)).rejects.toThrow('Status change cancelled.')
    expect(mocks.confirm).toHaveBeenCalledWith('Disabling this user will end all active sessions. Continue?')
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('updates after the administrator confirms and lets the API own session cleanup', async () => {
    mocks.confirm.mockReturnValue(true)

    await expect(userOperations.update!('u1', updateInput)).resolves.toEqual({ id: 'u1', ...updateInput })
    expect(mocks.update).toHaveBeenCalledWith({ param: { id: 'u1' }, json: updateInput })
  })

  it('leaves the form operation failed when the update request fails', async () => {
    mocks.confirm.mockReturnValue(true)
    mocks.update.mockResolvedValue({ ok: false, json: async () => ({ error: 'forbidden', message: 'Update denied.' }) })

    await expect(userOperations.update!('u1', updateInput)).rejects.toMatchObject({ error: 'forbidden', message: 'Update denied.' })
  })
})
