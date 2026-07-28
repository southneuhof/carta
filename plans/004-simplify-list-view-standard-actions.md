# Plan 004: Make ListView render standard capability actions directly

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat af08462..HEAD -- packages/is-vue-framework/src/components/views/ListView.vue packages/is-vue-framework/src/resources apps/web/src/routes docs/architecture`
> This plan depends on Plan 003. If Plan 003 is not `DONE`, stop. Also inspect
> `git status --short` and preserve the pre-existing terminology/capability
> changes; do not reset or overwrite them.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: 003-unify-resource-capabilities.md
- **Category**: tech-debt
- **Planned at**: commit `af08462`, 2026-07-28

## Why this matters

`ListView` currently derives standard per-record detail/update/delete actions,
but a route must manually repeat the resource's standard create capability in
the `controls` slot. The fallback row renderer also carries presentation data
inside `RowAction` and uses generic dispatch helpers (`iconFor` and
`isNavigationAction`) even though the framework supports exactly three standard
row branches. This plan makes the standard behavior explicit and local:
`ListView` hardcodes the Indonesian labels, icons, button variants, and
placement for create/detail/update/delete; capability presence and access decide
whether each branch exists; slots remain only for genuinely custom additions.

## Current state

- `packages/is-vue-framework/src/components/views/ListView.vue:20-44` accepts
  either a resource or raw table props and resolves `{ table, rowActions }`.
- `ListView.vue:46` reserves a `controls` slot, while lines 75–84 always require
  the route to populate that slot for a create button.
- `ListView.vue:50-58` defines `iconFor()` and `isNavigationAction()` to dispatch
  among the fixed standard row actions.
- `ListView.vue:93-118` loops over `rowActions`, dynamically chooses an icon,
  distinguishes navigation from command actions structurally, and renders the
  delete confirmation.
- `packages/is-vue-framework/src/resources/defineResource.ts:237-247` defines
  `RowAction` with presentation labels and `TableSurface` with `rowActions`.
  Around lines 443–468, the resource maps standard action/capability metadata
  into labelled row descriptors after access and visibility checks.
- `apps/web/src/routes/(authenticated)/settings/roles/index.route.vue:8-11`
  and `apps/web/src/routes/(authenticated)/hr/overtimes/index.route.vue:9-12`
  manually render the same `Tambah` control from the resource's create route.
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts:374-419`
  currently asserts that resource-bound `ListView` has no inferred page control
  and tests row actions through label-driven aria attributes. Those
  expectations must be inverted without weakening access checks.

After Plan 003, these resource actions are named capabilities and each standard
capability has a `handler`, `permission`, optional `visible`, and optional `to`.
This plan must use that capability contract and must not restore an `actions`
map.

## Target behavior

For resource-bound `ListView` only:

| Standard capability | Hardcoded ListView rendering |
|---|---|
| `create` | Header `RouterLink` + primary `Button`, text `Tambah`, icon `add` |
| `detail` | Per-row icon button, aria label `Detail`, icon `eye` |
| `update` | Per-row icon button, aria label `Ubah`, icon `edit` |
| `delete` | Per-row destructive icon button and existing confirmation dialog, aria label `Hapus`, icon `delete-bin` |

Rules:

- Render create only when the standard create capability exists, has a static
  route target, passes its permission check, and passes `visible` with no
  record.
- Render detail/update only when their capability exists, has a resolved route
  for the row identity, and passes permission/visibility for that record.
- Render delete only when its capability passes permission/visibility and the
  table call supplied the existing deletion callback.
- A raw `table` prop has no resource capability context and therefore renders
  no inferred create action.
- The `controls` slot remains additive for custom route-owned controls. It is
  not required for standard create and does not suppress the inferred create
  button.
- Do not infer or render custom capabilities.
- Do not add capability `label`, `icon`, `presentation`, `placement`, `variant`,
  or similar configuration.
- Do not add generic `pageActions`, `primaryActions`, registries, renderer maps,
  or action-component factories.
- Do not retain `iconFor`, `isNavigationAction`, or an equivalent generic
  dispatch helper. Use literal `v-if`/`v-else-if` branches on the standard key.

The intended template shape is direct:

```vue
<RouterLink v-if="surface.createRoute" :to="surface.createRoute">
  <Button><Icon name="add" />Tambah</Button>
</RouterLink>

<template v-for="action in surface.rowActions?.(record)" :key="action.key">
  <RouterLink v-if="action.key === 'detail'" :to="action.to">
    <Button kind="icon" variant="standard" aria-label="Detail">
      <template #icon><Icon name="eye" size="base" /></template>
    </Button>
  </RouterLink>
  <RouterLink v-else-if="action.key === 'update'" :to="action.to">
    <Button kind="icon" variant="standard" aria-label="Ubah">
      <template #icon><Icon name="edit" size="base" /></template>
    </Button>
  </RouterLink>
  <Dialog v-else-if="action.key === 'delete'">
    <!-- preserve the existing hardcoded delete confirmation -->
  </Dialog>
</template>
```

