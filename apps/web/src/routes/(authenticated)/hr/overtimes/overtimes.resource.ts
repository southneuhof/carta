import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { overtime } from '@southneuhof/api/routes/overtimes/overtimes.entity'
import { overtimeOperations, type Overtime, type OvertimeCreate, type OvertimeListQuery, type OvertimeStatus, type OvertimeUpdate } from './overtimes.operations'
import { createLookupDetail, createLookupLoad } from '@/framework/adapters/lookup'

const sections = {
  fields: ['name'],
  load: createLookupLoad<Record<string, unknown>>('toll-sections/list'),
  loadDetail: createLookupDetail<Record<string, unknown>>('toll-sections/list'),
  pick: 'id',
  view: 'name',
}
const employees = {
  fields: ['fullName'],
  load: createLookupLoad<Record<string, unknown>>('employees/list'),
  loadDetail: createLookupDetail<Record<string, unknown>>('employees/list'),
  pick: 'id',
  view: 'fullName',
}
const positions = {
  fields: ['name'],
  load: createLookupLoad<Record<string, unknown>>('job-positions/list'),
  loadDetail: createLookupDetail<Record<string, unknown>>('job-positions/list'),
  pick: 'id',
  view: 'name',
}

export const overtimeStatusLabels: Record<OvertimeStatus, string> = {
  draft: 'Draft',
  waiting: 'Menunggu Verifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export const overtimeFields = defineFields<Overtime, OvertimeCreate>()({
  sectionId: {
    label: 'Ruas',
    read: (record) => record.section?.name ?? record.sectionId,
    form: { renderer: 'lookup', props: sections },
  },
  applicantEmployeeId: {
    label: 'Karyawan',
    read: (record) => record.applicant?.fullName ?? record.applicantEmployeeId,
    form: {
      renderer: 'lookup',
      props: employees,
      behavior: {
        visible: ({ draft }) => Boolean(draft.sectionId),
        disabled: ({ draft }) => !draft.sectionId,
        props: ({ draft }) => ({ searchParameters: { sectionId: String(draft.sectionId ?? ''), for: 'hr-applicant' } }),
        resetWhen: ({ draft }) => draft.sectionId,
      },
    },
  },
  date: { label: 'Tanggal Lembur', table: { sortable: true }, form: { renderer: 'date' } },
  startTime: { label: 'Waktu Mulai Lembur', form: { renderer: 'time' } },
  estimatedMinutes: { label: 'Estimasi Lama Lembur', display: { format: 'number' }, form: { renderer: 'number', props: { suffix: 'Menit', min: 1 } } },
  description: { label: 'Keterangan', form: { renderer: 'textarea' } },
  statusCode: { label: 'Status', read: (record) => overtimeStatusLabels[record.statusCode] ?? record.statusCode, form: false },
  createdAt: { label: 'Dibuat', display: { format: 'datetime' }, form: false },
  updatedAt: { label: 'Diperbarui', display: { format: 'datetime' }, form: false },
})

const overtimeFilterFields = defineFields<OvertimeListQuery, OvertimeListQuery>()({
    sectionId: { label: 'Ruas', form: { renderer: 'lookup', props: sections } },
    applicantEmployeeId: { label: 'Karyawan', form: { renderer: 'lookup', props: employees } },
    startDate: { label: 'Tanggal mulai', form: { renderer: 'date' } },
    endDate: { label: 'Tanggal akhir', form: { renderer: 'date' } },
    jobPositionId: { label: 'Jabatan', form: { renderer: 'lookup', props: positions } },
    statusCode: {
      label: 'Status',
      form: {
        renderer: 'radio',
        props: {
          data: Object.entries(overtimeStatusLabels).map(([id, name]) => ({ id, name })),
          pick: 'id',
          view: 'name',
        },
      },
    },
})

export const overtimeListFilters = {
  label: 'Filter lembur',
  resetLabel: 'Reset filter',
  fields: overtimeFilterFields,
}

export const overtimes = defineResource({
  key: 'overtimes',
  fields: overtimeFields,
  table: { fields: ['sectionId', 'applicantEmployeeId', 'date', 'startTime', 'estimatedMinutes', 'statusCode'] },
  detail: { fields: ['sectionId', 'applicantEmployeeId', 'date', 'startTime', 'estimatedMinutes', 'description', 'statusCode', 'createdAt', 'updatedAt'] },
  form: { fields: ['sectionId', 'applicantEmployeeId', 'date', 'startTime', 'estimatedMinutes', 'description'] },
  schemas: { create: fromZod<OvertimeCreate>(overtime.schemas.create), update: fromZod<OvertimeUpdate>(overtime.schemas.update) },
  capabilities: {
    list: { handler: overtimeOperations.list, permission: 'overtimes.list', to: { name: 'hr-overtimes' } },
    create: { handler: overtimeOperations.create, permission: 'overtimes.create', to: { name: 'hr-overtimes-create' } },
    detail: { handler: overtimeOperations.detail, permission: 'overtimes.detail', to: { name: 'hr-overtimes-detail', params: (id) => ({ overtimeId: id }) } },
    update: { handler: overtimeOperations.update, permission: 'overtimes.update', to: { name: 'hr-overtimes-edit', params: (id) => ({ overtimeId: id }) } },
  },
})

export type { Overtime, OvertimeCreate, OvertimeUpdate }
