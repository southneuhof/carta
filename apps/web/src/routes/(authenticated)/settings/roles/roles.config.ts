import type { CRUDCompositeConfig } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { resources } from '@/framework/rpc'

export default {
  name: 'roles',
  title: 'Role',
  resource: resources.roles,
  fields: ['name'],
  transaction: { fields: ['name'], inputConfig: { name: { type: 'text', props: { required: true } } } },
} satisfies CRUDCompositeConfig<typeof resources.roles>
