import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  createContext: vi.fn(),
  schedules: vi.fn(),
  scheduleContext: vi.fn(),
  completeReport: vi.fn(),
  verifyWorkItem: vi.fn(),
  submitDocumentations: vi.fn(),
  verify: vi.fn(),
}))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    'quality-inspection': {
      list: { $get: mocks.list },
      detail: { ':id': { $get: mocks.detail } },
      create: { $post: mocks.create },
      update: { ':id': { $patch: mocks.update } },
      delete: { ':id': { $delete: mocks.remove } },
      createContext: { $get: mocks.createContext },
      schedules: { list: { $get: mocks.schedules }, ':id': { createContext: { $get: mocks.scheduleContext } } },
      actions: { ':id': { completeReport: { $post: mocks.completeReport }, submitDocumentations: { $post: mocks.submitDocumentations }, verify: { $post: mocks.verify }, workItems: { ':workItemRowId': { verify: { $post: mocks.verifyWorkItem } } } } },
    },
  },
}))

const { loadCreateContext } = await import('./quality-inspection.actions')

function response(data: unknown) {
  return new Response(JSON.stringify({ data }), { status: 200, headers: { 'content-type': 'application/json' } })
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
})

describe('Inspection/Test context action', () => {
  it('sends the fixed create or update operation to the context endpoint', async () => {
    mocks.createContext.mockImplementation(() => response({ tree: [] }))

    await expect(loadCreateContext('project-1', 'create')).resolves.toEqual({ tree: [] })
    await expect(loadCreateContext('project-1', 'update')).resolves.toEqual({ tree: [] })

    expect(mocks.createContext).toHaveBeenNthCalledWith(1, { query: { projectId: 'project-1', operation: 'create' } })
    expect(mocks.createContext).toHaveBeenNthCalledWith(2, { query: { projectId: 'project-1', operation: 'update' } })
  })
})
