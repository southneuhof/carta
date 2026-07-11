import { defineCRUDCompositeConfig, type CRUDOperations } from '@southneuhof/is-vue-framework/adapters/crud-operations'

const unavailable = async () => {
  throw new Error('Tasks CRUD is unavailable because the current RPC does not expose a tasks resource.')
}

const operations: CRUDOperations = {
  list: unavailable,
  detail: unavailable,
  create: unavailable,
  update: unavailable,
  delete: unavailable,
}

export default defineCRUDCompositeConfig({
  name: 'tasks',
  title: 'Tasks',
  resource: null,
  operations,
  fields: ['task_name', 'task_code', 'description', 'active'],
  fieldsAlias: { task_name: 'Nama Task', task_code: 'Kode Task', description: 'Keterangan', active: 'Status' },
  transaction: {
    fields: ['task_name', 'task_code', 'description', 'active'],
    inputConfig: {
      task_name: { type: 'text', props: { required: true } },
      task_code: { type: 'text', props: { required: true } },
      description: { type: 'textarea' },
      active: { type: 'radio', props: { required: true, defaultValue: true, data: [{ name: 'Aktif', id: true }, { name: 'Nonaktif', id: false }] } },
    },
  },
})
