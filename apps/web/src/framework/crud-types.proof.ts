import type { CRUDCompositeConfig } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { resources } from './rpc'

const usersConfig = {
  name: 'users-proof',
  title: 'Users',
  resource: resources.users,
  fields: ['name', 'email'],
} satisfies CRUDCompositeConfig<typeof resources.users>

usersConfig.resource.list({ page: '1' })
usersConfig.resource.detail('user-1')

// @ts-expect-error fields are limited to keys returned by the resource
const invalidRecordField = { name: 'users-proof', title: 'Users', resource: resources.users, fields: ['missing'] } satisfies CRUDCompositeConfig<typeof resources.users>
void invalidRecordField

// @ts-expect-error aliases are limited to keys returned by the resource
const invalidRecordAlias = { name: 'users-proof', title: 'Users', resource: resources.users, fieldsAlias: { missing: 'Missing' } } satisfies CRUDCompositeConfig<typeof resources.users>
void invalidRecordAlias

// @ts-expect-error RPC registry only exposes full CRUD branches
resources.health.list()