`surface.createRoute` is the recommended minimal projection: an optional
already-authorized `RouteLocationRaw` derived by `resource.table()` from
`capabilities.create`. It contains no label/icon/presentation metadata and does
not create a general page-action abstraction.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; all Vitest tests pass |
| Framework type-check | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0; no `vue-tsc` errors |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0; all web tests pass |
| Web type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no `vue-tsc` errors |
| Full verification | `pnpm type-check && pnpm test` | both commands exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts`
- resource type tests directly affected by `TableSurface`/`RowAction`
- `packages/is-vue-framework/src/components/views/ListView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `packages/is-vue-framework/src/contracts/__type-tests__/contracts.type-test.ts`
- `apps/web/src/routes/(authenticated)/settings/roles/index.route.vue`
- `apps/web/src/routes/(authenticated)/hr/overtimes/index.route.vue`
- their direct resource/route tests if assertions change
- ListView/resource sections of:
  - `docs/architecture/web-application-architecture.md`
  - `docs/architecture/resource-migration-guide.md`
  - `docs/architecture/routing-and-controls-review.md`
- `plans/README.md` status/index metadata

**Out of scope**:

- `DetailView` resource-level update/delete controls; this plan concerns the
  ListView create button and ListView row detail/update/delete actions only
- automatic rendering of custom capabilities
- presentation configuration on resources or capabilities
- localization/i18n work; preserve the framework's current Indonesian standard
  wording
- changes to standard handler behavior, cache invalidation, API authorization,
  or route generation
- removal of `controls` or `row-actions` slots; both remain escape hatches
- generic component slots named `actions` elsewhere in the framework

## Git workflow

- If a branch is created, use the repository's `codex/` prefix.
- Do not reset, commit, push, or open a PR unless separately instructed.
- Preserve all pre-existing dirty-worktree edits.

## Steps

### Step 1: Strip presentation data from standard row descriptors

In `defineResource.ts`, change `RowAction` into a discriminated union containing
only behavior/navigation data:

```ts
type RowAction =
  | { key: 'detail'; to: RouteLocationRaw }
  | { key: 'update'; to: RouteLocationRaw }
  | { key: 'delete'; onSelect: () => void }
```

Remove labels from resource row-action construction. Keep the existing
per-record identity resolution, permission check, `visible` check, deletion
callback requirement, and result ordering: detail, update, delete.

Update type tests and resource tests to assert keys, routes, callbacks, and
access behavior rather than label metadata.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework type-check && pnpm --filter @southneuhof/is-vue-framework test`
→ both exit 0.

### Step 2: Project the standard create capability onto the table surface

Add an optional `createRoute: RouteLocationRaw | undefined` to `TableSurface`.
During `resource.table()` construction, derive it only from the standard
`capabilities.create` entry after checking:

1. the capability exists;
2. `to` is a static route target appropriate for create;
3. permission is `null` or the access adapter allows operation `create`;
4. `visible`, when present, returns true with `{ access }` and no record.

Do not expose the create handler through the surface and do not create a
generic list of page actions. Raw table mode in `ListView` must use
`createRoute: undefined`.

Add tests proving allowed, denied, invisible, targetless, and absent create
capabilities produce the expected `createRoute`.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test`
→ all resource tests pass, including the five create-route cases.

### Step 3: Replace generic ListView action rendering with literal branches

In `ListView.vue`:

- extend its internal surface with `createRoute`;
- remove `iconFor()` and `isNavigationAction()`;
- render the inferred create button directly in the header before the additive
  `controls` slot;
- replace structural navigation detection and dynamic icon selection with
  literal branches for `detail`, `update`, and `delete`;
- hardcode the exact labels, icons, button kinds/variants, destructive color,
  and existing delete confirmation copy;
- preserve deletion pending-state behavior and slot precedence for a custom
  `row-actions` slot.

Do not extract these four branches into a new action renderer/component unless
the existing Vue template cannot type-check. If direct discriminated-union
narrowing fails in the template, STOP and report rather than introducing casts,
helpers, or a renderer abstraction.

**Verify**:

