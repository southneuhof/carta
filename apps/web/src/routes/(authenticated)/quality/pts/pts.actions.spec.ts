import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  action: vi.fn(),
  list: vi.fn(),
  detail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    'qhsse-pts': {
      list: { $get: mocks.list },
      detail: { ':id': { $get: mocks.detail } },
      create: { $post: mocks.create },
      update: { ':id': { $patch: mocks.update } },
      delete: { ':id': { $delete: mocks.remove } },
      action: { ':id': { actions: { ':action': { $post: mocks.action } } } },
    },
  },
}))

const { runAction } = await import('./pts.actions')

function response(data: unknown) {
  return new Response(JSON.stringify({ data }), { status: 200, headers: { 'content-type': 'application/json' } })
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
})

describe('manual PTS actions', () => {
  it('posts the typed action endpoint and preserves the action name', async () => {
    mocks.action.mockResolvedValue(response({ id: 'pts-1', stepCode: 'low-disposition' }))
    await expect(runAction('pts-1', 'disposition', { dispositionStatusCode: 'repair' })).resolves.toEqual({ id: 'pts-1', stepCode: 'low-disposition' })
    expect(mocks.action).toHaveBeenCalledWith({ param: { id: 'pts-1', action: 'disposition' }, json: { dispositionStatusCode: 'repair' } })
  })
})
