/**
 * Compile-time contract tests. These files carry no runtime behavior; they fail
 * the framework `type-check` when a contract regresses.
 *
 * They deliberately live outside `__tests__/`, which `tsconfig.json` excludes.
 */

import type { Resource } from '../../resources'
import type {
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

/* Factory outputs are exactly the native core component props. */
const tableProps: TableProps<Role, RoleQuery> = roles.table()
const scopedTableProps: TableProps<Role, RoleQuery> = roles.table({
  searchParameters: { organisation_id: 'org-1' },
  namespace: 'archived',
})
const detailProps: DetailProps<Role> = roles.detail({ id: roleId })
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
const nestedTableProps: TableProps<Role, RoleQuery> = roles.table({ searchParameters: { incident_id: 'incident-1' } })
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
