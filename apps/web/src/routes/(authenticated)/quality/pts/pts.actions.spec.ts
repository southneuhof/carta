import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  lookups: vi.fn(),
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
      lookups: { $get: mocks.lookups },
      action: { ':id': { actions: { ':action': { $post: mocks.action } } } },
    },
  },
}))

const { loadLookups, lookupOptions, runAction } = await import('./pts.actions')

function response(data: unknown) {
  return new Response(JSON.stringify({ data }), { status: 200, headers: { 'content-type': 'application/json' } })
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
})

describe('manual PTS actions', () => {
  it('filters dependent lookup options without a second transport contract', async () => {
    mocks.lookups.mockImplementation(() => response({
      divisions: [], projects: [{ id: 'p1', name: 'Project', divisionId: 'd1' }, { id: 'p2', name: 'Other', divisionId: 'd2' }],
      ptsWorkCategories: [], rootCauses: [], projectVendors: [], projectUsers: [],
      workItems: [
        { id: 'category', name: 'Category', projectId: 'p1', parentId: null },
        { id: 'leaf', name: 'Leaf', projectId: 'p1', parentId: 'category' },
        { id: 'other', name: 'Other', projectId: 'p1', parentId: null },
      ],
    }))
    await expect(lookupOptions('projects', { query: {}, searchParameters: { divisionId: 'd1' } })).resolves.toMatchObject({ data: [{ id: 'p1' }] })
    await expect(lookupOptions('workItems', { query: {}, searchParameters: { projectId: 'p1', leafOnly: true, workItemCategoryId: 'category' } })).resolves.toMatchObject({ data: [{ id: 'leaf' }] })
    expect(mocks.lookups).toHaveBeenCalledWith({ query: { projectId: 'p1' } })
  })

  it('posts the typed action endpoint and preserves the action name', async () => {
    mocks.action.mockResolvedValue(response({ id: 'pts-1', stepCode: 'low-disposition' }))
    await expect(runAction('pts-1', 'disposition', { dispositionStatusCode: 'repair' })).resolves.toEqual({ id: 'pts-1', stepCode: 'low-disposition' })
    expect(mocks.action).toHaveBeenCalledWith({ param: { id: 'pts-1', action: 'disposition' }, json: { dispositionStatusCode: 'repair' } })
  })
})
