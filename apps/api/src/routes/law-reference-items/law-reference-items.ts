import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel, type DefinedModel } from '@southneuhof/sprindle/model'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import {
  lawReferenceCategories,
  lawReferenceCategory,
  lawReferenceItemCreateSchema,
  lawReferenceItemSelectSchema,
  lawReferenceItems,
  lawReferenceItem,
  lawReferenceItemUpdateSchema,
  lawReferenceItemsRelations,
} from './law-reference-items.entity'
import type { LawReferenceItemRecord } from './law-reference-items.entity'

const listAccess = [authenticated(), requirePermission('list-law-reference-items')]
const detailAccess = [authenticated(), requirePermission('detail-law-reference-items')]
const createAccess = [authenticated(), requirePermission('create-law-reference-items')]
const updateAccess = [authenticated(), requirePermission('update-law-reference-items')]
const deleteAccess = [authenticated(), requirePermission('delete-law-reference-items')]

type ItemInput = { lawReferenceCategoryCode: string; parentId?: string | null; type?: string | null }
type SourceContext = Parameters<typeof lawReferenceItem.source.list>[0]['context']

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

function numberFilter(value: unknown, field: string) {
  if (value == null || value === '') return undefined
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1 || number > 3) throw validationError(`${field} must be 1, 2, or 3.`)
  return number
}

async function activeCategory(code: string) {
  const category = (await getDb().select().from(lawReferenceCategories).where(and(eq(lawReferenceCategories.code, code), eq(lawReferenceCategories.active, true))).limit(1))[0]
  if (!category) throw validationError('Law reference category is invalid.')
  return category
}

async function position(input: ItemInput, id?: string, currentParentId?: string | null) {
  const categoryCode = input.lawReferenceCategoryCode.trim()
  await activeCategory(categoryCode)
  const parentId = input.parentId === undefined ? currentParentId ?? null : input.parentId

  if (!parentId) {
    if (input.type !== 'reference' && input.type !== 'applicable') throw validationError('Root law reference items require a type.')
    return { categoryCode, parentId: null, level: 1, type: input.type }
  }

  const parent = (await getDb().select({ id: lawReferenceItems.id, parentId: lawReferenceItems.parentId, categoryCode: lawReferenceItems.lawReferenceCategoryCode, level: lawReferenceItems.level, active: lawReferenceItems.active }).from(lawReferenceItems).where(and(eq(lawReferenceItems.id, parentId), eq(lawReferenceItems.deleted, false))).limit(1))[0]
  if (!parent || parent.categoryCode !== categoryCode || !parent.active) throw validationError('Law reference parent is invalid.')
  if (parent.level >= 3) throw validationError('Level 3 law reference items cannot receive a child.')
  if (input.type != null) throw validationError('Child law reference items cannot have a type.')

  let current = parent.id
  const seen = new Set<string>()
  while (current) {
    if (current === id) throw validationError('Law reference parent cannot create a cycle.')
    if (seen.has(current)) throw validationError('Law reference parent cannot create a cycle.')
    seen.add(current)
    current = (await getDb().select({ parentId: lawReferenceItems.parentId }).from(lawReferenceItems).where(eq(lawReferenceItems.id, current)).limit(1))[0]?.parentId ?? ''
  }

  return { categoryCode, parentId, level: parent.level + 1, type: null }
}

async function visibleItem(id: string, context: SourceContext): Promise<LawReferenceItemRecord> {
  const result = await lawReferenceItem.source.list({ query: { id, deleted: false, page: 1, limit: 1 }, context })
  const data = Array.isArray(result) ? result : result.data
  const item = data[0]
  if (!item) throw notFound()
  return lawReferenceItemSelectSchema.parse(item)
}

export const lawReferenceItemList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: listAccess,
  action: async (args) => {
    await actor(args)
    const rawQuery = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    const level = numberFilter(rawQuery.level, 'level')
    const type = rawQuery.type == null || rawQuery.type === '' ? undefined : rawQuery.type
    if (type !== undefined && type !== 'reference' && type !== 'applicable') throw validationError('type must be reference or applicable.')
    const query: Record<string, unknown> = {
      ...rawQuery,
      deleted: false,
      ...(level === undefined ? {} : { level }),
      ...(type === undefined ? {} : { type }),
    }
    const result = await lawReferenceItem.source.list({ query, context: args.context })
    const data = Array.isArray(result) ? result : result.data
    const total = Array.isArray(result) ? data.length : result.total
    return args.c.json({ data, page: Number(rawQuery.page), limit: Number(rawQuery.limit), total })
  },
})

export const lawReferenceItemDetail = defineRoute({
  kind: 'detail',
  path: '/:id',
  method: 'get',
  authorize: detailAccess,
  action: async (args) => {
    await actor(args)
    return args.c.json({ data: await visibleItem(requiredId(args), args.context) })
  },
})

