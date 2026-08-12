import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  optionList: vi.fn(),
  optionDetail: vi.fn(),
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
      'create-options': {
        divisions: { list: { $get: mocks.optionList }, detail: { ':id': { $get: mocks.optionDetail } } },
        'pts-work-categories': { list: { $get: mocks.optionList }, detail: { ':id': { $get: mocks.optionDetail } } },
        projects: { list: { $get: mocks.optionList }, detail: { ':id': { $get: mocks.optionDetail } } },
        'root-causes': { list: { $get: mocks.optionList }, detail: { ':id': { $get: mocks.optionDetail } } },
        'work-items': { list: { $get: mocks.optionList }, detail: { ':id': { $get: mocks.optionDetail } } },
        'project-vendors': { list: { $get: mocks.optionList }, detail: { ':id': { $get: mocks.optionDetail } } },
        'project-users': { list: { $get: mocks.optionList }, detail: { ':id': { $get: mocks.optionDetail } } },
      },
      action: { ':id': { actions: { ':action': { $post: mocks.action } } } },
    },
  },
}))

const { ptsCreateOptionActions, runAction } = await import('./pts.actions')

function response(data: unknown) {
  return new Response(JSON.stringify({ data }), { status: 200, headers: { 'content-type': 'application/json' } })
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
})

describe('manual PTS actions', () => {
  it('sends option dependencies and pagination to the server', async () => {
    mocks.optionList.mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 'p1', name: 'Project' }], page: 2, limit: 10, total: 1 }), { status: 200, headers: { 'content-type': 'application/json' } }))
    await expect(ptsCreateOptionActions.projects.list({ query: { page: 2, limit: 10 }, searchParameters: { divisionId: 'd1' } } as never)).resolves.toMatchObject({ data: [{ id: 'p1' }], meta: { page: 2, pageSize: 10, total: 1 } })
    expect(mocks.optionList).toHaveBeenCalledWith(
      { query: { divisionId: 'd1', page: '2', limit: '10' } },
      expect.anything(),
    )
  })

  it('hydrates one selected option through its detail endpoint', async () => {
    mocks.optionDetail.mockResolvedValue(response({ id: 'leaf', name: 'Leaf' }))
    await expect(ptsCreateOptionActions.workItems.detail({ id: 'leaf', searchParameters: { projectId: 'p1', workItemCategoryId: 'category', leafOnly: true } })).resolves.toEqual({ id: 'leaf', name: 'Leaf' })
    expect(mocks.optionDetail).toHaveBeenCalledWith(
      { param: { id: 'leaf' }, query: { projectId: 'p1', workItemCategoryId: 'category', leafOnly: 'true' } },
      expect.anything(),
    )
  })

  it('posts the typed action endpoint and preserves the action name', async () => {
    mocks.action.mockResolvedValue(response({ id: 'pts-1', stepCode: 'low-disposition' }))
    await expect(runAction('pts-1', 'disposition', { dispositionStatusCode: 'repair' })).resolves.toEqual({ id: 'pts-1', stepCode: 'low-disposition' })
    expect(mocks.action).toHaveBeenCalledWith({ param: { id: 'pts-1', action: 'disposition' }, json: { dispositionStatusCode: 'repair' } })
  })
})
