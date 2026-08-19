import { authenticated, deleteRoute, defineRoute, detail, list } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { safetyChecklists, safetyChecklist } from './safety-checklist.entity'

const listAccess = [authenticated(), requirePermission('list-safety-checklist')]
const detailAccess = [authenticated(), requirePermission('detail-safety-checklist')]
const createAccess = [authenticated(), requirePermission('create-safety-checklist')]
const updateAccess = [authenticated(), requirePermission('update-safety-checklist')]
const deleteAccess = [authenticated(), requirePermission('delete-safety-checklist')]

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
    ? and(eq(safetyChecklists.code, value), ne(safetyChecklists.id, id))
    : eq(safetyChecklists.code, value)
  const existing = await getDb().select({ id: safetyChecklists.id }).from(safetyChecklists).where(where).limit(1)
  if (existing.length) throw validationError('code must be unique.')
}

export const safetyChecklistCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = safetyChecklist.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const code = normalizeCode(input.code)
    await ensureUniqueCode(code)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(safetyChecklists).values({
      ...input,
      code,
      active: input.active ?? true,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Safety checklist was not created.')
    return args.c.json({ data: safetyChecklist.schemas.select.parse(row) }, 201)
  },
})

export const safetyChecklistUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = safetyChecklist.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof safetyChecklists.$inferInsert> = { ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }
    if (Object.prototype.hasOwnProperty.call(input, 'code')) {
      values.code = normalizeCode(input.code)
      await ensureUniqueCode(values.code, id)
    }
    const updated = await getDb().update(safetyChecklists).set(values).where(eq(safetyChecklists.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: safetyChecklist.schemas.select.parse(updated[0]) })
  },
})

export const domain = defineDomainPart({ tables: { safetyChecklists }, entities: [safetyChecklist] })

export const safetyChecklistModel = defineModel({
  path: '/safety-checklist',
  entity: safetyChecklist,
  routes: {
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: safetyChecklistCreate,
    update: safetyChecklistUpdate,
    delete: deleteRoute({ authorize: deleteAccess }),
  },
})
