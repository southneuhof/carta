# Resource migration guide

How to move a screen from the retired CRUD architecture to resources, cores, and
view shells. Every example below is copied from migrated code in this repository
(`apps/web/src/routes/(authenticated)/settings/`), not invented.

There are no compatibility wrappers: `@southneuhof/is-vue-framework` 2.0 removed
the legacy CRUD surface outright. Translate each screen by hand using the tables
below.

## Transport, UI, and runtime truth

Hono route availability is a **build-time** TypeScript property. Use the explicit
optional integration, never the root package, and let the typed route decide the
operations a resource may expose:

```ts
import { defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceOperations, type HonoRequestOf } from '@southneuhof/is-vue-framework/hono'

const roleOperations = createHonoResourceOperations(rpc.roles)
const roles = defineResource({ key: 'roles', fields: roleFields, operations: roleOperations })
roles.table()
roles.form()
roles.form({ id: 'role-1' })
```

For a partial route, TypeScript rejects absent behavior; it is not a runtime
capability check:

```ts
const userOperations = createHonoResourceOperations(rpc.users)
// @ts-expect-error the typed users route has no create endpoint
userOperations.create
```

`actions` are separate runtime UI truth: targets, permissions, and `visible`
decide controls, but actions never materialize an operation. Hidden or
programmatic operations need no action. The API and its authorization remain
runtime enforcement. Do not use `Object.keys`, truthiness, casts to `any`, or a
broad `ResourceOperations` annotation as capability detection; Hono clients are
universal proxies and the adapter's physical wrappers are intentionally not
transport metadata.

Plain spread and explicit overrides are supported:

```ts
const roles = defineResource({
  key: 'roles', fields: roleFields,
  operations: { ...createHonoResourceOperations(rpc.roles), list: loadCachedRoles },
})
```

A bring-your-own backend stays narrow and backend-neutral. If its record/input
types cannot be inferred structurally, use the compile-only helper (it adds no
runtime keys):

```ts
const customers = defineResourceOperations<Customer, {}, CustomerCreate>()({
  list: async () => ({ data: await externalClient.customers() }),
  create: (input) => externalClient.createCustomer(input),
})
```

`HonoRequestOf` retains the exact wire request; the adapter-facing query accepts
serializable UI scalars and converts them to strings. Standard Hono create and
update responses must be `{ data: Record }`: operations unwrap and return that
record, including its declared identity fields. Plan 038 moves the web app to
this API and makes its build type-checking.

## What replaced what

| Retired | Replacement |
| --- | --- |
| `CRUDComposite` + `?<name>_view=` query state | one filesystem route file per screen |
| `CRUDList` | `<ListView :resource="resource" />`; raw `resource.table()` remains escape hatch |
| `CRUDDetail` | `<DetailView :resource="resource" :id="id" />`; raw `resource.detail({ id })` remains escape hatch |

## Routing and resource-first views

Resource targets use Vue Router `RouteLocationRaw`, preferably named locations. A resource maps its
scalar or composite identity forward into route params; route components explicitly map params back
to their identity. Do not serialize composite objects into one URL segment or infer identity from a
whole params bag.

`DetailView` resource mode owns standard deletion: `remove`, normalized feedback, then
`router.replace(resource.actions.list?.to)` where available. Use raw detail mode for workflows that need
preloaded data or custom delete behavior. `id` is always explicit; views never inspect current route.
| `CRUDCreate` | `FormView :resource="resource"` |
| `CRUDUpdate` | `FormView :resource="resource" :id="id"` |
| `useCRUDOperations` / `FrameworkCRUDRuntime` | `defineResource({ operations })`, derived from a typed Hono parent by `createHonoResourceOperations` |
| nested `CRUDComposite` with fabricated operations | a child route plus an ordinary `searchParameters` entry |
| `inject<any>('data')` | route params, or a parent route component that passes them down |
| `actions: { create: false }` | nothing: absent behavior removes the control automatically |

Field configuration mapping lives next to the catalog, in
`packages/is-vue-framework/src/fields/MIGRATION.md` (`fieldsAlias` → `label`,
`fieldsProxy` → `read`, `type` → `renderer`, `dependency` → `behavior`, ...).

