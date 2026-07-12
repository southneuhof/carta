import type { CRUDCompositeConfig, ResourceCreateInput, ResourceQuery, ResourceRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { resources } from './rpc'

const usersConfig = {
  name: 'users-proof',
  title: 'Users',
  resource: resources.users,
  fields: ['name', 'email'],
} satisfies CRUDCompositeConfig<typeof resources.users>

const resourceName: string = usersConfig.resource
void resourceName
type UserRecord = ResourceRecord<typeof resources.users>
type UsersQuery = ResourceQuery<typeof resources.users>
type UsersCreateInput = ResourceCreateInput<typeof resources.users>
const userName: UserRecord['name'] = 'Ada'
const page: UsersQuery['page'] = '1'
void userName
void page
// Users RPC has no create route, so create input is statically unavailable.
// @ts-expect-error no create input can be constructed
const createInput: UsersCreateInput = { name: 'Ada' }
void createInput

// @ts-expect-error fields are limited to keys returned by the resource
const invalidRecordField = { name: 'users-proof', title: 'Users', resource: resources.users, fields: ['missing'] } satisfies CRUDCompositeConfig<typeof resources.users>
void invalidRecordField

// @ts-expect-error aliases are limited to keys returned by the resource
const invalidRecordAlias = { name: 'users-proof', title: 'Users', resource: resources.users, fieldsAlias: { missing: 'Missing' } } satisfies CRUDCompositeConfig<typeof resources.users>
void invalidRecordAlias

// @ts-expect-error RPC registry only exposes CRUD-shaped branches
void resources.health
