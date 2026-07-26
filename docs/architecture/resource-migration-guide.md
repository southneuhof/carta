# Resource migration guide

How to move a screen from the retired CRUD architecture to resources, cores, and
view shells. Every example below is copied from migrated code in this repository
(`apps/web/src/framework/adapters/resources/` and
`apps/web/src/routes/(authenticated)/settings/`), not invented.

There are no compatibility wrappers: `@southneuhof/is-vue-framework` 2.0 removed
the legacy CRUD surface outright. Translate each screen by hand using the tables
below.

## What replaced what

| Retired | Replacement |
| --- | --- |
| `CRUDComposite` + `?<name>_view=` query state | one filesystem route file per screen |
| `CRUDList` | `ListView` + `resource.table()` |
| `CRUDDetail` | `DetailView` + `resource.detail({ id })` |
| `CRUDCreate` | `FormView` + `resource.form()` |
| `CRUDUpdate` | `FormView` + `resource.form({ id })` |
| `useCRUDOperations` / `FrameworkCRUDRuntime` | `defineResource({ operations })`, derived from RPC by `createRpcOperations` |
| nested `CRUDComposite` with fabricated operations | a child route plus an ordinary `searchParameters` entry |
| `inject<any>('data')` | route params, or a parent route component that passes them down |
| `actions: { create: false }` | nothing: absent behavior removes the control automatically |

Field configuration mapping lives next to the catalog, in
`packages/is-vue-framework/src/fields/MIGRATION.md` (`fieldsAlias` → `label`,
`fieldsProxy` → `read`, `type` → `renderer`, `dependency` → `behavior`, ...).

## 1. Define the resource

```ts
// apps/web/src/framework/adapters/resources/roles.ts
export const roleFields = defineFields<Role, RoleDraft>()({
  name: { label: 'Nama Role', table: { sortable: true }, form: { renderer: 'text' } },
  createdAt: { label: 'Dibuat', display: { format: 'datetime' }, form: false },
})

export const roles = defineResource<Role, RoleQuery, RoleDraft, RoleDraft>({
  key: 'roles',
  fields: roleFields,
  operations: createRpcOperations(rpc.roles),
  table: { fields: ['name', 'createdAt'] },
  detail: { fields: ['name', 'createdAt'] },
  form: { fields: ['name'] },
  schemas: { create: fromZod(roleSchemas.create), update: fromZod(roleSchemas.update) },
  routes: {
    list: '/settings/roles',
    create: '/settings/roles/new',
    detail: (id) => `/settings/roles/${id}`,
    update: (id) => `/settings/roles/${id}/edit`,
  },
})
```

Only the operations the RPC route exposes are derived. `users` has no create or
delete route, so `users.capabilities.create` is false and the create control
never renders — no `actions: { create: false }` needed.

## 2. Give every screen a route file

```text
settings/roles/
  index.route.vue          -> /settings/roles
  new.route.vue            -> /settings/roles/new
  [roleId].route.vue       -> parent layout (tabs + <RouterView/>)
  [roleId]/
    index.route.vue        -> /settings/roles/:roleId
    edit.route.vue         -> /settings/roles/:roleId/edit
    permissions/
      index.route.vue      -> /settings/roles/:roleId/permissions
```

```vue
<!-- index.route.vue -->
<script setup lang="ts">
import { ListView, standardControls } from '@southneuhof/is-vue-framework'
import { roles } from '@/framework/adapters/resources/roles'

const controls = standardControls({ resource: roles, surface: 'list' })
</script>

<template>
  <ListView title="Roles" :table="roles.table()" :controls="controls" />
</template>
```

```vue
<!-- [roleId]/edit.route.vue — the same Form the create route uses, with no mode -->
<template>
  <FormView title="Ubah Role" :form="roles.form({ id: roleId })" @submitted="onSubmitted" />
</template>
```

## 3. Express nesting with the filesystem, not with vocabulary

A child collection is an ordinary table scoped by an ordinary
`searchParameters` entry supplied by the route:

```ts
const table = computed(() => rolePermissions.table({ searchParameters: { role_id: roleId.value } }))
```

There is no `parent` option, no nested-resource kind, and no injected record.

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
| a control the inference cannot know about | a custom `ViewControl` descriptor or a shell slot |

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