## 1. Define the resource

```ts
// apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts
import { roleOperations, type Role, type RoleCreate } from './roles.operations'

export const roleFields = defineFields<Role, RoleCreate>()({
  name: { label: 'Nama Role', table: { sortable: true }, form: { renderer: 'text' } },
  createdAt: { label: 'Dibuat', display: { format: 'datetime' }, form: false },
})

export const roles = defineResource({
  key: 'roles',
  fields: roleFields,
  operations: roleOperations,
  table: { fields: ['name', 'createdAt'] },
  detail: { fields: ['name', 'createdAt'] },
  form: { fields: ['name'] },
  schemas: { create: fromZod(roleSchemas.create), update: fromZod(roleSchemas.update) },
  actions: {
    list: { permission: 'roles.list', to: { name: 'settings-roles' } },
    create: { permission: 'roles.create', to: { name: 'settings-roles-create' } },
    detail: { permission: 'roles.detail', to: { name: 'settings-roles-detail', params: (id) => ({ roleId: id }) } },
    update: { permission: 'roles.update', to: { name: 'settings-roles-edit', params: (id) => ({ roleId: id }) } },
    delete: { permission: 'roles.delete' },
  },
})
```

## Route-owned operations

The route subtree is both the navigation unit and the owner of its resource. A
shared CRUD resource lives at that subtree root; identity-only workflows and
child collections live beside their nearest dynamic or child route. Keep the
two files direct and visible—do not add a route `index.ts` barrel or a central
application resource registry:

```text
settings/roles/
  roles.operations.ts     # Hono calls, parsed responses, derived transport types
  roles.resource.ts       # fields, schemas, surfaces, actions
  [roleId]/detail/permissions/
    role-permissions.operations.ts
    role-permissions.resource.ts
```

`*.operations.ts` must not import Vue, the router, components, or toasts.
`*.resource.ts` must not call RPC. A Vue route imports these canonical files
directly and retains temporary state, optimistic updates, dialogs, and toasts.
Split a complex operation set by cohesive use case rather than growing a
generic controller. Existing API shapes use `HonoResponseOf` and
`ResourceRecordOf`/`ResourceCreateOf` derivations; a client-created projection
may use `Pick` or `Omit` over those types.

Only typed operations can be declared as actions. A missing `users.create`
operation cannot produce a create action or create form; controls are instead
derived from the declared action, target, permission, visibility, and access.

## 2. Give every screen a route file

```text
settings/roles/
  index.route.vue          -> /settings/roles
  create.route.vue         -> /settings/roles/create
  [roleId]/
    detail.route.vue       -> /settings/roles/:roleId/detail
    edit.route.vue         -> /settings/roles/:roleId/edit
    detail/permissions/
      index.route.vue      -> /settings/roles/:roleId/detail/permissions
```

```vue
<!-- index.route.vue -->
<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { roles } from './roles.resource'
</script>

<template>
  <ListView title="Roles" :resource="roles" />
</template>
```

Filesystem owns URL structure and names: static segments joined by `-`, with
route groups, `index`, and dynamic params omitted. `create` stays `create`; `edit`
stays `edit`; no semantic aliases exist. Resources own standard action targets
and permissions; navigation manifest owns only ordered entrypoints. Record
parents render `DetailView`, ordered action tabs, then `AppRouterView`; every
child deliberately renders detail-under. Each `AppRouterView` owns one
transition boundary at its injected RouterView depth. Its key is rendered record
identity plus that named record's concrete inherited-param path, never full leaf
URL: child/sibling changes leave parent mounted, parent-param changes remount
parent, and query/hash changes do neither. Shells remain outside this boundary.

`RouteTab` contains a child resource action plus label. Mounted Tabs replaces
bare owning parent with first valid child using `router.replace`; zero valid
children leave parent detail visible.
Tabs selects content only; it neither owns nor suppresses transitions.

