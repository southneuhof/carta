/**
 * Compile-time contract tests. These files carry no runtime behavior; they fail
 * the framework `type-check` when a contract regresses.
 *
 * They deliberately live outside `__tests__/`, which `tsconfig.json` excludes.
 */

import { defineResource } from '../../resources'
import type { Resource, RowAction } from '../../resources'
import type {
  FieldCatalog,
  RecordIdentityValue,
  CollectionResult,
  DetailProps,
  FormProps,
  Load,
  RecordLoadContext,
  TableProps,
  CollectionLoadContext,
} from '../index'

interface Role extends Record<string, unknown> {
  id: string
  name: string
}

interface RoleQuery extends Record<string, unknown> {
  page: number
  search?: string
}

interface RoleCreate extends Record<string, unknown> {
  name: string
}

interface RoleUpdate extends Record<string, unknown> {
  name: string
}

declare const roles: Resource<Role, RoleQuery, RoleCreate, RoleUpdate>
declare const roleId: string
declare const maybeRoleId: string | undefined

/* Surface factories return shell-ready bundles over the native core props. */
const tableProps: TableProps<Role, RoleQuery> = roles.table().table
const scopedTableProps: TableProps<Role, RoleQuery> = roles.table({
  searchParameters: { organisation_id: 'org-1' },
  namespace: 'archived',
}).table
const rowActions: readonly RowAction[] | undefined = roles.table().rowControls?.({ id: roleId, name: 'Admin' })
void rowActions
const detailProps: DetailProps<Role> = roles.detail({ id: roleId }).detail
const createProps: FormProps<RoleCreate> = roles.form()
const prefilledCreateProps: FormProps<RoleCreate> = roles.form({ initialData: { name: 'copy' } })
const updateProps: FormProps<RoleUpdate> = roles.form({ id: roleId })
void tableProps
void scopedTableProps
void detailProps
void createProps
void prefilledCreateProps
void updateProps

/* A possibly-undefined route parameter never silently becomes a create form. */
// @ts-expect-error id must be non-nullable
roles.form({ id: maybeRoleId })
// @ts-expect-error id must be non-nullable
roles.detail({ id: maybeRoleId })
// @ts-expect-error detail requires an id
roles.detail({})

/* Nested placement is scoping, never a resource kind. */
const nestedTableProps: TableProps<Role, RoleQuery> = roles.table({ searchParameters: { incident_id: 'incident-1' } }).table
void nestedTableProps
// @ts-expect-error there is no parent vocabulary
roles.table({ parent: { incident_id: 'incident-1' } })
// @ts-expect-error nesting adds no resource kind
roles.table({ nested: true })

/* Form never learns a mode. */
declare const submitRole: (draft: RoleCreate) => Promise<Role>
const modelessForm: FormProps<RoleCreate> = {
  fields: [{ key: 'name' }],
  submit: submitRole,
}
void modelessForm
const invalidModeForm: FormProps<RoleCreate> = {
  fields: [{ key: 'name' }],
  submit: submitRole,
  // @ts-expect-error forms have no create/update mode
  mode: 'create',
}
void invalidModeForm

/* `load` is universal: synchronous local data and remote promises both satisfy it. */
declare const roleFixtures: Role[]
const loadFromFixture: Load<CollectionLoadContext<RoleQuery>, CollectionResult<Role>> = () => ({ data: roleFixtures })
const loadFromApi: Load<CollectionLoadContext<RoleQuery>, CollectionResult<Role>> = async ({ query, signal }) => {
  void query
  void signal
  return { data: roleFixtures, meta: { total: roleFixtures.length } }
}
const loadRecordFromCache: Load<RecordLoadContext, Role | undefined> = ({ id }) => roleFixtures.find((role) => role.id === id)
void loadFromFixture
void loadFromApi
void loadRecordFromCache

const syncTable: TableProps<Role, RoleQuery> = { fields: [{ key: 'name' }], load: loadFromFixture }
const asyncTable: TableProps<Role, RoleQuery> = { fields: [{ key: 'name' }], load: loadFromApi }
const controlledTable: TableProps<Role, RoleQuery> = { fields: [{ key: 'name' }], data: roleFixtures }
void syncTable
void asyncTable
void controlledTable

/* Invalid prop names are rejected on every core component. */
const invalidTableProp: TableProps<Role, RoleQuery> = {
  fields: [{ key: 'name' }],
  // @ts-expect-error unknown prop
  queryNamespace: 'archived',
}
void invalidTableProp
const invalidDetailProp: DetailProps<Role> = {
  fields: [{ key: 'name' }],
  // @ts-expect-error unknown prop
  controls: [],
}
void invalidDetailProp
const invalidFormProp: FormProps<RoleCreate> = {
  fields: [{ key: 'name' }],
  submit: submitRole,
  // @ts-expect-error legacy name; forms take initialData
  initial: { name: 'x' },
}
void invalidFormProp

/* Field configuration selects widgets with `renderer`, never `type` or `control`. */
const rendererFields: TableProps<Role, RoleQuery> = {
  fields: [{ key: 'name', table: { renderer: 'chip', props: { options: [] } } }],
}
void rendererFields
const invalidRendererKey: TableProps<Role, RoleQuery> = {
  // @ts-expect-error widget selection is named renderer
  fields: [{ key: 'name', table: { type: 'chip' } }],
}
void invalidRendererKey

