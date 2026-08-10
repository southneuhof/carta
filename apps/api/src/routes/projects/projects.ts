import { authenticated, create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { divisions } from '../divisions/divisions.entity'
import { workItems } from '../work-items/work-items.entity'
import { projectRelations, projects, project } from './projects.entity'

const read = [authenticated(), requirePermission('view-projects')]
const write = [authenticated(), requirePermission('manage-projects')]

async function validateProject(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    for (const key of ['number', 'integrationCode']) if (typeof input[key] === 'string') input[key] = input[key].trim()
    if (typeof input.shortName === 'string') input.shortName = input.shortName.trim()
    for (const key of ['number', 'integrationCode']) if (key in input && input[key] === '') return `${key} is required.`
    if (route === 'create' && (typeof input.startDate !== 'string' || input.startDate.trim() === '')) return 'startDate is required.'
    if (typeof input.divisionId === 'string') {
      const parent = (await getDb().select({ active: divisions.active }).from(divisions).where(eq(divisions.id, input.divisionId)).limit(1))[0]
      if (!parent) return 'Division not found.'
      if (!parent.active) return 'Inactive division cannot receive an active project.'
    }
  }
  if (route === 'delete' && state.id) {
    const references = await getDb().select({ id: workItems.id }).from(workItems).where(eq(workItems.projectId, state.id)).limit(1)
    if (references.length) return 'Referenced records must be deactivated before delete.'
  }
  return undefined
}

export const domain = defineDomainPart({ tables: { projects }, entities: [project], relations: [projectRelations] })

export const projectModel = defineModel({
  path: '/projects',
  entity: project,
  routes: {
    list: list({ authorize: read }),
    detail: detail({ authorize: read }),
    create: create({ authorize: write }),
    update: update({ authorize: write }),
    delete: deleteRoute({ authorize: write }),
  },
  validate: async ({ route, state }) => validateProject(route.kind, state as { input?: unknown; id?: string }),
})
