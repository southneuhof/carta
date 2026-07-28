# Plan 005: Render ListView standard actions as static capability branches

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat af08462..HEAD -- packages/is-vue-framework/src/resources packages/is-vue-framework/src/components/views apps/web/src/routes docs/architecture plans`
> This plan follows completed Plan 004 in a dirty working tree. Preserve every
> existing edit. If the current-state excerpts below no longer match, stop and
> report rather than applying this plan mechanically.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/004-simplify-list-view-standard-actions.md`
- **Category**: tech-debt
- **Planned at**: commit `af08462`, 2026-07-28

## Why this matters

`ListView` supports exactly four standard resource capabilities: create,
detail, update, and delete. Plan 004 renders those controls, but represents
the three row capabilities as a finite `RowAction[]`, then loops and switches
on a key the framework already knows. Delete is worse: it is hidden until each
route supplies an `onDelete` callback even though `resource.delete(id)` already
owns the handler and cache invalidation.

Replace that transient descriptor list with named, capability-specific table
surface members. `ListView` should use direct `v-if` branches for its four
supported controls, invoke generic resource deletion itself, and leave any
non-standard row control to an additive slot. This removes dead extension
machinery without making custom workflows resource configuration.

## Current state

### Resource surface

`packages/is-vue-framework/src/resources/defineResource.ts` currently mixes
native table arguments with route-owned deletion and emits a descriptor array:

```ts
// TableSurfaceArguments, around lines 275-280
export interface TableSurfaceArguments<TQuery extends object = Record<string, unknown>>
  extends TableFactoryArguments<TQuery> {
  onDelete?: (record: object) => void
}

// TableSurface, around lines 292-298
export interface TableSurface<TRecord extends object, TQuery extends object> {
  table: TableProps<TRecord, TQuery>
  createRoute: RouteLocationRaw | undefined
  rowActions: ((record: TRecord) => RowAction[]) | undefined
}
```

Its `rowActions(record, onDelete)` implementation builds detail/update/delete
objects after evaluating capability permission and `visible`. `tableSurface()`
only exposes delete when that route callback exists. Later in the same file,
`deleteResource(id)` already calls the typed delete handler and invalidates the
deleted record plus every collection for that resource. Preserve this one
execution path; do not call `capabilities.delete.handler` directly from a view.

`packages/is-vue-framework/src/query/client.ts:37-47` defines that invalidation
contract: deletion invalidates `resource/<key>/list` and the deleted record.

### ListView

`packages/is-vue-framework/src/components/views/ListView.vue:35-58` receives
`createRoute` and `rowActions`. Its template at lines 87-123 runs:

```vue
<template v-for="action in surface.rowActions(slotProps.record)" :key="action.key">
  <RouterLink v-if="action.key === 'detail'" ... />
  <RouterLink v-else-if="action.key === 'update'" ... />
  <Dialog v-else-if="action.key === 'delete'">...</Dialog>
</template>
```

Those are not open-ended descriptors: every branch is hardcoded in this file.
`FormView.vue:135-156` is existing framework precedent for a resource-bound
shell owning successful standard-operation feedback through `vue-sonner` while
leaving exceptional follow-up work explicit.

### Existing tests and docs

- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts` asserts
  `rowActions` keys and requires `table({ onDelete })` for delete.
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
  supplies the ListView mount harness and shell-boundary tests.
- `apps/web/src/routes/(authenticated)/settings/{roles,users}/*.resource.spec.ts`,
  `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts`,
  and `apps/web/src/routes/(authenticated)/to-do/notifications.resource.spec.ts`
  assert the retired `rowActions` projection.
- `packages/is-vue-framework/src/resources/index.ts` publicly exports
  `RowAction`.
- `docs/architecture/web-application-architecture.md` describes the
  `rowActions` list surface around lines 333-340 and its generation around
  lines 627 onward. `docs/architecture/routing-and-controls-review.md` still
  describes callback freshness. Both must describe the replacement instead.

The codebase uses Vue `script setup`, direct template branches, Vitest, and
Vue Test Utils. Retain current Indonesian standard copy and icons: `Tambah` /
`add`, `Detail` / `eye`, `Ubah` / `edit`, and `Hapus` / `delete-bin`.

## Target contract

`TableSurface` must contain only these named standard-control projections in
addition to its native `table` props:

```ts
interface TableSurface<TRecord extends object, TQuery extends object> {
  table: TableProps<TRecord, TQuery>
  createRoute: RouteLocationRaw | undefined
  detailRoute: ((record: TRecord) => RouteLocationRaw | undefined) | undefined
  updateRoute: ((record: TRecord) => RouteLocationRaw | undefined) | undefined
  canDelete: ((record: TRecord) => boolean) | undefined
  deleteRecord: ((record: TRecord) => Promise<unknown>) | undefined
}
```

Rules:

- `createRoute` remains the existing static, permitted create target.
- `detailRoute(record)` and `updateRoute(record)` return `undefined` unless
  capability exists, has a route target, and passes permission plus `visible`
  for that record. Route resolution is pure, so direct template `v-if` checks
  may call it twice.
- `canDelete(record)` returns `true` only when delete capability exists and
  passes permission plus `visible` for that record.
- `deleteRecord(record)` calls `deleteResource(identity(record))`. It does not
  reimplement transport, access, identity, or cache invalidation.
- `deleteRecord` is present only for a resource with a delete capability;
  `ListView` calls it only after `canDelete(record)` rendered the button.
- Remove `RowAction`, `rowActions`, and `onDelete` completely from framework
  types, code, exports, tests, documentation, and app assertions.
- `tableOptions` returns to forwarding only `TableFactoryArguments`; it cannot
  register UI behavior.
- Do not add generic action registries, maps, labels, renderers, components,
  callback overrides, or arbitrary capability rendering.
- Do not change direct `resource.delete(id)` callers. They remain the API for
  custom workflows and detail pages.

`ListView` must statically render its supported actions. Its `row-actions`
slot becomes additive: standard permitted controls render first, then slot
content renders for custom controls. A route needing complete replacement uses
the existing `body` slot and composes `Table` directly. This makes the ordinary
custom case additive without turning standard controls into a configuration
language.

The generic delete path owns the existing confirmation dialog, pending state,
default success toast (`Data berhasil dihapus.`), and fallback failure toast
(`Gagal menghapus data.`). Do not add per-resource message metadata in this
plan. Transport-specific errors may still be displayed by their existing
adapter; this fallback must not swallow or transform the thrown error.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; all Vitest tests pass |
| Framework type-check | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0; no `vue-tsc` diagnostics |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0; all web tests pass |
| Web type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no `vue-tsc` diagnostics |
| Full verification | `pnpm type-check && pnpm test` | both commands exit 0 |
| Retired API search | `rg -n "RowAction|rowActions|onDelete" packages/is-vue-framework/src apps/web/src docs/architecture` | no matches, except unrelated legacy component slots named `list-rowActions` |

## Scope

**In scope**:

- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/resources/index.ts`
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts`
- `packages/is-vue-framework/src/components/views/ListView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.spec.ts`
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.spec.ts`
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts`
- `apps/web/src/routes/(authenticated)/to-do/notifications.resource.spec.ts`
- `docs/architecture/web-application-architecture.md`
- `docs/architecture/routing-and-controls-review.md`
- `docs/architecture/resource-migration-guide.md`
- `plans/README.md`

**Out of scope**:

- `DetailView` standard delete, delete-follow-up navigation, and detail-page
  controls. Those require a separate decision about redirect and nested-route
  behavior.
- Resource capabilities other than create/detail/update/delete.
- Generic page-action descriptors, arbitrary action renderers, localization,
  or per-resource presentation/message configuration.
- Unrelated legacy `list-rowActions` slots in composites and inputs.
- API authorization, RPC adapters, handler signatures, and cache-key design.

## Git workflow

- If a branch is needed, create `codex/005-static-listview-capability-branches`.
- Preserve all pre-existing dirty-worktree edits.
- Do not commit, push, or open a PR unless separately instructed.

## Steps

### Step 1: Replace descriptor-array types with named standard projections

In `defineResource.ts`:

1. Make `TableSurfaceArguments<TQuery>` an alias or interface containing only
   `TableFactoryArguments<TQuery>`; delete `onDelete`.
2. Delete `RowAction` and remove its export from `resources/index.ts`.
3. Replace `TableSurface.rowActions` with `detailRoute`, `updateRoute`,
   `canDelete`, and `deleteRecord`, matching the target contract exactly.
4. Keep `createRoute` unchanged.

Do not move any of these fields into `TableProps`; `Table` remains unaware of
resource capabilities and action chrome.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0.

### Step 2: Derive explicit capability checks and generic deletion

In `defineResource.ts`:

1. Replace `rowActions(record, onDelete)` with small, named capability helpers.
   One may centralize permission and `visible` evaluation, but it must return
   either an authorized route or a delete eligibility boolean; it must not
   construct action objects or arrays.
2. Build `detailRoute` and `updateRoute` only when their capability has a
   route target. Each function returns an authorized route target or
   `undefined` for that record.
3. Build `canDelete` and `deleteRecord` only when delete handler exists.
   `deleteRecord(record)` delegates to existing `deleteResource(identity(record))`.
4. Remove the `onDelete` destructuring and callback closure from
   `tableSurface()`.

Keep evaluation at render/click time through `useResourceRuntime()` so changed
access state and record-specific visibility are not frozen when the surface is
created. Keep route-target normalization and final conditional-surface casts
within Plan 003's established cast boundary.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test` → all resource tests pass.

### Step 3: Render ListView controls as direct branches

In `ListView.vue`:

1. Remove `RowAction` import, `rowActions` surface member, and
   `remove(action, close)` signature.
2. Add the four named surface members and safe raw-table defaults of
   `undefined`.
3. Leave existing create branch intact.
4. In the single `#row-actions` table slot, render direct branches in this
   order: detail, update, delete, then custom `row-actions` slot content.
   Each standard navigation branch tests its matching route function with
   `v-if`; the route function is pure and may be used again for `:to`.
5. Render the delete dialog only when `canDelete(record)` is true. Its confirm
   handler calls `deleteRecord(record)`, maintains `deleting`, closes only on
   success, and shows the specified standard success/failure toasts.
6. Define the table slot only when at least one named standard surface member
   or the custom slot exists, so raw table mode still has no action column.
7. Change custom `row-actions` semantics from replacement to additive. Keep
   `body` as full-table replacement escape hatch.

Do not use `v-for` for standard detail/update/delete controls. Do not introduce
a helper that dispatches on an action key or re-creates an action union.

**Verify**:

```sh
rg -n "v-for=.*action|rowActions|RowAction|onDelete|action\.key" \
  packages/is-vue-framework/src/components/views/ListView.vue \
  packages/is-vue-framework/src/resources
pnpm --filter @southneuhof/is-vue-framework type-check
```

Expected: `rg` emits no matches; type-check exits 0.

### Step 4: Characterize capability-specific behavior

Update `resources.spec.ts` and affected web resource specs. Follow existing
Vitest style and runtime-registration setup.

Cover all of these cases:

- permitted create returns its static route;
- permitted detail/update return their named targets for a record;
- denied and `visible: false` detail/update return `undefined`;
- delete capability exposes `canDelete` and `deleteRecord` without
  `tableOptions` callbacks;
- calling `deleteRecord(record)` invokes the resource delete handler with its
  resolved identity and invalidates the resource list;
- denied or record-invisible delete has `canDelete(record) === false`;
- resources without delete expose neither delete surface function;
- custom `verify` capability never appears in a standard surface field;
- roles now expose generic list deletion; users, overtimes, and notifications
  keep only the named standard functions their declarations support.

Do not retain key-list assertions such as
`rowActions(...).map(action => action.key)`.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/framework-web test` → both exit 0.

### Step 5: Test ListView static markup and generic deletion

Extend `views.spec.ts` using its existing `mountCore` harness. Construct a
resource-shaped test fixture with the named table-surface functions; do not
reintroduce `RowAction` test descriptors.

Cover:

- create/detail/update/delete render their existing labels and icons when
  their named conditions pass;
- missing or denied capability functions render no corresponding standard
  control;
- delete confirmation calls `deleteRecord(record)` exactly once while pending,
  closes after success, and shows standard success/failure feedback;
- custom `row-actions` slot appears beside standard controls, not instead of
  them;
- raw `table` mode has no action column and a body slot still replaces the
  full table region.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test` → all view tests pass.

### Step 6: Reconcile public docs and plan index

Update only the scoped documentation sections:

- replace `rowActions` array language with direct standard capability branches;
- state that ListView owns generic list-row deletion, confirmation, cache
  invalidation through `resource.delete`, and default feedback;
- state that custom `row-actions` adds non-standard controls; use `body` for
  full replacement;
- preserve backend authorization as authoritative;
- remove stale callback-freshness reasoning tied to `onDelete`.

Mark Plan 005 `DONE` in `plans/README.md` only after every verification gate
passes. Keep Plan 004 marked `DONE`; it is historical, not to be rewritten.

**Verify**:

```sh
rg -n "RowAction|rowActions|onDelete" packages/is-vue-framework/src apps/web/src docs/architecture
pnpm type-check && pnpm test
```

Expected: no relevant retired API matches (ignore unrelated legacy
`list-rowActions` slot names); both full commands exit 0.

## Test plan

- Framework resource tests verify each named projection, access policy,
  visibility, deletion identity, and cache invalidation.
- Framework view tests verify literal UI branches, generic delete lifecycle,
  and additive custom slot behavior.
- Web resource specs verify every resource now states its supported standard
  functions instead of a descriptor list.
- Type-check both framework and web to catch exported-contract and Vue-template
  narrowing regressions.

## Done criteria

- [ ] No `RowAction`, `rowActions`, or framework `onDelete` API remains.
- [ ] ListView has direct create/detail/update/delete branches and no standard
  action `v-for` or action-key dispatch.
- [ ] List deletion invokes `resource.delete` through the generated
  `deleteRecord(record)` path and invalidates resource collections.
- [ ] Permission and `visible` still hide every ineligible per-record control.
- [ ] Custom row actions are additive; raw-table and body-slot escape hatches
  keep their current boundaries.
- [ ] `pnpm type-check && pnpm test` exits 0.
- [ ] Documentation and `plans/README.md` reflect final behavior.
- [ ] No files outside Scope changed, apart from ignored graph artifacts.

## STOP conditions

Stop and report instead of improvising if:

- any capability route function cannot be called safely twice from the template
  because it has side effects or unstable output;
- additive custom row controls conflict with a documented consumer that needs
  replacement but cannot use the existing `body` escape hatch;
- generic deletion needs route-specific navigation, optimistic state rollback,
  or a per-resource confirmation/message before it can be correct;
- Vue template type-checking requires casts, action maps, or a generic renderer
  to represent these direct branches;
- a verification command fails twice after a contained fix.

## Maintenance notes

- Future standard ListView capabilities must be added as explicit named surface
  fields and literal template branches, not descriptors or a registry.
- Custom workflow controls belong in the additive row slot or a custom body;
  they must not be inferred from arbitrary resource capabilities.
- Detail-page deletion remains deliberately separate because deletion there has
  a navigation decision that list-row deletion does not.
