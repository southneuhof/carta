import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const roleGroupModel: ModelConfig = withModelDefaults({
  name: 'roleGroup',
  title: 'Role Group',
  modelAPI: 'roleGroup',
  fields: ['name'],
  transaction: {
    fields: ['name'],
    inputConfig: {
      name: { type: 'text', props: { required: true } },
    },
  },
})

export default roleGroupModel