export const lawReferenceItemCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = lawReferenceItemCreateSchema.parse(await args.c.req.json().catch(() => ({})))
    const next = await position(input, undefined)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(lawReferenceItems).values({
      id: crypto.randomUUID(),
      lawReferenceCategoryCode: next.categoryCode,
      name: input.name.trim(),
      level: next.level,
      type: next.type ?? null,
      parentId: next.parentId,
      active: input.active ?? true,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Law reference item was not created.')
    return args.c.json({ data: await lawReferenceItem.source.materialize(row, { context: args.context }) }, 201)
  },
})

export const lawReferenceItemUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const current = await visibleItem(id, args.context)
    const input = lawReferenceItemUpdateSchema.parse(await args.c.req.json().catch(() => ({})))
    if (input.lawReferenceCategoryCode && input.lawReferenceCategoryCode !== current.lawReferenceCategoryCode) throw validationError('Law reference category cannot be changed.')
    const next = await position({
      lawReferenceCategoryCode: current.lawReferenceCategoryCode,
      parentId: Object.prototype.hasOwnProperty.call(input, 'parentId') ? input.parentId : undefined,
      type: Object.prototype.hasOwnProperty.call(input, 'type') ? input.type : current.type,
    }, id, current.parentId)
    const values: Partial<typeof lawReferenceItems.$inferInsert> = {
      updatedByUserId: identity.userId,
      updatedAt: new Date().toISOString(),
      parentId: next.parentId,
      level: next.level,
      type: next.type ?? null,
    }
    if (input.name !== undefined) values.name = input.name.trim()
    if (input.active !== undefined) values.active = input.active
    const updated = await getDb().update(lawReferenceItems).set(values).where(and(eq(lawReferenceItems.id, id), eq(lawReferenceItems.deleted, false))).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: await lawReferenceItem.source.materialize(updated[0], { context: args.context }) })
  },
})

export const lawReferenceItemDelete = defineRoute({
  kind: 'delete',
  path: '/:id',
  method: 'delete',
  authorize: deleteAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    await visibleItem(id, args.context)
    const timestamp = new Date().toISOString()
    await getDb().transaction(async (tx) => {
      const descendants = await tx.select({ id: lawReferenceItems.id }).from(lawReferenceItems).where(sql`${lawReferenceItems.id} in (
        with recursive descendants(id) as (
          select root.id from ${lawReferenceItems} as root where root.id = ${id} and root.deleted = false
          union all
          select child.id from ${lawReferenceItems} as child inner join descendants as parent on parent.id = child.parent_id where child.deleted = false
        )
        select id from descendants
      )`)
      const ids = descendants.map((row) => row.id)
      if (!ids.length) throw notFound()
      await tx.update(lawReferenceItems).set({ deleted: true, deletedByUserId: identity.userId, deletedAt: timestamp, deletedReason: 'Deleted from law reference tree', updatedByUserId: identity.userId, updatedAt: timestamp }).where(inArray(lawReferenceItems.id, ids))
    })
    return args.c.json({ ok: true })
  },
})

export const lawReferenceItemTree = defineRoute({
  kind: 'custom',
  path: '',
  method: 'get',
  authorize: listAccess,
  action: async (args) => {
    await actor(args)
    const code = args.c.req.query('lawReferenceCategoryCode') ?? 'environment'
    const categories = await getDb().select().from(lawReferenceCategories).where(eq(lawReferenceCategories.active, true))
    const order = new Map([['environment', 0], ['k3', 1], ['security', 2]])
    categories.sort((left, right) => (order.get(left.code) ?? 99) - (order.get(right.code) ?? 99))
    const category = categories.find((row) => row.code === code)
    if (!category) throw validationError('Law reference category is invalid.')
    const rows = await getDb().select().from(lawReferenceItems).where(and(eq(lawReferenceItems.lawReferenceCategoryCode, code), eq(lawReferenceItems.deleted, false))).orderBy(asc(lawReferenceItems.level), asc(lawReferenceItems.name), asc(lawReferenceItems.id))
    const nodes = rows.map((row) => ({ ...row, children: [] as unknown[] }))
    const byId = new Map(nodes.map((node) => [node.id, node]))
    const roots: typeof nodes = []
    for (const node of nodes) {
      const parent = node.parentId ? byId.get(node.parentId) : undefined
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
    return args.c.json({
      data: {
        categories: categories.map((row) => lawReferenceCategory.schemas.select.parse(row)),
        category: lawReferenceCategory.schemas.select.parse(category),
        items: roots,
      },
    })
  },
})

export const domain = defineDomainPart({
  tables: { lawReferenceCategories, lawReferenceItems },
  entities: [lawReferenceCategory, lawReferenceItem],
  relations: [lawReferenceItemsRelations],
})

const lawReferenceItemModelRuntime = defineModel({
  path: '/law-reference-items',
  entity: lawReferenceItem,
  routes: {
    list: lawReferenceItemList,
    tree: lawReferenceItemTree,
    detail: lawReferenceItemDetail,
    create: lawReferenceItemCreate,
    update: lawReferenceItemUpdate,
    delete: lawReferenceItemDelete,
  },
})

// Keep this route out of the global Hono union. The web module uses its local typed boundary.
export const lawReferenceItemModel = lawReferenceItemModelRuntime as unknown as DefinedModel<'/law-reference-items', never, never>
