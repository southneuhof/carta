# Plan 018: Evict superseded table-search results

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command before moving on. If a STOP condition occurs, stop and
> report — do not improvise. When complete, set this plan's row in
> `plans/README.md` to `DONE` after implementation and review.
>
> **Drift check**: `git diff --stat fc8c9ec..HEAD -- packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/components/core/__tests__/harness.ts packages/is-vue-framework/src/components/core/__tests__/table.spec.ts packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts plans/README.md plans/018-evict-superseded-table-search-cache.md`
> If an in-scope file changed, compare the current code with this plan. A
> mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `fc8c9ec`, 2026-07-28
- **Disposition**: REJECTED as the CPU-freeze fix on 2026-07-28. The reported
  reproduction alternates two tiny cached keys (seven rows and zero rows), so
  cache retention is not the accumulating work. Do not execute this plan as a
  fix for the freeze.

## Why this matters

Every distinct table search term becomes a TanStack Query key. The framework
does not set `gcTime`, so inactive result payloads remain for TanStack Query's
five-minute default. Repeated searches therefore accumulate real result sets
until garbage collection and renderer work peg a browser CPU core.

Evict only obsolete table-search entries after a search transition. Preserve
the active request and normal non-search collection cache; add no state layer,
public API, timer, or user-flow change.

## Current state

- `packages/is-vue-framework/src/components/core/Table.vue:87-99` builds the
  collection key. It is the only layer that knows this query represents Table
  search:

  ```ts
  const owner = ownerOf(props.namespace, 'table')
  const effectiveQuery = computed<QueryValues>(() => {
    if (!props.reorderable) return query.values.value
    const { page: _page, limit: _limit, sort_by: _sortBy, sort: _sort, ...filters } = query.values.value
    return filters
  })
  const loaded = useLoader<CollectionLoadContext, CollectionResult>({
    key: computed(() => collectionCacheKey(owner, effectiveQuery.value, props.searchParameters ?? {})),
  })
  ```

- `packages/is-vue-framework/src/components/core/useCoreData.ts:24-26` creates
  `['core', owner, 'list', stableValue({ ...searchParameters, ...query })]`.
  The fourth item is the normalized query object and includes `search`.
- `packages/is-vue-framework/src/query/loader.ts:53-64` uses this key directly
  with `useQuery`; keep it generic.
- `packages/is-vue-framework/src/query/client.ts:16-25` has no `gcTime`.
- `packages/is-vue-framework/src/components/views/ListView.vue:214-217` maps
  empty input to `search: undefined` and resets `page: 1`. Do not change it.
- `packages/is-vue-framework/src/components/core/__tests__/harness.ts` creates
  the test client internally. Add optional client injection only for precise
  cache assertions.

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/core/__tests__/harness.ts`
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`
- `packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts`
- `plans/README.md`
- `plans/018-evict-superseded-table-search-cache.md`
- generated `graphify-out/` changes from the required graph update

**Out of scope**:

- `packages/is-vue-framework/src/query/loader.ts` — it is generic.
- `packages/is-vue-framework/src/query/client.ts` — global `gcTime` would
  discard useful pagination/sort cache.
- `packages/is-vue-framework/src/components/views/ListView.vue` and
  `SearchBox.vue` — preserve existing search flow and debounce.
- Column visibility/sizing/persistence and all public APIs.

## Steps

### Step 1: Add one Table-owned eviction watcher

In `Table.vue`, import `useFrameworkQueryClient` from `../../query` and get the
client once in setup. Immediately after `effectiveQuery`, add exactly one
watcher of `effectiveQuery.value.search`; do not add a ref, composable, prop,
event, timer, or duplicated query state.

Use `flush: 'post'` so the existing `useQuery` observer has moved to the new
key first. Call `queryClient.removeQueries` with `type: 'inactive'` and a
predicate that accepts only keys with prefix `['core', owner, 'list']`, a
non-array object at index 3, a string `search` there, and a value differing
from the new search. A small local type guard is allowed if it makes the
predicate safe.

Do not use `deep`/`immediate`, `clear`, `invalidateQueries`, global `gcTime`,
or an old-key collection. Moving to `undefined` must remove all string search
keys for this owner, but preserve unsearched, pagination/sort/filter,
other-owner, and record keys.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework type-check` exits 0.

### Step 2: Prove exact cache ownership with a unit test

Extend `__tests__/harness.ts` with optional `queryClient?: QueryClient` and
install it when provided; preserve the created test client as the default.

In `__tests__/table.spec.ts`, mount a controlled-query `roles` Table with a
loader and an injected real client. Start unsearched, set `search` to `one`,
then `two`, awaiting `flush()` after each. Inspect
`queryClient.getQueryCache().findAll()` and prove `one` is absent, `two`
remains, the unsearched collection key remains, and another owner's search key
remains. Clear to `undefined` and prove `roles` has no string-search key.
Existing controlled-query event behavior must remain unchanged.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test -- table.spec.ts`
exits 0 with the new test and all existing Table tests passing.

### Step 3: Add a browser-scale regression

Extend the local mount helper in `Table.browser.spec.ts` only enough to pass a
controlled query, loader, and inspectable test client. Add a test with 20
fields and 200 loader rows. Change the controlled search through several terms,
waiting for `frame()` each time. After every transition, verify expected rows
and cells render; at the end, verify this owner has at most one string-search
key. Do not use timing thresholds.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test:browser -- Table.browser.spec.ts`
exits 0 with all pointer, visibility, resize, and search tests passing.

### Step 4: Complete verification and update records

Run these commands: `pnpm --filter @southneuhof/is-vue-framework type-check`,
`pnpm --filter @southneuhof/is-vue-framework test`, `graphify update .`,
`git diff --check`, and `git status --short`. All commands must succeed;
`git diff --check` must print nothing. Review scope, then set Plan 018 to DONE.

## Done criteria

- [ ] Exactly one Table-owned watcher implements eviction.
- [ ] No global cache lifetime, ListView/SearchBox flow, public API, or extra
  query/cache layer changes.
- [ ] Active search remains; obsolete string-search entries for this owner are
  removed after the observer switches.
- [ ] Unsearched, pagination/sort/filter, other-owner, and record caches stay.
- [ ] Focused unit/browser tests, full framework tests, and type-check pass.
- [ ] `graphify update .` and `git diff --check` pass.

## STOP conditions

- The collection key no longer has `['core', owner, 'list', object]` shape.
- Installed TanStack Query lacks `removeQueries({ type: 'inactive', predicate })`.
- `flush: 'post'` cannot run after the Query observer moves without changing
  user-visible timing or adding duplicated state.
- Safe identification requires an out-of-scope file.

## Maintenance notes

This must remain a Table policy: only Table knows an interactive query is a
superseded search. If future product work needs search-history cache, define a
separate bounded policy; do not silently restore five-minute accumulation.
