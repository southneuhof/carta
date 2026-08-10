import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { workItems } from '../work-items/work-items.entity'
import { uoms, uom } from './uoms.entity'

const read = [authenticated(), requirePermission('view-uoms')]
const write = [authenticated(), requirePermission('manage-uoms')]

async function validateUom(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    if (typeof input.code === 'string') input.code = input.code.trim()
    if ('code' in input && input.code === '') return 'code is required.'
  }
  if (route === 'delete' && state.id) {
    const references = await getDb().select({ id: workItems.id }).from(workItems).where(eq(workItems.uomId, state.id)).limit(1)
    if (references.length) return 'Referenced records must be deactivated before delete.'
  }
  return undefined
}

export const domain = defineDomainPart({ tables: { uoms }, entities: [uom] })

export const uomModel = defineModel({
  path: '/uoms',
  entity: uom,
  routes: {
    list: list({ authorize: read }),
    detail: detail({ authorize: read }),
    create: create({ authorize: write }),
    update: update({ authorize: write }),
    delete: deleteRoute({ authorize: write }),
  },
  before: ({ route, state }) => route.kind === 'list'
    ? { query: { ...(state.query as Record<string, unknown>), uomType: 'work-items' } }
    : undefined,
  validate: async ({ route, state }) => validateUom(route.kind, state as { input?: unknown; id?: string }),
})
