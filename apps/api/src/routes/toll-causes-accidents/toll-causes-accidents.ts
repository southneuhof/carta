import { authenticated, defineRoute, deleteRoute, detail, list } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { tollCausesAccidents, tollCausesAccidentsCategories, tollCausesAccidentsCategory, tollCausesAccidentsCause, tollCausesAccidentsRelations } from './toll-causes-accidents.entity'

const listAccess = [authenticated(), requirePermission('list-toll-causes-accidents')]
const detailAccess = [authenticated(), requirePermission('detail-toll-causes-accidents')]
const createAccess = [authenticated(), requirePermission('create-toll-causes-accidents')]
const updateAccess = [authenticated(), requirePermission('update-toll-causes-accidents')]
const deleteAccess = [authenticated(), requirePermission('delete-toll-causes-accidents')]

async function validateTollCause(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    if (typeof input.categoryCode === 'string') {
      const category = await getDb().select({ active: tollCausesAccidentsCategories.active }).from(tollCausesAccidentsCategories).where(eq(tollCausesAccidentsCategories.code, input.categoryCode.trim())).limit(1)
      if (!category[0]?.active) return 'Category is invalid.'
    }
    if (typeof input.code === 'string' && input.code.trim() !== '') {
      const where = state.id
        ? and(eq(tollCausesAccidents.code, input.code.trim()), ne(tollCausesAccidents.id, state.id))
        : eq(tollCausesAccidents.code, input.code.trim())
      const duplicate = await getDb().select({ id: tollCausesAccidents.id }).from(tollCausesAccidents).where(where).limit(1)
      if (duplicate.length) return 'code must be unique.'
    }
  }
  return undefined
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

export const tollCausesAccidentsCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: createAccess,
  action: async (args) => {
    const identity = await actor(args)
    const input = tollCausesAccidentsCause.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const message = await validateTollCause('create', { input })
    if (message) throw validationError(message)
    const timestamp = new Date().toISOString()
    const inserted = await getDb().insert(tollCausesAccidents).values({
      ...input,
      createdByUserId: identity.userId,
      updatedByUserId: identity.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Toll accident cause was not created.')
    const data = await tollCausesAccidentsCause.source.materialize(row, { context: args.context })
    return args.c.json({ data }, 201)
  },
})

export const tollCausesAccidentsUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: updateAccess,
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const input = tollCausesAccidentsCause.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    const message = await validateTollCause('update', { id, input })
    if (message) throw validationError(message)
    const updated = await getDb().update(tollCausesAccidents).set({ ...input, updatedByUserId: identity.userId, updatedAt: new Date().toISOString() }).where(eq(tollCausesAccidents.id, id)).returning()
    if (!updated[0]) throw notFound()
    const data = await tollCausesAccidentsCause.source.materialize(updated[0], { context: args.context })
    return args.c.json({ data })
  },
})

export const domain = defineDomainPart({
  tables: { tollCausesAccidents, tollCausesAccidentsCategories },
  entities: [tollCausesAccidentsCause, tollCausesAccidentsCategory],
  relations: [tollCausesAccidentsRelations],
})

export const tollCausesAccidentsModel = defineModel({
  path: '/toll-causes-accidents',
  entity: tollCausesAccidentsCause,
  routes: {
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: tollCausesAccidentsCreate,
    update: tollCausesAccidentsUpdate,
    delete: deleteRoute({ authorize: deleteAccess }),
  },
  validate: async ({ route, state }) => validateTollCause(route.kind, state as { input?: unknown; id?: string }),
})
