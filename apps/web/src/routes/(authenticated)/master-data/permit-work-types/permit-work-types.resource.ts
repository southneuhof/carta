import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { permitWorkTypesSchema } from './permit-work-types.schema'

const api = createHonoResourceActions(rpc['permit-work-types'], dataAdapter)

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const

const fields = defineFields(permitWorkTypesSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

export const permitWorkTypes = defineResource(permitWorkTypesSchema, {
  key: 'permit-work-types',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-permit-work-types',
      route: { name: 'master-data-permit-work-types' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-permit-work-types',
      route: { name: 'master-data-permit-work-types-detail', params: (id) => ({ permitWorkTypeId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.description, fields.active],
      permission: 'create-permit-work-types',
      route: { name: 'master-data-permit-work-types-create' },
      initialData: { active: true },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.description, fields.active],
      permission: 'update-permit-work-types',
      route: { name: 'master-data-permit-work-types-edit', params: (id) => ({ permitWorkTypeId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-permit-work-types' },
  },
})

export type { PermitWorkType, PermitWorkTypeCreate, PermitWorkTypeUpdate } from './permit-work-types.schema'