```vue
<!-- [roleId]/edit.route.vue — same Form, no lifecycle handler -->
<template>
  <FormView title="Ubah Role" :resource="roles" :id="roleId" />
</template>
```

Resource FormView success behavior is declarative. Standard create/update
operations return records; FormView shows `Data berhasil disimpan.`, then
replaces to `actions.detail.to(identity(record))`, falls back to static
`actions.list.to`, or stays on form. Set `success-message="..."` for route
wording or `:success-message="false"` to suppress feedback.

Exceptional post-submit work belongs in `after-submit`. It is awaited and gets
`record`, `id`, `operation`, `defaultTo`, `navigate(to)`, and
`preventDefaultNavigation()`. Return values never navigate. `navigate` and
`preventDefaultNavigation` suppress default navigation; thrown effects leave
form mounted and report follow-up failure. Raw `form-props` is event-only: it
cannot use this hook or automatic navigation.

## 3. Express nesting with the filesystem, not with vocabulary

A child collection is an ordinary table scoped by an ordinary
`searchParameters` entry supplied by the route:

```ts
const table = computed(() => rolePermissions.table({ searchParameters: { role_id: roleId.value } }))
```

There is no `parent` option, no nested-resource kind, and no injected record.

Child resource owns its action; parent only places it:

```ts
const tabs = [{ action: rolePermissions.actions.list!, label: 'Permissions' }]
```

For composite identity, action params map declared identity explicitly:

```ts
detail: { permission: 'userRoles.detail', to: { name: 'settings-user-roles-detail', params: ({ userId, roleId }) => ({ userId, roleId }) } }
```

## 4. Keep custom workflows as code

Anything with branching, optimism, or rollback stays ordinary Vue code and
invalidates the affected resource afterwards:

```ts
async function toggle(record: RolePermission, next: boolean) {
  if (pending.value.has(record.id)) return
  optimistic.value = { ...optimistic.value, [record.id]: next }
  try {
    await setRolePermission(roleId.value, record.id, next)
    await rolePermissions.invalidate()
  } catch {
    optimistic.value = { ...optimistic.value, [record.id]: previous }
    toast.error('Gagal memperbarui permission. Silakan coba lagi.')
  }
}
```

## 5. Escape hatches, in order of preference

| Need | Escape hatch |
| --- | --- |
| one different prop at a call site | object spread: `{ ...roles.form({ id }), submit }` |
| the same resource twice in one view | `resource.table({ namespace: 'archived' })` on the second instance |
| query state that must not touch the URL | pass `query` to `Table` |
| a value that is not a plain property | field `read` / `write` |
| a field that appears conditionally | `form.behavior.visible` |
| a schema the manifest does not have | `schemas` on the resource, or `schema` on the component |
| a non-RPC or offline collection | `operations: { list: () => ({ data }) }` — `load` is universal |
| standard create/detail/update/delete UI | inferred by `ListView` from permitted capabilities |
| custom workflow UI | direct markup in the route's `controls` or `footer` slot |

## 6. URL compatibility

`apps/web/src/router/legacy-urls.ts` normalizes `/#/path` boot URLs and
redirects `?<name>_view=...&<name>_id=...` to the new paths, preserving
unrelated query values. Add an entry there for each feature you migrate.

## Downstream checklist (HKA-TROM)

The framework is ready; the downstream repository is **not migrated**. Run this
in that repository, not here:

1. Inventory its resources, routes, and custom workflows; mark which screens are
   ordinary CRUD and which are workflows.
2. Port the project adapters first: response/error normalization, the
   router-backed query adapter, the schema manifest, and renderer registries.
3. Pick one nested vertical slice (a parent record with a child collection) and
   migrate it end to end before touching anything else.
4. Translate field config with the catalog mapping table, then delete the legacy
   config file for that slice.
5. Run the acceptance matrix: two tables with independent namespaces, a
   duplicated resource with an explicit namespace, sync and async loaders,
   denied controls absent, and validation from schemas.
6. Add legacy URL redirects for that slice before release.
7. Repeat per slice; only then remove the legacy dependency.

Do not record downstream compatibility as proven until those steps run there.
