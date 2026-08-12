import { describe, expect, it, vi } from 'vitest'

const tree = vi.hoisted(() => vi.fn())
vi.mock('@/framework/rpc', () => ({ rpc: { 'work-items': { tree: { $get: tree } } } }))

const { workItemsActions } = await import('./work-items.actions')

describe('work item tree action', () => {
  it('returns the server tree for the selected project', async () => {
    tree.mockResolvedValue({ ok: true, json: async () => ({ data: [{ id: 'w1', children: [] }] }) })
    await expect(workItemsActions.loadTree('project-1')).resolves.toEqual([{ id: 'w1', children: [] }])
    expect(tree).toHaveBeenCalledWith({ query: { projectId: 'project-1' } })
  })
})
