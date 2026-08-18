# Plan 059: Render Work Items with the framework TreeTable

> **Implementation instructions**: Follow this plan in order. Run each check.
> If a STOP condition occurs, stop and report. After implementation and review,
> update this plan's status in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b0bf0c2..HEAD -- apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue apps/web/src/routes/(authenticated)/master-data/work-items/work-items.actions.ts apps/web/src/routes/(authenticated)/master-data/work-items/work-items.resource.ts packages/is-vue-framework/src/components/core/TreeTable.vue`.
> If an in-scope file changed, compare it with this plan before editing.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/058-add-framework-tree-table.md`
- **Category**: tech-debt
- **Planned at**: commit `b0bf0c2`, 2026-08-18

## Why this matters

Work Items is the first consumer of the framework tree table. It currently
owns a second native table plus local flattening and connector geometry.
Replacing that code with `TreeTable` removes the framework-gap exception but
keeps the data source, permission checks, form variants, dialog behavior,
mutation messages, action labels, and visible columns.

The route still owns division/project selection, loading, dialogs, confirmation,
toasts, and refresh after mutations. `TreeTable` only renders the complete
nested records from the existing custom action.

## Current state

- `apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue`
  owns the screen. Its raw table is at lines 141-208; its `rows` computed
  at lines 34-57 flattens and calculates connector segments.
- `work-items.actions.ts:9-24` defines the tree payload, including
  `children: WorkItemTreeNode[]`.
- `work-items.resource.ts` owns standard record fields. Its list fields read
  nested relations, but this tree endpoint returns `categoryName` and
  `uomName`. The route needs tree-specific display fields.
- The only use of local flat rows outside markup is the edit form context at
  `index.route.vue:63-75`.

```ts
// apps/web/src/routes/(authenticated)/master-data/work-items/work-items.actions.ts:9-24
export type WorkItemTreeNode = {
  id: string
  projectId: string
  parentId: string | null
  level: number
  name: string
  categoryName: string | null
  volume: string | null
  uomName: string | null
  isHighRisk: boolean
  haveMaterialItp: boolean | null
  haveProcessItp: boolean | null
  haveProductsItp: boolean | null
  children: WorkItemTreeNode[]
}
```

```ts
// apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue:34-42
const rows = computed<TreeRow[]>(() => {
  const flat: FlatTreeRow[] = []
  const flatten = (items: WorkItemTreeNode[], depth = 0) => items.forEach((item, index) => {
    const rowIndex = flat.length
    flat.push({ ...item, depth, isLast: index === items.length - 1, lines: [], rowIndex, subtreeEnd: rowIndex })
    flatten(item.children, depth + 1)
    flat[rowIndex].subtreeEnd = flat.length - 1
  })
  flatten(nodes.value)
  // local interval and connector calculation follows
})
```

Route ownership and core presentation ownership are fixed by
`docs/architecture/web-application-architecture.md:14-22`. The web reuse
policy in `AGENTS.md` requires a framework custom-collection surface rather
than a route-local table.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework prerequisite | `pnpm --filter @southneuhof/is-vue-framework test -- TreeTable` | Plan 058 tests pass. |
| Work Items focused tests | `pnpm --filter @southneuhof/framework-web test -- work-items` | Existing Work Items tests pass. |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0. |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | Exit 0. |
| Whitespace check | `git diff --check` | Exit 0 with no output. |

## Suggested implementation toolkit

- Use `web-ui-surface-reuse`. Required reuse record:
  **Reused:** `TreeTable`; **Searched:**
  `packages/is-vue-framework/src/components/core/{Table,TableContent,TreeTable}.vue`
  and the Work Items route; **Gap:** none after plan 058.
- Apply Vue named slots from plan 058. Do not add React composition mechanics.
- Read the completed plan 058 before starting.

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue`
- `plans/README.md` (status only after review)

**Out of scope**:

- `work-items.actions.ts`, `work-items.schema.ts`, and
  `work-items.resource.ts`.
- Work Items API, database, permissions, and payload shape.
- Inspection & Test Plans. It has union rows and route-owned expansion, which
  are not in the Work Items record-only contract.
- Labels, form layout, messages, confirmation text, action permissions, ITP
  values, or new tree behavior.

## Git workflow

Use the operator's current branch. Do not push or commit without direction. If a
commit is requested, use `refactor(work-items): use tree table`.

## Steps

