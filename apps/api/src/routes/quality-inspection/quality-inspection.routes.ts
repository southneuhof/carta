import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized } from '@southneuhof/sprindle'
import { orgIdentity, requirePermission } from '../../identity'
import {
  completeReportQualityInspectionSchema,
  createQualityInspectionSchema,
  qualityInspectionContextOperationSchema,
  qualityInspectionListQuerySchema,
  submitQualityInspectionDocumentationsSchema,
  updateQualityInspectionSchema,
  verifyQualityInspectionSchema,
  verifyQualityInspectionWorkItemItpSchema,
} from './quality-inspection.schemas'
import {
  completeReportQualityInspection,
  createQualityInspection,
  deleteQualityInspection,
  getQualityInspection,
  listQualityInspectionSchedules,
  listQualityInspections,
  loadQualityInspectionCreateContext,
  scheduleCreateContext,
  submitQualityInspectionDocumentations,
  updateQualityInspection,
  verifyQualityInspection,
  verifyQualityInspectionWorkItemItp,
} from './quality-inspection.service'

async function caller(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity.userId
}

export const listQualityInspectionRoute = defineRoute({
  method: 'get',
  authorize: [authenticated(), requirePermission('view-quality-inspection')],
  action: async (args) => {
    const query = qualityInspectionListQuerySchema.parse(args.c.req.query())
    const result = await listQualityInspections(await caller(args), query)
    return args.c.json({ data: result.data, page: query.page, limit: query.limit, total: result.total })
  },
})

export const detailQualityInspectionRoute = defineRoute({
  method: 'get',
  path: '/:id',
  authorize: [authenticated(), requirePermission('show-quality-inspection')],
  action: async (args) => {
    const id = args.c.req.param('id')
    if (!id) throw notFound()
    return args.c.json({ data: await getQualityInspection(await caller(args), id) })
  },
})

export const createQualityInspectionRoute = defineRoute({
  method: 'post',
  authorize: [authenticated()],
  state: async ({ c }) => ({ input: createQualityInspectionSchema.parse(await c.req.json().catch(() => ({}))) }),
  action: async (args) => args.c.json({ data: await createQualityInspection(await caller(args), args.state.input) }, 201),
})

export const updateQualityInspectionRoute = defineRoute({
  method: 'patch',
  path: '/:id',
  authorize: [authenticated()],
  state: async ({ c }) => ({ input: updateQualityInspectionSchema.parse(await c.req.json().catch(() => ({}))) }),
  action: async (args) => {
    const id = args.c.req.param('id')
    if (!id) throw notFound()
    return args.c.json({ data: await updateQualityInspection(await caller(args), id, args.state.input) })
  },
})

export const deleteQualityInspectionRoute = defineRoute({
  method: 'delete',
  path: '/:id',
  authorize: [authenticated()],
  action: async (args) => {
    const id = args.c.req.param('id')
    if (!id) throw notFound()
    return args.c.json({ data: await deleteQualityInspection(await caller(args), id, await args.c.req.json().catch(() => ({}))) })
  },
})

export const createContextQualityInspectionRoute = defineRoute({
  method: 'get',
  authorize: [authenticated(), requirePermission('view-quality-inspection')],
  action: async (args) => {
    const projectId = args.c.req.query('projectId') ?? ''
    const operation = qualityInspectionContextOperationSchema.parse(args.c.req.query('operation') ?? 'create')
    return args.c.json({ data: await loadQualityInspectionCreateContext(await caller(args), projectId, operation) })
  },
})

export const listSchedulesQualityInspectionRoute = defineRoute({
  method: 'get',
  authorize: [authenticated(), requirePermission('view-quality-inspection')],
  action: async (args) => args.c.json({ data: await listQualityInspectionSchedules(await caller(args)) }),
})

export const scheduleContextQualityInspectionRoute = defineRoute({
  method: 'get',
  authorize: [authenticated(), requirePermission('view-quality-inspection')],
  action: async (args) => {
    const id = args.c.req.param('id')
    if (!id) throw notFound()
    return args.c.json({ data: await scheduleCreateContext(await caller(args), id) })
  },
})

export const completeReportQualityInspectionRoute = defineRoute({
  method: 'post',
  authorize: [authenticated()],
  state: async ({ c }) => ({ input: completeReportQualityInspectionSchema.parse(await c.req.json().catch(() => ({}))) }),
  action: async (args) => { const id = args.c.req.param('id'); if (!id) throw notFound(); return args.c.json({ data: await completeReportQualityInspection(await caller(args), id, args.state.input) }) },
})

export const verifyWorkItemQualityInspectionRoute = defineRoute({
  method: 'post',
  authorize: [authenticated()],
  state: async ({ c }) => ({ input: verifyQualityInspectionWorkItemItpSchema.parse(await c.req.json().catch(() => ({}))) }),
  action: async (args) => { const id = args.c.req.param('id'); const rowId = args.c.req.param('workItemRowId'); if (!id || !rowId) throw notFound(); return args.c.json({ data: await verifyQualityInspectionWorkItemItp(await caller(args), id, rowId, args.state.input) }) },
})

export const submitDocumentationsQualityInspectionRoute = defineRoute({
  method: 'post',
  authorize: [authenticated()],
  state: async ({ c }) => ({ input: submitQualityInspectionDocumentationsSchema.parse(await c.req.json().catch(() => ({}))) }),
  action: async (args) => { const id = args.c.req.param('id'); if (!id) throw notFound(); return args.c.json({ data: await submitQualityInspectionDocumentations(await caller(args), id, args.state.input) }) },
})

export const verifyQualityInspectionRoute = defineRoute({
  method: 'post',
  authorize: [authenticated()],
  state: async ({ c }) => ({ input: verifyQualityInspectionSchema.parse(await c.req.json().catch(() => ({}))) }),
  action: async (args) => { const id = args.c.req.param('id'); if (!id) throw notFound(); return args.c.json({ data: await verifyQualityInspection(await caller(args), id, args.state.input) }) },
})
