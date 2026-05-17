import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const userModel: ModelConfig = withModelDefaults({
  name: 'user',
  title: 'Pengguna',
  modelAPI: 'user',
  fields: ['id', 'name', 'email', 'role_id', 'createdAt', 'updatedAt'],
  fieldsAlias: {
    role_id: 'Role',
  },
  view: {
    list: {
      filter: {
        fields: ['role_id'],
      },
    },
  },
  transaction: {
    fields: ['name', 'email', 'role_id'],
    inputConfig: {
      name: { type: 'text', props: { required: true } },
      email: { type: 'text', props: { required: true } },
      role_id: { type: 'text', props: { required: true } },
    },
    create: {
      fields: ['name', 'email', 'role_id', 'password'],
      inputConfig: {
        password: { type: 'password' },
      },
    },
  },
})

export default userModel
