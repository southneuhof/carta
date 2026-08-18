# Plan 058: Add a framework TreeTable for nested records

> **Implementation instructions**: Follow this plan in order. Run each check.
> If a STOP condition occurs, stop and report. After implementation and review,
> update this plan's status in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b0bf0c2..HEAD -- packages/is-vue-framework/src/contracts/components.ts packages/is-vue-framework/src/contracts/index.ts packages/is-vue-framework/src/components/core packages/is-vue-framework/src/index.ts`.
> If an in-scope file changed, compare it with this plan before editing.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `b0bf0c2`, 2026-08-18

## Why this matters

The framework has a general `Table`, but no nested-record contract. Work Items
therefore owns a native table, flattening, and connector layout. A distinct
`TreeTable` can reuse all normal table behavior and supply only nested-record
presentation. Do not add a `tree` mode or boolean flags to `Table`.

This is Vue 3. Apply composition guidance through a separate component and
named slots. Do not use React providers, render props, `use()`, or
`forwardRef`. Do not add collapse state: the required first consumer displays
the supplied complete tree.

## Current state

- `packages/is-vue-framework/src/components/core/Table.vue` wraps
  `Collection`, forwards table props and every slot, and exposes `refresh`
  and query state.
- `packages/is-vue-framework/src/components/core/TableContent.vue` owns the
  semantic table, loading/error/empty states, columns, cell rendering, row
  actions, sizing, and pagination.
- `packages/is-vue-framework/src/contracts/components.ts:51-76` defines
  `TableProps` and `TableContentProps`; the contract export chain is
  `contracts/index.ts`, `components/core/index.ts`, and `src/index.ts`.
- `apps/web/src/routes/(authenticated)/master-data/work-items/work-items.actions.ts:9-24`
  exposes the first input shape, including `children: WorkItemTreeNode[]`.
  Do not change that application route in this plan.

The core split is intentional:

```ts
// packages/is-vue-framework/src/components/core/Table.vue:70-100
<Collection ref="collectionRef" v-bind="collectionProps">
  <template #default="collection">
    <TableContent
      :fields="props.fields"
      :records="collection.records"
      :loading="collection.loading"
      :error="collection.error"
      :empty="collection.empty"
      :query="collection.query"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps" :key="name">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
    </TableContent>
  </template>
</Collection>
```

```ts
// packages/is-vue-framework/src/contracts/components.ts:51-64
export interface TableProps<TRecord extends object, TQuery extends object>
  extends CollectionProps<TRecord, TQuery> {
  fields: FieldsInput<TRecord>
  minColumnWidth?: number
  visibleColumns?: readonly string[]
  columnSizing?: Readonly<Record<string, number>>
  rowKey?: string | ((record: TRecord) => string | number)
  schema?: ValidationSchema<TQuery>
}
```

Framework core only presents data; routes retain workflows
(`docs/architecture/web-application-architecture.md:14-22`). The framework
uses `script setup` generics, `withDefaults`, explicit emits,
`defineExpose`, and named-slot forwarding. Copy the test style from
`components/core/__tests__/table.spec.ts` and
`components/core/__tests__/Table.browser.spec.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework type check | `pnpm --filter @southneuhof/is-vue-framework type-check` | Exit 0. |
| Focused unit test | `pnpm --filter @southneuhof/is-vue-framework test -- TreeTable` | TreeTable tests pass. |
| Focused browser test | `pnpm --filter @southneuhof/is-vue-framework test:browser -- TreeTable` | TreeTable browser tests pass. |
| Full framework unit suite | `pnpm --filter @southneuhof/is-vue-framework test` | All framework unit tests pass. |
| Whitespace check | `git diff --check` | Exit 0 with no output. |

## Suggested implementation toolkit

- Use `vercel-composition-patterns` as architecture guidance only. In Vue,
  use a distinct component and named slots; skip all React-specific mechanics.
- Read `AGENTS.md`, `docs/architecture/web-application-architecture.md`,
  and `packages/is-vue-framework/README.md` before edits.
- Reuse `Table` and `TableContent`; do not copy either implementation.

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/contracts/index.ts`
- `packages/is-vue-framework/src/components/core/TreeTable.vue` (new)
- `packages/is-vue-framework/src/components/core/index.ts`
- `packages/is-vue-framework/src/index.ts`
- `packages/is-vue-framework/src/components/core/__tests__/TreeTable.spec.ts` (new)
- `packages/is-vue-framework/src/components/core/__tests__/TreeTable.browser.spec.ts` (new)
- `plans/README.md` (status only after review)

