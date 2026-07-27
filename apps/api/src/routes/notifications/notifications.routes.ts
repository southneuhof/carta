import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import type { ModelRuntimeContext } from '@southneuhof/sprindle/model'
import type { TypedResponse } from 'hono'
import { inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../db'
import { orgIdentity } from '../../identity'
import { notification, notifications } from './notifications.entity'
import { scopeConditions } from './notifications.source'

type RelationalReader = { findMany: (config?: unknown) => Promise<unknown[]> }
type ScopedDb = { query: Record<string, RelationalReader> }

const markSeenSchema = z.object({ ids: z.array(z.string()).max(200) })
type MarkSeenInput = { json: z.input<typeof markSeenSchema> }
type MarkSeenOutput = TypedResponse<{ data: { updated: number } }, 200, 'json'>

/** Rows the caller may legitimately see, optionally narrowed further. */
async function visibleRows(identity: Awaited<ReturnType<typeof orgIdentity>>, extra: Record<string, unknown>[] = [], columns?: Record<string, true>) {
  const db = getDb() as unknown as ScopedDb
  return db.query.notifications.findMany({
    where: { AND: [...scopeConditions(identity), ...extra] },
    ...(columns ? { columns } : { with: { jobPosition: true, role: true, section: true } }),
  })
}

export const notificationDetail = defineRoute({
  path: '/notifications/detail/:id',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => {
    const id = args.c.req.param('id')
    const rows = await visibleRows(await orgIdentity(args), [{ id }])
    const found = rows[0]
    // A row the caller may not see is indistinguishable from one that does not
    // exist. Answering 403 here would confirm the id.
    if (!found) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: notification.schemas.select.parse(found) })
  },
})

export const unreadCount = defineRoute({
  path: '/notifications/unread-count',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => {
    // `unset` is excluded on purpose: it marks a chain step whose turn has not
    // come, not an unread message. Counting it inflates the badge.
    const rows = await visibleRows(await orgIdentity(args), [{ statusCode: 'unseen' }], { id: true })
    return args.c.json({ data: { total: rows.length } })
  },
})

export const markSeen = defineRoute<MarkSeenOutput, ModelRuntimeContext, 'post', '/notifications/mark-seen', MarkSeenInput>({
  path: '/notifications/mark-seen',
  method: 'post',
  authorize: [authenticated()],
  action: async (args) => {
    const body = markSeenSchema.parse(await args.c.req.json().catch(() => ({})))
    if (body.ids.length === 0) return args.c.json({ data: { updated: 0 } })

    const identity = await orgIdentity(args)
    const visible = (await visibleRows(identity, [{ id: { in: body.ids } }], { id: true })) as { id: string }[]

    // Only ids the caller is genuinely a recipient of are updated. Passing someone
    // else's id updates nothing and still answers 200 — a 403 would turn this route
    // into an existence oracle for other sections' notification ids.
    if (visible.length === 0) return args.c.json({ data: { updated: 0 } })

    const updated = await getDb()
      .update(notifications)
      .set({ statusCode: 'seen' })
      .where(inArray(notifications.id, visible.map((row) => row.id)))
      .returning({ id: notifications.id })

    return args.c.json({ data: { updated: updated.length } })
  },
})
