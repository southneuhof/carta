import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { projects } from '../projects/projects.entity'
import { projectVendorRelations, projectVendors, projectVendor } from './project-vendors.entity'

const read = [authenticated(), requirePermission('view-project-vendors')]
const write = [authenticated(), requirePermission('manage-project-vendors')]

async function validateProjectVendor(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if ((route === 'create' || route === 'update') && typeof input.projectId === 'string') {
    const project = (await getDb().select({ active: projects.active }).from(projects).where(eq(projects.id, input.projectId)).limit(1))[0]
    if (!project) return 'Project not found.'
    if (!project.active) return 'Inactive project cannot receive a vendor.'
  }
  return undefined
}

export const domain = defineDomainPart({ tables: { projectVendors }, entities: [projectVendor], relations: [projectVendorRelations] })

export const projectVendorModel = defineModel({
  path: '/project-vendors',
  entity: projectVendor,
  routes: {
    list: list({ authorize: read }),
    detail: detail({ authorize: read }),
    create: create({ authorize: write }),
    update: update({ authorize: write }),
    delete: deleteRoute({ authorize: write }),
  },
  validate: async ({ route, state }) => validateProjectVendor(route.kind, state as { input?: unknown; id?: string }),
})
