import { authenticated, defineRoute, deleteRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, eq, ilike, type SQL, type SQLWrapper } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import {
  findingCategories,
  findingCategoryEntity,
  findingCauses,
  findingCauseEntity,
  findingCriteria,
  findingCriteriaEntity,
  findingTypes,
  findingTypeEntity,
  hsseObservationRelations,
} from './hsse-observation.entity'

const reservedQueryKeys = new Set(['page', 'limit', 'search', 'sort', 'order', 'permission'])

const access = {
  criteria: {
    list: [authenticated(), requirePermission('list-finding-criteria')],
    detail: [authenticated(), requirePermission('detail-finding-criteria')],
    create: [authenticated(), requirePermission('create-finding-criteria')],
    update: [authenticated(), requirePermission('update-finding-criteria')],
    delete: [authenticated(), requirePermission('delete-finding-criteria')],
  },
  types: {
    list: [authenticated(), requirePermission('list-finding-types')],
    detail: [authenticated(), requirePermission('detail-finding-types')],
    create: [authenticated(), requirePermission('create-finding-types')],
    update: [authenticated(), requirePermission('update-finding-types')],
    delete: [authenticated(), requirePermission('delete-finding-types')],
  },
  categories: {
    list: [authenticated(), requirePermission('list-finding-categories')],
    detail: [authenticated(), requirePermission('detail-finding-categories')],
    create: [authenticated(), requirePermission('create-finding-categories')],
    update: [authenticated(), requirePermission('update-finding-categories')],
    delete: [authenticated(), requirePermission('delete-finding-categories')],
  },
  causes: {
    list: [authenticated(), requirePermission('list-finding-cause')],
    detail: [authenticated(), requirePermission('detail-finding-cause')],
    create: [authenticated(), requirePermission('create-finding-cause')],
    update: [authenticated(), requirePermission('update-finding-cause')],
    delete: [authenticated(), requirePermission('delete-finding-cause')],
  },
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

function pageOf(query: Record<string, unknown>) {
  return { page: Number(query.page), limit: Number(query.limit) }
}

function searchWhere(column: SQLWrapper, query: Record<string, unknown>) {
  return typeof query.search === 'string' && query.search ? ilike(column, `%${query.search}%`) : undefined
}

function criteriaWhere(query: Record<string, unknown>) {
  const conditions: SQL[] = []
  const search = searchWhere(findingCriteria.name, query)
  if (search) conditions.push(search)
  if (query.active !== undefined) conditions.push(eq(findingCriteria.active, query.active as boolean))
  return conditions.length ? and(...conditions) : undefined
}

function typeWhere(query: Record<string, unknown>) {
  const conditions: SQL[] = []
  if (typeof query.findingCriteriaCode === 'string' && query.findingCriteriaCode) conditions.push(eq(findingTypes.findingCriteriaCode, query.findingCriteriaCode))
  if (query.active !== undefined) conditions.push(eq(findingTypes.active, query.active as boolean))
  const search = searchWhere(findingTypes.name, query)
  if (search) conditions.push(search)
  return conditions.length ? and(...conditions) : undefined
}

function categoryWhere(query: Record<string, unknown>) {
  const conditions: SQL[] = []
  if (typeof query.findingTypeId === 'string' && query.findingTypeId) conditions.push(eq(findingCategories.findingTypeId, query.findingTypeId))
  if (query.active !== undefined) conditions.push(eq(findingCategories.active, query.active as boolean))
  const search = searchWhere(findingCategories.name, query)
  if (search) conditions.push(search)
  return conditions.length ? and(...conditions) : undefined
}

function causeWhere(query: Record<string, unknown>) {
  const conditions: SQL[] = []
  if (typeof query.findingCategoryId === 'string' && query.findingCategoryId) conditions.push(eq(findingCauses.findingCategoryId, query.findingCategoryId))
  if (query.active !== undefined) conditions.push(eq(findingCauses.active, query.active as boolean))
  const search = searchWhere(findingCauses.name, query)
  if (search) conditions.push(search)
  return conditions.length ? and(...conditions) : undefined
}

function rejectUnknownQuery(query: Record<string, unknown>, allowed: readonly string[]) {
  for (const key of Object.keys(query)) {
    if (reservedQueryKeys.has(key) || allowed.includes(key)) continue
    throw validationError(`Unknown query parameter "${key}".`)
  }
}

function nullableText(value: string | null | undefined) {
  return value?.trim() || null
}

async function ensureCode(table: typeof findingCriteria | typeof findingTypes | typeof findingCategories | typeof findingCauses, code: string | null | undefined, id?: string) {
  if (code == null) return
  const existing = await getDb().select({ id: table.id }).from(table).where(eq(table.code, code)).limit(1)
  if (existing[0] && existing[0].id !== id) throw validationError('code must be unique.')
}

async function readCriteria(id: string) {
  const row = (await getDb().select().from(findingCriteria).where(eq(findingCriteria.id, id)).limit(1))[0]
  if (!row) throw notFound()
  return findingCriteriaEntity.schemas.select.parse(row)
}

async function readType(id: string) {
  const row = (await getDb().select({ type: findingTypes, findingCriteria }).from(findingTypes).innerJoin(findingCriteria, eq(findingCriteria.code, findingTypes.findingCriteriaCode)).where(eq(findingTypes.id, id)).limit(1))[0]
  if (!row) throw notFound()
  return findingTypeEntity.schemas.select.parse({ ...row.type, findingCriteria: row.findingCriteria })
}

async function readCategory(id: string) {
  const row = (await getDb().select({ category: findingCategories, findingType: findingTypes }).from(findingCategories).innerJoin(findingTypes, eq(findingTypes.id, findingCategories.findingTypeId)).where(eq(findingCategories.id, id)).limit(1))[0]
  if (!row) throw notFound()
  return findingCategoryEntity.schemas.select.parse({ ...row.category, findingType: row.findingType })
}

async function readCause(id: string) {
  const row = (await getDb().select({ cause: findingCauses, findingCategory: findingCategories }).from(findingCauses).innerJoin(findingCategories, eq(findingCategories.id, findingCauses.findingCategoryId)).where(eq(findingCauses.id, id)).limit(1))[0]
  if (!row) throw notFound()
  return findingCauseEntity.schemas.select.parse({ ...row.cause, findingCategory: row.findingCategory })
}

export const findingCriteriaList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.criteria.list,
  action: async (args) => {
    await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    rejectUnknownQuery(query, ['active'])
    const { page, limit } = pageOf(query)
    const where = criteriaWhere(query)
    const [rows, totalRows] = await Promise.all([
      getDb().select().from(findingCriteria).where(where).orderBy(asc(findingCriteria.name)).limit(limit).offset((page - 1) * limit),
      getDb().select({ value: count() }).from(findingCriteria).where(where),
    ])
    return args.c.json({ data: rows.map((row) => findingCriteriaEntity.schemas.select.parse(row)), page, limit, total: Number(totalRows[0]?.value ?? 0) })
  },
})

