import { authenticated, defineRoute, deleteRoute, detail } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, desc, eq, getTableColumns, ilike, or, type SQL } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { coerceBooleanQuery } from '../../owner-list'
import { toolsBrandCategoryCodes, toolsBrands, toolsBrand } from './tools-brands.entity'

const listAccess = [authenticated(), requirePermission('list-tools-brands')]
const detailAccess = [authenticated(), requirePermission('detail-tools-brands')]
const createAccess = [authenticated(), requirePermission('create-tools-brands')]
const updateAccess = [authenticated(), requirePermission('update-tools-brands')]
const deleteAccess = [authenticated(), requirePermission('delete-tools-brands')]
const columns = getTableColumns(toolsBrands) as Record<string, unknown>
const reservedQueryKeys = new Set(['page', 'limit', 'search', 'sort', 'order', 'permission'])

function validateCategoryCode(value: unknown) {
  if (typeof value !== 'string' || !toolsBrandCategoryCodes.includes(value as typeof toolsBrandCategoryCodes[number])) throw validationError('categoryCode is invalid.')
}

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
  const filters: SQL[] = []
  for (const [key, value] of Object.entries(query)) {
    if (reservedQueryKeys.has(key) || value === undefined) continue
    const column = columns[key]
    if (!column) throw validationError(`Unknown query parameter "${key}".`)
    if (key === 'categoryCode') validateCategoryCode(value)
    filters.push(eq(column as never, value as never))
  }
  const search = typeof query.search === 'string' && query.search ? `%${query.search}%` : undefined
  const conditions = [...filters, ...(search ? [or(ilike(toolsBrands.name, search), ilike(toolsBrands.description, search))] : [])]
  return conditions.length ? and(...conditions) : undefined
}

function orderBy(query: Record<string, unknown>) {
  const column = query.sort ? columns[String(query.sort)] : toolsBrands.name
  if (!column) throw validationError(`Unknown sort column "${String(query.sort)}".`)
  return [query.order === 'desc' ? desc(column as never) : asc(column as never)]
}

export const toolsBrandList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: listAccess,
  action: async (args) => {
    await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    coerceBooleanQuery(query, 'active')
    const page = Number(query.page)
    const limit = Number(query.limit)
    const where = listWhere(query)
    const db = getDb()
    const [rows, totalRows] = await Promise.all([
      db.select().from(toolsBrands).where(where).orderBy(...orderBy(query)).limit(limit).offset((page - 1) * limit),
      db.select({ value: count() }).from(toolsBrands).where(where),
    ])
    return args.c.json({ data: rows.map((row) => toolsBrand.schemas.select.parse(row)), page, limit, total: Number(totalRows[0]?.value ?? 0) })
  },
})

export const toolsBrandCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = toolsBrand.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    validateCategoryCode(input.categoryCode)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(toolsBrands).values({
      ...input,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      active: input.active ?? true,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Tool brand was not created.')
    return args.c.json({ data: toolsBrand.schemas.select.parse(row) }, 201)
  },
})

export const toolsBrandUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = toolsBrand.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    if (input.categoryCode !== undefined) validateCategoryCode(input.categoryCode)
    const values: Partial<typeof toolsBrands.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'name') && input.name !== undefined) values.name = input.name.trim()
    if (Object.prototype.hasOwnProperty.call(input, 'description')) values.description = input.description?.trim() || null
    const updated = await getDb().update(toolsBrands).set(values).where(eq(toolsBrands.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: toolsBrand.schemas.select.parse(updated[0]) })
  },
})

export const domain = defineDomainPart({ tables: { toolsBrands }, entities: [toolsBrand] })

export const toolsBrandModel = defineModel({
  path: '/tools-brands',
  entity: toolsBrand,
  routes: {
    list: toolsBrandList,
    detail: detail({ authorize: detailAccess }),
    create: toolsBrandCreate,
    update: toolsBrandUpdate,
    delete: deleteRoute({ authorize: deleteAccess }),
  },
})
