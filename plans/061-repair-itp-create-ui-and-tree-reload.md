# Plan 061: Repair ITP create UI and tree reload

> **Implementation instructions**: Start only after Plans 055-058 and 060 are
> DONE. Keep all loading state in the ITP detail route. Reuse framework
> TreeTable and DialogForm. Do not modify framework source or add a cache,
> compatibility route, or local generic component. Update the plan index only
> after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat b0bf0c2..HEAD -- apps/web/src/routes/(authenticated)/quality/inspection-test-plans apps/api/src/routes/inspection-test-plans packages/is-vue-framework plans`

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/055-build-itp-api-contract.md`,
  `plans/056-build-itp-web-resource-and-form.md`,
  `plans/057-build-itp-project-tree.md`,
  `plans/058-add-framework-tree-table.md`,
  `plans/060-protect-itp-reads-and-leaf-work-items.md`
- **Category**: bug, UX
- **Planned at**: commit `b0bf0c2`, 2026-08-18

## Why this matters

The current Add action requests a route that does not exist, so the create
dialog never opens. The route also uses a query loader for one complete project
tree, then tries to refresh it after writes. That cache is not the ITP resource
cache. TreeTable loader metadata is bound to record identity, so a reused query
record can render with depth zero until a full page reload.

The route needs a simple rule: fetch the tree on route load, replace the rows
after each successful write, and give each leaf one Add action. The Add dialog
selects a missing ITP stage, as the legacy `Tahapan ITP` radio does.

## Current state

- The server registers `GET /inspection-test-plans/template?projectId=<id>`.
  The local API returns `401` for that path without a session and `404` for
  `/inspection-test-plans/template/template`.
- `itp.actions.ts:9-14` calls the duplicate client path. Its unit test mocks
  that same wrong shape.
- `detail.route.vue:19-29` passes `loadTreeRows` and a custom namespace to
  TreeTable, then calls `table.refresh()` after create, update, and delete.
- `TreeTable.vue` supports direct `data`. Only its `load` path stores tree
  metadata in an object-reference map. This plan uses `data`, so no framework
  change is needed.
- The current three Material/Process/Product buttons choose a type before the
  dialog. The static type radio still exposes all types and can select an
  already-used type. The legacy uses one Add button and its `Tahapan ITP` radio.

## Reuse requirement

**Reused**: `TreeTable` with direct `data`, `DialogForm`, `Detail`, framework
`Button`, `Card`, `Dialog`, and existing route-local `ItpInspectorGrid`.

**Searched**: `TreeTable.vue`, `DialogForm.vue`, `Form.vue`, the ITP resource,
the Work Items direct-load route, and the legacy ITP editor.

