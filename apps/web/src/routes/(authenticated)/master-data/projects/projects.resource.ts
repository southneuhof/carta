import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { locationOperations } from '@/framework/adapters/location'
import { divisions } from '../divisions/divisions.resource'
import { projectsActions } from './projects.actions'
import { projectsSchema } from './projects.schema'

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

function locationName(record: unknown) {
  const value = record && typeof record === 'object' ? (record as Record<string, unknown>).location : undefined
  return value && typeof value === 'object' ? (value as { address?: unknown }).address : value
}

function writeLocation(draft: Record<string, unknown>, value: unknown) {
  const coordinate = value as { formatted_address?: string; name?: string; lat: number; lng: number }
  draft.location = { address: coordinate.formatted_address ?? coordinate.name ?? '', lat: coordinate.lat, lng: coordinate.lng }
}

const fields = defineFields(projectsSchema, {
  name: { table: { sortable: true } },
  shortName: { label: 'Short Name', form: { renderer: 'text' } },
  division: { label: 'Division', read: (record) => relationName(record, 'division') },
  divisionId: { label: 'Division', form: { renderer: 'lookup', source: divisions, props: { pick: 'id', view: 'name', required: true } } },
  number: { table: { sortable: true }, form: { renderer: 'text' } },
  integrationCode: { label: 'Integration Code', form: { renderer: 'text', props: { required: true } } },
  location: { label: 'Location', read: locationName, form: { renderer: 'location', props: { operations: locationOperations } }, write: writeLocation },
  startDate: { label: 'Start Date', form: { renderer: 'date', props: { required: true } } },
  endDate: { label: 'End Date', form: { renderer: 'date' } },
  description: {},
})

export const projects = defineResource(projectsSchema, {
  key: 'projects',
  actions: {
    list: {
      run: projectsActions.list,
      fields: [fields.name, fields.shortName, fields.division, fields.number, fields.integrationCode, fields.location, fields.startDate, fields.endDate, fields.description],
      permission: 'view-projects',
      route: { name: 'master-data-projects' },
    },
    detail: {
      run: projectsActions.detail,
      fields: [fields.name, fields.division, fields.number, fields.integrationCode, fields.location, fields.description],
      permission: 'view-projects',
      route: { name: 'master-data-projects-detail', params: (id) => ({ projectId: String(id) }) },
    },
    create: {
      run: projectsActions.create,
      fields: [fields.name, fields.shortName, fields.divisionId, fields.number, fields.integrationCode, fields.location, fields.startDate, fields.endDate, fields.description],
      permission: 'create-projects',
      route: { name: 'master-data-projects-create' },
    },
    update: {
      run: projectsActions.update,
      fields: [fields.name, fields.shortName, fields.divisionId, fields.number, fields.integrationCode, fields.location, fields.startDate, fields.endDate, fields.description],
      permission: 'update-projects',
      route: { name: 'master-data-projects-edit', params: (id) => ({ projectId: String(id) }) },
    },
    delete: { run: projectsActions.delete, permission: 'delete-projects' },
  },
})
