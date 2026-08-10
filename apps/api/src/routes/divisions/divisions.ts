import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { businessCategories } from '../business-categories/business-categories.entity'
import { projects } from '../projects/projects.entity'
import { divisionRelations, divisions, division } from './divisions.entity'

async function validateDivision(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    if (typeof input.code === 'string') input.code = input.code.trim()
    if ('code' in input && input.code === '') return 'code is required.'
    if (typeof input.businessCategoryId === 'string') {
      const parent = (await getDb().select({ active: businessCategories.active }).from(businessCategories).where(eq(businessCategories.id, input.businessCategoryId)).limit(1))[0]
      if (!parent) return 'Business category not found.'
      if (!parent.active) return 'Inactive business category cannot receive an active division.'
    }
  }
  if (route === 'delete' && state.id) {
    const references = await getDb().select({ id: projects.id }).from(projects).where(eq(projects.divisionId, state.id)).limit(1)
    if (references.length) return 'Referenced records must be deactivated before delete.'
  }
  return undefined
}

export const domain = defineDomainPart({ tables: { divisions }, entities: [division], relations: [divisionRelations] })

const read = [authenticated(), requirePermission('view-divisions')]
const write = [authenticated(), requirePermission('manage-divisions')]

export const divisionModel = defineModel({
  path: '/divisions',
  entity: division,
  routes: {
    list: list({ authorize: read }),
    detail: detail({ authorize: read }),
    create: create({ authorize: write }),
    update: update({ authorize: write }),
    delete: deleteRoute({ authorize: write }),
  },
  validate: async ({ route, state }) => validateDivision(route.kind, state as { input?: unknown; id?: string }),
})
