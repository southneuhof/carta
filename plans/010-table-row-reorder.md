# Plan 010: Add mutually exclusive row reordering with vuedraggable

> **Implementation instructions**: Reorder mode must automatically remove
> pagination and sorting. Do not combine ambiguous modes.
>
> **Drift check (run first)**:
> `git diff --stat aaec97a..HEAD -- packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/contracts/components.ts packages/is-vue-framework/src/contracts/resource.ts packages/is-vue-framework/src/resources/defineResource.ts packages/is-vue-framework/package.json`
> plus working-tree diff.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — row identity/order can be corrupted by reloads
- **Execution**: DONE — 2026-07-28
- **Depends on**: `plans/007-list-query-search-filter.md`,
  `plans/009-table-column-preferences.md`
- **Category**: direction
- **Planned at**: commit `aaec97a`, 2026-07-28

## Why this matters

Some resources have meaningful manual order. `vuedraggable` is already a direct
package dependency, but core Table has no reorder contract. Pagination and sort
must be disabled automatically because page-local or sorted drag order has no
unambiguous global meaning.

## Current state

- `Table.vue:49` derives rows directly from loader data.
- TanStack consumes `rows.value`; no local ordered copy exists.
- Existing row IDs default to TanStack index IDs, unsafe across reorders.
- `vuedraggable@4.1.0` is installed.
- Resource definitions already expose an identity extractor internally.

## Target API

```vue
<Table
  reorderable
  :row-key="record => record.id"
  @row-reorder="persistOrder"
/>
```

Payload:

```ts
{
  rows,
  oldIndex,
  newIndex,
  moved,
  query
}
```

Table emits; application/resource integration persists. Table performs no
hidden request.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Target tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/core/__tests__/table.spec.ts` | exit 0 |
| Resource tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/resources/__tests__/resources.spec.ts` | exit 0 |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |

## Scope

**In scope**

- Table/component/resource contracts
- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts`
- Relevant tests

**Out of scope**

- Backend reorder endpoint or optimistic mutation
- Dragging columns
- Cross-table drag/drop
- Reordering a paginated or sorted subset

## Steps

### 1. Define reorder contract and stable identity

Add `reorderable?: boolean` and required-at-runtime `rowKey` when enabled:
string key or extractor returning string/number. Add typed `row-reorder`
payload. Development error if reorder is enabled without a valid unique key or
duplicate keys occur.

Allow resource table arguments to request reorder; when used through a resource,
inject its existing identity extractor as default row key.

**Verify**: raw and resource type/tests cover identity paths and errors.

### 2. Make modes mutually exclusive

When reorderable:

- hide pagination and page-size control
- disable sorting handlers/affordances regardless of field metadata
- remove `page`, `limit`, `sort_by`, and `sort` from effective loader query
- preserve user search/filter query keys
- emit normalized query if stale forbidden keys were externally supplied

No giant sentinel limit such as 9999. Loader contract must return complete
ordered result for reorder mode. Document this.

**Verify**: loader receives search/filter but none of four forbidden keys;
pagination nav and sortable header buttons are absent.

### 3. Render rows through vuedraggable

Maintain a local ordered copy synchronized when loader/data source changes.
Use `vuedraggable` with semantic `tbody` tag/item rendering supported by
version 4. Preserve cell slots, row action slots, click behavior, state-layer
CSS, visibility, and sizes.

Use stable item key from rowKey. After drag end/change, update local rows once
and emit complete payload with original record references.

**Verify**: simulated drag yields expected order, indices, moved record, query,
and record identity.

### 4. Handle reload and failure boundaries

Incoming data replacement is authoritative and resets local order. Emitting does
not mutate caller-owned `data` array. Reorder handler rejection is caller-owned;
Table stays at emitted local order until refreshed or parent data changes.

**Verify**: parent array remains unchanged; replacement rows resynchronize.

## Test plan

- Reorder mode hides pagination and sorting
- Effective loader query omits pagination/sort keys but keeps filters
- Missing/duplicate row identity errors
- Drag event payload and original references
- Parent data immutability
- Loader replacement resynchronization
- Existing row click/action and visibility behavior under draggable tbody

## Done criteria

- [x] Uses installed `vuedraggable`
- [x] Pagination and sorting cannot coexist with reorder mode
- [x] Stable row key required
- [x] Emits reorder context; performs no network mutation
- [x] All verification commands exit 0

## STOP conditions

- `vuedraggable` v4 cannot produce valid table markup with current slot shape.
- Disabling pagination would silently truncate an existing backend loader; report
  required loader contract change rather than inventing a limit.
- Resource identity can be composite and vuedraggable rejects it; serialize with
  existing stable-value helper only if tests prove collision-free, otherwise
  stop.

## Maintenance notes

Backend persistence should accept stable identities and final sequence, not
trust visible indices alone. Sorting later added to reorderable screens must be
rejected at contract level.
