import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { orgIdentity } from '../../identity'
import { actionSchemas, createReportSchema, updateReportSchema, type ActionName } from './qhsse-pts.schemas'
import {
  createReport,
  getPtsCreateDivision,
  getPtsCreateCategory,
  getPtsCreateProject,
  getPtsCreateRootCause,
  getPtsCreateUser,
  getPtsCreateVendor,
  getPtsCreateWorkItem,
  getReport,
  listPtsCreateDivisions as readPtsCreateDivisions,
  listPtsCreateCategories as readPtsCreateCategories,
  listPtsCreateProjects as readPtsCreateProjects,
  listPtsCreateRootCauses as readPtsCreateRootCauses,
  listPtsCreateUsers as readPtsCreateUsers,
  listPtsCreateVendors as readPtsCreateVendors,
  listPtsCreateWorkItems as readPtsCreateWorkItems,
  listReports,
  performAction,
  updateReport,
} from './qhsse-pts.service'

export const listPtsCreateDivisions = defineRoute({
  path: '/qhsse-pts/create-options/divisions/list',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    const result = await readPtsCreateDivisions(userId, args.state.query)
    return args.c.json({ data: result.data, page: args.state.query.page, limit: args.state.query.limit, total: result.total })
  },
})

export const detailPtsCreateDivision = defineRoute({
  path: '/qhsse-pts/create-options/divisions/detail/:id',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await getPtsCreateDivision(userId, id, args.state.query) })
  },
})

export const listPtsCreateCategories = defineRoute({
  path: '/qhsse-pts/create-options/pts-work-categories/list',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    const result = await readPtsCreateCategories(userId, args.state.query)
    return args.c.json({ data: result.data, page: args.state.query.page, limit: args.state.query.limit, total: result.total })
  },
})

export const detailPtsCreateCategory = defineRoute({
  path: '/qhsse-pts/create-options/pts-work-categories/detail/:id',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await getPtsCreateCategory(userId, id, args.state.query) })
  },
})

export const listPtsCreateProjects = defineRoute({
  path: '/qhsse-pts/create-options/projects/list',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    const result = await readPtsCreateProjects(userId, args.state.query)
    return args.c.json({ data: result.data, page: args.state.query.page, limit: args.state.query.limit, total: result.total })
  },
})

export const detailPtsCreateProject = defineRoute({
  path: '/qhsse-pts/create-options/projects/detail/:id',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await getPtsCreateProject(userId, id, args.state.query) })
  },
})

export const listPtsCreateRootCauses = defineRoute({
  path: '/qhsse-pts/create-options/root-causes/list',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    const result = await readPtsCreateRootCauses(userId, args.state.query)
    return args.c.json({ data: result.data, page: args.state.query.page, limit: args.state.query.limit, total: result.total })
  },
})

export const detailPtsCreateRootCause = defineRoute({
  path: '/qhsse-pts/create-options/root-causes/detail/:id',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await getPtsCreateRootCause(userId, id, args.state.query) })
  },
})

export const listPtsCreateWorkItems = defineRoute({
  path: '/qhsse-pts/create-options/work-items/list',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    const result = await readPtsCreateWorkItems(userId, args.state.query)
    return args.c.json({ data: result.data, page: args.state.query.page, limit: args.state.query.limit, total: result.total })
  },
})

export const detailPtsCreateWorkItem = defineRoute({
  path: '/qhsse-pts/create-options/work-items/detail/:id',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await getPtsCreateWorkItem(userId, id, args.state.query) })
  },
})

export const listPtsCreateVendors = defineRoute({
  path: '/qhsse-pts/create-options/project-vendors/list',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    const result = await readPtsCreateVendors(userId, args.state.query)
    return args.c.json({ data: result.data, page: args.state.query.page, limit: args.state.query.limit, total: result.total })
  },
})

export const detailPtsCreateVendor = defineRoute({
  path: '/qhsse-pts/create-options/project-vendors/detail/:id',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await getPtsCreateVendor(userId, id, args.state.query) })
  },
})

export const listPtsCreateUsers = defineRoute({
  path: '/qhsse-pts/create-options/project-users/list',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    if (!userId) return args.c.json({ error: 'unauthorized' }, 401)
    const result = await readPtsCreateUsers(userId, args.state.query)
    return args.c.json({ data: result.data, page: args.state.query.page, limit: args.state.query.limit, total: result.total })
  },
})

export const detailPtsCreateUser = defineRoute({
  path: '/qhsse-pts/create-options/project-users/detail/:id',
  method: 'get',
  authorize: [authenticated()],
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async (args) => {
    const userId = await caller(args)
    const id = args.c.req.param('id')
    if (!userId || !id) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await getPtsCreateUser(userId, id, args.state.query) })
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
