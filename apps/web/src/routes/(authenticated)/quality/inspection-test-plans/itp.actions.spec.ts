import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  template: vi.fn(),
  tree: vi.fn(),
  detail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    'inspection-test-plans': {
      template: { $get: mocks.template },
      project: { ':projectId': { tree: { $get: mocks.tree } } },
      detail: { ':id': { $get: mocks.detail } },
      create: { $post: mocks.create },
      update: { ':id': { $patch: mocks.update } },
      delete: { ':id': { $delete: mocks.remove } },
    },
  },
}))

const { itpActions, loadItpTemplate, loadItpTree } = await import('./itp.actions')

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), { status, headers: { 'content-type': 'application/json' } })
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
})

describe('ITP actions', () => {
  it('loads the project template and tree through their typed endpoints', async () => {
    mocks.template.mockResolvedValue(response({ inspectorTypes: [], inspectionPoints: [] }))
    mocks.tree.mockResolvedValue(response([]))

    await expect(loadItpTemplate('project-1')).resolves.toEqual({ inspectorTypes: [], inspectionPoints: [] })
    await expect(loadItpTree('project-1')).resolves.toEqual([])
    expect(mocks.template).toHaveBeenCalledWith({ query: { projectId: 'project-1' } })
    expect(mocks.tree).toHaveBeenCalledWith({ param: { projectId: 'project-1' } })
  })

  it('keeps the complete grid in create and update payloads', async () => {
    const inspectors = [{ inspectorTypeId: 'sc', points: [{ inspectionPointCode: 'P', value: false }] }]
    mocks.create.mockResolvedValue(response({ id: 'itp-1', inspectors }, 201))
    mocks.update.mockResolvedValue(response({ id: 'itp-1', inspectors }))

    await expect(itpActions.create({ workItemId: 'work-item-1', type: 'material', frequency: 1, inspectors })).resolves.toEqual({ id: 'itp-1', inspectors })
    await expect(itpActions.update('itp-1', { type: 'material', frequency: 1, inspectors })).resolves.toEqual({ id: 'itp-1', inspectors })
    expect(mocks.create).toHaveBeenCalledWith({ json: { workItemId: 'work-item-1', type: 'material', frequency: 1, inspectors } })
    expect(mocks.update).toHaveBeenCalledWith({ param: { id: 'itp-1' }, json: { type: 'material', frequency: 1, inspectors } })
  })
})