- `rg -n "iconFor|isNavigationAction|action\\.label|:name=\"iconFor" packages/is-vue-framework/src/components/views/ListView.vue packages/is-vue-framework/src/resources` → no matches;
- `pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0;
- `pnpm --filter @southneuhof/is-vue-framework test` → exit 0.

### Step 4: Replace the old no-page-action test with inference coverage

Update `resources.spec.ts` and `views.spec.ts` using their existing mount
harness. Cover:

- permitted routed create renders one `Tambah` button with `add` icon;
- denied/invisible/targetless/absent create renders no standard create button;
- raw table mode renders no standard create button;
- a custom `controls` slot renders alongside, not instead of, permitted create;
- detail/update/delete branches render their hardcoded aria labels and icons;
- denied row capabilities remain absent;
- the custom `row-actions` slot still replaces standard row rendering;
- delete still opens the hardcoded confirmation and invokes the route-provided
  deletion callback once while respecting pending state.

Do not assert a generic presentation object or snapshot the entire view.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test`
→ all view/resource tests pass and the former “no inferred page controls” test
no longer exists.

### Step 5: Remove manual standard create controls from web routes

Delete the repeated `#controls` blocks from the roles and overtimes list routes.
Remove imports that become unused. Do not alter their cell links, titles,
resource declarations, or route names. Users without create permission must
continue to see no create button through inferred capability filtering.

**Verify**:

- `rg -n -C 2 "#controls|capabilities\\.create.*to" "apps/web/src/routes/(authenticated)/settings/roles/index.route.vue" "apps/web/src/routes/(authenticated)/hr/overtimes/index.route.vue"` → no manual standard create control remains;
- `pnpm --filter @southneuhof/framework-web type-check` → exit 0;
- `pnpm --filter @southneuhof/framework-web test` → exit 0.

### Step 6: Reconcile architecture documentation

Update the scoped architecture sections to state:

- the resource capability determines availability/access;
- `ListView` owns the fixed presentation and placement of standard create;
- standard row detail/update/delete affordances are fixed ListView behavior;
- route slots are for custom additions or full escape-hatch replacement, not
  standard create registration;
- custom capabilities are not inferred.

Remove statements that all page actions must be route-authored when they refer
to the standard create action. Preserve the broader rule that custom workflow
placement remains route-owned.

**Verify**:

- `rg -n "page actions belong in route-owned|no inferred page|manually.*create|presentation:" packages/is-vue-framework/src docs/architecture apps/web/src/routes` → no stale statement/configuration for this behavior;
- `pnpm type-check && pnpm test` → both commands exit 0;
- `git status --short` → only in-scope files and preserved pre-existing changes
  are present.

## Test plan

Use these existing tests as structural patterns:

- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts:301-345`
  for access-filtered row actions;
- the resource-in-shell tests around lines 374–419 for ListView mounts and slot
  precedence;
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts` for
  shell markup and heading behavior.

Required cases:

1. allowed routed create;
2. denied create;
3. `visible` false create;
4. targetless create;
5. missing create;
6. raw table mode;
7. additive custom controls slot;
8. literal detail/update/delete branches;
9. row slot override;
10. delete confirmation/callback/pending behavior.

## Done criteria

- [ ] A resource-bound ListView renders standard create automatically from
  `capabilities.create`.
- [ ] Capability permission, `visible`, and `to` fully decide whether create
  appears; there is no separate `show-create` prop.
- [ ] Standard labels/icons/button presentation are hardcoded in `ListView.vue`.
- [ ] No capability/resource type contains label/icon/presentation/placement
  configuration for these standard actions.
- [ ] `RowAction` contains only key plus route/callback behavior.
- [ ] `ListView.vue` contains no `iconFor`, `isNavigationAction`, dynamic icon
  mapping, or equivalent generic dispatcher.
- [ ] Roles and overtimes list routes contain no manual standard create slot.
- [ ] Custom capabilities are not inferred or rendered.
- [ ] `controls` and `row-actions` slots remain available as escape hatches.
- [ ] `pnpm type-check` exits 0.
- [ ] `pnpm test` exits 0.
- [ ] `plans/README.md` marks Plan 004 `DONE` only after implementation and
  review.

## STOP conditions

Stop and report instead of improvising if:

- Plan 003 is not complete or the live resource API does not expose
  `capabilities`;
- Vue template type-checking cannot narrow `RowAction` by `key` without casts
  or helper dispatch functions;
- create route targets cannot be statically distinguished from identity-based
  detail/update targets under the Plan 003 types;
- eligibility would require a new presentation registry, action renderer,
  `show-create` prop, or capability presentation metadata;
- the change requires auto-rendering custom capabilities;
- preserving access behavior requires changing backend authorization;
- focused verification fails twice after a reasonable correction;
- implementation expands into DetailView resource-level actions or unrelated
  component action slots.

## Maintenance notes

The fixed labels and icons are deliberate framework policy. Reviewers should
reject attempts to make them configurable per resource unless a later,
separately approved architecture decision reverses this requirement.

When adding a new standard capability in the future, do not automatically place
it in ListView. First decide whether its surface placement and interaction are
as unambiguous as create/detail/update/delete. Custom capabilities remain
route-owned.
