import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { divisions } from '@/routes/(authenticated)/master-data/divisions/divisions.resource'
import { projects } from '@/routes/(authenticated)/master-data/projects/projects.resource'
import { projectVendorLookup } from '@/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors/project-vendors.resource'
import { ptsWorkCategories } from '@/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.resource'
import { rootCauses } from '@/routes/(authenticated)/master-data/root-causes/root-causes.resource'
import { workItems } from '@/routes/(authenticated)/master-data/work-items/work-items.resource'
import { users } from '@/routes/(authenticated)/settings/users/users.resource'
import { ptsActions } from './pts.actions'
import { codeLabel, criteriaOptions, dispositionOptions, jobImplementorOptions, ptsSchema, stepLabels } from './pts.schema'

function relationName(record: unknown, key: string, fallback?: string) {
  if (!record || typeof record !== 'object') return fallback
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : fallback
}

function writeRootCauseIds(draft: Record<string, unknown>, value: unknown) {
  draft.rootCauseIds = (Array.isArray(value) ? value : [])
    .map((item) => typeof item === 'string' ? item : item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string' ? (item as { id: string }).id : undefined)
    .filter((item): item is string => Boolean(item))
}

function writeImagePath(draft: Record<string, unknown>, value: unknown) {
  const file = value && typeof value === 'object' ? value as { path?: unknown } : undefined
  draft.imgBefore = typeof file?.path === 'string' ? file.path : typeof value === 'string' ? value : undefined
}

const criteriaDisplay = {
  low: { color: 'success', label: 'Low' },
  medium: { color: 'warning', label: 'Medium' },
  high: { color: 'error', label: 'High' },
} as const
const statusDisplay = {
  open: { color: 'info', label: 'Open' },
  'on-progress': { color: 'warning', label: 'In progress' },
  close: { color: 'success', label: 'Closed' },
} as const

const fields = defineFields(ptsSchema, {
  number: { label: 'PTS Number', table: { sortable: true } },
  divisionId: { label: 'Division', read: (record) => relationName(record, 'division', record.divisionName as string), form: { renderer: 'lookup', source: divisions, props: { pick: 'id', view: 'name', required: true }, behavior: { props: () => ({ searchParameters: { permission: 'create-qhsse-pts', active: true } }) } } },
  projectId: {
    label: 'Project',
    read: (record) => relationName(record, 'project', record.projectName as string),
    form: { renderer: 'lookup', source: projects, props: { pick: 'id', view: 'name', required: true }, behavior: {
      disabled: ({ draft }) => !draft.divisionId,
      props: ({ draft }) => ({ searchParameters: { permission: 'create-qhsse-pts', divisionId: draft.divisionId, active: true } }),
      resetWhen: ({ draft }) => draft.divisionId,
    } },
  },
  ptsWorkCategoryId: {
    label: 'PTS Work Category',
    read: (record) => relationName(record, 'ptsWorkCategory'),
    form: { renderer: 'lookup', source: ptsWorkCategories, props: { pick: 'id', view: 'name', required: true }, behavior: { props: () => ({ searchParameters: { active: true } }) } },
  },
  workItemCategoryId: {
    label: 'Work-item Category',
    read: (record) => relationName(record, 'workItemCategory'),
    form: { renderer: 'lookup', source: workItems, props: { pick: 'id', view: 'name', required: true }, behavior: {
      disabled: ({ draft }) => !draft.projectId,
      props: ({ draft }) => ({ searchParameters: { projectId: draft.projectId, rootOnly: true, active: true } }),
      resetWhen: ({ draft }) => draft.projectId,
    } },
  },
  workItemId: {
    label: 'Work Item',
    read: (record) => relationName(record, 'workItem'),
    form: { renderer: 'lookup', source: workItems, props: { pick: 'id', view: 'name', required: true }, behavior: {
      disabled: ({ draft }) => !draft.workItemCategoryId,
      props: ({ draft }) => ({ searchParameters: { projectId: draft.projectId, workItemCategoryId: draft.workItemCategoryId, leafOnly: true, active: true } }),
      resetWhen: ({ draft }) => draft.workItemCategoryId,
    } },
  },
  locationZone: { label: 'Location Zone', form: { renderer: 'text' } },
  criteriaCode: { label: 'Criteria', display: { renderer: 'chip', props: { options: criteriaDisplay } }, form: { renderer: 'radio', source: criteriaOptions, props: { required: true } } },
  rootCauseIds: { label: 'Root Causes', read: (record) => Array.isArray(record.rootCauses) ? record.rootCauses.map((cause) => (cause as { name?: string }).name).filter(Boolean).join(', ') : '', form: { renderer: 'lookup', source: rootCauses, props: { pick: 'id', view: 'name', multi: true, required: true }, behavior: { props: () => ({ searchParameters: { active: true } }) } }, write: writeRootCauseIds },
  location: { label: 'Location', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Description', form: { renderer: 'textarea' } },
  imgBefore: { label: 'Before Image', form: { renderer: 'image', props: { required: true } }, write: writeImagePath },
  statusCode: { label: 'Status', display: { renderer: 'chip', props: { options: statusDisplay } }, table: { align: 'center' } },
  stepCode: { label: 'Step', read: (record) => codeLabel(record.stepCode, stepLabels), table: { sortable: true } },
  somUserId: { label: 'SOM User' },
  temporaryFollowUpPlan: { label: 'Temporary Follow-up Plan' },
  managementNotes: { label: 'Management Notes' },
  followUpPlan: { label: 'Follow-up Plan' },
  targetDate: { label: 'Target Date', display: { format: 'date' } },
  implementationUserId: { label: 'Implementation User' },
  workMethod: { label: 'Work Method' },
  estimationCost: { label: 'Estimated Cost' },
  jobImplementorType: { label: 'Job Implementor' },
  projectVendorId: { label: 'Project Vendor' },
  implementationDate: { label: 'Implementation Date', display: { format: 'date' } },
  imgProcess: { label: 'Process Image' },
  imgAfter: { label: 'After Image' },
  implementationDescription: { label: 'Implementation Description' },
  implementationStatusCode: { label: 'Implementation Status' },
  implementationVerificationDescription: { label: 'Verification Description' },
  actualCost: { label: 'Actual Cost' },
  actualJobImplementorType: { label: 'Actual Job Implementor' },
  actualProjectVendorId: { label: 'Actual Project Vendor' },
  createdAt: { label: 'Created', display: { format: 'datetime' } },
  updatedAt: { label: 'Updated', display: { format: 'datetime' } },
})

export const pts = defineResource(ptsSchema, {
  key: 'qhsse-pts',
  actions: {
    list: {
      run: ptsActions.list,
      fields: [fields.number, fields.projectId, fields.divisionId, fields.criteriaCode, fields.statusCode, fields.stepCode, fields.createdAt],
      permission: 'view-qhsse-pts',
      route: { name: 'quality-pts' },
    },
    detail: {
      run: ptsActions.detail,
      fields: [fields.number, fields.projectId, fields.divisionId, fields.ptsWorkCategoryId, fields.workItemCategoryId, fields.workItemId, fields.criteriaCode, fields.statusCode, fields.stepCode, fields.createdAt, fields.updatedAt],
      permission: 'view-qhsse-pts',
      route: { name: 'quality-pts-detail', params: (id) => ({ ptsId: String(id) }) },
    },
    create: {
      run: ptsActions.create,
      fields: [fields.divisionId, fields.projectId, fields.ptsWorkCategoryId, fields.workItemCategoryId, fields.workItemId, fields.locationZone, fields.criteriaCode, fields.rootCauseIds, fields.location, fields.imgBefore, fields.description],
      permission: null,
      route: { name: 'quality-pts-create' },
    },
    update: {
      run: ptsActions.update,
      fields: [fields.divisionId, fields.projectId, fields.ptsWorkCategoryId, fields.workItemCategoryId, fields.workItemId, fields.locationZone, fields.criteriaCode, fields.rootCauseIds, fields.location, fields.imgBefore, fields.description],
      permission: null,
      route: { name: 'quality-pts-edit', params: (id) => ({ ptsId: String(id) }) },
    },
    disposition: { run: (id: string, input: object) => ptsActions.action(id, 'disposition', input) },
    temporaryPlan: { run: (id: string, input: object) => ptsActions.action(id, 'temporary-plan', input) },
    managementNotes: { run: (id: string, input: object) => ptsActions.action(id, 'management-notes', input) },
    completeReport: { run: (id: string, input: object) => ptsActions.action(id, 'complete-report', input) },
    completeQiReport: { run: (id: string, input: object) => ptsActions.action(id, 'complete-qi-report', input) },
    followUpImplementation: { run: (id: string, input: object) => ptsActions.action(id, 'follow-up-implementation', input) },
    followUpPrice: { run: (id: string, input: object) => ptsActions.action(id, 'follow-up-price', input) },
    implementationReport: { run: (id: string, input: object) => ptsActions.action(id, 'implementation-report', input) },
    verifyImplementation: { run: (id: string, input: object) => ptsActions.action(id, 'verify-implementation', input) },
    realization: { run: (id: string, input: object) => ptsActions.action(id, 'realization', input) },
    close: { run: (id: string) => ptsActions.action(id, 'close', {}) },
    deleteReport: { run: (id: string, deletedReason: string) => ptsActions.deleteReport(id, deletedReason) },
  },
})

export const ptsActionFields = {
  dispositionStatusCode: { label: 'Disposition', form: { renderer: 'radio', source: dispositionOptions, props: { required: true } } },
  temporaryFollowUpPlan: { label: 'Temporary Follow-up Plan', form: { renderer: 'textarea', props: { required: true } } },
  managementNotes: { label: 'Management Notes', form: { renderer: 'textarea', props: { required: true } } },
  somUserId: { label: 'SOM User', form: { renderer: 'lookup', source: users, props: { pick: 'id', view: 'name', required: true }, behavior: { props: ({ draft }) => ({ searchParameters: { projectId: draft.projectId, statusCode: 'active' } }) } } },
  followUpPlan: { label: 'Follow-up Plan', form: { renderer: 'textarea', props: { required: true } } },
  targetDate: { label: 'Target Date', form: { renderer: 'date', props: { required: true } } },
  criteriaCode: { label: 'Criteria', form: { renderer: 'radio', source: criteriaOptions, props: { required: true } } },
  rootCauseIds: { label: 'Root Causes', form: { renderer: 'lookup', source: rootCauses, props: { pick: 'id', view: 'name', multi: true, required: true }, behavior: { props: () => ({ searchParameters: { active: true } }) } } },
  imgBefore: { label: 'Before Image', form: { renderer: 'image', props: { required: true } } },
  location: { label: 'Location', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Description', form: { renderer: 'textarea', props: { required: true } } },
  implementationUserId: { label: 'Implementation User', form: { renderer: 'lookup', source: users, props: { pick: 'id', view: 'name', required: true }, behavior: { props: ({ draft }) => ({ searchParameters: { projectId: draft.projectId, statusCode: 'active' } }) } } },
  workMethod: { label: 'Work Method', form: { renderer: 'textarea', props: { required: true } } },
  estimationCost: { label: 'Estimated Cost', form: { renderer: 'text', props: { required: true, inputmode: 'decimal' } } },
  jobImplementorType: { label: 'Job Implementor', form: { renderer: 'radio', source: jobImplementorOptions, props: { required: true } } },
  projectVendorId: { label: 'Project Vendor', form: { renderer: 'lookup', source: projectVendorLookup, props: { pick: 'id', view: 'name' }, behavior: {
    visible: ({ draft }) => draft.jobImplementorType === 'vendor',
    props: ({ draft }) => ({ searchParameters: { projectId: draft.projectId, active: true }, required: draft.jobImplementorType === 'vendor' }),
  } } },
  implementationDate: { label: 'Implementation Date', form: { renderer: 'date', props: { required: true } } },
  imgProcess: { label: 'Process Image', form: { renderer: 'image', props: { required: true } } },
  imgAfter: { label: 'After Image', form: { renderer: 'image', props: { required: true } } },
  implementationDescription: { label: 'Implementation Description', form: { renderer: 'textarea' } },
  implementationStatusCode: { label: 'Verification', form: { renderer: 'radio', source: [{ id: 'approved', name: 'Approved' }, { id: 'rejected', name: 'Rejected' }], props: { required: true } } },
  implementationVerificationDescription: { label: 'Verification Description', form: { renderer: 'textarea' } },
  actualCost: { label: 'Actual Cost', form: { renderer: 'text', props: { required: true, inputmode: 'decimal' } } },
  actualJobImplementorType: { label: 'Actual Job Implementor', form: { renderer: 'radio', source: jobImplementorOptions, props: { required: true } } },
  actualProjectVendorId: { label: 'Actual Project Vendor', form: { renderer: 'lookup', source: projectVendorLookup, props: { pick: 'id', view: 'name' }, behavior: {
    visible: ({ draft }) => draft.actualJobImplementorType === 'vendor',
    props: ({ draft }) => ({ searchParameters: { projectId: draft.projectId, active: true }, required: draft.actualJobImplementorType === 'vendor' }),
  } } },
}

export { dispositionOptions, jobImplementorOptions }
