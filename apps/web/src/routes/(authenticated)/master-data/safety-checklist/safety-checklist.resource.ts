import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { safetyChecklistsSchema } from './safety-checklist.schema'

const api = createHonoResourceActions(rpc['safety-checklist'], dataAdapter)

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const

const fields = defineFields(safetyChecklistsSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

export const safetyChecklists = defineResource(safetyChecklistsSchema, {
  key: 'safety-checklist',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.active],
      permission: 'view-safety-checklist',
      route: { name: 'master-data-safety-checklist' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.active],
      permission: 'view-safety-checklist',
      route: { name: 'master-data-safety-checklist-detail', params: (id) => ({ safetyChecklistId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.active],
      permission: 'create-safety-checklist',
      route: { name: 'master-data-safety-checklist-create' },
      initialData: { active: true },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.active],
      permission: 'update-safety-checklist',
      route: { name: 'master-data-safety-checklist-edit', params: (id) => ({ safetyChecklistId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-safety-checklist' },
  },
})

export type { SafetyChecklist, SafetyChecklistCreate, SafetyChecklistUpdate } from './safety-checklist.schema'
