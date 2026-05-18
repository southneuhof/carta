import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const tasksModel: ModelConfig = withModelDefaults({
  name: 'tasks',
  title: 'Tasks',
  modelAPI: 'tasks',
  fields: ['task_name', 'task_code', 'description', 'active'],
  transaction: {
    fields: ['task_name', 'task_code', 'description', 'active'],
    inputConfig: {
      task_name: { type: 'text', props: { required: true } },
      task_code: { type: 'text', props: { required: true } },
      description: { type: 'textarea' },
      active: {
        type: 'radio',
        props: {
          required: true,
          defaultValue: true,
          data: [
            { name: 'Aktif', id: true },
            { name: 'Nonaktif', id: false },
          ],
        },
      },
    },
  },
  fieldsAlias: {
    task_name: 'Nama Task',
    task_code: 'Kode Task',
    description: 'Keterangan',
    active: 'Status',
  },
})

export default tasksModel
