import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { qhssePtsRootCauses } from '../qhsse-pts/qhsse-pts.entity'
import { rootCauses, rootCause } from './root-causes.entity'

const listAccess = [authenticated(), requirePermission('list-root-causes')]
const detailAccess = [authenticated(), requirePermission('detail-root-causes')]
const createAccess = [authenticated(), requirePermission('create-root-causes')]
const updateAccess = [authenticated(), requirePermission('update-root-causes')]
const deleteAccess = [authenticated(), requirePermission('delete-root-causes')]

async function validateRootCause(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    if (typeof input.code === 'string') input.code = input.code.trim()
    if ('code' in input && input.code === '') return 'code is required.'
  }
  if (route === 'delete' && state.id) {
    const references = await getDb().select({ id: qhssePtsRootCauses.qhssePtsId }).from(qhssePtsRootCauses).where(eq(qhssePtsRootCauses.rootCauseId, state.id)).limit(1)
    if (references.length) return 'Referenced records must be deactivated before delete.'
  }
  return undefined
}

export const domain = defineDomainPart({ tables: { rootCauses }, entities: [rootCause] })

export const rootCauseModel = defineModel({
  path: '/root-causes',
  entity: rootCause,
  routes: {
    list: list({ authorize: listAccess }),
    detail: detail({ authorize: detailAccess }),
    create: create({ authorize: createAccess }),
    update: update({ authorize: updateAccess }),
    delete: deleteRoute({ authorize: deleteAccess }),
  },
  validate: async ({ route, state }) => validateRootCause(route.kind, state as { input?: unknown; id?: string }),
})
