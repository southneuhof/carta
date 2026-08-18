import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized } from '@southneuhof/sprindle'
import { orgIdentity, requirePermission } from '../../identity'
import { createInspectionTestPlanSchema, updateInspectionTestPlanSchema } from './inspection-test-plans.schemas'
import {
  createInspectionTestPlan,
  deleteInspectionTestPlan,
  getInspectionTestPlan,
  loadInspectionTestPlanTemplate,
  loadInspectionTestPlanTree,
  updateInspectionTestPlan,
} from './inspection-test-plans.service'

async function caller(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity.userId
}

export const templateInspectionTestPlans = defineRoute({
  method: 'get',
  authorize: [authenticated(), requirePermission('view-projects')],
  action: async (args) => {
    const userId = await caller(args)
    const projectId = args.c.req.query('projectId')
    return args.c.json({ data: await loadInspectionTestPlanTemplate(projectId ?? '', userId) })
  },
})

export const treeInspectionTestPlans = defineRoute({
  method: 'get',
  authorize: [authenticated(), requirePermission('view-projects')],
  action: async (args) => {
    const userId = await caller(args)
    const projectId = args.c.req.param('projectId')
    if (!projectId) throw notFound()
    return args.c.json({ data: await loadInspectionTestPlanTree(userId, projectId) })
  },
})

export const createInspectionTestPlans = defineRoute({
  method: 'post',
  state: async ({ c }) => ({ input: createInspectionTestPlanSchema.parse(await c.req.json().catch(() => ({}))) }),
  action: async (args) => args.c.json({ data: await createInspectionTestPlan(await caller(args), args.state.input) }, 201),
})

export const detailInspectionTestPlans = defineRoute({
  method: 'get',
  path: '/:id',
  authorize: [authenticated(), requirePermission('view-projects')],
  action: async (args) => {
    const id = args.c.req.param('id')
    if (!id) throw notFound()
    return args.c.json({ data: await getInspectionTestPlan(await caller(args), id) })
  },
})

export const updateInspectionTestPlans = defineRoute({
  method: 'patch',
  path: '/:id',
  state: async ({ c }) => ({ input: updateInspectionTestPlanSchema.parse(await c.req.json().catch(() => ({}))) }),
  action: async (args) => {
    const id = args.c.req.param('id')
    if (!id) throw notFound()
    return args.c.json({ data: await updateInspectionTestPlan(await caller(args), id, args.state.input) })
  },
})

export const deleteInspectionTestPlans = defineRoute({
  method: 'delete',
  path: '/:id',
  action: async (args) => {
    const id = args.c.req.param('id')
    if (!id) throw notFound()
    return args.c.json({ data: await deleteInspectionTestPlan(await caller(args), id) })
  },
})
