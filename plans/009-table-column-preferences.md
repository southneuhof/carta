# Plan 009: Persist resizable and visible Table columns by namespace

> **Implementation instructions**: Persistence requires an explicit namespace.
> Never invent a default shared key.
>
> **Drift check (run first)**:
> `git diff --stat aaec97a..HEAD -- packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/components/views/ListView.vue packages/is-vue-framework/src/contracts/components.ts packages/is-vue-framework/src/components/core/__tests__/table.spec.ts packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
> plus working-tree diff.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED — malformed/stale storage and controlled state can hide data
- **Execution**: DONE — 2026-07-28
- **Depends on**: `plans/007-list-query-search-filter.md`,
  `plans/008-table-footer-state-layer.md`
- **Category**: direction
- **Planned at**: commit `aaec97a`, 2026-07-28

## Why this matters

Users need durable widths and column choices per resource. Namespace is already
the framework’s internal resource/view identifier and must be the only
persistence scope. New or renamed fields must recover safely from old storage.

## Current state

- TanStack Table is present, but `Table.vue:79-118` controls only sorting and
  pagination.
- Resolved fields preserve declaration order and keys.
- ListView owns toolbar/dialog chrome; Table owns column rendering.
- Old composite Table contains manual global `tableColumnWidths` storage and a
  60px minimum. Do not copy its global key or document listeners.
- `packages/utilities/src/storage.ts` directly accesses browser globals and
  returns `{}` for malformed JSON; core components need SSR-safe handling.

## Target storage

Only when namespace is present:

```text
is-framework:<namespace>:table:column-sizes
is-framework:<namespace>:table:visible-columns
```

Stored values contain field keys, never labels. Unknown keys are ignored. New
fields default visible. Minimum width defaults to 96px.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Table tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/core/__tests__/table.spec.ts` | exit 0 |
| View tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/views/__tests__/views.spec.ts` | exit 0 |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |

## Scope

**In scope**

- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/core/useTablePreferences.ts` (new)
- `packages/is-vue-framework/src/components/views/ListView.vue`
- Relevant Table/view tests

**Out of scope**

- Draggable column order
- Server-side preference synchronization
- Persistence without namespace
- Persisting query/search/filter values in localStorage

## Steps

### 1. Build SSR-safe preference state

Create `useTablePreferences` with namespace, live field keys, and optional
controlled values. It must:

- skip all storage reads/writes when namespace is absent
- guard `window`/`localStorage`
- recover from malformed, wrong-shape, negative, infinite, or stale values
- preserve declaration order
- default new fields visible
- debounce or write only on completed resize, not every pointer pixel
- react when namespace changes

Expose sizes, visible keys, setters, and `resetColumns()`. Reset removes both
keys and restores default sizes/visibility.

**Verify**: focused unit cases can live in `table.spec.ts` or a new adjacent
spec; malformed and namespace-less storage cases pass.

### 2. Use TanStack column sizing

Configure TanStack `columnSizing`, `enableColumnResizing`,
`columnResizeMode: 'onEnd'`, size/minSize, and resize handlers. Render an
accessible resize separator at each resizable header edge with pointer/touch
support. Apply header width to matching cells through TanStack sizes.

Default minimum is 96px. Add `minColumnWidth?: number` escape hatch; validate
positive finite values. Action column stays intrinsic and non-resizable.

**Verify**: simulated resize cannot go below minimum, updates table state, and
persists on completion.

### 3. Add controlled visibility API

Add optional `visibleColumns` and `update:visibleColumns` contract. Table uses
stored visibility when uncontrolled and namespace exists; explicit controlled
value wins. No namespace plus no controlled value means all fields visible and
no persistence.

Visibility must affect headers, cells, export metadata, and range-independent
table behavior. At least one data column must remain visible when no row action
column exists. When row actions exist, zero data columns is allowed.

**Verify**: tests cover controlled/uncontrolled values and safety rule.

### 4. Add ListView column dialog

Toolbar gets Remix `table` icon Button opening Dialog. Dialog lists every
resolved table field in declaration order with Switch controls. Include “Reset
columns” action inside dialog. ListView controls visibility passed to Table and
uses same namespaced preference composable.

Expose optional column-dialog title/reset labels and slot escape hatches.
Resource and raw Table paths share the same implementation.

**Verify**: toggle hides header/cells, remount restores state, reset restores all
fields/sizes, and two namespaces do not share state.

### 5. Protect storage and source boundaries

Do not use `storage.localStorage.clear`. Do not persist labels, renderer props,
records, or query data. Add no browser reads at module initialization.

**Verify**: package test under jsdom and typecheck pass.

## Test plan

- No namespace → zero localStorage calls
- Namespace-scoped widths and visibility survive remount
- Namespace A/B independence
- Malformed and stale storage recovery
- New fields become visible; removed fields disappear from state
- 96px minimum and custom minimum
- dialog toggles and in-dialog reset
- all-hidden safety with/without action column

## Done criteria

- [x] Resizing uses TanStack state and persists only with namespace
- [x] Visibility dialog persists by namespace
- [x] Reset action is inside dialog and clears both preferences
- [x] Unknown/stale storage never throws or hides new fields
- [x] All verification commands exit 0

## STOP conditions

- TanStack Vue resizing handlers cannot be attached without bypassing its state
  model.
- Existing Switch cannot represent controlled Boolean state reliably.
- ListView cannot obtain resolved field metadata without duplicating resolver
  logic; extract a shared resolver result, then report before widening scope.

## Maintenance notes

Field key changes intentionally reset that field’s preference. Review storage
key changes as migrations; never silently reuse a key for a different shape.
