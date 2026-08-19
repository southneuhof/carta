import { authenticated, deleteRoute, defineRoute, detail, list } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { permitWorkTypes, permitWorkType } from './permit-work-types.entity'

const listAccess = [authenticated(), requirePermission('list-permit-work-types')]
const detailAccess = [authenticated(), requirePermission('detail-permit-work-types')]
const createAccess = [authenticated(), requirePermission('create-permit-work-types')]
const updateAccess = [authenticated(), requirePermission('update-permit-work-types')]
const deleteAccess = [authenticated(), requirePermission('delete-permit-work-types')]

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
    ? and(eq(permitWorkTypes.code, value), ne(permitWorkTypes.id, id))
    : eq(permitWorkTypes.code, value)
  const existing = await getDb().select({ id: permitWorkTypes.id }).from(permitWorkTypes).where(where).limit(1)
  if (existing.length) throw validationError('code must be unique.')
}

export const permitWorkTypeCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = permitWorkType.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const code = normalizeCode(input.code)
    await ensureUniqueCode(code)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(permitWorkTypes).values({
      ...input,
      code,
      active: input.active ?? true,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Permit work type was not created.')
    return args.c.json({ data: permitWorkType.schemas.select.parse(row) }, 201)
  },
})

export const permitWorkTypeUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = permitWorkType.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof permitWorkTypes.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code')) {
      values.code = normalizeCode(input.code)
      await ensureUniqueCode(values.code, id)
    }
    const updated = await getDb().update(permitWorkTypes).set(values).where(eq(permitWorkTypes.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: permitWorkType.schemas.select.parse(updated[0]) })
  },
})

export const domain = defineDomainPart({ tables: { permitWorkTypes }, entities: [permitWorkType] })

export const permitWorkTypeModel = defineModel({
  path: '/permit-work-types',
  entity: permitWorkType,
  routes: {
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: permitWorkTypeCreate,
    update: permitWorkTypeUpdate,
    delete: deleteRoute({ authorize: deleteAccess }),
  },
})