export const findingCriteriaDetail = defineRoute({ kind: 'detail', path: '/:id', method: 'get', authorize: access.criteria.detail, action: async (args) => args.c.json({ data: await readCriteria(requiredId(args)) }) })

export const findingCriteriaCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.criteria.create,
  action: async (args) => {
    const identity = await actor(args)
    const input = findingCriteriaEntity.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const code = nullableText(input.code)
    await ensureCode(findingCriteria, code)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(findingCriteria).values({ ...input, code, description: nullableText(input.description), createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Finding criteria was not created.')
    return args.c.json({ data: findingCriteriaEntity.schemas.select.parse(row) }, 201)
  },
})

export const findingCriteriaUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: access.criteria.update,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = findingCriteriaEntity.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof findingCriteria.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code')) {
      values.code = nullableText(input.code)
      await ensureCode(findingCriteria, values.code, id)
    }
    if (Object.prototype.hasOwnProperty.call(input, 'description')) values.description = nullableText(input.description)
    if (input.name !== undefined) values.name = input.name.trim()
    const updated = await getDb().update(findingCriteria).set(values).where(eq(findingCriteria.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: findingCriteriaEntity.schemas.select.parse(updated[0]) })
  },
})

export const findingTypeList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.types.list,
  action: async (args) => {
    await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    rejectUnknownQuery(query, ['active', 'findingCriteriaCode'])
    const { page, limit } = pageOf(query)
    const where = typeWhere(query)
    const [rows, totalRows] = await Promise.all([
      getDb().select({ type: findingTypes, findingCriteria }).from(findingTypes).innerJoin(findingCriteria, eq(findingCriteria.code, findingTypes.findingCriteriaCode)).where(where).orderBy(asc(findingTypes.displayOrder), asc(findingTypes.name)).limit(limit).offset((page - 1) * limit),
      getDb().select({ value: count() }).from(findingTypes).where(where),
    ])
    return args.c.json({ data: rows.map((row) => findingTypeEntity.schemas.select.parse({ ...row.type, findingCriteria: row.findingCriteria })), page, limit, total: Number(totalRows[0]?.value ?? 0) })
  },
})

