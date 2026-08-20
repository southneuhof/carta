import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { toolsBrandsSchema } from './tools-brands.schema'

const api = createHonoResourceActions(rpc['tools-brands'], dataAdapter)

export const toolsBrandCategoryOptions = [
  { id: 'heavy-equipments', name: 'Alat Berat' },
  { id: 'measuring-instruments', name: 'Alat Ukur/Uji' },
] as const

const fields = defineFields(toolsBrandsSchema, {
  categoryCode: { label: 'Kategori', form: { renderer: 'select', source: toolsBrandCategoryOptions, props: { pick: 'id', view: 'name', required: true } } },
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'switch' } },
})

export const toolsBrands = defineResource(toolsBrandsSchema, {
  key: 'tools-brands',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-tools-brands',
      route: { name: 'master-data-tools-brands' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.description, fields.active],
      permission: 'view-tools-brands',
      route: { name: 'master-data-tools-brands-detail', params: (id) => ({ toolsBrandId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.categoryCode, fields.description, fields.active],
      permission: 'create-tools-brands',
      route: { name: 'master-data-tools-brands-create' },
      initialData: { categoryCode: 'heavy-equipments', active: true },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.categoryCode, fields.description, fields.active],
      permission: 'update-tools-brands',
      route: { name: 'master-data-tools-brands-edit', params: (id) => ({ toolsBrandId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-tools-brands' },
  },
})

export type { ToolsBrand, ToolsBrandCreate, ToolsBrandUpdate } from './tools-brands.schema'
