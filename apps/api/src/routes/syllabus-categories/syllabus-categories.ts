import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, eq, ilike, inArray, notInArray, type SQL } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { roles } from '../roles/roles.entity'
import {
  orientationRelations,
  syllabus,
  syllabusCategories,
  syllabusCategory,
  syllabusCategoryMappings,
  syllabusCategoryRole,
  syllabusCategoryRoles,
  syllabusCategoryMapping,
  syllabi,
} from '../orientation/orientation.entity'
import { z } from 'zod/v4'

const access = {
  list: [authenticated(), requirePermission('list-syllabus-categories')],
  detail: [authenticated(), requirePermission('detail-syllabus-categories')],
  create: [authenticated(), requirePermission('create-syllabus-categories')],
  update: [authenticated(), requirePermission('update-syllabus-categories')],
  delete: [authenticated(), requirePermission('delete-syllabus-categories')],
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

function requiredParam(args: Parameters<typeof actor>[0], name: string) {
  const value = args.c.req.param(name)
  if (!value) throw notFound()
  return value
}

function pageOf(query: Record<string, unknown>) {
  return { page: Number(query.page), limit: Number(query.limit) }
}

function booleanQuery(value: unknown) {
  if (value === undefined) return undefined
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  throw validationError('Boolean query values must be true or false.')
}

async function ensureCategory(id: string) {
  const row = (await getDb().select({ id: syllabusCategories.id }).from(syllabusCategories).where(eq(syllabusCategories.id, id)).limit(1))[0]
  if (!row) throw notFound()
}

export const syllabusCategoryList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.list,
  action: async (args) => {
    await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    const { page, limit } = pageOf(query)
    const conditions: SQL[] = []
    const active = booleanQuery(query.active)
    if (active !== undefined) conditions.push(eq(syllabusCategories.active, active))
    if (typeof query.search === 'string' && query.search) conditions.push(ilike(syllabusCategories.name, `%${query.search}%`))
    const where = conditions.length ? and(...conditions) : undefined
    const [rows, totals] = await Promise.all([
      getDb().select().from(syllabusCategories).where(where).orderBy(asc(syllabusCategories.name)).limit(limit).offset((page - 1) * limit),
      getDb().select({ value: count() }).from(syllabusCategories).where(where),
    ])
    return args.c.json({ data: rows.map((row) => syllabusCategory.schemas.select.parse(row)), page, limit, total: Number(totals[0]?.value ?? 0) })
  },
})

export const syllabusCategoryDetail = defineRoute({
  kind: 'detail',
  path: '/:id',
  method: 'get',
  authorize: access.detail,
  action: async (args) => {
    await actor(args)
    const row = (await getDb().select().from(syllabusCategories).where(eq(syllabusCategories.id, requiredId(args))).limit(1))[0]
    if (!row) throw notFound()
    return args.c.json({ data: syllabusCategory.schemas.select.parse(row) })
  },
})

export const syllabusCategoryCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.create,
  action: async (args) => {
    const identity = await actor(args)
    const input = syllabusCategory.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const timestamp = new Date().toISOString()
    const row = (await getDb().insert(syllabusCategories).values({
      ...input,
      name: input.name.trim(),
      imgThumbnail: input.imgThumbnail?.trim() || null,
      description: input.description?.trim() || null,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning())[0]
    if (!row) throw validationError('Kategori Silabus was not created.')
    return args.c.json({ data: syllabusCategory.schemas.select.parse(row) }, 201)
  },
})

export const syllabusCategoryUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: access.update,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    await ensureCategory(id)
    const input = syllabusCategory.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof syllabusCategories.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (values.name !== undefined) values.name = values.name.trim()
    if (values.imgThumbnail !== undefined) values.imgThumbnail = values.imgThumbnail?.trim() || null
    if (values.description !== undefined) values.description = values.description?.trim() || null
    const row = (await getDb().update(syllabusCategories).set(values).where(eq(syllabusCategories.id, id)).returning())[0]
    if (!row) throw notFound()
    return args.c.json({ data: syllabusCategory.schemas.select.parse(row) })
  },
})

