# Plan 041: Adopt TanStack Table internally without changing the Table contract

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update this plan's row in
> `plans/README.md` after implementation and review.
>
> **Drift check (run first)**: `git diff --stat 2826b0a..HEAD -- packages/is-vue-framework/package.json pnpm-lock.yaml packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/components/core/__tests__/table.spec.ts packages/is-vue-framework/src/contracts/components.ts packages/is-vue-framework/src/contracts/fields.ts packages/is-vue-framework/src/query/namespace.ts packages/is-vue-framework/src/components/views/ListView.vue packages/is-vue-framework/src/index.ts docs/architecture/web-application-architecture.md plans/README.md`
> If any watched source file changed since this plan was written, compare the
> "Current state" excerpts against live code. Changes attributable to another
> completed plan are acceptable only after confirming every invariant below;
> otherwise treat the mismatch as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/004-rebuild-core-components.md` (DONE), `plans/005-add-resource-view-shells.md` (DONE), `plans/006-build-native-resource-definitions.md` (DONE)
- **Category**: migration
- **Planned at**: commit `2826b0a`, 2026-07-27

## Why this matters

Canonical `core/Table.vue` currently hand-wires only basic rows, server sorting,
and previous/next pagination. Upcoming column visibility, sizing, ordering,
selection, and expansion would otherwise create another custom table state
engine. Adopt `@tanstack/vue-table` as the private row/column state engine now,
while retaining every existing framework prop, event, slot, exposed member,
query convention, loader behavior, renderer convention, and DOM state. This is
an internal migration, not a public API redesign and not a visual redesign.

## Compatibility guarantee

This plan freezes the canonical Table contract before replacing internals. All
items below must remain true after migration.

### Public props

`TableProps` in `packages/is-vue-framework/src/contracts/components.ts:22-36`
remains structurally unchanged:

```ts
export interface TableProps<TRecord extends object, TQuery extends object> {
  fields: FieldsInput<TRecord>
  data?: TRecord[]
  load?: Load<CollectionLoadContext<TQuery>, CollectionResult<TRecord>>
  searchParameters?: Record<string, unknown>
  namespace?: QueryNamespace
  query?: TQuery
  schema?: ValidationSchema<TQuery>
}
```

- `data` and `load` remain mutually exclusive at runtime.
- `data` remains caller-controlled; `load` remains framework-controlled.
- Sync, async, cached, and offline loaders retain one `load` contract.
- `searchParameters`, `namespace`, controlled `query`, and `schema` retain their
  names and types. Do not remove `schema` because current Table does not consume
  it; query-schema integration is separate work.

### Events, slots, and exposed members

- `update:query` still emits the complete framework query object after a table
  query change.
- `row-click` still emits the original record and zero-based visible-row index.
- `loading`, `error`, and `empty` slots retain current precedence and scope.
- `cell:<field-key>` retains `{ value, record, field, index }`.
- `refresh` and `query` remain exposed. No TanStack instance is exposed.

### Field and rendering conventions

- Field order still comes from `resolveFields()`.
- `table: false` still excludes a field.
- Default reads still use `record[field.key]`; `field.read(record, {})` remains
  the escape hatch.
- `field.label`, `sortable`, `align`, `renderer`, and `props` retain semantics.
- A named `cell:<key>` slot still overrides a registered renderer; renderer
  still overrides plain `value ?? '-'` output.
- Semantic `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, and row markup
  remain. Loading, error, and empty states still replace the table.

### Query and data conventions

- Framework query keys stay `page` (one-based), `limit`, `sort_by`, and `sort`.
- First sortable-header click remains ascending; second remains descending.
  Sorting does not gain a third "none" state.
- Sorting resets `page` to `1`.
- Pagination remains server-driven and uses normalized `meta.totalPage`.
- TanStack's zero-based `pageIndex` exists only inside `Table.vue` and is
  translated at the boundary.
- Sorting or pagination must not reorder/slice rows client-side. The loader and
  backend remain authoritative.
- URL state remains owned by `useNamespacedQuery`; Table must not import Vue
  Router or write URL parameters itself.
- Fetching, cancellation, caching, normalization, and refresh remain owned by
  `useLoader` and TanStack Query. TanStack Table must never fetch data.

### Explicit non-goals

- Do not change `packages/is-vue-framework/src/components/composites/Table.vue`.
  It is a separate legacy component and remains behaviorally untouched.
- Do not add compatibility adapters between legacy and canonical props.
- Do not add column sizing, visibility, ordering, pinning, selection,
  expansion, grouping, drag ordering, virtualization, filtering UI, export, or
  toolbar controls in this migration.
