import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { project } from '@southneuhof/api/routes/projects/projects.entity'
import { divisions } from '../divisions/divisions.resource'
import { locationOperations, projectOperations, type Project, type ProjectCreate, type ProjectUpdate } from './projects.operations'

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

export const projects = defineResource({
  key: 'projects',
  fields: defineFields<Project, ProjectCreate>()({
    number: { table: { sortable: true }, form: { renderer: 'text' } },
    name: { table: { sortable: true } },
    shortName: { label: 'Short Name', form: { renderer: 'text' } },
    divisionId: { label: 'Division', form: { renderer: 'lookup', source: divisions, props: { pick: 'id', view: 'name', required: true } } },
    division: { label: 'Division', read: (record: unknown) => relationName(record, 'division') },
    integrationCode: { label: 'Integration Code', form: { renderer: 'text', props: { required: true } } },
    location: { label: 'Location', read: (record: unknown) => { const value = record && typeof record === 'object' ? (record as Record<string, unknown>).location : undefined; return value && typeof value === 'object' ? (value as { address?: unknown }).address : value }, form: { renderer: 'location', props: { operations: locationOperations } }, write: (draft: Record<string, unknown>, value: unknown) => { const coordinate = value as { formatted_address?: string; name?: string; lat: number; lng: number }; draft.location = { address: coordinate.formatted_address ?? coordinate.name ?? '', lat: coordinate.lat, lng: coordinate.lng } } },
    startDate: { label: 'Start Date', form: { renderer: 'date', props: { required: true } } },
    endDate: { label: 'End Date', form: { renderer: 'date' } },
    description: {},
  }),
  table: { fields: ['name', 'shortName', 'division', 'number', 'integrationCode', 'location', 'startDate', 'endDate', 'description'] },
  detail: { fields: ['name', 'division', 'number', 'integrationCode', 'location', 'description'] },
  form: { fields: ['name', 'shortName', 'divisionId', 'number', 'integrationCode', 'location', 'startDate', 'endDate', 'description'] },
  schemas: { create: fromZod<ProjectCreate>(project.schemas.create), update: fromZod<ProjectUpdate>(project.schemas.update) },
  capabilities: {
    list: { handler: projectOperations.list, permission: null, to: { name: 'master-data-projects' } },
    create: { handler: projectOperations.create, permission: 'create-projects', to: { name: 'master-data-projects-create' } },
    detail: { handler: projectOperations.detail, permission: null, to: { name: 'master-data-projects-detail', params: (id: string) => ({ projectId: id }) } },
    update: { handler: projectOperations.update, permission: null, to: { name: 'master-data-projects-edit', params: (id: string) => ({ projectId: id }) } },
    delete: { handler: projectOperations.delete, permission: null },
  },
})
