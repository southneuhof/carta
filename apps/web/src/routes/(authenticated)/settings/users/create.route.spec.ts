import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ create: vi.fn() }))

vi.mock('@/framework/rpc', () => ({ rpc: { users: { create: { $post: mocks.create } } } }))

const { createUser } = await import('./create.operations')

beforeEach(() => {
  mocks.create.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'u2', name: 'New user' } }) })
})

describe('user create route operation', () => {
  it('sends account fields and every selected system role in one request', async () => {
    const input = {
      name: 'New user',
      username: 'new-user',
      email: 'new@example.test',
      password: 'password-123',
      imgPhotoUser: null,
      systemRoleIds: ['role-admin', 'role-auditor'],
    }

    await expect(createUser(input)).resolves.toEqual({ id: 'u2', name: 'New user' })
    expect(mocks.create).toHaveBeenCalledOnce()
    expect(mocks.create).toHaveBeenCalledWith({ json: input })
  })
})
