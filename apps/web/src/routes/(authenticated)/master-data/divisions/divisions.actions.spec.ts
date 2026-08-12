import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ detail: vi.fn(), create: vi.fn() }))
vi.mock('@/framework/rpc', () => ({ apiUrl: 'https://api.test/', rpc: { divisions: { detail: { ':id': { $get: mocks.detail } }, create: { $post: mocks.create } } } }))

const { divisionsActions } = await import('./divisions.actions')

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

beforeEach(() => {
  mocks.detail.mockReset()
  mocks.create.mockReset()
})

describe('division image actions', () => {
  it('maps detail assets and stores only their paths on create', async () => {
    mocks.detail.mockResolvedValue(ok({ data: { id: 'd1', imgThumbnail: 'uploads/logo.png' } }))
    await expect(divisionsActions.detail({ id: 'd1', searchParameters: {} })).resolves.toMatchObject({
      imgThumbnail: { kind: 'file', path: 'uploads/logo.png', name: 'logo.png' },
    })

    mocks.create.mockResolvedValue(ok({ data: { id: 'd1' } }))
    await divisionsActions.create({ imgThumbnail: { path: 'uploads/logo.png' } } as never)
    expect(mocks.create).toHaveBeenCalledWith({ json: { imgThumbnail: 'uploads/logo.png' } })
  })
})
