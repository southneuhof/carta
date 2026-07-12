import { defineCRUDCompositeConfig } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { rpc } from '@/framework/rpc'

export default defineCRUDCompositeConfig({
  name: 'roles',
  title: 'Role',
  resource: rpc.roles,
  fields: ['name'],
  transaction: { fields: ['name'], inputConfig: { name: { type: 'text', props: { required: true } } } },
})
