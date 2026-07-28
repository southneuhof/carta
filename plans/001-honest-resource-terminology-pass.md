# 001 — Honest resource terminology pass

Status: Done
Depends on: none

## Goal

Align three already-settled API names with what they actually represent:

- `rowControls` → `rowActions`
- `rowLink` → `detailRoute`
- `resource.remove()` → `resource.delete()`

This plan is intentionally narrow. It does not collapse `operations` and `actions`, and it does not rename `detail`.

## Why

Current framework still translates honest domain words into less honest UI words:

- row-level actions are exposed as `rowControls`, even though type is `RowAction[]`
- detail navigation target is exposed as `rowLink`, even though value is `RouteLocationRaw` for detail route generation
- delete operation is exposed publicly as `resource.remove()`, even though underlying operation is `delete`

These create avoidable translation burden for maintainers, agents, and downstream app code.

## Evidence

Primary framework sources:

- `packages/is-vue-framework/src/resources/defineResource.ts`
  - `TableSurface.rowControls`
  - `rowActions(record, onDelete)`
  - `rowLink?: (record) => RouteLocationRaw`
  - `remove(id)` delegating to `operations.delete`
- `packages/is-vue-framework/src/components/views/ListView.vue`
  - view surface reads `surface.rowControls`
  - fallback row-action renderer treats entries as actions, not generic controls

## In scope

Framework package only, plus direct app/test consumers required to keep workspace compiling:

- resource contracts and helpers
- `ListView.vue` and view-facing types
- tests and type tests
- app call sites using renamed APIs

## Out of scope

Do not touch:

- `operations` vs `actions` structural design
- `detail` naming
- `searchParameters`
- `namespace`
- removed ViewControls system beyond terminology fallout

## Repo conventions to follow

- keep route-owned page controls pattern from post-ViewControls cleanup
- preserve existing action derivation from resource `actions`
- preserve existing access checks and visibility gating
- keep tests close to current framework patterns instead of rewriting test architecture

## Steps

### 1. Rename `rowControls` to `rowActions` in framework surface types

Update `packages/is-vue-framework/src/resources/defineResource.ts`:

- `TableSurface.rowControls` → `rowActions`
- `tableSurface()` return object key → `rowActions`
- comments/docstrings must say “per-record actions”, not “controls”

Then update `packages/is-vue-framework/src/components/views/ListView.vue`:

- `ListViewSurface.rowControls` → `rowActions`
- slot fallback reads `surface.rowActions`
- internal variable names match `action`, not `control`, where practical

Stop if this change implies reintroducing generic page controls. That is out of scope.

### 2. Rename `rowLink` to `detailRoute`

Update `packages/is-vue-framework/src/resources/defineResource.ts`:

- `ResourceBase.rowLink` → `detailRoute`
- implementation key using `actions.detail.to` → `detailRoute`

Requirements:

- keep exact runtime behavior
- keep return type `RouteLocationRaw`
- keep derivation from `actions.detail.to`

Then update direct consumers, tests, and docs.

### 3. Rename public resource method `remove()` to `delete()`

Update `packages/is-vue-framework/src/resources/defineResource.ts`:

- `remove(id)` → `delete(id)`
- returned resource surface method type → `delete: (id) => Promise<unknown>`

Requirements:

- underlying behavior still delegates to `operations.delete`
- invalidation behavior unchanged
- thrown error text should stay semantically correct for missing delete behavior

Audit downstream call sites and tests for `resource.remove(...)`.

### 4. Sweep direct consumers

Update all direct references in:

- framework tests
- app route/resource tests
- any docs/type examples that use old names

Use repository search to find:

- `rowControls`
- `rowLink`
- `.remove(` on framework resources where delete semantic applies

Do not bulk-rename unrelated `remove` methods outside framework resource API.

### 5. Verification

Minimum verification:

1. search shows no remaining framework/public references to old names:
   - `rg "rowControls|rowLink|\\.remove\\(" packages/is-vue-framework apps/web`
2. focused framework tests pass
3. framework typecheck passes
4. app typecheck passes

If app/test failures expose stale docs-only contracts, do not fix them ad hoc here unless strictly required for compile. Put broader cleanup into Plan 002.

## Done criteria

- no public framework API still exposes `rowControls`
- no public framework API still exposes `rowLink`
- resource public delete entrypoint is `resource.delete(...)`
- framework and direct consumers compile
- focused framework tests covering list/resource behavior pass

## Test plan

Add or update tests that prove:

- table surface exposes `rowActions`
- `rowActions(record)` still derives detail/update/delete affordances correctly
- resource exposes `detailRoute(record)` when `actions.detail.to` exists
- resource exposes `delete(id)` and still invalidates after successful delete

Prefer updating existing resource/list view tests over adding brand-new suites.

## Risks

Low to medium.

Main risk: partial rename leaves stale public types or tests. Runtime behavior should remain same if sweep is complete.

## Maintenance note

Future `operations`/`actions` collapse should build on honest surface naming from this plan. Do not reintroduce `controls` wording for row actions.
