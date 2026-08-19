import { authenticated, deleteRoute, defineRoute, detail, list } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { emergencySimulationTopics, emergencySimulationTopic } from './emergency-simulation-topics.entity'

const listAccess = [authenticated(), requirePermission('list-emergency-simulation-topics')]
const detailAccess = [authenticated(), requirePermission('detail-emergency-simulation-topics')]
const createAccess = [authenticated(), requirePermission('create-emergency-simulation-topics')]
const updateAccess = [authenticated(), requirePermission('update-emergency-simulation-topics')]
const deleteAccess = [authenticated(), requirePermission('delete-emergency-simulation-topics')]

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
    ? and(eq(emergencySimulationTopics.code, value), ne(emergencySimulationTopics.id, id))
    : eq(emergencySimulationTopics.code, value)
  const existing = await getDb().select({ id: emergencySimulationTopics.id }).from(emergencySimulationTopics).where(where).limit(1)
  if (existing.length) throw validationError('code must be unique.')
}

export const emergencySimulationTopicCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = emergencySimulationTopic.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const code = normalizeCode(input.code)
    await ensureUniqueCode(code)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(emergencySimulationTopics).values({
      ...input,
      name: input.name.trim(),
      code,
      description: input.description?.trim() || null,
      active: input.active ?? true,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Emergency simulation topic was not created.')
    return args.c.json({ data: emergencySimulationTopic.schemas.select.parse(row) }, 201)
  },
})

export const emergencySimulationTopicUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = emergencySimulationTopic.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const values: Partial<typeof emergencySimulationTopics.$inferInsert> = {
      ...input,
      updatedByUserId: identity.userId,
      updatedAt: new Date().toISOString(),
    }
    if (Object.prototype.hasOwnProperty.call(input, 'name') && input.name !== undefined) values.name = input.name.trim()
    if (Object.prototype.hasOwnProperty.call(input, 'code')) {
      values.code = normalizeCode(input.code)
      await ensureUniqueCode(values.code, id)
    }
    if (Object.prototype.hasOwnProperty.call(input, 'description')) values.description = input.description?.trim() || null
    const updated = await getDb().update(emergencySimulationTopics).set(values).where(eq(emergencySimulationTopics.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: emergencySimulationTopic.schemas.select.parse(updated[0]) })
  },
})

export const domain = defineDomainPart({ tables: { emergencySimulationTopics }, entities: [emergencySimulationTopic] })

export const emergencySimulationTopicModel = defineModel({
  path: '/emergency-simulation-topics',
  entity: emergencySimulationTopic,
  routes: {
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: emergencySimulationTopicCreate,
    update: emergencySimulationTopicUpdate,
    delete: deleteRoute({ authorize: deleteAccess }),
  },
})
