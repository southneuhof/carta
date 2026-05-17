import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const languageModel: ModelConfig = withModelDefaults({
  name: 'language',
  title: 'Language',
  modelAPI: 'language',
  fields: ['id', 'code', 'name', 'active'],
  view: {
    list: {
      fields: ['code', 'name', 'active'],
    },
    detail: {
      fields: ['id', 'code', 'name', 'active'],
    },
  },
  transaction: {
    fields: ['code', 'name', 'active'],
    inputConfig: {
      code: { type: 'text', props: { required: true } },
      name: { type: 'text', props: { required: true } },
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

export default languageModel