export const syllabusCategoryDelete = defineRoute({
  kind: 'delete',
  path: '/:id',
  method: 'delete',
  authorize: access.delete,
  action: async (args) => {
    await actor(args)
    const deleted = await getDb().delete(syllabusCategories).where(eq(syllabusCategories.id, requiredId(args))).returning({ id: syllabusCategories.id })
    if (!deleted[0]) throw notFound()
    return args.c.json({ ok: true })
  },
})

export const syllabusCategorySyllabusList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.list,
  action: async (args) => {
    await actor(args)
    const categoryId = requiredId(args)
    await ensureCategory(categoryId)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    const { page, limit } = pageOf(query)
    const rows = await getDb().select({ mapping: syllabusCategoryMappings, syllabus: syllabi }).from(syllabusCategoryMappings).innerJoin(syllabi, eq(syllabi.id, syllabusCategoryMappings.syllabusId)).where(eq(syllabusCategoryMappings.syllabusCategoryId, categoryId)).orderBy(asc(syllabi.name)).limit(limit).offset((page - 1) * limit)
    const total = await getDb().select({ value: count() }).from(syllabusCategoryMappings).where(eq(syllabusCategoryMappings.syllabusCategoryId, categoryId))
    return args.c.json({ data: rows.map(({ mapping, syllabus: row }) => syllabusCategoryMapping.schemas.select.parse({ ...mapping, syllabus: row })), page, limit, total: Number(total[0]?.value ?? 0) })
  },
})

export const syllabusCategoryAvailableSyllabi = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.list,
  action: async (args) => {
    await actor(args)
    const categoryId = requiredId(args)
    await ensureCategory(categoryId)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    const { page, limit } = pageOf(query)
    const mapped = await getDb().select({ syllabusId: syllabusCategoryMappings.syllabusId }).from(syllabusCategoryMappings).where(eq(syllabusCategoryMappings.syllabusCategoryId, categoryId))
    const mappedIds = mapped.map((row) => row.syllabusId)
    const conditions = [eq(syllabi.active, true), ...(mappedIds.length ? [notInArray(syllabi.id, mappedIds)] : [])]
    if (typeof query.search === 'string' && query.search) conditions.push(ilike(syllabi.name, `%${query.search}%`))
    const where = and(...conditions)
    const [rows, totals] = await Promise.all([
      getDb().select().from(syllabi).where(where).orderBy(asc(syllabi.name)).limit(limit).offset((page - 1) * limit),
      getDb().select({ value: count() }).from(syllabi).where(where),
    ])
    return args.c.json({ data: rows.map((row) => syllabus.schemas.select.parse(row)), page, limit, total: Number(totals[0]?.value ?? 0) })
  },
})

export const syllabusCategorySyllabusAdd = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.update,
  action: async (args) => {
    const identity = await actor(args)
    const categoryId = requiredId(args)
    await ensureCategory(categoryId)
    const input = z.object({ syllabusIds: z.array(z.string().trim().min(1)).min(1).max(100) }).parse(await args.c.req.json().catch(() => ({})))
    const ids = [...new Set(input.syllabusIds)]
    const syllabiRows = await getDb().select({ id: syllabi.id }).from(syllabi).where(and(inArray(syllabi.id, ids), eq(syllabi.active, true)))
    if (syllabiRows.length !== ids.length) throw validationError('One or more Silabus records are invalid.')
    const existing = await getDb().select({ syllabusId: syllabusCategoryMappings.syllabusId }).from(syllabusCategoryMappings).where(and(eq(syllabusCategoryMappings.syllabusCategoryId, categoryId), inArray(syllabusCategoryMappings.syllabusId, ids)))
    const existingIds = new Set(existing.map((row) => row.syllabusId))
    const timestamp = new Date().toISOString()
    const values = ids.filter((id) => !existingIds.has(id)).map((syllabusId) => ({ id: crypto.randomUUID(), syllabusCategoryId: categoryId, syllabusId, active: true, createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp }))
    if (values.length) await getDb().insert(syllabusCategoryMappings).values(values)
    return args.c.json({ data: { added: values.length } }, 201)
  },
})

