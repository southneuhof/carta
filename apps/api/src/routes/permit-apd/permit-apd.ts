import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, eq, ilike, ne, or } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { permitCategoryApds } from '../permit-category-apd/permit-category-apd.entity'
import { permitApds, permitApd } from './permit-apd.entity'

const listAccess = [authenticated(), requirePermission('list-permit-apd')]
const detailAccess = [authenticated(), requirePermission('detail-permit-apd')]
const createAccess = [authenticated(), requirePermission('create-permit-apd')]
const updateAccess = [authenticated(), requirePermission('update-permit-apd')]
const deleteAccess = [authenticated(), requirePermission('delete-permit-apd')]

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

function requiredParentId(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') throw validationError('permitCategoryApdId is required.')
  return value.trim()
}

async function ensureParent(id: string) {
  const parent = await getDb().select({ id: permitCategoryApds.id }).from(permitCategoryApds).where(eq(permitCategoryApds.id, id)).limit(1)
  if (!parent[0]) throw notFound()
}

function normalizeCode(value: string | null | undefined) {
  if (value == null || value.trim() === '') return null
  return value.trim()
}

async function ensureUniqueCode(value: string | null, id?: string) {
  if (value == null) return
  const where = id ? and(eq(permitApds.code, value), ne(permitApds.id, id)) : eq(permitApds.code, value)
  const existing = await getDb().select({ id: permitApds.id }).from(permitApds).where(where).limit(1)
  if (existing.length) throw validationError('code must be unique.')
}

async function readApd(parentId: string, id: string) {
  const row = await getDb().select().from(permitApds).where(and(eq(permitApds.id, id), eq(permitApds.permitCategoryApdId, parentId))).limit(1)
  if (!row[0]) throw notFound()
  return permitApd.schemas.select.parse(row[0])
}

export const permitApdList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: listAccess,
  action: async (args) => {
    await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    const parentId = requiredParentId(query.permitCategoryApdId)
    await ensureParent(parentId)
    const page = Number(query.page)
    const limit = Number(query.limit)
    const search = typeof query.search === 'string' && query.search ? `%${query.search}%` : undefined
    const where = and(
      eq(permitApds.permitCategoryApdId, parentId),
      ...(search ? [or(ilike(permitApds.name, search), ilike(permitApds.description, search))] : []),
    )
    const db = getDb()
    const [rows, totalRows] = await Promise.all([
      db.select().from(permitApds).where(where).orderBy(asc(permitApds.name)).limit(limit).offset((page - 1) * limit),
      db.select({ value: count() }).from(permitApds).where(where),
    ])
    return args.c.json({ data: rows.map((row) => permitApd.schemas.select.parse(row)), page, limit, total: Number(totalRows[0]?.value ?? 0) })
  },
})

export const permitApdDetail = defineRoute({
  kind: 'detail',
  path: '/:id',
  method: 'get',
  authorize: detailAccess,
  action: async (args) => {
    await actor(args)
    const parentId = requiredParentId(args.c.req.query('permitCategoryApdId'))
    await ensureParent(parentId)
    return args.c.json({ data: await readApd(parentId, requiredId(args)) })
  },
})

export const permitApdCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = permitApd.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    await ensureParent(input.permitCategoryApdId)
    const code = normalizeCode(input.code)
    await ensureUniqueCode(code)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(permitApds).values({
      ...input,
      code,
      active: input.active ?? true,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('APD was not created.')
    return args.c.json({ data: permitApd.schemas.select.parse(row) }, 201)
  },
})

export const permitApdUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const parentId = requiredParentId(args.c.req.query('permitCategoryApdId'))
    await ensureParent(parentId)
    const id = requiredId(args)
    await readApd(parentId, id)
    const input = permitApd.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof permitApds.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code')) {
      values.code = normalizeCode(input.code)
      await ensureUniqueCode(values.code, id)
    }
    if (typeof values.name === 'string') values.name = values.name.trim()
    const updated = await getDb().update(permitApds).set(values).where(and(eq(permitApds.id, id), eq(permitApds.permitCategoryApdId, parentId))).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: permitApd.schemas.select.parse(updated[0]) })
  },
})

export const permitApdDelete = defineRoute({
  kind: 'delete',
  path: '/:id',
  method: 'delete',
  authorize: deleteAccess,
  action: async (args) => {
    await actor(args)
    const parentId = requiredParentId(args.c.req.query('permitCategoryApdId'))
    await ensureParent(parentId)
    const deleted = await getDb().delete(permitApds).where(and(eq(permitApds.id, requiredId(args)), eq(permitApds.permitCategoryApdId, parentId))).returning({ id: permitApds.id })
    if (!deleted[0]) throw notFound()
    return args.c.json({ ok: true })
  },
})

export const domain = defineDomainPart({ tables: { permitApds }, entities: [permitApd] })

export const permitApdModel = defineModel({
  path: '/permit-apd',
  entity: permitApd,
  routes: {
    list: permitApdList,
    detail: permitApdDetail,
    create: permitApdCreate,
    update: permitApdUpdate,
    delete: permitApdDelete,
  },
})