**Gap**: none. TreeTable direct-data mode and DialogForm field input already
fit this route. Do not change the framework identity map in this plan.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| ITP web tests | `pnpm --filter @southneuhof/framework-web test -- inspection-test-plans` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API contract check | `curl -i http://127.0.0.1:3000/inspection-test-plans/template` | unauthenticated `401` when local API runs |
| Whitespace check | `git diff --check` | no output |

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/itp.actions.ts`
- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/itp.actions.spec.ts`
- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/[projectId]/detail.route.vue`
- focused ITP tests only when they prove the corrected client boundary
- `plans/README.md` status only after review

**Out of scope**:

- API path registration, database schema, type values, permissions, seed data,
  and project creation behavior.
- `packages/is-vue-framework`, including TreeTable metadata behavior.
- The Work Items route, native tables, legacy import/export, and a general
  application cache or invalidation helper.

## Steps

### Step 1: Call the registered template endpoint

Change the template endpoint type and call in `itp.actions.ts` to use the
single `/inspection-test-plans/template` route. Update the action test mock to
the same direct client branch and retain its request query assertion.

If the generated Hono client type does not expose the direct branch, use one
narrow local type assertion around this call only. It must still produce the
single runtime path. Do not change the server route to accept the duplicate
path and do not change shared RPC or framework code.

**Verify**: the focused action test proves the query is
`{ projectId: 'project-1' }`; browser network inspection has no duplicate
`template/template` request.

### Step 2: Use direct route-owned tree state

In the ITP detail route, replace the table ref, `loadTreeRows`, custom
namespace, and `refreshTree` with these route-owned values:

- `treeRows`, initially an empty ITP tree;
- `treeLoading`;
- one `reloadTree()` function that awaits `loadItpTree(projectId)`, builds the
  tree, replaces `treeRows`, and reports a normalized error once; and
- `onMounted(() => void reloadTree())`.

Pass `:data="treeRows"` and `:loading="treeLoading"` to TreeTable. Do not pass
`load` or `namespace`. After each successful create, update, or delete, await
the same `reloadTree()` before closing the dialog and showing its success toast.
Keep the current error behavior: a failed write leaves the dialog open.

This is one project-sized fetch on route load and after mutations. Do not add
TanStack Query keys, manual invalidation, optimistic records, or a new store.

**Verify**: a load and each successful mutation issue one tree request; a
reload keeps tree indentation and connectors without a browser refresh.

### Step 3: Restore the legacy Add and stage choice flow

Replace the three per-type buttons with one leaf-only **Add** action. On click,
load the master template, store the leaf's `availableTypes`, set the first
available type as the draft value, and open the existing DialogForm. Do not
open a second dialog.

Pass a route-local form-field list to DialogForm. It must replace only the
`type` field source and label with `Tahapan ITP`:

- create: only the selected leaf's `availableTypes`;
- update: the plan's current type plus its leaf's missing types.

The server remains the final duplicate guard. Do not hide the type field, add
new type fields, or let the radio offer an occupied type.

**Verify**: a leaf with no ITP offers all three stages; a leaf with Material
offers Process and Product; an existing Material ITP can keep Material or move
only to an unused stage; non-leaves show no Add action.

### Step 4: Run the real ITP workflow

Use the in-app browser with an authenticated project user who has
`view-projects` and the needed ITP write permission. Select a project with a
nested work-item tree. Check:

1. the initial tree fetch has the one registered path;
2. Add opens the existing DialogForm;
3. the `Tahapan ITP` radio contains only allowed stages;
4. create, edit, and delete each reload the displayed tree once;
5. indentation and connectors remain after every reload; and
6. a failed create keeps the dialog and its values.

If an in-app browser cannot reach the local preview after a valid retry, record
the exact limitation and mark the plan `BLOCKED`; do not claim completion or
replace this check with a browser tool outside the project preview.

## Test plan

Keep the existing action-boundary test and change it to the real path. Keep the
ITP tree helper tests for leaf/type availability. Do not add a large DOM mock
of TreeTable or DialogForm; the browser flow verifies their composition.

## Done criteria

- [ ] Add calls `/inspection-test-plans/template` once and opens DialogForm.
- [ ] No `/template/template` endpoint or request remains.
- [ ] Tree data loads on route mount and reloads directly after writes.
- [ ] The ITP route has no query namespace, table refresh ref, or cache
  invalidation code.
- [ ] One Add action uses a `Tahapan ITP` radio with only permitted stages.
- [ ] Tree indentation and connectors remain correct after reload.
- [ ] Focused tests, web type check, lint, whitespace check, and real browser
  flow pass.
- [ ] Framework files are unchanged; the implementation report repeats the
  Reused, Searched, and Gap record above.

## STOP conditions

- The single template path is not registered by the API.
- The route cannot pass direct data and loading state to the current TreeTable.
- Dynamic field source needs a framework change.
- The corrected read policy from Plan 060 blocks the intended ITP user role.
- Browser verification needs production data or an external action.

## Maintenance notes

The direct reload is intentional. Add a shared cache only when more than one
screen needs synchronized ITP tree data and that need is measured.