- `docs/architecture/web-application-architecture.md:247-249` mentions
  selection, but canonical Table currently has no selection prop/event/slot.
  Do not invent that contract here. Record it as deferred follow-up work.
- Do not move or adopt `@tanstack/vue-form`; Form is outside this plan.
- Do not redesign styling or attempt to reproduce the supplied screenshot.

## Current state

### Relevant files

- `packages/is-vue-framework/src/components/core/Table.vue` owns canonical Table
  orchestration and rendering.
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts` is the
  focused behavioral suite; baseline at planning time is 11 passing tests.
- `packages/is-vue-framework/src/contracts/components.ts` owns `TableProps`.
- `packages/is-vue-framework/src/contracts/fields.ts` owns framework field
  vocabulary. TanStack column definitions must be derived from it, never replace
  it.
- `packages/is-vue-framework/src/query/namespace.ts` owns one-based namespaced
  framework query state and URL-adapter synchronization.
- `packages/is-vue-framework/src/components/views/ListView.vue` forwards Table
  props and slots without translating them.
- `packages/is-vue-framework/src/resources/defineResource.ts:417-429` creates
  exact `TableProps` objects for direct binding.
- `packages/is-vue-framework/src/index.ts:1-6` exports framework contracts and
  canonical components. It must not export TanStack Table.
- `packages/is-vue-framework/src/components/composites/Table.vue` is legacy and
  explicitly out of scope.

### Current orchestration excerpts

`packages/is-vue-framework/src/components/core/Table.vue:31-49` resolves fields,
owns one-based query defaults, and delegates loading:

```ts
const fields = computed(() => resolveFields({ fields: props.fields, surface: 'table' }))
const defaults: QueryValues = { page: 1, limit: 10 }
const query = useNamespacedQuery(/* ... */)
const loaded = useLoader<CollectionLoadContext, CollectionResult>({
  key: computed(() => collectionCacheKey(owner, query.values.value, props.searchParameters ?? {})),
  context: computed(() => ({ query: query.values.value, searchParameters: props.searchParameters ?? {} })),
  load: computed(() => props.load),
  data: computed(() => (props.data ? { data: props.data } : undefined)),
  normalize: (result) => adapters.data.normalizeCollection(result),
})
```

`packages/is-vue-framework/src/components/core/Table.vue:57-70` defines exact
sorting and pagination behavior that must survive:

```ts
function toggleSort(key: string) {
  const descending = query.values.value.sort_by === key && query.values.value.sort === 'asc'
  update({ sort_by: key, sort: descending ? 'desc' : 'asc', page: 1 })
}

function goTo(next: number) {
  if (next < 1) return
  if (totalPage.value != null && next > totalPage.value) return
  update({ page: next })
}
```

`packages/is-vue-framework/src/components/core/Table.vue:98-130` renders fields,
original records, slot/renderer precedence, and server pagination. Preserve its
observable markup and Indonesian fallback labels.

### Architectural constraints

`docs/architecture/web-application-architecture.md:247-249` assigns collection
rendering, namespaced query state, pagination, sorting, loading, refreshing,
empty, and error states to Table while excluding page headers, Cards, route
navigation, and CRUD controls. Lines 489-522 require independent namespaced URL
queries and prohibit direct router imports. `plans/README.md:394-407` requires
framework-owned vocabulary and keeps TanStack Query private. Apply the same
vendor boundary to TanStack Table.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Baseline/focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/core/__tests__/table.spec.ts --environment jsdom` | one file passes; baseline is 11 tests before additions |
| Install | `pnpm --filter @southneuhof/is-vue-framework add @tanstack/vue-table@8.21.3 --save-exact` | exit 0; framework manifest and root lockfile change |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all tests pass |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 with no errors |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all tests pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 with no errors |
| Web build | `pnpm --filter @southneuhof/framework-web build` | type-check and Vite build exit 0 |
| Public-leak scan | `rg "@tanstack/(vue-table|table-core)" packages/is-vue-framework/src --glob '!components/core/Table.vue' --glob '!components/core/__tests__/table.spec.ts'` | no output |
| Graph refresh | `graphify update .` | exit 0 |

`@tanstack/vue-table@8.21.3` was current when this plan was written. It peers on
Vue `>=3.2` and depends on matching `@tanstack/table-core@8.21.3`; this repo uses
Vue `3.5.39`. Keep the exact pin, matching the framework package's exact
`@tanstack/vue-query` policy. Do not upgrade unrelated dependencies.