export const findingTypeDetail = defineRoute({ kind: 'detail', path: '/:id', method: 'get', authorize: access.types.detail, action: async (args) => args.c.json({ data: await readType(requiredId(args)) }) })

export const findingTypeCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.types.create,
  action: async (args) => {
    const identity = await actor(args)
    const input = findingTypeEntity.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const parent = (await getDb().select({ code: findingCriteria.code, active: findingCriteria.active }).from(findingCriteria).where(eq(findingCriteria.code, input.findingCriteriaCode)).limit(1))[0]
    if (!parent) throw validationError('Finding criteria not found.')
    if (!parent.active) throw validationError('Inactive finding criteria cannot receive a finding type.')
    const code = nullableText(input.code)
    await ensureCode(findingTypes, code)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(findingTypes).values({ ...input, findingCriteriaCode: input.findingCriteriaCode.trim(), code, description: nullableText(input.description), displayOrder: input.displayOrder ?? 0, createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Finding type was not created.')
    return args.c.json({ data: await readType(row.id) }, 201)
  },
})

export const findingTypeUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: access.types.update,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = findingTypeEntity.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof findingTypes.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code')) {
      values.code = nullableText(input.code)
      await ensureCode(findingTypes, values.code, id)
    }
    if (Object.prototype.hasOwnProperty.call(input, 'description')) values.description = nullableText(input.description)
    if (input.name !== undefined) values.name = input.name.trim()
    const updated = await getDb().update(findingTypes).set(values).where(eq(findingTypes.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: await readType(updated[0].id) })
  },
})

export const findingCategoryList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.categories.list,
  action: async (args) => {
    await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    rejectUnknownQuery(query, ['active', 'findingTypeId'])
    const { page, limit } = pageOf(query)
    const where = categoryWhere(query)
    const [rows, totalRows] = await Promise.all([
      getDb().select({ category: findingCategories, findingType: findingTypes }).from(findingCategories).innerJoin(findingTypes, eq(findingTypes.id, findingCategories.findingTypeId)).where(where).orderBy(asc(findingCategories.displayOrder), asc(findingCategories.name)).limit(limit).offset((page - 1) * limit),
      getDb().select({ value: count() }).from(findingCategories).where(where),
    ])
    return args.c.json({ data: rows.map((row) => findingCategoryEntity.schemas.select.parse({ ...row.category, findingType: row.findingType })), page, limit, total: Number(totalRows[0]?.value ?? 0) })
  },
})

export const findingCategoryDetail = defineRoute({ kind: 'detail', path: '/:id', method: 'get', authorize: access.categories.detail, action: async (args) => args.c.json({ data: await readCategory(requiredId(args)) }) })

export const findingCategoryCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.categories.create,
  action: async (args) => {
    const identity = await actor(args)
    const input = findingCategoryEntity.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const parent = (await getDb().select({ id: findingTypes.id, active: findingTypes.active }).from(findingTypes).where(eq(findingTypes.id, input.findingTypeId)).limit(1))[0]
    if (!parent) throw validationError('Finding type not found.')
    if (!parent.active) throw validationError('Inactive finding type cannot receive a finding category.')
    await ensureCode(findingCategories, input.code.trim())
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(findingCategories).values({ ...input, findingTypeId: input.findingTypeId.trim(), code: input.code.trim(), description: nullableText(input.description), displayOrder: input.displayOrder ?? 0, createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Finding category was not created.')
    return args.c.json({ data: await readCategory(row.id) }, 201)
  },
})

