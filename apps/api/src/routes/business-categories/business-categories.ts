import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { divisions } from '../divisions/divisions.entity'
import { businessCategories, businessCategory } from './business-categories.entity'

const listBusinessCategories = [authenticated(), requirePermission('list-business-categories')]
const detailBusinessCategories = [authenticated(), requirePermission('detail-business-categories')]
const createBusinessCategories = [authenticated(), requirePermission('create-business-categories')]
const updateBusinessCategories = [authenticated(), requirePermission('update-business-categories')]
const deleteBusinessCategories = [authenticated(), requirePermission('delete-business-categories')]

async function validateBusinessCategory(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    if (typeof input.code === 'string') input.code = input.code.trim()
    if ('code' in input && input.code === '') return 'code is required.'
  }
  if (route === 'delete' && state.id) {
    const references = await getDb().select({ id: divisions.id }).from(divisions).where(eq(divisions.businessCategoryId, state.id)).limit(1)
    if (references.length) return 'Referenced records must be deactivated before delete.'
  }
  return undefined
}

export const domain = defineDomainPart({ tables: { businessCategories }, entities: [businessCategory] })

export const businessCategoryModel = defineModel({
  path: '/business-categories',
  entity: businessCategory,
  routes: {
    list: list({ authorize: listBusinessCategories }),
    detail: detail({ authorize: detailBusinessCategories }),
    create: create({ authorize: createBusinessCategories }),
    update: update({ authorize: updateBusinessCategories }),
    delete: deleteRoute({ authorize: deleteBusinessCategories }),
  },
  validate: async ({ route, state }) => validateBusinessCategory(route.kind, state as { input?: unknown; id?: string }),
})
