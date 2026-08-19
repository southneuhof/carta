import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { divisions } from '@/routes/(authenticated)/master-data/divisions/divisions.resource'
import { projects } from '@/routes/(authenticated)/master-data/projects/projects.resource'
import { ptsWorkCategories } from '@/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.resource'
import { workItems } from '@/routes/(authenticated)/master-data/work-items/work-items.resource'
import { qualityInspectionActions } from './quality-inspection.actions'
import { itpTypeOptions, qualityInspectionSchema, resultColors, resultLabels, statusColors, statusLabels, statusOptions, stepLabels } from './quality-inspection.schema'

function relationName(record: unknown, key: string, fallback?: string) {
  const value = record && typeof record === 'object' ? (record as Record<string, unknown>)[key] : undefined
  return value && typeof value === 'object' && typeof (value as { name?: unknown }).name === 'string' ? (value as { name: string }).name : fallback
}

const statusDisplay = Object.fromEntries(Object.keys(statusLabels).map((id) => [id, { color: statusColors[id], label: statusLabels[id] }]))
const resultDisplay = Object.fromEntries(Object.keys(resultLabels).map((id) => [id, { color: resultColors[id], label: resultLabels[id] }]))

const fields = defineFields(qualityInspectionSchema, {
  number: { label: 'Nomor Inspection/Test', table: { sortable: true } },
  divisionId: { label: 'Divisi', read: (record) => relationName(record, 'division', record.divisionName as string), form: { renderer: 'lookup', source: divisions, props: { pick: 'id', view: 'name', required: true }, behavior: { props: () => ({ searchParameters: { permission: 'create-quality-inspection', active: true } }) } } },
  projectId: { label: 'Proyek', read: (record) => relationName(record, 'project', record.projectName as string), form: { renderer: 'lookup', source: projects, props: { pick: 'id', view: 'name', required: true }, behavior: { disabled: ({ draft }) => !draft.divisionId, props: ({ draft }) => ({ searchParameters: { permission: 'create-quality-inspection', divisionId: draft.divisionId, active: true } }), resetWhen: ({ draft }) => draft.divisionId } } },
  targetDate: { label: 'Target Pelaksanaan', display: { format: 'date' }, form: { renderer: 'date', props: { required: true } } },
  qualityWorkCategoryId: { label: 'Kategori Pekerjaan', read: (record) => relationName(record, 'qualityWorkCategory'), form: { renderer: 'lookup', source: ptsWorkCategories, props: { pick: 'id', view: 'name', required: true }, behavior: { props: () => ({ searchParameters: { active: true } }) } } },
  workItemCategoryId: { label: 'Jenis Pekerjaan', read: (record) => relationName(record, 'workItemCategory', record.workItemCategoryName as string), form: { renderer: 'lookup', source: workItems, props: { pick: 'id', view: 'name', required: true }, behavior: { disabled: ({ draft }) => !draft.projectId || !draft.qualityWorkCategoryId, props: ({ draft }) => ({ searchParameters: { projectId: draft.projectId, categoryId: draft.qualityWorkCategoryId, rootOnly: true, active: true } }), resetWhen: ({ draft }) => `${draft.projectId ?? ''}:${draft.qualityWorkCategoryId ?? ''}` } } },
  locationZone: { label: 'Area/Zona Kerja', form: { renderer: 'text' } },
  createdByName: { label: 'Dilaporkan Oleh', read: (record) => relationName(record, 'createdByUser', record.createdByName as string) },
  selectedRows: { label: 'Item Pekerjaan', form: { span: 12 } },
  statusCode: { label: 'Status', display: { renderer: 'chip', props: { options: statusDisplay } }, table: { align: 'center' } },
  stepCode: { label: 'Tahap', read: (record) => stepLabels[String(record.stepCode)] ?? String(record.stepCode ?? '—'), table: { sortable: true } },
  resultCode: { label: 'Hasil Inspeksi', display: { renderer: 'chip', props: { options: resultDisplay } } },
  verificationDescription: { label: 'Catatan', display: { renderer: 'html' } },
  workMethod: { label: 'Prosedur / Metode Kerja' },
  inspectionPointCode: { label: 'Inspection Point' },
  scheduleId: { label: 'Jadwal' },
  scheduleStartDate: { label: 'Periode Mulai', display: { format: 'date' } },
  scheduleEndDate: { label: 'Periode Selesai', display: { format: 'date' } },
  createdAt: { label: 'Tanggal Laporan', display: { format: 'datetime' } },
  updatedAt: { label: 'Diubah', display: { format: 'datetime' } },
})

export const qualityInspection = defineResource(qualityInspectionSchema, {
  key: 'quality-inspection',
  actions: {
    list: { run: qualityInspectionActions.list, fields: [fields.number, fields.projectId, fields.targetDate, fields.workItemCategoryId, fields.createdByName, fields.createdAt, fields.locationZone, fields.statusCode, fields.stepCode], permission: 'view-quality-inspection', route: { name: 'quality-quality-inspection' } },
    detail: { run: qualityInspectionActions.detail, fields: [fields.number, fields.divisionId, fields.projectId, fields.targetDate, fields.qualityWorkCategoryId, fields.workItemCategoryId, fields.locationZone, fields.createdByName, fields.scheduleId, fields.scheduleStartDate, fields.scheduleEndDate, fields.statusCode, fields.stepCode, fields.resultCode, fields.verificationDescription, fields.inspectionPointCode, fields.workMethod, fields.createdAt], permission: 'show-quality-inspection', route: { name: 'quality-quality-inspection-detail', params: (id) => ({ qualityInspectionId: String(id) }) } },
    create: { run: qualityInspectionActions.create, fields: [fields.divisionId, fields.projectId, fields.targetDate, fields.qualityWorkCategoryId, fields.workItemCategoryId, fields.locationZone, fields.selectedRows], permission: 'create-quality-inspection', route: { name: 'quality-quality-inspection-create' } },
    update: { run: qualityInspectionActions.update, fields: [fields.divisionId, fields.projectId, fields.targetDate, fields.qualityWorkCategoryId, fields.workItemCategoryId, fields.locationZone, fields.selectedRows], permission: 'update-quality-inspection', route: { name: 'quality-quality-inspection-edit', params: (id) => ({ qualityInspectionId: String(id) }) } },
    delete: { run: qualityInspectionActions.delete, permission: 'delete-quality-inspection' },
    completeReport: { run: qualityInspectionActions.completeReport },
    verifyWorkItem: { run: qualityInspectionActions.verifyWorkItem },
    submitDocumentations: { run: qualityInspectionActions.submitDocumentations },
    verifyReport: { run: qualityInspectionActions.verifyReport },
    loadCreateContext: { run: qualityInspectionActions.loadCreateContext },
    loadSchedules: { run: qualityInspectionActions.loadSchedules },
    loadScheduleContext: { run: qualityInspectionActions.loadScheduleContext },
  },
})

export const qualityInspectionFields = fields
export { itpTypeOptions, statusOptions }
