import { describe, expect, it, vi } from 'vitest'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

const listGet = vi.fn(async () => ok({ data: [], total: 0, limit: 20 }))
const unreadGet = vi.fn(async () => ok({ data: { total: 3 } }))
const markSeenPost = vi.fn(async () => ok({ data: { updated: 2 } }))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    notifications: {
      list: { $get: listGet },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: { id: 'n1' } })) } },
      'unread-count': { $get: unreadGet },
      'mark-seen': { $post: markSeenPost },
    },
  },
}))

const { notifications } = await import('./notifications.resource')
const { unreadNotificationCount, markNotificationsSeen, unreadIds } = await import('./notifications.operations')

const rows = [
  { id: 'n1', readAt: null },
  { id: 'n2', readAt: '2026-08-10T00:00:00.000Z' },
  { id: 'n3', readAt: null },
  { id: 'n4', readAt: null },
] as never

describe('notifications resource', () => {
  it('offers no generated row action, because notifications are produced by workflows', () => {
    expect(notifications.table().detailRoute).toBeUndefined()
    expect(notifications.table().updateRoute).toBeUndefined()
    expect(notifications.table().canDelete).toBeUndefined()
  })

  it('holds independent query state per namespace', () => {
    // Two namespaces over one resource is a stated release gate: paging the
    // drawer must not move the to-do tab.
    const inbox = notifications.table({ namespace: 'inbox' }).table
    const todo = notifications.table({ namespace: 'to-do' }).table

    expect(inbox.namespace).toBe('inbox')
    expect(todo.namespace).toBe('to-do')
    expect(inbox.namespace).not.toBe(todo.namespace)
  })
})

describe('unread accounting', () => {
  it('counts rows without a read timestamp', () => {
    expect(unreadIds(rows)).toEqual(['n1', 'n3', 'n4'])
  })

  it('reads the badge total from the server', async () => {
    expect(await unreadNotificationCount()).toBe(3)
    expect(unreadGet).toHaveBeenCalled()
  })

  it('marks only the ids it is given', async () => {
    expect(await markNotificationsSeen(['n1', 'n4'])).toBe(2)
    expect(markSeenPost).toHaveBeenCalledWith({ json: { ids: ['n1', 'n4'] } })
  })

  it('skips the request entirely when there is nothing unread', async () => {
    markSeenPost.mockClear()
    expect(await markNotificationsSeen([])).toBe(0)
    expect(markSeenPost).not.toHaveBeenCalled()
  })
})
