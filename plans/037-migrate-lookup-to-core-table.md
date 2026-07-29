# Plan 037: Migrate LookupInput to the TanStack-backed core Table

> **Implementation instructions:** Replace legacy table integration without
> altering Lookup selection/model semantics. Core Table owns page, limit, sort,
> loading, empty, and error. Lookup owns search, filters, staging, commit, and
> preview actions.
>
> **Drift check (run first):**
> `git diff --stat 7700799..HEAD -- packages/is-vue-framework/src/components/composites/form-inputs/LookupInput.vue packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/contracts packages/is-vue-framework/src/fields apps/web/src/routes apps/web/src/framework/adapters/lookup.ts`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** HIGH
- **Depends on:** 035
- **Category:** migration
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Lookup is a high-use form input still coupled to legacy composite Table and
endpoint/runtime adapters. Migration gives it framework-standard loading,
TanStack pagination/sorting, strict field metadata, cancellation, and normalized
errors. Selection behavior is subtle, so tests must freeze it before changing
table ownership.

## Target contract and ownership

Lookup props should include:

```ts
fields: FieldsInput<TRecord>
data?: readonly TRecord[]
load?: Load<CollectionLoadContext<TQuery>, CollectionResult<TRecord>>
loadDetail?: Load<RecordLoadContext, RecordResult<TRecord>>
searchParameters?: Record<string, unknown>
namespace?: QueryNamespace
pick?: string
view?: string
```

- `data XOR load`.
- `loadDetail` hydrates scalar/sparse initial model values.
- `view` controls trigger/chip display; default may derive from first field key
  only when omitted.
- Core Table owns `query.page`, `query.limit`, `query.sort_by`, `query.sort`.
- Lookup merges its search/filter state into `searchParameters`; it must not
  duplicate page/sort state.
- No legacy field-map conversion layer.

## Current state

- `LookupInput.vue:2,7,20,114-118` imports runtime defaults, legacy
  `../Table.vue`, and `useFrameworkRuntime`.
- `LookupInput.vue:22-118` requires `getAPI`, accepts `getData/getDetail`, and
  exposes `fieldsAlias`, `fieldsType`, `fieldsProxy`, `fieldsDictionary`,
  `fieldsParse`, and `dataFormatter`.
- `LookupInput.vue:130-143` duplicates `page`, `sort_by`, `sort`, and search.
- `LookupInput.vue:220-237` hydrates details but swallows every failure.
- `LookupInput.vue:284-300` displays `fields[0]`; callers already pass `view`,
  but component has no `view` prop.
- `LookupInput.vue:378-422` passes legacy field props and load signature to
  composite Table, uses `list-rowActions`, and injects save buttons through
  `pagination-lengthControl`.
- `LookupInput.vue:432-447` also renders selected preview with legacy Table.
- `core/Table.vue:22-38,66-108` defines strict props, asserts source XOR, owns
  query state, and calls `useLoader`.
- `core/Table.vue:143-225` owns page-size, sort, and pagination transitions.
- `core/Table.vue` exposes `row-click` and `row-actions`; action cells stop
  propagation, so radio/checkbox actions need direct handlers.
- `core/__tests__/Table.browser.spec.ts:21-63` is browser mount exemplar.

Current legacy template:

