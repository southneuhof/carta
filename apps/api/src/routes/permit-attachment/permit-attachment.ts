import { authenticated, deleteRoute, defineRoute, detail, list } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { permitWorkTypes } from '../permit-work-types/permit-work-types.entity'
import { permitAttachment, permitAttachments } from './permit-attachment.entity'

const listAccess = [authenticated(), requirePermission('list-permit-attachment')]
const detailAccess = [authenticated(), requirePermission('detail-permit-attachment')]
const createAccess = [authenticated(), requirePermission('create-permit-attachment')]
const updateAccess = [authenticated(), requirePermission('update-permit-attachment')]
const deleteAccess = [authenticated(), requirePermission('delete-permit-attachment')]

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
    ? and(eq(permitAttachments.code, value), ne(permitAttachments.id, id))
    : eq(permitAttachments.code, value)
  const existing = await getDb().select({ id: permitAttachments.id }).from(permitAttachments).where(where).limit(1)
  if (existing.length) throw validationError('code must be unique.')
}

async function ensurePermitWorkType(id: string | null | undefined) {
  if (id == null) return
  const existing = await getDb().select({ id: permitWorkTypes.id }).from(permitWorkTypes).where(eq(permitWorkTypes.id, id)).limit(1)
  if (!existing.length) throw validationError('Permit work type not found.')
}

export const permitAttachmentCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = permitAttachment.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const code = normalizeCode(input.code)
    await ensureUniqueCode(code)
    await ensurePermitWorkType(input.permitWorkTypeId)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(permitAttachments).values({
      ...input,
      code,
      active: input.active ?? true,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Permit attachment was not created.')
    return args.c.json({ data: permitAttachment.schemas.select.parse(row) }, 201)
  },
})

export const permitAttachmentUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = permitAttachment.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof permitAttachments.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code')) {
      values.code = normalizeCode(input.code)
      await ensureUniqueCode(values.code, id)
    }
    const updated = await getDb().update(permitAttachments).set(values).where(eq(permitAttachments.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: permitAttachment.schemas.select.parse(updated[0]) })
  },
})

export const domain = defineDomainPart({ tables: { permitAttachments }, entities: [permitAttachment] })

export const permitAttachmentModel = defineModel({
  path: '/permit-attachment',
  entity: permitAttachment,
  routes: {
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: permitAttachmentCreate,
    update: permitAttachmentUpdate,
    delete: deleteRoute({ authorize: deleteAccess }),
  },
})
