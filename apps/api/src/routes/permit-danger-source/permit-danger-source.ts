import { authenticated, deleteRoute, defineRoute, detail, list } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { permitDangerSources, permitDangerSource } from './permit-danger-source.entity'

const listAccess = [authenticated(), requirePermission('list-permit-danger-source')]
const detailAccess = [authenticated(), requirePermission('detail-permit-danger-source')]
const createAccess = [authenticated(), requirePermission('create-permit-danger-source')]
const updateAccess = [authenticated(), requirePermission('update-permit-danger-source')]
const deleteAccess = [authenticated(), requirePermission('delete-permit-danger-source')]

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
    ? and(eq(permitDangerSources.code, value), ne(permitDangerSources.id, id))
    : eq(permitDangerSources.code, value)
  const existing = await getDb().select({ id: permitDangerSources.id }).from(permitDangerSources).where(where).limit(1)
  if (existing.length) throw validationError('code must be unique.')
}

export const permitDangerSourceCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = permitDangerSource.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const code = normalizeCode(input.code)
    await ensureUniqueCode(code)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(permitDangerSources).values({
      ...input,
      code,
      active: input.active ?? true,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Permit danger source was not created.')
    return args.c.json({ data: permitDangerSource.schemas.select.parse(row) }, 201)
  },
})

export const permitDangerSourceUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = permitDangerSource.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof permitDangerSources.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code')) {
      values.code = normalizeCode(input.code)
      await ensureUniqueCode(values.code, id)
    }
    const updated = await getDb().update(permitDangerSources).set(values).where(eq(permitDangerSources.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: permitDangerSource.schemas.select.parse(updated[0]) })
  },
})

export const domain = defineDomainPart({ tables: { permitDangerSources }, entities: [permitDangerSource] })

export const permitDangerSourceModel = defineModel({
  path: '/permit-danger-source',
  entity: permitDangerSource,
  routes: {
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: permitDangerSourceCreate,
    update: permitDangerSourceUpdate,
    delete: deleteRoute({ authorize: deleteAccess }),
  },
})