**Out of scope**:

- `Table.vue` and `TableContent.vue`.
- All application routes and API payloads.
- Sorting policy, pagination policy, drag reordering, selection, lazy children,
  collapse/expand, and union rows.
- A tree flag or any tree-specific optional props on `Table`.

## Git workflow

Use the operator's current branch. Do not push or commit without direction. If a
commit is requested, use `feat(framework): add tree table`, consistent with
the recent scoped prefix style.

## Steps

### Step 1: Add the public contract

In `contracts/components.ts`, define
`TreeTableProps<TRecord, TQuery>` from `TableProps<TRecord, TQuery>`.
Remove `reorderable` from this contract. Add exactly these required props:

- `children: (record: TRecord) => readonly TRecord[]`;
- `treeColumn: string`, the field key that receives indentation and connectors.

Keep all other table props unchanged, including optional `rowKey`. Re-export
the type through `contracts/index.ts`.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework type-check` exits 0.

### Step 2: Compose the new component over Table

Create `components/core/TreeTable.vue` with the generic `script setup`
pattern from `Table.vue`. It must render the existing `Table`, not a new
native table or copied `TableContent`.

1. For `data`, flatten root records in preorder. For `load`, wrap the
   loader and flatten only returned `data`, preserving the rest of its result.
   Pass exactly one flattened source to `Table`.
2. Preserve original record objects. Store depth and ancestor/sibling
   connector metadata only in component-local state; do not clone or decorate
   application records.
3. Forward all ordinary `Table` props, emits, expose methods, and named
   slots. The selected tree-cell slot is reserved by the component.
4. Render indentation and vertical/horizontal connectors in that tree cell
   using semantic table content and existing Tailwind surface/outline tokens.
   Supply a `tree-cell` slot with value, original record, resolved field,
   index, depth, and connector metadata. Its fallback renders the normal value.
5. Leave non-tree cells, row actions, loading, errors, empty state, sizing,
   query events, pagination, and row clicks to `Table`.
6. Reject cyclic or repeated record identities with
   `[is-vue-framework] TreeTable children must form a tree.` rather than
   recurse without end.

Export `TreeTable` through both current component export files.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework type-check` exits 0.

### Step 3: Add focused component tests

Create `TreeTable.spec.ts`, using `mountCore` and `flush` from
`components/core/__tests__/harness.ts`. Use a three-level tree with two
siblings. Test:

- preorder display and original record identity in `tree-cell` and
  `row-actions`;
- depth and connector markers, including a non-final sibling branch;
- ordinary field cell slots, row click, loader refresh, loading, empty, and
  error state delegation;
- cyclic input rejection.

Create `TreeTable.browser.spec.ts` by adapting only the mount helper and the
pinned-row-action test from `Table.browser.spec.ts`. At a narrow width, check
that horizontal scrolling keeps action cells pinned and tree connector elements
stay in the tree cell. Do not duplicate the whole Table browser suite.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test -- TreeTable`
passes.

### Step 4: Review the boundary

Confirm the diff contains no change to `Table.vue` or `TableContent.vue`,
no React API, no tree boolean, no expansion state, no reorder support, and no
record mutation.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test:browser -- TreeTable
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework type-check
git diff --check
```

Expected: each command exits 0; the whitespace check prints nothing.

## Test plan

Use the current Table unit and browser specifications as the structural model.
Cover preorder, identity, connector geometry, standard-table delegation,
refresh, and cycle safety. No application test belongs in this framework-only
plan.

## Done criteria

- [ ] Root package export includes `TreeTable` and `TreeTableProps`.
- [ ] Nested data and nested loader data render in preorder with connectors in
  `treeColumn`.
- [ ] `Table.vue` and `TableContent.vue` are unchanged.
- [ ] No tree mode boolean, expansion API, reorder support, or record mutation
  exists.
- [ ] Focused and full framework checks pass.
- [ ] No file outside Scope changed.
- [ ] The plan index is updated after review.

## STOP conditions

- Table no longer owns collection lifecycle or named cell slots as described.
- The work needs `TableContent.vue` changes or an application renderer.
- The first consumer needs collapse/expand, lazy children, sorting, pagination,
  or moves.
- Vue slot forwarding cannot preserve original records without cloning.
- A check fails twice after a localized fix.

## Maintenance notes

Add controlled expansion only when two consumers need the same semantics. Do
not absorb union rows or arbitrary child content into this record-only component.
Reviewers should reject a copied table implementation; delegation to `Table`
is the maintenance constraint.

