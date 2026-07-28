# Plan 017: Rebuild Table visibility rendering around one derived field list

> **Implementation instructions**: Follow this plan in order. Preserve user-visible behavior and public contracts. Do not optimize or patch the old visibility path; remove it and replace it with the target shape below. Run every verification gate. If any STOP condition occurs, stop and report. When implementation and review pass, change this plan's row in `plans/README.md` to `DONE`.
>
> **Drift check (run first)**: `git diff --stat aaec97a..HEAD -- packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/components/core/__tests__/table.spec.ts packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts packages/is-vue-framework/src/components/views/ListView.vue packages/is-vue-framework/src/components/views/__tests__/views.spec.ts plans/README.md`

## Status

- **State**: DONE
- **Priority**: P0
- **Effort**: M
- **Risk**: MED — replaces Table's data-column render loop while preserving its public API.
- **Depends on**: `plans/016-unify-listview-column-visibility-state.md` (DONE)
- **Category**: performance / bug
- **Planned at**: commit `aaec97a`, 2026-07-28

## Why this matters

Slow, consecutive column toggles can pin browser renderer CPU at 100% and crash tab. Reproduction needs no `ListView`, dialog, Switch, or storage: controlled `Table` with 200 rows × 20 fields freezes after ten visibility updates. One update costs about 66 ms before cumulative work starts.

Plain Vue table and minimal TanStack table both complete same workload. Current `Table.vue` is extra integration layer: it translates visible keys into TanStack `columnVisibility`, then asks TanStack again for visible columns and visible cells while also rebuilding `colgroup`, headers, sizing, slots, hover layers, and resize state. Replace this chain with one derived `visibleFields` list. TanStack continues to own row model, sorting, and pagination; it no longer owns visibility.

## Current state

- `packages/is-vue-framework/src/components/views/ListView.vue:119-140` — `useTablePreferences.visibleKeys` is ListView's only mutable visibility state. `ListView.vue:253-256` updates it immediately; `ListView.vue:280` passes it to `Table` as controlled `visible-columns`. Preserve this flow exactly.
- `packages/is-vue-framework/src/components/core/useTablePreferences.ts:59-70` — visibility state changes synchronously; storage write trails by 200 ms. Do not change this file or add visual debouncing.
- `packages/is-vue-framework/src/components/core/Table.vue:43-60` — derives both `visibleColumnKeys` and a `VisibilityState` object.

  ```ts
  const visibleColumnKeys = computed(() => {
    const keys = hasVisibleColumns ? (props.visibleColumns ?? fieldKeys.value) : preferences.visibleKeys.value
    return fieldKeys.value.filter((key) => keys.includes(key))
  })
  const columnVisibility = computed<VisibilityState>(() => {
    const visible = new Set(visibleColumnKeys.value)
    return Object.fromEntries(fieldKeys.value.map((key) => [key, visible.has(key)]))
  })
  ```

- `Table.vue:205-236` supplies that object to `useVueTable`; `Table.vue:241-246`, `326-329`, `331-358`, and `389-424` then consume TanStack visible-column/cell APIs in several render locations.

  ```ts
  get state() {
    return { sorting: sorting.value, pagination: pagination.value, columnVisibility: columnVisibility.value }
  }
  // template
  <col v-for="column in table.getVisibleLeafColumns()" ... />
  <td v-for="cell in row.getVisibleCells()" ...>
  ```