export const syllabusCategorySyllabusRemove = defineRoute({
  kind: 'delete',
  method: 'delete',
  authorize: access.update,
  action: async (args) => {
    await actor(args)
    const categoryId = requiredId(args)
    const syllabusId = requiredParam(args, 'syllabusId')
    const deleted = await getDb().delete(syllabusCategoryMappings).where(and(eq(syllabusCategoryMappings.syllabusCategoryId, categoryId), eq(syllabusCategoryMappings.syllabusId, syllabusId))).returning({ id: syllabusCategoryMappings.id })
    if (!deleted[0]) throw notFound()
    return args.c.json({ ok: true })
  },
})

export const syllabusCategoryRoleList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.list,
  action: async (args) => {
    await actor(args)
    const categoryId = requiredId(args)
    await ensureCategory(categoryId)
    const rows = await getDb().select({ role: roles, mapping: syllabusCategoryRoles }).from(roles).leftJoin(syllabusCategoryRoles, and(eq(syllabusCategoryRoles.roleId, roles.id), eq(syllabusCategoryRoles.syllabusCategoryId, categoryId))).where(eq(roles.active, true)).orderBy(asc(roles.name))
    return args.c.json({ data: rows.map(({ role: row, mapping }) => syllabusCategoryRole.schemas.select.parse({
      id: mapping?.id ?? `${categoryId}:${row.id}`,
      syllabusCategoryId: categoryId,
      roleId: row.id,
      description: mapping?.description ?? null,
      active: mapping?.active ?? false,
      createdByUserId: mapping?.createdByUserId ?? null,
      updatedByUserId: mapping?.updatedByUserId ?? null,
      createdAt: mapping?.createdAt ?? new Date(0).toISOString(),
      updatedAt: mapping?.updatedAt ?? new Date(0).toISOString(),
      role: row,
    })) })
  },
})

export const syllabusCategoryRoleToggle = defineRoute({
  kind: 'update',
  method: 'put',
  authorize: access.update,
  action: async (args) => {
    const identity = await actor(args)
    const categoryId = requiredId(args)
    const roleId = requiredParam(args, 'roleId')
    await ensureCategory(categoryId)
    const input = z.object({ active: z.boolean() }).parse(await args.c.req.json().catch(() => ({})))
    const roleRow = (await getDb().select({ id: roles.id }).from(roles).where(and(eq(roles.id, roleId), eq(roles.active, true))).limit(1))[0]
    if (!roleRow) throw validationError('Role is invalid.')
    const current = (await getDb().select({ id: syllabusCategoryRoles.id }).from(syllabusCategoryRoles).where(and(eq(syllabusCategoryRoles.syllabusCategoryId, categoryId), eq(syllabusCategoryRoles.roleId, roleId))).limit(1))[0]
    const timestamp = new Date().toISOString()
    if (current) {
      await getDb().update(syllabusCategoryRoles).set({ active: input.active, updatedByUserId: identity.userId, updatedAt: timestamp }).where(eq(syllabusCategoryRoles.id, current.id))
    } else {
      await getDb().insert(syllabusCategoryRoles).values({ id: crypto.randomUUID(), syllabusCategoryId: categoryId, roleId, active: input.active, createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp })
    }
    return args.c.json({ data: { roleId, active: input.active } })
  },
})

export const domain = defineDomainPart({
  tables: {},
  entities: [syllabusCategory, syllabusCategoryMapping, syllabusCategoryRole],
  relations: [orientationRelations],
})

export const syllabusCategoriesModel = defineModel({
  path: '/syllabus-categories',
  entity: syllabusCategory,
  routes: {
    list: syllabusCategoryList,
    detail: syllabusCategoryDetail,
    create: syllabusCategoryCreate,
    update: syllabusCategoryUpdate,
    delete: syllabusCategoryDelete,
    ':id': {
      syllabi: { list: syllabusCategorySyllabusList, create: syllabusCategorySyllabusAdd, ':syllabusId': { delete: syllabusCategorySyllabusRemove } },
      'available-syllabi': { list: syllabusCategoryAvailableSyllabi },
      roles: { list: syllabusCategoryRoleList, ':roleId': { update: syllabusCategoryRoleToggle } },
    },
  },
})