```vue
<!-- LookupInput.vue:378-394 -->
<Table
  :fields="fields"
  :fieldsAlias="resolvedFieldsAlias"
  :limitSet="[5, 10]"
  :load="(query) => resolvedGetData(getAPI, query)"
  :searchParameters="combinedSearchParameters"
  :onRowClick="handleClick"
>
  <template #list-rowActions="{ data }">
```

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Lookup unit tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/composites/__tests__/LookupInput.spec.ts src/components/core/__tests__/table.spec.ts` | all pass |
| Browser tests | `pnpm --filter @southneuhof/is-vue-framework test:browser` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Legacy audit | `rg -n "getAPI|getData|getDetail|fieldsAlias|fieldsType|fieldsProxy|fieldsDictionary|fieldsParse|defaultLookup|useFrameworkRuntime|\\.\\./Table\\.vue|list-rowActions|pagination-lengthControl" packages/is-vue-framework/src/components/composites/form-inputs/LookupInput.vue` | no matches |

## Scope

**In scope**

- `LookupInput.vue`
- New Lookup unit/browser tests under existing component test directories.
- Contract additions needed for typed Lookup props.
- `runtimeDefaults.ts` only for now-unused lookup helpers.
- `apps/web/src/framework/adapters/lookup.ts`
- Web resource/operation/catalog files that pass Lookup props, including
  `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts` and
  `overtimes.operations.ts`.
- Related resource/catalog tests.

**Out of scope**

- Behavior changes in `core/Table.vue`; modify it only if a demonstrated generic
  Table defect blocks Lookup, then stop and report before expanding scope.
- Migrating other users of legacy composite Table/Detail/Tree.
- Rewriting legacy filter `Form`.
- New selection semantics, inline-add redesign, or visual redesign.
- Runtime capability removal; plan 042.

## Git workflow

- Branch: `codex/037-lookup-core-table`
- Suggested commits:
  1. `test(framework): characterize lookup selection`
  2. `refactor(framework): migrate lookup to core table`
  3. `refactor(web): wire lookup operations`

## Steps

### Step 1: Characterize selection state machine

Create `LookupInput.spec.ts`. Mount through `FrameworkPlugin` with deterministic
query client. Cover:

- scalar initial ID hydrated by `loadDetail`;
- whole-record initial value;
- multi initial array;
- single click select/deselect;
- multi toggling;
- staged changes reset on dialog close;
- `static=true` commits only on Save;
- non-static Save uses same commit pipeline;
- `onCommit`, `onSelectData`, and `validation:touch` order;
- preview delete updates model through confirmation;
- hydration error retains fallback selection and exposes/handles error according
  to final contract rather than silently corrupting model.

**Verify:** characterization tests pass before table replacement, except tests
explicitly marked as target behavior for new API.

### Step 2: Replace endpoint/runtime and field-map props

Add typed source props and `view`. Remove `getAPI`, `showAPI`, `getData`,
`getDetail`, all legacy field mapping props, `dataFormatter`, and runtime
resolution. Use framework field catalog directly. Keep formatter behavior local:
single returns picked scalar; multi returns records, unless existing documented
props require `transform`.

Make `view` the trigger/chip display key. If absent, derive first resolved field
key. Never index raw `fields[0]` when `fields` may be catalog object.

**Verify:** typecheck plus tests for array field selection and catalog-object
field selection.

### Step 3: Give core Table query ownership

Delete Lookup's `page/sort_by/sort` state. Keep search and filter state only.
Pass `fields`, `data/load`, `namespace`, page size options `[5,10]`,
`searchParameters`, and `@row-click`.

Map loader context unchanged to caller:

```ts
load({ query, searchParameters, signal })
```

Do not merge query into search parameters or rename sort direction in component.
App adapter translates backend vocabulary.

Use `#row-actions="{ record }"`. Both checkbox and radio control must call
`handleClick(record)` explicitly because action-cell propagation is stopped.
Prevent double toggles when row itself is clicked.

**Verify:** tests assert loader receives page/limit/sort separately from
search/filter, each gesture toggles once, and prior load aborts on search/page
change.

### Step 4: Move footer outside Table

Render action-button slot and Save controls after core Table in dialog content.
Preserve slot payload:
`{ searchParameters, selectedData, setOpen, isLoading }`.
Do not add a footer slot to core Table solely for Lookup.

Rename internal slot usage to core conventions:
`row-actions` payload `{record}`. Keep public Lookup `actionButton` slot unless a
breaking rename was explicitly approved; none was.

**Verify:** Save/action controls remain accessible with zero rows, loading,
error, and one/many pages.

### Step 5: Migrate preview Table

Render committed multi-selection using core Table static `data`, strict fields,
`pagination=false`, and `row-actions`. Delete action uses `record`. Remove
key-remount workaround unless a failing test proves core reactive `data` needs
it; plan 019 already fixed reactive TanStack data.

**Verify:** preview updates without remount key and delete regression passes.

### Step 6: Wire web operation closures

Replace `getAPI` resource props with explicit loaders in operation modules.
Backend adapters may call:

```ts
services.dataset(endpoint, {
  active: true,
  ...searchParameters,
  ...translatedQuery,
}, { signal })
```

Normalize `{data,total,totalPage}` to
`{data,meta:{total,totalPage}}`. Create explicit detail loaders for fields that
can start with scalar IDs. Update overtime resource tests to reject `getAPI`.
Update local catalog loader to new context signature and field catalog.

**Verify:** full framework/web gates pass.

## Test plan

- Unit state-machine tests in `LookupInput.spec.ts`.
- Browser tests for real core Table row/action behavior, search, pagination,
  sorting, dialog Save, and preview delete.
- Error/empty/loading states using deferred/rejected loaders.
- Web resource tests assert operation closure identity and normalized result.
- No real network.

## Done criteria

- [ ] Both Lookup tables use core TanStack Table.
- [ ] Strict field catalog and `view` work.
- [ ] Legacy props/imports absent.
- [ ] Core owns query; Lookup owns search/filter.
- [ ] Explicit `loadDetail` hydrates sparse selection.
- [ ] Selection/commit/preview regressions covered.
- [ ] Web callers pass normalized operations.
- [ ] Framework browser/unit tests and web gates pass.

## STOP conditions

- Core Table needs Lookup-specific slot/API behavior.
- A production caller depends on removed field converters and no strict field
  catalog can express same display.
- Existing caller relies on `showAPI` semantics not represented by
  `loadDetail`.
- Characterization reveals conflicting scalar/record behavior across callers.
- Migration requires changing unrelated legacy composite Table.

## Maintenance notes

Review duplicate-toggle risk and staged/committed copies. Future Lookup filters
should move to core Form fields separately; do not reintroduce endpoint or field
mapping props. Cache namespace is for intentional sharing/stability; unnamed
Table identity is already per instance.

