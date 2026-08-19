import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { permitDangerSourcesSchema } from './permit-danger-source.schema'

const api = createHonoResourceActions(rpc['permit-danger-source'], dataAdapter)

const activeOptions = [
  { id: true, name: 'Aktif' },
  { id: false, name: 'Tidak Aktif' },
] as const

const fields = defineFields(permitDangerSourcesSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'radio', source: activeOptions } },
})

export const permitDangerSources = defineResource(permitDangerSourcesSchema, {
  key: 'permit-danger-source',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-permit-danger-source',
      route: { name: 'master-data-permit-danger-source' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-permit-danger-source',
      route: { name: 'master-data-permit-danger-source-detail', params: (id) => ({ permitDangerSourceId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.description, fields.active],
      permission: 'create-permit-danger-source',
      route: { name: 'master-data-permit-danger-source-create' },
      initialData: { active: true },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.description, fields.active],
      permission: 'update-permit-danger-source',
      route: { name: 'master-data-permit-danger-source-edit', params: (id) => ({ permitDangerSourceId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-permit-danger-source' },
  },
})

export type { PermitDangerSource, PermitDangerSourceCreate, PermitDangerSourceUpdate } from './permit-danger-source.schema'
