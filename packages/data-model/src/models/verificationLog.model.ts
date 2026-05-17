import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const verificationLogModel: ModelConfig = withModelDefaults({
  name: 'verificationLog',
  title: 'Verification Log',
  modelAPI: 'verificationLog',
  actions: {
    create: false,
    update: false,
    delete: false,
  },
  fields: ['action', 'description', 'verifier_id', 'created_at', 'model', 'data_id'],
  view: {
    list: {
      filter: {
        fields: ['model', 'data_id'],
      },
    },
  },
})

export default verificationLogModel
