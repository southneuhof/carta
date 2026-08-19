import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { tollCausesAccidentsSchema } from './toll-causes-accidents.schema'

export const categoryOptions = [
  { id: 'driver', name: 'Pengemudi' },
  { id: 'vehicle', name: 'Kendaraan' },
  { id: 'road', name: 'Jalan' },
  { id: 'environment', name: 'Lingkungan' },
] as const

const api = createHonoResourceActions(rpc['toll-causes-accidents'], dataAdapter)

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

const fields = defineFields(tollCausesAccidentsSchema, {
  category: { label: 'Kategori', read: (record) => relationName(record, 'category') ?? '—' },
  categoryCode: { label: 'Kategori', form: { renderer: 'select', source: categoryOptions, props: { pick: 'id', view: 'name', required: true } } },
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  code: { label: 'Kode', form: { renderer: 'text' } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'switch' } },
})

export const tollCausesAccidents = defineResource(tollCausesAccidentsSchema, {
  key: 'toll-causes-accidents',
  actions: {
    list: {
      run: api.list,
      fields: [fields.category, fields.name, fields.code, fields.description, fields.active],
      permission: 'view-toll-causes-accidents',
      route: { name: 'master-data-toll-causes-accidents' },
    },
    detail: {
      run: api.detail,
      fields: [fields.category, fields.name, fields.code, fields.description, fields.active],
      permission: 'view-toll-causes-accidents',
      route: { name: 'master-data-toll-causes-accidents-detail', params: (id) => ({ tollCausesAccidentsId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.categoryCode, fields.name, fields.code, fields.description, fields.active],
      permission: 'create-toll-causes-accidents',
      route: { name: 'master-data-toll-causes-accidents-create' },
      initialData: { categoryCode: 'driver', active: true },
    },
    update: {
      run: api.update,
      fields: [fields.categoryCode, fields.name, fields.code, fields.description, fields.active],
      permission: 'update-toll-causes-accidents',
      route: { name: 'master-data-toll-causes-accidents-edit', params: (id) => ({ tollCausesAccidentsId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-toll-causes-accidents' },
  },
})

export type { TollCausesAccidents, TollCausesAccidentsCreate, TollCausesAccidentsUpdate } from './toll-causes-accidents.schema'
