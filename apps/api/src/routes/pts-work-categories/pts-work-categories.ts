import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { requirePermission } from '../../identity'
import { ptsWorkCategories, ptsWorkCategory } from './pts-work-categories.entity'

const listAccess = [authenticated(), requirePermission('list-pts-work-categories')]
const detailAccess = [authenticated(), requirePermission('detail-pts-work-categories')]
const createAccess = [authenticated(), requirePermission('create-pts-work-categories')]
const updateAccess = [authenticated(), requirePermission('update-pts-work-categories')]
const deleteAccess = [authenticated(), requirePermission('delete-pts-work-categories')]

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
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: create({ authorize: createAccess }),
    update: update({ authorize: updateAccess }),
    delete: deleteRoute({ authorize: deleteAccess }),
  },
  validate: async ({ route, state }) => validatePtsWorkCategory(route.kind, state as { input?: unknown }),
})
