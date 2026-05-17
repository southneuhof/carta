import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const roleModel: ModelConfig = withModelDefaults({
  name: 'role',
  title: 'Role',
  modelAPI: 'role',
  fields: ['name'],
  fieldsAlias: {
    role_group_id: 'Role Group',
  },
  view: {
    list: {
      filter: {
        fields: ['role_group_id'],
      },
    },
  },
  transaction: {
    fields: ['name', 'role_group_id'],
    inputConfig: {
      name: { type: 'text', props: { required: true } },
      role_group_id: { type: 'text', props: { required: true } },
    },
  },
})

export default roleModel
