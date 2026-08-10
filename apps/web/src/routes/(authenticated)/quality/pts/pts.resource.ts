import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { createReportSchema, updateReportSchema } from '@southneuhof/api/routes/qhsse-pts/qhsse-pts.schemas'
import { ptsOperations, type Pts, type PtsCreate, type PtsQuery, type PtsUpdate } from './pts.operations'

export const ptsFields = defineFields<Pts, PtsCreate>()({
  number: { label: 'PTS Number', table: { sortable: true } },
  date: { label: 'Date', table: { sortable: true }, form: { renderer: 'text' } },
  projectName: { label: 'Project', table: { sortable: true } },
  divisionName: { label: 'Division', table: { sortable: true } },
  criteriaCode: { label: 'Criteria', table: { sortable: true }, form: { renderer: 'text' } },
  statusCode: { label: 'Status', table: { sortable: true } },
  stepCode: { label: 'Step', table: { sortable: true } },
  description: { label: 'Description', form: { renderer: 'textarea' } },
  imgBefore: { label: 'Before Image', display: { renderer: 'file' }, form: { renderer: 'file' } },
  imgProcess: { label: 'Process Image', display: { renderer: 'file' }, form: { renderer: 'file' } },
  imgAfter: { label: 'After Image', display: { renderer: 'file' }, form: { renderer: 'file' } },
})

const ptsCapabilities = {
  list: { handler: ptsOperations.list, permission: 'view-qhsse-pts', to: { name: 'quality-pts' } },
  create: { handler: ptsOperations.create, permission: 'create-qhsse-pts', to: { name: 'quality-pts-create' } },
  detail: { handler: ptsOperations.detail, permission: 'show-qhsse-pts', to: { name: 'quality-pts-detail', params: (id: string) => ({ ptsId: id }) } },
  update: { handler: ptsOperations.update, permission: 'update-qhsse-pts', to: { name: 'quality-pts-edit', params: (id: string) => ({ ptsId: id }) } },
  delete: { handler: ptsOperations.delete, permission: 'delete-qhsse-pts' },
} as const

export const pts = defineResource<typeof ptsCapabilities, Pts, PtsQuery, PtsCreate, PtsUpdate>({
  key: 'qhsse-pts',
  fields: ptsFields,
  table: { fields: ['number', 'date', 'projectName', 'divisionName', 'criteriaCode', 'statusCode', 'stepCode'] },
  detail: {
    fields: ['number', 'date', 'projectName', 'divisionName', 'criteriaCode', 'statusCode', 'stepCode', 'description', 'location', 'imgBefore', 'imgProcess', 'imgAfter', 'createdAt', 'updatedAt'],
  },
  form: { fields: ['date', 'divisionId', 'projectId', 'ptsWorkCategoryId', 'workItemCategoryId', 'workItemId', 'criteriaCode', 'rootCauseIds', 'imgBefore', 'location', 'description'] },
  schemas: { create: fromZod<PtsCreate>(createReportSchema), update: fromZod<PtsUpdate>(updateReportSchema) },
  capabilities: ptsCapabilities,
})

export type { PtsCreate, PtsUpdate }
