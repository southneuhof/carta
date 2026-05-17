import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const permissionModel: ModelConfig = withModelDefaults({
  name: 'permission',
  title: 'Permission',
  modelAPI: 'permission',
  fields: ['code', 'name', 'description'],
  transaction: {
    fields: ['code', 'name', 'description'],
    inputConfig: {
      code: { type: 'text', props: { required: true } },
      name: { type: 'text', props: { required: true } },
      description: { type: 'textarea' },
    },
  },
})

export default permissionModel
