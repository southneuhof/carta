import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { requirePermission } from '../../identity'
import { ptsWorkCategories, ptsWorkCategory } from './pts-work-categories.entity'

const read = [authenticated(), requirePermission('view-pts-work-categories')]
const write = [authenticated(), requirePermission('manage-pts-work-categories')]

async function validatePtsWorkCategory(route: string, state: { input?: unknown }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    if (typeof input.code === 'string') input.code = input.code.trim()
    if ('code' in input && input.code === '') return 'code is required.'
  }
  return undefined
}

export const domain = defineDomainPart({ tables: { ptsWorkCategories }, entities: [ptsWorkCategory] })

export const ptsWorkCategoryModel = defineModel({
  path: '/pts-work-categories',
  entity: ptsWorkCategory,
  routes: {
    list: list({ authorize: read }),
    detail: detail({ authorize: read }),
    create: create({ authorize: write }),
    update: update({ authorize: write }),
    delete: deleteRoute({ authorize: write }),
  },
  validate: async ({ route, state }) => validatePtsWorkCategory(route.kind, state as { input?: unknown }),
})