Known pnpm reconciliation, approved 2026-07-27: adding this dependency with the
workspace's pnpm version may also deduplicate stale optional peer snapshots for
`better-auth -> @sveltejs/kit -> @sveltejs/vite-plugin-svelte` from Vite 5.4.21
to the workspace's existing Vite 8.1.4 resolution. The observed rewrite changes
no manifest specifier, package version, or importer besides adding TanStack
Table; it removes only the duplicate Vite 5 variants of SvelteKit, the Svelte
plugin/inspector, and `vitefu`, then repoints `better-auth`'s optional SvelteKit
snapshot to Vite 8. Vite 5 remains in the lockfile for actual Vitest 2 consumers.
This exact normalization is allowed. Any broader lockfile rewrite remains a STOP
condition.

## Reference docs

- Vue adapter: <https://tanstack.com/table/latest/docs/framework/vue/vue-table>
- Manual server pagination: <https://tanstack.com/table/latest/docs/guide/pagination>
- Manual server sorting: <https://tanstack.com/table/latest/docs/guide/sorting>

Use only core row, controlled sorting, and controlled pagination APIs needed by
this migration. Headless availability does not authorize new public features.

## Scope

**In scope** (only these source/config files may change):

- `packages/is-vue-framework/package.json`
- `pnpm-lock.yaml`
- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`
- `docs/architecture/web-application-architecture.md`
- `plans/README.md` for status/index maintenance
- `graphify-out/**` generated only by required graph refresh

**Read-only contract sentinels** (must not change):

- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/contracts/fields.ts`
- `packages/is-vue-framework/src/query/namespace.ts`
- `packages/is-vue-framework/src/components/views/ListView.vue`
- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/index.ts`

**Out of scope** (do not touch even if related):

- `packages/is-vue-framework/src/components/composites/Table.vue`
- `packages/is-vue-framework/src/components/utils/Pagination.vue`
- `packages/is-vue-framework/src/components/core/Form.vue` and Form contracts
- `apps/web/package.json`, including its unused `@tanstack/vue-form` dependency
- App routes, resources, adapters, styles, controls, and screenshots
- Any public prop carrying TanStack options, state, column definitions, row
  models, table instances, or callback types

## Git workflow

- Suggested branch: `advisor/041-tanstack-table-engine`
- Keep characterization tests and implementation as separate logical commits
  when practical.
- Commit style follows recent conventional commits, for example:
  `refactor(framework): adopt internal table engine`.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Freeze observable Table behavior before adding TanStack

Extend `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`
while current implementation is still active. Retain all 11 existing tests and
add characterization coverage for gaps in the compatibility guarantee:

1. `row-click` emits the exact original record reference and visible zero-based
   index.
2. `cell:<key>` receives exactly usable `value`, `record`, `field`, and `index`;
   slot output still wins over a registered renderer.
3. `field.read` supplies display/slot value without replacing the original
   record, and `table: false` excludes a field.
4. Alignment reaches header and cells with existing `textAlign` values.
5. First sort click emits/loads `asc`, second emits/loads `desc`, both reset page
   to one, and no third-state behavior appears.
6. A sort query change does not reorder controlled `data`; server/manual
   ownership is explicit.
7. Pagination cannot leave `[1, totalPage]`, uses normalized metadata, and keeps
   one-based query values.
8. `refresh` performs another load and exposed `query` reflects current
   framework keys without exposing TanStack state.
9. Loading, error, and empty slot precedence remains unchanged.
10. Reactive `data`, `fields`, namespace/query-adapter updates, and loader result
    changes update rendered rows/columns without remounting.

Avoid brittle full-markup snapshots. Assert semantic selectors, emitted values,
slot scopes, and visible text. If a listed behavior is not true in current code,
STOP and report the discrepancy instead of encoding a desired behavior as
"characterization."

**Verify**: `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/core/__tests__/table.spec.ts --environment jsdom` -> all existing and new tests pass against pre-TanStack Table.

### Step 2: Add TanStack Table as one private framework dependency

Run the exact install command from the command table. Confirm
`@tanstack/vue-table: 8.21.3` appears under
`packages/is-vue-framework/package.json` dependencies and lockfile resolution is
`8.21.3`. Do not add it to `apps/web`, peer dependencies, root dependencies, or
public exports. Do not change `@tanstack/vue-form` in this plan.

The approved pnpm reconciliation documented under "Commands you will need" may
remain. Review it narrowly: no importer specifier changes are allowed except the
new framework dependency; no Vite package version is added; the existing Vite 5
package/snapshots required by Vitest 2 remain. Then prove the resulting lockfile
is internally complete with a frozen install.

**Verify**: `pnpm install --frozen-lockfile` -> exit 0; `pnpm --filter @southneuhof/is-vue-framework type-check` -> exit 0; then `git diff -- packages/is-vue-framework/package.json pnpm-lock.yaml` -> only TanStack Table entries and the specifically approved optional-peer snapshot normalization appear.

### Step 3: Derive private TanStack columns from framework fields

In `packages/is-vue-framework/src/components/core/Table.vue`, keep
`resolveFields()` as authoritative. Derive private reactive TanStack column
definitions from resolved fields:

- column `id` is `field.key`;
- accessor calls `field.read(record, {})` when supplied, otherwise reads
  `record[field.key]`;
- header value comes from `field.label`;
- sorting enablement comes from `field.sortable`;
- force ascending-first behavior for every sortable field;
- disable multi-sort and sort removal to retain the two-state framework cycle.

Do not add TanStack types to contracts or field definitions. Do not replace the
renderer registry with `FlexRender`: existing slots and registry renderers are
the framework's presentation extension points. A local map from column ID to
resolved field is preferable to public/module-wide TanStack metadata
augmentation.

Create `useVueTable()` directly in `Table.vue`; do not add a one-use composable.
Configure `getCoreRowModel()` only. Keep column/data options reactive using the
Vue adapter's supported getter/reactive option shape so prop and loader updates
do not capture stale arrays.

**Verify**: focused Table suite -> all tests pass; framework type-check -> exit 0.

### Step 4: Bridge controlled sorting and pagination to framework query state

Configure TanStack Table for `manualSorting: true` and
`manualPagination: true`. It must model state and capabilities but never sort,
filter, slice, or fetch rows.

Build controlled internal state from `query.values`:

```ts
sorting: sort_by ? [{ id: String(sort_by), desc: sort === 'desc' }] : []
pagination: {
  pageIndex: Math.max(0, Number(page ?? 1) - 1),
  pageSize: Number(limit ?? 10),
}
```

Translate TanStack updater callbacks back through existing `update()` only:

- sorting writes one `sort_by`, `asc|desc`, and `page: 1`;
- pagination writes one-based `page` and current `limit`;
- reject page indices outside known `meta.totalPage` bounds;
- every accepted change still emits `update:query` with full query state;
- URL writes still flow only through `useNamespacedQuery`.

Supply normalized page count to TanStack when known. Preserve current hidden-nav
behavior when `totalPage` is absent or at most one. Never send TanStack's
zero-based names or array sorting shape to loaders, events, URLs, or exposed
state.

**Verify**: focused Table suite -> all tests pass, including exact query payloads and unchanged row order.

### Step 5: Render TanStack row/header/cell models through existing Vue contract

Replace direct `v-for` loops over `fields` and `rows` with TanStack header, row,
and visible-cell models, while preserving observable markup and slot context:

- headers stay one semantic row with `scope="col"`;
- sortable buttons invoke TanStack's controlled sorting path;
- each rendered row retains `row.original` for events and slots;
- emitted/slot index remains visible row index, not page-global index or a
  string row ID;
- cell value comes from TanStack accessor evaluation;
- resolved framework field still supplies alignment, renderer key, renderer
  props, and slot field object;
- pagination buttons use TanStack capability/mutation methods but retain current
  labels and bounds;
- loading/error/empty branches remain outside TanStack rendering and keep
  current precedence.

Keep `defineExpose({ refresh: loaded.refresh, query: query.values })` equivalent.
Do not expose the table instance as a debugging convenience.

**Verify**: focused Table suite, full framework tests, and framework type-check -> all pass.

### Step 6: Prove package and app compatibility

Run framework and web gates from the command table. Inspect source diff and
confirm no changes to contracts, resource factories, `ListView`, app call sites,
or legacy Table. Run the public-leak scan; only private implementation/test
imports may mention TanStack Table.

Update `docs/architecture/web-application-architecture.md` with one short
internal-runtime paragraph near the Table/query sections:

- TanStack Table is private implementation machinery;
- framework field/query/slot contracts remain authoritative;
- server loading stays in `useLoader`/TanStack Query;
- future table features require framework-owned contract design.

Do not rewrite unrelated architecture text. Run `graphify update .` after source
and documentation changes.

**Verify**: every framework/web command and public-leak scan in the command table succeeds; `git diff --name-only` contains only in-scope files plus generated `graphify-out/**` files.

### Step 7: Review the migration as an API-preservation change

Review every hunk against this rule: if an application or resource definition
can observe TanStack or must change its existing code, the migration failed.
Specifically inspect:

- one-based/zero-based conversion at every boundary;
- updater handling for controlled sorting and pagination;
- no client-side row transformations in manual mode;
- slot and event scopes use `row.original`;
- reactivity when data, fields, metadata, namespace, or query changes;
- no stale column definitions or accidental row identity semantics;
- no import/export of TanStack outside private implementation/tests.

Mark plan `DONE` in `plans/README.md` only after this review and all gates pass.

**Verify**: `git diff --check` -> no errors; final focused/full/type/build gates remain green.

## Test plan

Use `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts` and
its `mountCore` harness as structural pattern. Keep tests black-box except where
checking exposed `refresh` and `query` is part of public behavior.

Required coverage after migration:

- external `data` and sync/async `load` paths;
- data+load rejection;
- normalization and server page count;
- namespace isolation and URL-adapter updates;
- request cancellation on load-context changes;
- exact ascending/descending cycle and page reset;
- manual server sorting/pagination with unchanged local row order;
- page lower/upper bounds and one-based values;
- loading, error, and empty default/slot states;
- renderer and slot precedence with complete slot scope;
- `field.read`, field exclusion, alignment, and reactive field changes;
- `row-click` original identity and index;
- `refresh` and exposed framework query;
- reactive data/loader result updates without remount;
- static scan preventing public TanStack leakage.

Do not add tests for future sizing/visibility/selection APIs. Their shape is not
decided by this migration.

## Done criteria

- [ ] `@tanstack/vue-table@8.21.3` is an exact framework dependency only.
- [ ] `pnpm install --frozen-lockfile` succeeds after the dependency and approved
  optional-peer snapshot normalization.
- [ ] Canonical Table uses TanStack core row, controlled sorting, and controlled
  pagination models internally.
- [ ] `TableProps` is byte-for-byte unchanged.
- [ ] Existing events, slots, exposed members, fallback text, and semantic table
  structure remain compatible.
- [ ] Framework query vocabulary remains one-based `page`/`limit` plus
  `sort_by`/`sort`; no TanStack state reaches public boundaries.
- [ ] Sorting and pagination remain manual/server-owned; TanStack does not
  reorder or slice loaded rows.
- [ ] `useLoader`, TanStack Query, and adapters still own all data operations.
- [ ] Legacy composite Table and every app route/resource remain untouched.
- [ ] Focused Table, full framework, web test/type/build gates all pass.
- [ ] Public-leak scan returns no output.
- [ ] Architecture note and graph are current.
- [ ] `plans/README.md` row is `DONE` only after implementation review.

## STOP conditions

Stop and report; do not improvise if:

- Any compatibility test requested in Step 1 fails against pre-migration Table.
- Preserving behavior requires changing `TableProps`, field contracts,
  `ListView`, resource factories, app routes/resources, or query adapters.
- TanStack types must appear in any public export, prop, event, slot, or exposed
  member.
- Vue adapter reactivity cannot update rows, fields, page count, sorting, or
  pagination without remounting.
- Manual mode still transforms row order or slices rows before rendering.
- First-click ascending, second-click descending, page reset, or one-based URL
  semantics cannot be retained through controlled state.
- A renderer or named slot cannot receive the same original record/value/field
  context as before.
- The implementation appears to need a new public feature contract such as
  selection, visibility, sizing, expansion, or filtering.
- Package installation changes any unrelated manifest/importer specifier,
  package version, or lockfile entry beyond the explicitly approved stale
  optional SvelteKit/Vite peer-snapshot normalization, or requires a Vue version
  change.
- Any verification command fails twice after one reasonable correction.

## Maintenance notes

- Treat TanStack Table like existing TanStack Query integration: replaceable
  internal machinery behind stable framework vocabulary.
- Future column visibility, sizing, ordering, pinning, selection, expansion, or
  filtering work must begin with framework contracts and characterization tests,
  then map privately to TanStack state. Never pass raw `TableOptions` through.
- Export and toolbar actions remain `ListView`/application concerns. TanStack
  state may support them later, but does not move visual chrome into core Table.
- Review TanStack upgrades for Vue adapter reactive-option changes and sorting/
  pagination default changes. Exact compatibility tests are upgrade gates.
- Current docs claim selection ownership without an implemented selection
  contract. Resolve that in a separate design plan before adding selection.