- `Table.vue:196-198` performs `Array.find()` against all TanStack rows from every reorder-row render. It exists only to obtain `getVisibleCells()` and disappears with direct field rendering.
- `Table.vue:471-475` adds per-cell stacking contexts and pseudo-elements for hover. Diagnostic overrides did not remove freeze by themselves, but this layer is no longer justified after rebuild. Previous simple row classes are sufficient.
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts:142-159` proves a single controlled update and no storage write. `Table.browser.spec.ts:82-176` has physical interaction test harness but no visibility stress regression.
- Conventions: use `computed`, direct template loops, and existing field `read` behavior. `Table.vue:135-142` is canonical value definition: `field.read(record, {})` if present, otherwise `record[field.key]`.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Focused unit tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/core/__tests__/table.spec.ts src/components/views/__tests__/views.spec.ts` | exit 0 |
| Browser regression | `pnpm --filter @southneuhof/is-vue-framework test:browser` | exit 0; stress test completes within test timeout |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Diff validation | `git diff --check` | exit 0 |
| Graph refresh | `graphify update .` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`
- `packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts`
- `plans/017-rebuild-table-visibility-rendering.md`
- `plans/README.md`
- `graphify-out/**` generated by final graph refresh

**Out of scope**:

- `ListView.vue`, `useTablePreferences.ts`, Dialog, and Switch. Their immediate UI flow and single mutable preference state are already correct.
- `TableProps`, `visibleColumns`, `update:visibleColumns`, `columnSizing`, resize interaction, storage keys/schema, row-reorder event contract, sorting/pagination contracts.
- Virtualization, pagination defaults, batching/debouncing visual changes, custom caches, render queues, requestAnimationFrame, watchers added solely for performance.

## Target design

`visibleFields` is the only visibility-derived render value in `Table.vue`:

```ts
const visibleFields = computed(() => {
  const requested = hasVisibleColumns ? (props.visibleColumns ?? fieldKeys.value) : preferences.visibleKeys.value
  const visible = new Set(requested)
  return fields.value.filter((field) => visible.has(field.key))
})
```

- Controlled Table reads `props.visibleColumns`; uncontrolled Table reads its own preference helper. Neither creates another mutable visibility copy.
- `useVueTable` state contains sorting and pagination only. Remove `VisibilityState`, `columnVisibility`, `table.getVisibleLeafColumns()`, and `row.getVisibleCells()` from `Table.vue`.
- Header, `colgroup`, width calculation, normal rows, and reorder rows each iterate `visibleFields` directly.
- A small pure `valueFor(record, field)` reads values with same existing contract. It is not reactive state, does not cache, and does not call TanStack cell APIs.
- Existing named cell slots and registered renderers remain public behavior; feed them `field`, `valueFor(record, field)`, record, and index directly.
- Use ordinary row hover/focus utility classes. Remove scoped pseudo-element CSS and its browser test. No per-cell state layer.

## Git workflow

- Start from current user working tree; `Table.vue` is already modified. Preserve unrelated edits.
- Do not create a branch, stage, commit, push, or open PR unless operator requests it.
- If committing later, repository history uses conventional commits; example: `fix(api): make the development seed satisfy its own verificator chain`.

## Steps

### Step 1: Add failing visibility-stress characterization

Extend `Table.browser.spec.ts` before touching `Table.vue`.

1. Make its `mount()` helper accept optional `fields`, `data`, and controlled `visibleColumns` state. Return a setter/ref so test changes same controlled prop that `ListView` changes.
2. Add a 20-field, 200-row fixture. Do not involve localStorage, ListView, Dialog, or Switch.
3. Add browser test with a strict per-test timeout (for example 4 seconds). Toggle two fields on/off for ten sequential cycles; after each `requestAnimationFrame` + `nextTick`, assert header count and `td` count equal current visible-field count × 200.
4. Replace old pseudo-element hover assertion with assertion for ordinary hover/focus row classes. Do not assert generated `::after` styles.

This must fail or time out on current faulty path and pass after rebuild. It proves no persistent renderer spin under slow, sequential controlled updates.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test:browser` → current baseline exposes regression; after Step 2 it exits 0.

### Step 2: Replace TanStack visibility plumbing with direct field rendering

In `Table.vue`:

1. Replace `visibleColumnKeys` and `columnVisibility` with `visibleFields` target design above. Keep `fieldKeys` for normalization and preference helper.
2. Remove `VisibilityState` import and `columnVisibility` from `useVueTable` state. Keep `sorting`, `pagination`, `getCoreRowModel`, manual sorting, manual pagination, and callbacks unchanged.
3. Add pure helpers:
   - `valueFor(record, field)` replicates existing `accessorFn`: call `field.read(record, {})` when supplied, otherwise `record[field.key]`.
   - `sizeFor(fieldKey)` returns local `columnSizing[fieldKey]`, else TanStack column's default size, else minimum width. It returns a number; creates no state.
4. Compute `tableMinimumWidth` from `visibleFields` plus existing 64px row-actions allowance.
5. Template rebuild, all from `visibleFields`:
   - `colgroup`: one `col` per visible field, width from `sizeFor`.
   - headers: one `th` per visible field; retain labels, alignment, sort button behavior, physical resize ref, and separator. Sort through `table.getColumn(field.key)?.toggleSorting()`.
   - normal body: each TanStack row maps to `visibleFields`; invoke existing named cell slot/renderer fallback with `valueFor(row.original, field)`.
   - reorder body: each draggable record maps to `visibleFields`; remove `rowFor()`. Use draggable record/index directly.
6. Delete `fieldsByKey`, `fieldFor`, `rowFor`, and any other helper made redundant. Do not retain alternate visibility paths, compatibility flags, caches, or a second render model.

**Verify**: browser stress test passes. `rg -n "columnVisibility|getVisibleLeafColumns|getVisibleCells|rowFor\(" packages/is-vue-framework/src/components/core/Table.vue` → no matches.

### Step 3: Remove cell state-layer complexity without changing interaction

In `Table.vue`:

1. Replace `is-table-state-row` plus scoped pseudo-element CSS with direct row classes equivalent to existing behavior: normal row hover/focus visual state through ordinary utility classes; reorder row same class.
2. Delete scoped `<style>` block. Do not add a replacement component, transition manager, composable, or event listener.
3. Keep row click and row-action click-stop behavior unchanged.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test:browser` → hover test and resize tests pass; `rg -n "is-table-state-row|::after|isolation: isolate" packages/is-vue-framework/src/components/core/Table.vue` → no matches.

### Step 4: Retain contract characterization and run full gates

In `table.spec.ts`, keep controlled visibility test and extend only where needed:

- controlled prop hide/show immediately updates headers and data cells;
- controlled updates make no `visible-columns` storage write;
- field `read`, named cell slot, registered renderer fallback, and row-action column continue receiving correct visible-field values after direct rendering;
- reorderable table emits expected payload and remains independent from visibility render internals.

Do not duplicate ListView persistence coverage. `views.spec.ts` already proves immediate switch state, debounce, reset cancellation, and unmount flush.

Run all commands in Commands table. After tests/typecheck pass, run `graphify update .`, inspect only intended paths, then update Plan 017 status in README and this file.

**Verify**: every Commands-table command exits 0.

## Test plan

- Browser: controlled 200×20 Table; ten slow sequential visibility updates; each frame has exact headers/cells; test timeout catches persistent CPU spin.
- Unit: controlled hide/show remains immediate and storage-free.
- Unit: current field read/alignment, slot/renderer, row action, sorting, pagination, resize, and reorder tests remain green.
- View: existing immediate column dialog plus debounced persistence tests remain unchanged and green.

## Done criteria

- [ ] `Table.vue` renders data columns only from one `visibleFields` computed list.
- [ ] No TanStack ColumnVisibility state or visible-column/cell method remains in `Table.vue`.
- [ ] No mutable visibility copy exists beyond uncontrolled Table preferences or controlled caller prop.
- [ ] ListView switch remains immediate; no Apply/draft flow added; no visual debounce added.
- [ ] Browser 200×20 / ten-toggle regression test passes inside its fixed timeout.
- [ ] All Commands-table checks exit 0.
- [ ] `git diff --check` exits 0; only in-scope files changed, apart from generated graph output.
- [ ] `plans/README.md` and this plan show `DONE` after implementation/review.

## STOP conditions

- `visibleColumns` must become a public API change, needs an Apply flow, or requires a second visibility ref. Stop.
- Direct `visibleFields` rendering cannot preserve field `read`, named `cell:<key>` slot, or registered renderer semantics. Stop and report exact incompatible contract.
- Stress test remains above timeout after direct rendering and removal of cell state layer. Stop; capture browser CPU profile before adding any queue, debounce, cache, or virtualizer.
- Fix requires touching ListView, preferences storage, or public contracts outside scope. Stop.
- Existing user-owned Table changes conflict with target excerpts. Stop and reconcile; do not overwrite them.

## Maintenance notes

- Visibility is presentation state. Keep it out of TanStack unless future feature truly needs TanStack's visibility APIs; reintroducing it requires this browser stress test to stay green.
- Future table rendering additions should consume `visibleFields`, never independently call a TanStack visible-column/cell API.
- Review focus: no duplicate render model, no cache/queue/composable added to mask work, and no user-flow change in ListView.
- Virtualization is intentionally deferred. It may be warranted for genuinely large data sets, but must not substitute for eliminating this current cumulative render bug.
