import { defineCRUDCompositeConfig } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { rpc } from '@/framework/rpc'

export default defineCRUDCompositeConfig({
  name: 'users',
  title: 'Pengguna',
  resource: rpc.users,
  fields: ['name', 'email', 'roleId', 'createdAt', 'updatedAt'],
  fieldsAlias: { roleId: 'Role' },
  view: { list: { filter: { fields: ['roleId'] } } },
  transaction: {
    fields: ['name', 'email', 'roleId'],
    inputConfig: {
      name: { type: 'text', props: { required: true } },
      email: { type: 'text', props: { required: true } },
      roleId: { type: 'text', props: { required: true } },
    },
    create: {
      fields: ['name', 'email', 'roleId', 'password'],
      inputConfig: { password: { type: 'password' } },
    },
  },
})