/* Behavior options are pure functions over the draft, with no depends-on list. */
const behaviorForm: FormProps<RoleCreate> = {
  fields: [
    {
      key: 'name',
      form: {
        renderer: 'text',
        behavior: {
          visible: ({ draft }) => draft.name !== '',
          disabled: () => false,
          props: ({ draft }) => ({ placeholder: draft.name }),
        },
      },
    },
  ],
  submit: submitRole,
}
void behaviorForm
const invalidBehavior: FormProps<RoleCreate> = {
  fields: [
    {
      key: 'name',
      form: {
        // @ts-expect-error behavior carries no manual dependency list
        behavior: { fields: ['name'], visible: () => true },
      },
    },
  ],
  submit: submitRole,
}
void invalidBehavior

/* ------------------------------------------------------------------------- *
 * Declared identity shapes (plan 026).
 * ------------------------------------------------------------------------- */

interface UserRole extends Record<string, unknown> {
  userId: string
  roleId: string
  assignedAt: string
}

const userRoleFields: FieldCatalog<UserRole, UserRole> = { userId: { label: 'Pengguna' }, roleId: { label: 'Role' } }

/* The key list is the first-class spelling: one declaration yields the type. */
const userRoles = defineResource({
  key: 'userRoles',
  fields: userRoleFields,
  identity: ['userId', 'roleId'],
  operations: {
    detail: ({ id }) => ({ userId: id?.userId ?? '', roleId: id?.roleId ?? '', assignedAt: 'now' }),
    update: (id, input: UserRole) => ({ ...input, ...id }),
    delete: (id) => id.roleId,
  },
  actions: {
    detail: { permission: 'user-roles.detail', to: { name: 'user-roles-detail', params: ({ userId, roleId }) => ({ userId, roleId }) } },
    update: { permission: 'user-roles.update', to: { name: 'user-roles-edit', params: ({ userId, roleId }) => ({ userId, roleId }) } },
  },
})

const compositeIdentity: { userId: string; roleId: string } = userRoles.identity({
  userId: 'u-1',
  roleId: 'r-1',
  assignedAt: 'now',
})
void compositeIdentity
void userRoles.detail({ id: { userId: 'u-1', roleId: 'r-1' } })
void userRoles.form({ id: { userId: 'u-1', roleId: 'r-1' } })
void userRoles.remove({ userId: 'u-1', roleId: 'r-1' })
void userRoles.invalidate({ id: { userId: 'u-1', roleId: 'r-1' } })
void (typeof userRoles.actions.update?.to === 'function' && userRoles.actions.update.to({ userId: 'u-1', roleId: 'r-1' }))

/* A composite resource gets a typed row link with no route code (plan 027). */
const compositeRowLink = userRoles.rowLink?.({
  userId: 'u-1',
  roleId: 'r-1',
  assignedAt: 'now',
})
void compositeRowLink

/* A resource without list behavior exposes no table surface. */
// @ts-expect-error resource without typed list operation exposes no table surface
userRoles.table()
void userRoles.detail({ id: { userId: 'u-1', roleId: 'r-1' } })

/* A composite resource never accepts a scalar identity. */
// @ts-expect-error a composite identity is not a scalar
userRoles.detail({ id: 'u-1' })
// @ts-expect-error a composite identity is not a scalar
typeof userRoles.actions.update?.to === 'function' && userRoles.actions.update.to('u-1')
// @ts-expect-error every declared key is required
userRoles.detail({ id: { userId: 'u-1' } })

/* The function spelling is the escape hatch; its return type is the identity.
 * Inference runs from the extractor outwards, so its parameter is annotated. */
const derivedIdentity = defineResource({
  key: 'derivedUserRoles',
  fields: userRoleFields,
  identity: (record: UserRole) => `${record.userId}:${record.roleId}`,
  operations: { detail: () => ({ userId: 'u-1', roleId: 'r-1', assignedAt: 'now' }) },
  actions: { detail: { permission: 'user-roles.detail', to: { name: 'user-roles-detail', params: (id) => ({ id }) } } },
})
const derivedIdentityValue: string = derivedIdentity.identity({ userId: 'u-1', roleId: 'r-1', assignedAt: 'now' })
void derivedIdentityValue
void derivedIdentity.detail({ id: 'u-1:r-1' })
// @ts-expect-error the declared identity is a string
derivedIdentity.detail({ id: { userId: 'u-1' } })

/* The loader is checked against the declared identity, at the definition site. */
defineResource({
  key: 'mismatched',
  fields: userRoleFields,
  identity: ['userId', 'roleId'],
  operations: {
    // @ts-expect-error a scalar-id loader cannot serve a composite resource
    detail: ({ id }: { id?: string; searchParameters: Record<string, unknown> }) => id,
  },
})

/* Unconfigured identity keeps today's scalar default, extracted from `record.id`. */
const scalarIdentity = defineResource({
  key: 'roles',
  fields: { name: { label: 'Nama' } } as FieldCatalog<Role, Role>,
  operations: { detail: ({ id }) => ({ id: String(id), name: 'Admin' }) },
  actions: { detail: { permission: 'roles.detail', to: { name: 'roles-detail', params: (id) => ({ id }) } } },
})
const scalarIdentityValue: RecordIdentityValue = scalarIdentity.identity({ id: 'r-1', name: 'Admin' })
void scalarIdentityValue
void scalarIdentity.detail({ id: 'r-1' })
void scalarIdentity.detail({ id: 7 })
// @ts-expect-error a scalar resource takes no composite identity
scalarIdentity.detail({ id: { userId: 'u-1' } })