export const findingCategoryUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: access.categories.update,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = findingCategoryEntity.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof findingCategories.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code') && input.code !== undefined) {
      values.code = input.code.trim()
      await ensureCode(findingCategories, values.code, id)
    }
    if (Object.prototype.hasOwnProperty.call(input, 'description')) values.description = nullableText(input.description)
    if (input.name !== undefined) values.name = input.name.trim()
    const updated = await getDb().update(findingCategories).set(values).where(eq(findingCategories.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: await readCategory(updated[0].id) })
  },
})

export const findingCauseList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: access.causes.list,
  action: async (args) => {
    await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    rejectUnknownQuery(query, ['active', 'findingCategoryId'])
    const { page, limit } = pageOf(query)
    const where = causeWhere(query)
    const [rows, totalRows] = await Promise.all([
      getDb().select({ cause: findingCauses, findingCategory: findingCategories }).from(findingCauses).innerJoin(findingCategories, eq(findingCategories.id, findingCauses.findingCategoryId)).where(where).orderBy(asc(findingCauses.name)).limit(limit).offset((page - 1) * limit),
      getDb().select({ value: count() }).from(findingCauses).where(where),
    ])
    return args.c.json({ data: rows.map((row) => findingCauseEntity.schemas.select.parse({ ...row.cause, findingCategory: row.findingCategory })), page, limit, total: Number(totalRows[0]?.value ?? 0) })
  },
})

export const findingCauseDetail = defineRoute({ kind: 'detail', path: '/:id', method: 'get', authorize: access.causes.detail, action: async (args) => args.c.json({ data: await readCause(requiredId(args)) }) })

export const findingCauseCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: access.causes.create,
  action: async (args) => {
    const identity = await actor(args)
    const input = findingCauseEntity.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const parent = (await getDb().select({ id: findingCategories.id, active: findingCategories.active }).from(findingCategories).where(eq(findingCategories.id, input.findingCategoryId)).limit(1))[0]
    if (!parent) throw validationError('Finding category not found.')
    if (!parent.active) throw validationError('Inactive finding category cannot receive a finding cause.')
    await ensureCode(findingCauses, input.code.trim())
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(findingCauses).values({ ...input, findingCategoryId: input.findingCategoryId.trim(), code: input.code.trim(), description: nullableText(input.description), createdByUserId: identity.userId, updatedByUserId: identity.userId, createdAt: timestamp, updatedAt: timestamp }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Finding cause was not created.')
    return args.c.json({ data: await readCause(row.id) }, 201)
  },
})

export const findingCauseUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: access.causes.update,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = findingCauseEntity.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof findingCauses.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code') && input.code !== undefined) {
      values.code = input.code.trim()
      await ensureCode(findingCauses, values.code, id)
    }
    if (Object.prototype.hasOwnProperty.call(input, 'description')) values.description = nullableText(input.description)
    if (input.name !== undefined) values.name = input.name.trim()
    const updated = await getDb().update(findingCauses).set(values).where(eq(findingCauses.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: await readCause(updated[0].id) })
  },
})

export const domain = defineDomainPart({
  tables: { findingCriteria, findingTypes, findingCategories, findingCauses },
  entities: [findingCriteriaEntity, findingTypeEntity, findingCategoryEntity, findingCauseEntity],
  relations: [hsseObservationRelations],
})

export const findingCriteriaModel = defineModel({
  path: '/finding-criteria',
  entity: findingCriteriaEntity,
  routes: { list: findingCriteriaList, detail: findingCriteriaDetail, create: findingCriteriaCreate, update: findingCriteriaUpdate, delete: deleteRoute({ authorize: access.criteria.delete }) },
})

export const findingTypeModel = defineModel({
  path: '/finding-types',
  entity: findingTypeEntity,
  routes: { list: findingTypeList, detail: findingTypeDetail, create: findingTypeCreate, update: findingTypeUpdate, delete: deleteRoute({ authorize: access.types.delete }) },
})

export const findingCategoryModel = defineModel({
  path: '/finding-categories',
  entity: findingCategoryEntity,
  routes: { list: findingCategoryList, detail: findingCategoryDetail, create: findingCategoryCreate, update: findingCategoryUpdate, delete: deleteRoute({ authorize: access.categories.delete }) },
})

export const findingCauseModel = defineModel({
  path: '/finding-cause',
  entity: findingCauseEntity,
  routes: { list: findingCauseList, detail: findingCauseDetail, create: findingCauseCreate, update: findingCauseUpdate, delete: deleteRoute({ authorize: access.causes.delete }) },
})
