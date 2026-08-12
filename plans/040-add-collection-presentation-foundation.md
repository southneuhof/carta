# Plan 040: Add one-loader collection presentation to the framework

> **Implementation instructions**: Follow this plan in order. Run each check
> before the next step. If a STOP condition occurs, stop and report it. Do not
> start PTS application work in this plan. When implementation and review are
> complete, update this plan row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 1b8ae46..HEAD -- packages/is-vue-framework docs/architecture/web-application-architecture.md`
> If an in-scope file changed, compare the current code with the excerpts below.
> A material mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `1b8ae46`, 2026-08-12

## Why this matters

`ListView` can replace its table body, but it cannot give loaded records to a
custom presentation. A PTS card grid would therefore need a second loader and a
second copy of query, error, empty, pagination, and refresh behavior. Add one
framework collection owner first. Keep `Table` as the normal table API and keep
the framework independent of PTS.

## Current state

- `packages/is-vue-framework/src/components/core/Table.vue:72-114` owns query,
  loading, records, metadata, empty state, and pagination inside the table.

```ts
const query = useNamespacedQuery({ ... })
const loaded = useLoader<CollectionLoadContext, CollectionResult>({ ... })
const rows = computed(() => loaded.data.value?.data ?? [])
const empty = computed(() => !loaded.loading.value && !loaded.error.value && rows.value.length === 0)
```

- `packages/is-vue-framework/src/components/views/ListView.vue:97-127` converts
  its resource props into `TableProps`.
- `packages/is-vue-framework/src/components/views/ListView.vue:445-456` gives
  the `body` slot only `{ table: surface.table }`; its default body mounts
  `Table`, which starts the collection lifecycle.
- `packages/is-vue-framework/src/query/loader.ts` and
  `packages/is-vue-framework/src/query/namespace.ts` are the existing data and
  query primitives. Reuse them. Do not add a store or dependency.
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts` and
  `packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts`
  are the current table behavior patterns.
- `packages/is-vue-framework/src/components/views/__type-tests__/list-view.type-test.ts`
  is the slot and generic type pattern.
- The approved contract is in
  `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md`, section
  "Framework Collection foundation".

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; all tests pass |
| Browser tests | `pnpm --filter @southneuhof/is-vue-framework test:browser` | exit 0; all browser tests pass |
| Type check | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0; no errors |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no errors |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Use `pit-of-success` to check the public API. The natural `Table` call must
  keep correct loading and query behavior.
- Use `web-ui-surface-reuse` only to verify that the application can use the
  result. Do not change `apps/web` in this plan.
- Read `docs/architecture/web-application-architecture.md` and
  `packages/is-vue-framework/README.md` before editing.

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/contracts/index.ts`
- `packages/is-vue-framework/src/components/core/Collection.vue` (create)
- `packages/is-vue-framework/src/components/core/TableContent.vue` (create,
  internal presentation)
- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/core/index.ts`
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`
- `packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts`
- `packages/is-vue-framework/src/components/views/ListView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `packages/is-vue-framework/src/components/views/__type-tests__/list-view.type-test.ts`
- `packages/is-vue-framework/src/__tests__/public-api.spec.ts`
- `packages/is-vue-framework/README.md`
- `docs/architecture/web-application-architecture.md`

**Out of scope**:

- All PTS API, database, and web files.
- Automatic invalidation for custom resource actions.
- A generic card or card-grid component.
- A new query client, store, dependency, or compatibility wrapper.
- Any change to table fields, renderers, row actions, export, or routing policy.

## Git workflow

- Suggested branch: `codex/040-collection-presentation`.
- Use conventional commits, for example
  `feat(framework): add collection presentation`.
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Record the framework baseline

Run the current framework checks before extraction. Do not edit files in this
step. Record the results so a later failure can be assigned to this plan instead
of to pre-existing state.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework test`
- `pnpm --filter @southneuhof/is-vue-framework test:browser`
- `pnpm --filter @southneuhof/is-vue-framework type-check`

All three commands must exit 0 before implementation starts.

### Step 2: Add the lower-level Collection owner

Create `Collection.vue` and the smallest related public types. Move the shared
collection lifecycle from `Table.vue` into it:

- one of `data` or `load`, with the existing single-source assertion;
- controlled or namespaced query ownership;
- cache identity and `useLoader` use;
- records, metadata, loading, error, and empty state;
- page, limit, sort, search, filter, and refresh behavior;
- the existing pagination policy.

Expose state through one scoped default slot. Keep implementation primitives
private. `Collection` must not import `Table`, `TableContent`, or `ListView`.
Preserve the current controlled-query rule: a supplied query wins, and a
namespace then affects cache identity only.

Add focused unit coverage for this contract. Do not assert private component
structure or exact generated markup.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework type-check`
must exit 0.

