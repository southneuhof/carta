# Web Application Architecture

- **Status:** Shipped
- **Scope:** `apps/web` and reusable APIs in `packages/is-vue-framework`
- **Last updated:** 2026-08-11

This document describes the current frontend resource API. The locked decision
record is [Frontend Resource and Schema Architecture](../superpowers/specs/2026-08-11-frontend-resource-schema-architecture-design.md).

## Principles

1. Routes own URLs, navigation, dialogs, confirmations, toasts, and workflows.
2. Schemas own the standard web data contract and validation.
3. Resources own standard application actions and return native View props.
4. Core components own data presentation and editing. They do not know routes,
   transport, or application permissions.
5. Each module binds one schema-bound field set and each standard action selects
   its ordered references.
6. Custom actions are ordinary application functions.
7. The backend remains the authority for access and validation.

## Route ownership

Filesystem routes define the page structure and route names. A list, detail,
create form, update form, or nested page gets its own route when it is an
independent screen.

```text
settings/roles/
  index.route.vue
  create.route.vue
  [roleId]/detail.route.vue
  [roleId]/edit.route.vue
  [roleId]/detail/permissions/index.route.vue
```

The parent route supplies layout and tab data. The child route owns its action,
query state, data loading, and user workflow.

## Layers

```mermaid
flowchart LR
  Routes["filesystem routes"] --> Views["ListView / DetailView / FormView"]
  Views --> Core["Table / Detail / Form"]
  Core --> Renderers["renderers and inputs"]
  Schema["defineSchema"] --> Resource["defineResource"]
  Actions["app actions"] --> Resource
  Resource --> Views
```

The framework core has no Hono or application transport dependency. The app
owns transport adapters, response normalization, and service functions.

## Unified schema

The framework exposes one schema builder: `defineSchema`. A schema can use
runtime schemas, typed contract parts, or both.

```ts
export const usersSchema = defineSchema<AppResourceContract<typeof rpc.users>>({
  identity: 'id',
  record: { schema: userRecordSchema },
  query: { schema: userQuerySchema },
  create: { schema: createUserSchema, validators: createValidators },
  update: { schema: updateUserSchema, validators: updateValidators },
})
```

For services or plain fetch functions, the schema can infer its types from
runtime schema values:

```ts
export const usersSchema = defineSchema({
  identity: 'id',
  record: { schema: userRecordSchema },
  query: { schema: userQuerySchema },
  create: { schema: createUserSchema },
  update: { schema: updateUserSchema },
})
```

For Zod values, use `fromZod(schema)`. The bridge infers the parsed value from
the schema, including transform output. Do not pass a caller-supplied output
type. If a form control has a different raw shape, keep that input transform in
the local form schema. A raw form type is optional and local to a function that
actually consumes it.

The schema owns record, query, create, and update validation. It can also own
transforms and synchronous or asynchronous standard validators. Custom action
inputs are not added to the schema.

## Per-action resources

The resource receives the schema value and one `actions` object. Standard action
blocks keep the run function, fields, access metadata, route, and View options
together.

```ts
import { defineFields, defineResource } from '@southneuhof/is-vue-framework'

const api = createHonoResourceActions(rpc.users)
const fields = defineFields(usersSchema, {
  name: { label: 'Name', form: { renderer: 'text' } },
  email: { label: 'Email', form: { renderer: 'text', props: { type: 'email' } } },
  statusCode: { label: 'Status', form: { renderer: 'radio' } },
})

export const users = defineResource(usersSchema, {
  key: 'users',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.email, fields.statusCode],
      permission: 'view-users',
      route: { name: 'settings-users' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.email, fields.statusCode],
      permission: 'view-users',
      route: {
        name: 'settings-users-detail',
        params: (id) => ({ userId: id }),
      },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.email],
      permission: 'create-users',
      route: { name: 'settings-users-create' },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.statusCode],
      permission: 'update-users',
      route: {
        name: 'settings-users-edit',
        params: (id) => ({ userId: id }),
      },
    },
    delete: { run: api.delete, permission: 'delete-users' },
    verify: { run: verifyUser },
  },
})
```

