import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ detail: vi.fn(), create: vi.fn(), list: vi.fn() }))
vi.mock('@/framework/rpc', () => ({ rpc: { projects: { list: { $get: mocks.list }, detail: { ':id': { $get: mocks.detail } }, create: { $post: mocks.create } } } }))

const { projectsActions } = await import('./projects.actions')

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

beforeEach(() => {
  mocks.detail.mockReset()
  mocks.create.mockReset()
  mocks.list.mockReset()
})

describe('project location actions', () => {
  it('forwards list searchParameters to the owner list', async () => {
    mocks.list.mockResolvedValue(ok({ data: [{ id: 'p1', name: 'Project' }], page: 2, limit: 10, total: 1 }))
    await expect(projectsActions.list({ query: { page: 2, limit: 10 }, searchParameters: { permission: 'create-qhsse-pts', divisionId: 'd1', active: true } } as never)).resolves.toMatchObject({ data: [{ id: 'p1' }], meta: { page: 2, pageSize: 10, total: 1 } })
    expect(mocks.list).toHaveBeenCalledWith(
      { query: { permission: 'create-qhsse-pts', divisionId: 'd1', active: 'true', page: '2', limit: '10' } },
      expect.anything(),
    )
  })

  it('maps stored locations for detail and create', async () => {
    mocks.detail.mockResolvedValue(ok({ data: { id: 'p1', location: { address: 'Jakarta', lat: null, lng: null } } }))
    await expect(projectsActions.detail({ id: 'p1', searchParameters: {} })).resolves.toMatchObject({
      location: { formatted_address: 'Jakarta', lat: 0, lng: 0 },
    })

    mocks.create.mockResolvedValue(ok({ data: { id: 'p1' } }))
    await projectsActions.create({ location: { formatted_address: 'Jakarta', lat: -6.2, lng: 106.8 } } as never)
    expect(mocks.create).toHaveBeenCalledWith({ json: { location: { address: 'Jakarta', lat: -6.2, lng: 106.8 } } })
  })
})