### Step 3: Split loaded-row table rendering into TableContent

Move the table-only rendering and interaction code into internal
`TableContent.vue`. It receives already-loaded records and collection state. It
must not call `useLoader` or `useNamespacedQuery`. Preserve sorting, resizing,
column preferences, row click, row reorder, page size, pagination, slots, empty,
loading, and error behavior.

Make public `Table.vue` a thin composition of `Collection` and `TableContent`.
Keep its current props, events, slots, and exposed `refresh()` behavior as the
normal path. Do not add a second table API.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework test`
- `pnpm --filter @southneuhof/is-vue-framework test:browser`

Both commands must exit 0. Existing Table tests must pass without weaker
assertions.

### Step 4: Make ListView compose one Collection

Change `ListView` so it mounts one `Collection` around the selected
presentation. For `table`, render internal `TableContent`. For `custom`, invoke
the `custom` slot with the approved slot props. Keep the list shell, filters,
search, column controls, export, CRUD routes, and row actions unchanged.

The intended application call is:

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

Do not give the slot a loader. Do not remount `Collection` when presentation
changes. Keep existing list table calls unchanged.

Add a browser fixture whose loader records each call, and add type assertions
for the custom slot. Prove:

- `presentation` accepts `table` or `custom`; default is `table`;
- the slot receives records, query, metadata, loading, error, empty, refresh,
  and safe query/pagination actions;
- the slot does not receive `load`, `data`, cache keys, or a query client;
- `custom` without the slot throws a clear development error;
- presentation switch causes no load and keeps query state;
- page and refresh each cause one expected load.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework test`
- `pnpm --filter @southneuhof/is-vue-framework test:browser`
- `pnpm --filter @southneuhof/is-vue-framework type-check`
- `pnpm --filter @southneuhof/framework-web type-check`

All commands must exit 0.

### Step 5: Document only the new supported contract

Update the package README and web architecture document with the dependency
direction and the short `ListView` example above. State that custom actions
remain plain functions and that route code must invalidate its resource after
a successful custom action.

**Verify**:
`rg -n "presentation|#custom|Collection" packages/is-vue-framework/README.md docs/architecture/web-application-architecture.md`
must show the new contract in both files.

## Test plan

- Add one focused browser test for the table/custom switch, one-loader behavior,
  query retention, page load, refresh, and shared loading/empty/error states.
- Extend current unit tests only where an existing Table contract moves behind
  `TableContent`.
- Add one type test that rejects a custom slot loader and accepts typed records.
- Do not add snapshots for the new composition. Behavior is the contract.

## Done criteria

- [ ] `Table` keeps its current public call and existing tests pass.
- [ ] `ListView` defaults to table presentation.
- [ ] Custom presentation receives loaded records from the same collection.
- [ ] Switching presentation causes zero new loader calls and keeps the query.
- [ ] Page and refresh each cause exactly one expected load.
- [ ] The custom slot type has no loader.
- [ ] `custom` without its slot fails clearly in development.
- [ ] Framework unit, browser, and type checks pass.
- [ ] Web type check passes.
- [ ] `git diff --check` has no output.
- [ ] No file outside the in-scope list changed.

## STOP conditions

Stop and report if:

- keeping the current `Table` public props or events is not possible;
- the design needs two mounted loaders or two query owners;
- the custom slot needs a loader or framework internals;
- PTS-specific behavior appears necessary in the framework;
- another framework feature is needed beyond this approved gap;
- an existing Table or ListView behavior must be removed to make tests pass; or
- a verification command fails twice after a reasonable correction.

## Maintenance notes

`Collection` is a data lifecycle component, not a workflow or resource engine.
`TableContent` stays internal until an external consumer proves a need. Review
future changes for accidental dual query ownership and remounts. Add a generic
card presentation only after a second application has the same card contract.
