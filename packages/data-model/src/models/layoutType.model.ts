import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const layoutTypeModel: ModelConfig = withModelDefaults({
  name: 'layoutType',
  title: 'Layout Type',
  modelAPI: 'layoutType',
  fields: ['code', 'name', 'description', 'active'],
  view: {
    list: {
      fields: ['code', 'name', 'description', 'active'],
    },
    detail: {
      fields: ['code', 'name', 'description', 'active'],
    },
  },
  transaction: {
    fields: ['code', 'name', 'description', 'active'],
    inputConfig: {
      code: { type: 'text', props: { required: true } },
      name: { type: 'text', props: { required: true } },
      description: { type: 'textarea' },
      active: {
        type: 'radio',
        props: {
          required: true,
          data: [
            { id: true, name: 'Active' },
            { id: false, name: 'Inactive' },
          ],
        },
      },
    },
  },
})

export default layoutTypeModel
