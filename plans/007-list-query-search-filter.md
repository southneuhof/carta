# Plan 007: Give ListView one controlled query for search and filter Form

> **Implementation instructions**: Follow steps and verification gates. Update
> status only after implementation review.
>
> **Drift check (run first)**:
> `git diff --stat aaec97a..HEAD -- packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/components/views/ListView.vue packages/is-vue-framework/src/query/namespace.ts packages/is-vue-framework/src/contracts packages/is-vue-framework/src/resources/defineResource.ts`
> plus the same command without `aaec97a..HEAD` to include working-tree edits.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED — query ownership affects URL state and request cancellation
- **Execution**: DONE — 2026-07-28
- **Depends on**: `plans/006-form-model-bound-parity.md`
- **Category**: direction
- **Planned at**: commit `aaec97a`, 2026-07-28; `Table.vue` is dirty and must be reconciled, never reset

## Why this matters

Search is currently decorative: `ListView.vue:79` renders `<SearchBox/>`
without binding. Search and future filter fields must update the same query
object Table sends to its loader. Fixed resource scoping stays in
`searchParameters`; user-entered search/filter state belongs to `query`.

## Current state

- `TableProps.query` says externally controlled
  (`contracts/components.ts:35-38`), but `Table.vue:34-39` snapshots it and
  ignores it when a namespace is also present.
- `useNamespacedQuery` already supports either URL-owned or local Ref state.
- Table sends `{ query, searchParameters }` separately to load
  (`Table.vue:43-47`).
- `ListView.vue:45-49` derives a stable table surface, then forwards it at
  `ListView.vue:103`.
- `SearchBox.vue` already provides debounced `v-model<string>`.
- Shell boundary convention: ListView may orchestrate view state but must not
  import stores, RPC clients, SDKs, or project adapters.

## Public target

```vue
<ListView
  v-model:query="query"
  :resource="roles"
  :filters="{ fields: filterFields, defaults: { active: true } }"
/>
```

Search writes `query.search`. Filter Form writes other keys. Page resets to 1
when search/filter values change. `searchParameters` remains unchanged fixed
scope, such as a parent resource ID.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Query tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/query/__tests__/namespace.spec.ts src/components/core/__tests__/table.spec.ts` | exit 0 |
| View tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/views/__tests__/views.spec.ts` | exit 0 |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |

## Scope

**In scope**

- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/contracts/resource.ts`
- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/composites/SearchBox.vue`
- `packages/is-vue-framework/src/components/views/ListView.vue`
- Relevant query/Table/view tests

**Out of scope**

- Column persistence, export, and reorder
- Backend query naming beyond conventional `search`
- Moving `searchParameters` into query
- A filter DSL or automatic filter fields inferred from record fields

## Steps

### 1. Repair Table controlled query behavior

When `query` is supplied, use a writable controlled state that reacts to later
prop replacements and emits `update:query`. Namespace presence must not disable
controlled operation. When `query` is absent, preserve current namespaced URL
ownership. Ensure one user action emits once.

Expose a documented `updateQuery(patch)` alongside existing `query` and
`refresh`, so shells and custom controls need not reach into TanStack state.

**Verify**: Table tests cover controlled query with namespace, parent
replacement, one emission per update, and unchanged URL-owned mode.

### 2. Add ListView query and filter contracts

Add optional `query` model and a `filters` definition containing:

- `fields: FieldsInput<TQuery, TQuery>`
- optional `schema`
- optional `defaults`
- optional labels/reset label as escape hatches

Do not infer query fields from record fields. Use Table schema as fallback only
when compatible and explicit. Preserve raw `table` and resource input union.

ListView owns `useNamespacedQuery` when it renders standard body:

- namespace from `surface.table.namespace`
- defaults `{ page: 1, limit: 10, ...filters.defaults }`
- externally supplied query becomes controlled local state
- missing namespace uses non-persistent local state

Pass controlled query to Table and process `update:query`.

**Verify**: TypeScript tests or view compilation proves raw and resource forms.

### 3. Wire debounced search

Bind SearchBox to `query.search`. A changed search value resets `page` to 1.
Do not debounce pagination or filtering again. Preserve SearchBox internal
prop→local synchronization and cancel/ignore stale pending debounce writes.

**Verify**: view test types search, advances timers, then observes loader context
containing search and page 1.

### 4. Render filter Popover with model-bound Form

When filter fields exist, add Remix `filter` icon Button in toolbar. Popover
content contains model-bound Form, an apply-independent live query binding, and
a reset action. Reset preserves `search` and `limit`, restores filter defaults,
and resets `page` to 1. Keep filter popover extensible through named slots.

Use `Popover.vue`, `Button.vue`, `Icon.vue`, and Form from core. No Dialog.

**Verify**: view tests open/render filter content, change a field, observe query
and loader update, then reset without clearing search/limit.

### 5. Keep resource and shell boundaries honest

Update comments/contracts explaining:

- query = URL/user collection controls
- searchParameters = fixed loader scope
- namespace = query identity, later also preference identity

Keep passthrough cell/action slots and standard capability actions unchanged.

**Verify**: existing shell boundary and capability tests remain green.

## Test plan

- Controlled Table query works with a namespace and does not write URL.
- Uncontrolled Table still reads/writes namespaced URL.
- Search debounce sends `query.search` and cancels stale writes.
- Filter Form is model-bound, live, resettable, and keeps search/limit.
- Query changes cancel stale loader requests through existing `useLoader`.
- Two ListViews with different namespaces stay independent.

## Done criteria

- [x] ListView search changes loader `context.query.search`
- [x] Filter Popover uses model-bound Form
- [x] Fixed `searchParameters` remain separate
- [x] Parent can control `ListView` and `Table` query state
- [x] Existing raw Table URL ownership still works
- [x] All verification commands exit 0

## STOP conditions

- Query schema cannot validate partial live filter state without changing schema
  semantics; report and keep schema validation submit-only.
- Resource and raw-table ListView branches need incompatible public query APIs.
- Fix requires importing a project adapter/store/RPC client into ListView.

## Maintenance notes

New filters should only add fields/defaults; they should not create a second
search-parameter channel. Keep pagination reset centralized to avoid each
control implementing it differently.
