import { defineCRUDCompositeConfig } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { rpc } from './rpc'

const usersConfig = defineCRUDCompositeConfig({ name: 'users-proof', title: 'Users', resource: rpc.users })

usersConfig.resource.list.$get({ query: { page: '1' } })
usersConfig.resource.detail[':id'].$get({ param: { id: 'user-1' } })

// @ts-expect-error the concrete resource must not widen to an arbitrary RPC branch
usersConfig.resource.missing.$get()
// @ts-expect-error detail requires its typed id parameter
usersConfig.resource.detail[':id'].$get()
