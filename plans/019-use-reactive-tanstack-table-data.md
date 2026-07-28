# Plan 019: Pass Table data to TanStack Vue Table as a reactive ref

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, stop and report — do not improvise. When complete,
> update this plan's row in `plans/README.md` to `DONE` after implementation
> and review.
>
> **Drift check (run first)**: `git diff --stat fc8c9ec..HEAD -- packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/components/core/__tests__/table.spec.ts packages/is-vue-framework/src/components/composites/SearchBox.vue packages/is-vue-framework/src/components/core/useTablePreferences.ts packages/is-vue-framework/src/components/views/ListView.vue packages/is-vue-framework/src/query/loader.ts packages/is-vue-framework/src/query/namespace.ts packages/is-vue-framework/src/utilities/tableTrace.ts apps/web/src/framework/adapters/query/routeQuery.ts plans/README.md plans/019-use-reactive-tanstack-table-data.md`
>
> The working tree deliberately contains temporary tracing changes from the
> investigation. Compare the excerpts below against the live files before
> editing. If the Table integration is no longer a `get data()` accessor, stop
> and report rather than substituting a different fix.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `fc8c9ec`, 2026-07-28

## Why this matters

Searching or changing a table query progressively consumes a browser CPU core,
including a seven-row list alternating with zero rows and an already-empty
list. The issue is not result size or cache retention. In
`@tanstack/vue-table@8.21.3`, `useVueTable` selects its non-reactive option
path when `initialOptions.data` is not a Vue ref; that path repeatedly nests
the previous `mergeProxy` options object whenever reactive table state changes.

`Table.vue` currently supplies `data` as an accessor, which is not a ref. Pass
the same single data source as a computed ref instead. This selects the
adapter's reactive branch, whose option merge is flat, while retaining
TanStack Table, the current query flow, sorting, pagination, resize behavior,
and public API.

## Current state

- `packages/is-vue-framework/src/components/core/Table.vue` owns the TanStack
  table integration. Its collection data is already represented by the single
  `rows` computed and its reorder-only projection `orderedRows`:

  ```ts
  const rows = computed(() => loaded.data.value?.data ?? [])
  const orderedRows = ref<Record<string, unknown>[]>([])
  watch(rows, (next) => { orderedRows.value = [...next] }, { immediate: true })

  const table = useVueTable<Record<string, unknown>>({
    get data() {
      return props.reorderable ? orderedRows.value : rows.value
    },
    get columns() { return columns.value },
    get state() { return { sorting: sorting.value, pagination: pagination.value } },
  })
  ```

- `node_modules/.pnpm/@tanstack+vue-table@8.21.3_vue@3.5.39_typescript@5.9.3_/node_modules/@tanstack/vue-table/src/index.ts:53-115`
  identifies reactive data only with `isRef(initialOptions.data)`. Its
  non-reactive branch uses `mergeProxy(defaultOptions, options)`, and its
  reactive `watchEffect` repeatedly calls `mergeProxy(prev, initialOptions,
  ...)`. Because `prev` is the earlier proxy, this creates a growing proxy
  chain on every query-driven sorting/pagination update. The reactive data
  branch uses a flat object spread instead.

- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`
  mounts real `Table` instances through `mountCore()` and uses `flush()` to
  settle Vue and TanStack Query work. The controlled-query test near the
  existing `keeps a supplied query controlled` test is the closest structural
  pattern.

- The uncommitted files `tableTrace.ts`, `SearchBox.vue`, `namespace.ts`,
  `loader.ts`, `useTablePreferences.ts`, `ListView.vue`, and `routeQuery.ts`
  contain temporary opt-in console tracing added solely to locate this defect.
  They are not part of the product fix and must be removed cleanly in this
  plan; do not leave a diagnostic layer or console calls in production code.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused regression | `pnpm --filter @southneuhof/is-vue-framework test -- table.spec.ts` | exits 0; all Table unit tests, including the new repeated-query regression, pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exits 0 with no TypeScript errors |
| Browser regression suite | `pnpm --filter @southneuhof/is-vue-framework test:browser` | exits 0; all browser Table interaction tests pass |
| Graph refresh | `graphify update .` | reports updated code graph without an extraction failure |
| Diff validation | `git diff --check` | no output, exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`
- Temporary tracing cleanup only:
  - `packages/is-vue-framework/src/utilities/tableTrace.ts` (delete)
  - `packages/is-vue-framework/src/components/composites/SearchBox.vue`
  - `packages/is-vue-framework/src/components/core/useTablePreferences.ts`
  - `packages/is-vue-framework/src/components/views/ListView.vue`
  - `packages/is-vue-framework/src/query/loader.ts`
  - `packages/is-vue-framework/src/query/namespace.ts`
  - `apps/web/src/framework/adapters/query/routeQuery.ts`
- `plans/README.md` and this plan's status
- Generated `graphify-out/` updates required by the repository instructions

**Out of scope**:

- Replacing TanStack Table, pinning/changing its package version, or patching
  `node_modules/`.
- Query-key eviction, `gcTime`, router persistence, search debounce, or any
  user-flow change.
- Column visibility, column resizing, storage preference semantics, and public
  props/events.
