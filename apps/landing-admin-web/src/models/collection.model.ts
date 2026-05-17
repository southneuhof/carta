import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const collectionModel: ModelConfig = withModelDefaults({
  name: 'collection',
  title: 'Collection',
  modelAPI: 'collection',
  fields: ['code', 'name', 'data'],
  transaction: {
    fields: ['name', 'code', 'data'],
    inputConfig: {
      name: { type: 'text', props: { required: true } },
      code: { type: 'text' },
      data: { type: 'textarea' },
    },
  },
})

export default collectionModel
