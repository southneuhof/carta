import { authenticated, defineRoute, deleteRoute, detail } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, eq, ilike, type SQL } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { incidentStatementDocumentConfig, incidentStatementDocumentConfigs } from './incident-statement-document-configs.entity'

const listAccess = [authenticated(), requirePermission('list-incident-statement-document-configs')]
const detailAccess = [authenticated(), requirePermission('detail-incident-statement-document-configs')]
const createAccess = [authenticated(), requirePermission('create-incident-statement-document-configs')]
const updateAccess = [authenticated(), requirePermission('update-incident-statement-document-configs')]
const deleteAccess = [authenticated(), requirePermission('delete-incident-statement-document-configs')]
const reservedQueryKeys = new Set(['page', 'limit', 'search', 'sort', 'order', 'permission'])

async function actor(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity
}

function requiredId(args: Parameters<typeof actor>[0]) {
  const id = args.c.req.param('id')
  if (!id) throw notFound()
  return id
}

function listWhere(query: Record<string, unknown>) {
  const conditions: SQL[] = []
  for (const key of Object.keys(query)) {
    if (reservedQueryKeys.has(key) || key === 'active') continue
    throw validationError(`Unknown query parameter "${key}".`)
  }
  if (query.active !== undefined) conditions.push(eq(incidentStatementDocumentConfigs.active, query.active as boolean))
  if (typeof query.search === 'string' && query.search) conditions.push(ilike(incidentStatementDocumentConfigs.name, `%${query.search}%`))
  return conditions.length ? and(...conditions) : undefined
}

export const incidentStatementDocumentConfigCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = incidentStatementDocumentConfig.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(incidentStatementDocumentConfigs).values({ ...input, name: input.name.trim(), createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Incident statement document config was not created.')
    return args.c.json({ data: incidentStatementDocumentConfig.schemas.select.parse(row) }, 201)
  },
})

export const incidentStatementDocumentConfigUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = incidentStatementDocumentConfig.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof incidentStatementDocumentConfigs.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (input.name !== undefined) values.name = input.name.trim()
    const updated = await getDb().update(incidentStatementDocumentConfigs).set(values).where(eq(incidentStatementDocumentConfigs.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: incidentStatementDocumentConfig.schemas.select.parse(updated[0]) })
  },
})

export const incidentStatementDocumentConfigModel = defineModel({
  path: '/incident-statement-document-configs',
  entity: incidentStatementDocumentConfig,
  routes: {
    list: defineRoute({
      kind: 'list',
      method: 'get',
      authorize: listAccess,
      action: async (args) => {
        await actor(args)
        const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
        const page = Number(query.page)
        const limit = Number(query.limit)
        const where = listWhere(query)
        const [rows, totalRows] = await Promise.all([
          getDb().select().from(incidentStatementDocumentConfigs).where(where).orderBy(asc(incidentStatementDocumentConfigs.name)).limit(limit).offset((page - 1) * limit),
          getDb().select({ value: count() }).from(incidentStatementDocumentConfigs).where(where),
        ])
        return args.c.json({ data: rows.map((row) => incidentStatementDocumentConfig.schemas.select.parse(row)), page, limit, total: Number(totalRows[0]?.value ?? 0) })
      },
    }),
    detail: detail({ authorize: detailAccess }),
    create: incidentStatementDocumentConfigCreate,
    update: incidentStatementDocumentConfigUpdate,
    delete: deleteRoute({ authorize: deleteAccess }),
  },
})

export const domain = defineDomainPart({ tables: { incidentStatementDocumentConfigs }, entities: [incidentStatementDocumentConfig] })