- Adding a generic reactivity wrapper or a second copy of table data.

## Git workflow

- Do not create a branch, commit, push, or open a pull request unless the
  operator explicitly asks.
- Preserve unrelated working-tree changes. Only the temporary tracing changes
  listed above may be removed as part of this plan.

## Steps

### Step 1: Replace the TanStack data accessor with one computed data ref

In `Table.vue`, create `tableData` immediately after `orderedRows`. It must be
the one source used by TanStack:

```ts
const tableData = computed(() =>
  props.reorderable ? orderedRows.value : rows.value,
)
```

Pass it as `data: tableData` to `useVueTable` and remove the existing `get
data()` accessor. Keep the existing `rows` computed, `orderedRows` watcher,
`get columns()`, `get state()`, manual pagination/sorting settings, and row
identity behavior unchanged. Do not create a second array copy for ordinary
tables.

This must make `isRef(initialOptions.data)` true inside TanStack's Vue adapter.
The adapter will then use its flat reactive merge path rather than nesting
`mergeProxy(prev, ...)` on every query state update.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework type-check` exits 0.

### Step 2: Add the repeated successful query-result regression

In `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`, add
one test beside the existing controlled-query coverage. Follow its `Host`,
`ref`, `mountCore`, and `flush` conventions.

The host must pass `query: query.value` into `Table` and expose the query ref.
Use a synchronous `load({ query })` that returns the existing two `rows` plus
normal pagination metadata when `query.search` is absent and `{ data: [],
meta: { total: 0, page: 1, pageSize: 10, totalPage: 0 } }` when it is present.
Alternate the exposed controlled query between those two successful states at
least 30 times, awaiting `flush()` after each assignment. Assert each cycle's
expected DOM state (`tbody tr` count for the unsearched state and `No data` for
the searched state), then clear search once more and assert the two rows render.

Do not add a wall-clock assertion. This is a behavioral regression: the old
getter form fails to settle because the adapter's proxy chain grows; the
computed-ref form settles normally under the test runner's ordinary timeout.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test -- table.spec.ts`
exits 0.

### Step 3: Remove the temporary trace instrumentation

Delete `packages/is-vue-framework/src/utilities/tableTrace.ts`. Remove only its
imports and `traceTable(...)` calls from the in-scope files listed above,
restoring the surrounding behavior exactly. In `Table.vue`, retain the
pre-existing lifecycle cleanup but remove the trace-only `onUpdated` hook and
its import. Do not replace trace calls with unconditional `console.log`s.

The fix must be observable through the regression test, not a permanent
diagnostic layer. This keeps runtime work and public/global browser state
unchanged when the defect is fixed.

**Verify**: `rg -n "traceTable|__IS_TABLE_TRACE__|is-table trace" packages/is-vue-framework/src apps/web/src` prints no matches.

### Step 4: Run complete verification and update records

Run the focused unit test, framework typecheck, and browser Table suite from
the commands table. Then run `graphify update .`, `git diff --check`, and
`git status --short`. Inspect the status output: it may contain the two plan
files and generated `graphify-out/` changes, but must not contain source edits
outside this plan's scope.

After reviewing the final diff against this plan, set Plan 019's status row in
`plans/README.md` to `DONE`. Keep Plan 018 rejected.

## Test plan

- Unit: controlled `Table` query alternates 30 times between successful
  seven-row-equivalent and zero-row results, then returns to rows.
- Existing coverage retained: Table sorting/pagination, controlled queries,
  visibility, resize, and browser pointer interactions.
- Structural exemplar: `table.spec.ts` test `keeps a supplied query controlled
  even when a namespace exists`.
- Verify: run the focused unit test and `test:browser` commands above; both
  must pass without disabling or weakening existing tests.

## Done criteria

- [ ] `useVueTable` receives a computed Vue ref as `data`; no `get data()`
  accessor remains in `Table.vue`.
- [ ] Exactly one data source remains: `rows` for ordinary tables and
  `orderedRows` only for reorderable tables.
- [ ] The 30-cycle successful query regression test exists and passes.
- [ ] No trace utility, trace calls, global trace flag, or console logging
  remains in source.
- [ ] Framework typecheck and browser Table suite pass.
- [ ] `graphify update .` and `git diff --check` pass.
- [ ] No source files outside the declared scope are modified.

## STOP conditions

Stop and report rather than improvising if:

- `Table.vue` no longer passes data through the `get data()` accessor described
  above.
- Passing a computed ref makes TanStack Table reject the type or changes row
  identity/order semantics.
- The repeated-query regression still stalls after the computed-ref change.
- Fixing the test requires a TanStack upgrade, a package patch, a cache policy,
  or a second query/data state layer.
- Any existing non-trace working-tree change overlaps an in-scope hunk and its
  ownership cannot be determined.

## Maintenance notes

Future Table integrations must pass a Vue ref/computed ref for reactive table
data to `useVueTable`; do not reintroduce accessor-style `data`. Reviewers
should specifically check the `isRef(initialOptions.data)` branch in the
installed TanStack Vue adapter whenever this integration is refactored or the
dependency is upgraded. The regression test intentionally avoids timing
thresholds and instead proves repeated state transitions settle correctly.
