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
  { id: 'n1', statusCode: 'unseen' },
  { id: 'n2', statusCode: 'seen' },
  { id: 'n3', statusCode: 'unset' },
  { id: 'n4', statusCode: 'unseen' },
] as never

describe('notifications resource', () => {
  it('offers no write control, because notifications are produced by workflows', () => {
    expect(notifications.table().controls).toEqual([])
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
  it('counts unseen only, never unset', () => {
    // `unset` is a chain step whose turn has not come, not an unread message.
    // Counting it inflates every badge in the system.
    expect(unreadIds(rows)).toEqual(['n1', 'n4'])
    expect(unreadIds(rows)).not.toContain('n3')
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
