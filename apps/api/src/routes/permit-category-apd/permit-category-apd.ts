import { authenticated, defineRoute, detail, list } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { permitApds } from '../permit-apd/permit-apd.entity'
import { permitCategoryApds, permitCategoryApd } from './permit-category-apd.entity'

const listAccess = [authenticated(), requirePermission('list-permit-category-apd')]
const detailAccess = [authenticated(), requirePermission('detail-permit-category-apd')]
const createAccess = [authenticated(), requirePermission('create-permit-category-apd')]
const updateAccess = [authenticated(), requirePermission('update-permit-category-apd')]
const deleteAccess = [authenticated(), requirePermission('delete-permit-category-apd')]

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

function normalizeCode(value: string | null | undefined) {
  if (value == null || value.trim() === '') return null
  return value.trim()
}

async function ensureUniqueCode(value: string | null, id?: string) {
  if (value == null) return
  const where = id
    ? and(eq(permitCategoryApds.code, value), ne(permitCategoryApds.id, id))
    : eq(permitCategoryApds.code, value)
  const existing = await getDb().select({ id: permitCategoryApds.id }).from(permitCategoryApds).where(where).limit(1)
  if (existing.length) throw validationError('code must be unique.')
}

export const permitCategoryApdCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = permitCategoryApd.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const code = normalizeCode(input.code)
    await ensureUniqueCode(code)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(permitCategoryApds).values({
      ...input,
      code,
      active: input.active ?? true,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Permit category APD was not created.')
    return args.c.json({ data: permitCategoryApd.schemas.select.parse(row) }, 201)
  },
})

export const permitCategoryApdUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = permitCategoryApd.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof permitCategoryApds.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code')) {
      values.code = normalizeCode(input.code)
      await ensureUniqueCode(values.code, id)
    }
    if (typeof values.name === 'string') values.name = values.name.trim()
    const updated = await getDb().update(permitCategoryApds).set(values).where(eq(permitCategoryApds.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: permitCategoryApd.schemas.select.parse(updated[0]) })
  },
})

export const permitCategoryApdDelete = defineRoute({
  kind: 'delete',
  path: '/:id',
  method: 'delete',
  authorize: deleteAccess,
  action: async (args) => {
    await actor(args)
    const id = requiredId(args)
    const references = await getDb().select({ id: permitApds.id }).from(permitApds).where(eq(permitApds.permitCategoryApdId, id)).limit(1)
    if (references.length) throw validationError('Referenced records must be deactivated before delete.')
    const deleted = await getDb().delete(permitCategoryApds).where(eq(permitCategoryApds.id, id)).returning({ id: permitCategoryApds.id })
    if (!deleted[0]) throw notFound()
    return args.c.json({ ok: true })
  },
})

export const domain = defineDomainPart({ tables: { permitCategoryApds }, entities: [permitCategoryApd] })

export const permitCategoryApdModel = defineModel({
  path: '/permit-category-apd',
  entity: permitCategoryApd,
  routes: {
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: permitCategoryApdCreate,
    update: permitCategoryApdUpdate,
    delete: permitCategoryApdDelete,
  },
})