The standard action names are `list`, `detail`, `create`, `update`, and
`delete`. The first four return typed View props. Delete returns a typed action
with a `run` function. A non-standard action exposes only `{ run }`; the
framework does not add permission metadata, transport rules, validation, or
automatic invalidation to it.

## Field references

`defineFields(schema, definitions)` keeps shared labels, accessors, and write
functions adjacent to the schema. Surface settings use `display`, `table`,
`detail`, and `form` projections. Actions select immutable references in the
required order.

```ts
const roleFields = defineFields(rolesSchema, {
  name: { label: 'Role name', form: { renderer: 'text' } },
  realm: { label: 'Realm', form: { renderer: 'radio', source: realmOptions } },
})

const createFields = [roleFields.name, roleFields.realm]
const updateFields = [
  roleFields.name,
  roleFields.realm.override({ form: { behavior: { disabled: () => true } } }),
]
```

The override is one terminal partial patch. Its result has no second override
method. Omission removes a field from a View, and array order is the View order.

## Canonical View API

Each standard action object is both the exact View prop bag and the only holder
of its `run` function.

```vue
<ListView v-bind="users.list()" />
<DetailView v-bind="users.detail({ id: userId })" />
<FormView v-bind="users.create()" />
<FormView v-bind="users.update({ id: userId })" />
```

The same returned object is the only standard execution path:

```ts
await users.list().run(context)
await users.detail({ id: userId }).run()
await users.create().run(input)
await users.update({ id: userId }).run(input)
await users.delete({ id: userId }).run()
await users.actions.verify.run(input)
```

The route can add page title, query binding, slots, and custom workflow code.
It does not pass a whole resource object to a View.

The core components remain useful without a resource:

```vue
<Table :fields="fields" :load="loadRows" />
<Detail :fields="fields" :data="record" />
<Form :fields="fields" :submit="saveDraft" />
```

## Core components and shells

- `Collection` owns collection loading, cache identity, controlled or
  namespaced query state, metadata, loading, empty and error states, and
  refresh.
- `TableContent` is the internal loaded-row table presentation.
- `Table` composes one `Collection` with `TableContent`.
- `Detail` owns record loading and field rendering.
- `Form` owns draft state, field rendering, validation, initial loading, and
  submission.
- `ListView` adds page chrome around one `Collection`. Its default presentation
  is `table`; its `custom` slot receives loaded records and presentation-safe
  collection state.
- `DetailView` adds page chrome around `Detail`.
- `FormView` adds page chrome around `Form`.

The collection dependency direction is:

```mermaid
flowchart BT
  Collection[Collection] --> Table[Table]
  Collection --> ListView[ListView]
  TableContent[TableContent] --> Table
  TableContent --> ListView
```

Use one collection for table and custom presentations:

```vue
<ListView
  v-bind="resource.list()"
  :query="query"
  :presentation="view === 'grid' ? 'custom' : 'table'"
  @update:query="query = $event"
>
  <template #custom="{ records }">
    <RouteOwnedGrid :records="records" />
  </template>
</ListView>
```

The custom slot does not receive `load`, `data`, cache keys, or a query
client. A presentation switch keeps query state and does not start a second
load. Custom actions remain plain functions. The route must await
`resource.invalidate({ id })` after a successful custom action.

The shells forward native props. They do not discover APIs or choose a CRUD
mode. Page-level controls and effects stay in the route.

## Application transport boundary

`apps/web` owns the typed Hono client adapter, the standard action helper,
response normalization, and direct service or fetch functions.

```ts
const actions = createHonoResourceActions(rpc.users)
const users = defineResource(usersSchema, {
  key: 'users',
  actions: {
    list: { run: actions.list, fields: listFields },
    detail: { run: actions.detail, fields: detailFields },
  },
})
```

The helper returns normalized application data. It does not show UI, navigate,
or decide access. Failed requests throw and are handled by the owning route or
core component.

The framework package has no Hono entry point or Hono peer dependency.

## Verification

The web boundary test checks that resource files stay transport-free, old
operation files are absent, routes do not use raw RPC calls, and the app keeps
transport code in its own adapter. The framework public API test checks the
current exports and deleted exports.
