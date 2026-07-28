import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { overtime } from '@southneuhof/api/routes/overtimes/overtimes.entity'
import { overtimeOperations, type Overtime, type OvertimeCreate, type OvertimeStatus, type OvertimeUpdate } from './overtimes.operations'

export const overtimeStatusLabels: Record<OvertimeStatus, string> = {
  draft: 'Draft', waiting: 'Awaiting verification', approved: 'Approved', rejected: 'Rejected',
}

export const overtimeFields = defineFields<Overtime, OvertimeCreate>()({
  date: { label: 'Date', table: { sortable: true }, form: { renderer: 'date' } },
  startTime: { label: 'Start time', form: { renderer: 'text' } },
  estimatedMinutes: { label: 'Duration (minutes)', form: { renderer: 'number' } },
  applicantEmployeeId: { label: 'Applicant', read: (record) => record.applicant?.fullName ?? record.applicantEmployeeId, form: false },
  statusCode: { label: 'Status', read: (record) => overtimeStatusLabels[record.statusCode] ?? record.statusCode, form: false },
  description: { label: 'Description', form: { renderer: 'text' } },
  createdAt: { label: 'Created', display: { format: 'datetime' }, form: false },
})

export const overtimes = defineResource({
  key: 'overtimes',
  fields: overtimeFields,
  table: { fields: ['date', 'startTime', 'estimatedMinutes', 'applicantEmployeeId', 'statusCode'] },
  detail: { fields: ['date', 'startTime', 'estimatedMinutes', 'applicantEmployeeId', 'statusCode', 'description', 'createdAt'] },
  form: { fields: ['date', 'startTime', 'estimatedMinutes', 'description'] },
  schemas: { create: fromZod<OvertimeCreate>(overtime.schemas.create), update: fromZod<OvertimeUpdate>(overtime.schemas.update) },
  capabilities: {
    list: { handler: overtimeOperations.list, permission: 'overtimes.list', to: { name: 'hr-overtimes' } },
    create: { handler: overtimeOperations.create, permission: 'overtimes.create', to: { name: 'hr-overtimes-create' } },
    detail: { handler: overtimeOperations.detail, permission: 'overtimes.detail', to: { name: 'hr-overtimes-detail', params: (id) => ({ overtimeId: id }) } },
    update: { handler: overtimeOperations.update, permission: 'overtimes.update', to: { name: 'hr-overtimes-edit', params: (id) => ({ overtimeId: id }) } },
  },
})

export type { Overtime, OvertimeCreate, OvertimeUpdate }