### Step 1: Remove route-local tree presentation state

In `index.route.vue`, import `TreeTable` with the current framework imports.
Delete `TreeLine`, `TreeRow`, `FlatTreeRow`, and the `rows` computed.
Keep `nodes` as the route-owned `ref<WorkItemTreeNode[]>([])`.

Replace the edit-time flat-row lookup with one small recursive function that
finds the original node by ID in `nodes.value`. Continue to select
`variant: record?.parentId ? 'child' : 'root'`. Do not create a generic tree
utility for one route call.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` exits 0.

### Step 2: Define the route tree fields

Add a route-local `treeFields` constant for `WorkItemTreeNode`. Preserve
the exact current order and labels:

1. `name` — Work item;
2. `categoryName` — Category;
3. `volume` — Volume, right aligned and using the current `volume()` helper;
4. `uomName` — UOM;
5. `isHighRisk` — High Risk;
6. `haveMaterialItp` — Material ITP;
7. `haveProcessItp` — Process ITP;
8. `haveProductsItp` — Products ITP.

Keep `Chip` and `Icon` output in named cell slots. Use `tree-cell` only
for the existing root-row medium weight. Let `TreeTable` own indentation and
connectors. Do not add technical fields or change the resource field catalog.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` exits 0.

### Step 3: Replace the native table only

Keep the existing Card header, Add Root button, and route loading status.
Replace the native-table block and its framework-gap comment with one
`TreeTable` that receives:

- `:data="nodes"`;
- `:fields="treeFields"`;
- a children function that returns each record's `children`;
- `tree-column="name"`;
- `:pagination="false"`, because the action returns one complete project tree;
- `row-key="id"`.

Move existing cell presentation into `tree-cell` and `cell:*` slots. Move
the unchanged Add Child, Edit, and Delete controls to `row-actions`. Keep
permission conditions, click behavior, and accessible labels exactly as they
are.

Delete raw `table`, `thead`, `tbody`, manual depth spacers, connector
spans, sticky action classes, and the framework-gap comment. Do not alter the
manual route loading state; it remains owned by the route.

**Verify**: `pnpm --filter @southneuhof/framework-web lint:check` exits 0.

### Step 4: Check the real route

Run the focused tests. Start the web app with `pnpm dev:web`. In the
authenticated browser, select a division and a project with root and child Work
Items. Check:

- parents are before children, with correct indentation and connectors;
- all eight columns retain their prior labels and values;
- a wide table scrolls horizontally and action controls remain visible;
- Add Root, Add Child, Edit, and Delete keep the same dialogs/confirmation and
  refresh the tree after a successful mutation;
- an empty project uses the framework empty state, and loading uses the current
  route loading status.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test -- TreeTable
pnpm --filter @southneuhof/framework-web test -- work-items
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web lint:check
git diff --check
```

Expected: all commands exit 0; the whitespace check has no output. If the full
web suite is run, record a pre-existing plan 051 failure separately; do not
change baseline code here.

## Test plan

Do not add a brittle route DOM test that duplicates the framework component
contract. Plan 058 tests TreeTable behavior. Keep and run
`work-items.actions.spec.ts` and `work-items.resource.spec.ts`; use the real
route check for route-owned loading, dialogs, actions, and refresh.

## Done criteria

- [ ] The Work Items route has no raw table markup or framework-gap comment.
- [ ] It uses TreeTable with the current nested nodes, children function,
  tree column name, stable row key, and disabled pagination.
- [ ] All columns and Create/Edit/Delete behaviors remain.
- [ ] Resource and API files are unchanged.
- [ ] Focused framework and Work Items checks, web type check, lint, and
  whitespace check pass.
- [ ] A real authenticated check confirms tree rendering and actions.
- [ ] No file outside Scope changed.
- [ ] The plan index is updated after review.

## STOP conditions

- Plan 058 is not DONE or its public API differs from this plan.
- The response no longer returns complete recursive children.
- Keeping current actions needs a file outside Scope.
- The accepted screen needs collapse/expand, pagination, sorting, or another
  row shape.
- A required column value is absent from WorkItemTreeNode.
- A check fails twice after a localized fix.

## Maintenance notes

The route-local fields are intentional because this custom endpoint returns
display names, not the standard resource's relation objects. If Inspection &
Test Plans later adopts TreeTable, design its union-row and controlled-expansion
requirements first; do not force it into this smaller contract.

