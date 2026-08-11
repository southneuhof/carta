import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { orgIdentity } from '../../identity'
import { actionSchemas, createReportSchema, updateReportSchema, type ActionName } from './qhsse-pts.schemas'
import { createReport, deleteReport, getReport, listLookups, listReports, performAction, updateReport } from './qhsse-pts.service'

export const listPtsLookups = defineRoute({
  path: '/qhsse-pts/lookups',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    return args.c.json({
      data: await listLookups(userId, args.c.req.query('projectId')),
    })
  },
})

async function caller(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) return undefined
  return identity.userId
}

export const listPts = defineRoute({
  path: '',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    const query = listQuerySchema.parse(args.c.req.query())
    const result = await listReports(userId, query)
    return args.c.json({ data: result.data, page: query.page, limit: query.limit, total: result.total })
  },
})

export const createPts = defineRoute({
  path: '',
  method: 'post',
  authorize: [authenticated()],
  state: async ({ c }) => ({
    input: createReportSchema.parse(await c.req.json().catch(() => ({}))),
  }),
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    return args.c.json({ data: await createReport(userId, args.state.input) }, 201)
  },
})

export const detailPts = defineRoute({
  path: '/:id',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await getReport(userId, id) })
  },
})

export const updatePts = defineRoute({
  path: '/:id',
  method: 'patch',
  authorize: [authenticated()],
  state: async ({ c }) => ({
    input: updateReportSchema.parse(await c.req.json().catch(() => ({}))),
  }),
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({
      data: await updateReport(userId, id, args.state.input),
    })
  },
})

export const deletePts = defineRoute({
  path: '/:id',
  method: 'delete',
  authorize: [authenticated()],
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ ok: await deleteReport(userId, id) })
  },
})

const actionPath = '/:id/actions/:action' as const
const actionInput = {}

export const actionPts = defineRoute({
  path: actionPath,
  method: 'post',
  authorize: [authenticated()],
  state: async ({ c }) => ({
    action: c.req.param('action') as ActionName,
    input: await c.req.json().catch(() => actionInput),
  }),
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    if (!(args.state.action in actionSchemas)) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({
      data: await performAction(userId, id, args.state.action, args.state.input),
    })
  },
})
