import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { toolsTypesSchema } from './tools-types.schema'

const api = createHonoResourceActions(rpc['tools-types'], dataAdapter)

export const toolsTypeCategoryOptions = [
  { id: 'heavy-equipments', name: 'Alat Berat' },
  { id: 'measuring-instruments', name: 'Alat Ukur/Uji' },
] as const

const fields = defineFields(toolsTypesSchema, {
  categoryCode: { label: 'Kategori', form: { renderer: 'select', source: toolsTypeCategoryOptions, props: { pick: 'id', view: 'name', required: true } } },
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'switch' } },
})

export const toolsTypes = defineResource(toolsTypesSchema, {
  key: 'tools-types',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-tools-types',
      route: { name: 'master-data-tools-types' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-tools-types',
      route: { name: 'master-data-tools-types-detail', params: (id) => ({ toolsTypeId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.categoryCode, fields.description, fields.active],
      permission: 'create-tools-types',
      route: { name: 'master-data-tools-types-create' },
      initialData: { categoryCode: 'heavy-equipments', active: true },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.categoryCode, fields.description, fields.active],
      permission: 'update-tools-types',
      route: { name: 'master-data-tools-types-edit', params: (id) => ({ toolsTypeId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-tools-types' },
  },
})

export type { ToolsType, ToolsTypeCreate, ToolsTypeUpdate } from './tools-types.schema'
