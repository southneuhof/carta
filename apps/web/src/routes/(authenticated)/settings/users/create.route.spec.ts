import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ create: vi.fn() }))

vi.mock('@/framework/rpc', () => ({ rpc: { users: { create: { $post: mocks.create } } } }))

const { users } = await import('./users.resource')

beforeEach(() => {
  mocks.create.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'u2', name: 'New user' } }) })
})

describe('user create action', () => {
  it('sends account fields and every selected role in one request', async () => {
    const input = {
      name: 'New user',
      email: 'new@example.test',
      password: 'password-123',
      roleIds: ['role-admin', 'role-auditor'],
    }

    await expect(users.create().run(input)).resolves.toEqual({ id: 'u2', name: 'New user' })
    expect(mocks.create).toHaveBeenCalledOnce()
    expect(mocks.create).toHaveBeenCalledWith({ json: input })
  })
})
