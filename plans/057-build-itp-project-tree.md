# Plan 057: Build the ITP project list and tree workflow

> **Implementation instructions**: Start only after plans 055 and 056 are
> DONE. This is the final ITP user surface. Keep the data loader, tree state,
> dialogs, toasts, and refresh in this route. Update the plan index after
> implementation and review.
>
> **Drift check (run first)**: `git diff --stat b0bf0c2..HEAD -- apps/web/src apps/api/src/routes/inspection-test-plans apps/web/src/manifest packages/is-vue-framework`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/055-build-itp-api-contract.md`, `plans/056-build-itp-web-resource-and-form.md`
- **Category**: migration
- **Planned at**: commit `b0bf0c2`, 2026-08-18

## Why this matters

The legacy page is a project picker followed by a recursive work-item table
with ITP rows under each leaf. This route keeps that useful flow while avoiding
the legacy native table and unscoped client rules. It is also the acceptance
gate for leaf-only create, row-level permissions, type availability, and
post-write refresh.

## Current state

- The legacy flow is in
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/work-item-itp/work-item-itp.vue:9-27`
  and `layouts/WorkItemITPDetailUnder.vue:63-145`. It selects projects, shows
  the tree, permits leaf creates, and displays existing types beneath leaves.
- `apps/web/src/routes/(authenticated)/master-data/projects/index.route.vue`
  is the existing project `ListView` and controlled-query pattern. Reuse its
  project resource; do not create a second project model. Its API does not
  support legacy `startMonth`/`endMonth` values, so do not add them.
- `packages/is-vue-framework/src/components/core/Table.vue:1-103` forwards
  `cell:*` and `row-actions` slots. `TableContent.vue:358-404` supplies each
  cell record and the row-action slot. This is the approved tree rendering
  boundary.
- `apps/web/src/manifest/navigation.ts:3-6` is the single Quality navigation
  entry. Use `view-projects`, the same read grant as the project resource; ITP
  writes stay controlled by API-provided operations.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Web tests | `pnpm --filter @southneuhof/framework-web test -- inspection-test-plans` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test -- inspection-test-plans` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API lint | `pnpm --filter @southneuhof/api lint` | exit 0 |
| Root gate | `pnpm type-check && pnpm test` | exit 0 |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/index.route.vue`
- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/[projectId]/detail.route.vue`
- route-local tree helpers and focused tests under that directory
- `apps/web/src/manifest/navigation.ts` and its focused test
- generated route-type file only if the existing route generator changes it
- `plans/README.md` status updates

**Out of scope**:

- Framework `Table`, generic tree tables, custom global inputs, and the Work
  Items screen.
- API, database, permission catalog, and resource-form code from plans 055-056.
- Quality Inspection, Excel import/export, master-data administration, legacy
  data migration, and placeholders for them.

## Reuse requirement

**Reused**: `ListView`, existing `projects` resource, `Table`, `Detail`,
`DialogForm`, confirmation dialog, framework `Button`/`Icon`/`Card`, normal
image handling, and route-local form slots from plan 056.

**Searched**: `packages/is-vue-framework/src/components/core/Table.vue`,
`TableContent.vue`, `Form.vue`, `apps/web/src/routes/(authenticated)/master-data/projects/`,
`apps/web/src/routes/(authenticated)/quality/pts/`, and the ITP resource.

**Gap**: Framework `Table` has no tree-row contract. Keep expansion state,
flattening, connectors, and tree-cell display local to this one route. Add an
inline `framework-gap:` comment there. Do not change the framework.

## Steps

### Step 1: Add the project entry route and navigation

Create the Quality navigation entry “Inspection & Test Plan” pointing to
`quality-inspection-test-plans`, guarded by `view-projects`. Build the entry
route with `ListView v-bind="projects.list()"`, the existing project fields,
and one row action that navigates to the selected project detail. Use the
project resource's current filters only. Do not add the legacy month filter
because `projects.ts:listWhere` rejects unknown query keys.

**Verify**: focused route and manifest tests prove the entry is permission
guarded, list uses `projects.list()`, and a project action has the correct
detail route target.

### Step 2: Load and flatten the ITP tree locally

The detail route loads `GET /inspection-test-plans/project/:projectId/tree`
once through a route-owned loader. Keep a `Set` of expanded work-item IDs.
Flatten only expanded work-item children and insert every ITP row immediately
after its leaf parent. Give every table row a discriminant and stable unique key
so work-item and ITP rows cannot collide. A work-item record displays its name,
path/depth indentation, connector, and expand/collapse control; an ITP row
displays type, criteria, procedure code, specification, method, and frequency.

Pass the flattened rows to framework `Table` with `pagination="never"`, its
cell slots, and its row-actions slot. The table owns structure, loading/error/
empty presentation, columns, and actions. The route must not render a native
`<table>`.

**Verify**: unit tests prove collapsed and expanded flattening, parent-before-
child order, ITP rows below only leaf rows, stable keys, and no create action on
non-leaves.

### Step 3: Add create, view, update, and delete dialogs

Use the full template from plan 055 when opening a leaf create dialog. Hide the
create action for an ITP type that the tree says is occupied. Use one
`DialogForm` with plan 056 fields and `input:inspectors` slot. Use `Detail`
with the disabled grid slot for view. For edit, load ITP detail and use the
same DialogForm/grid; do not disable its points. Show row actions only from
the tree row's `allowedOperations`.

After each successful create/update/delete, await the standard resource action,
reload the route tree, close the dialog, and show one toast. On error keep the
dialog state and show the normalized server error. Delete uses the framework
confirmation dialog; API soft delete needs no client delete reason.

**Verify**: focused tests prove create-template load, type availability,
permission-driven visibility, editable update grid, all-false submit,
post-success tree reload, and failed-save behavior.

### Step 4: Run the final ITP gate and browser check

Use the in-app browser when a local preview is available. Sign in with the
documented local development account, select an accessible project, expand the
tree, create a leaf Material ITP with no selected points, edit a point, delete
it, and create the same type again. Verify no import, export, Quality
Inspection, or legacy migration control appears.

**Verify**: run all commands in “Commands you will need”; the browser flow
matches the acceptance criteria in the approved design.

## Test plan

Add focused tests for the project-row route target, tree flattening and unique
keys, leaf-only/type-available create actions, row permission actions,
template/create/edit grid wiring, soft-delete refresh, and the no-point case.
Do not snapshot table markup or re-test `Table` and `Form` internals.

## Done criteria

- [ ] Project entry reuses the current project resource and supported filters.
- [ ] The detail uses framework `Table`, not a native replacement.
- [ ] Tree expansion, indentation, connectors, and flattening are route-local.
- [ ] Only leaf rows offer missing types; existing ITP rows expose API-authorized
  view/edit/delete actions.
- [ ] Create and update use the full inspector grid; view is read-only.
- [ ] Successful writes refresh tree data; failed writes preserve dialog state.
- [ ] The deferred features are absent.
- [ ] Focused tests, root type/test gate, lint, diff check, and browser flow pass.
- [ ] Implementation report records Reused, Searched, and Gap exactly as above.

## STOP conditions

- Plan 055 does not return a full tree, availability, or row operations.
- Plan 056 cannot provide a reusable grid input slot.
- The route needs a native table, a new framework table feature, or a second
  project list model.
- Browser verification needs production data or an external action.

## Maintenance notes

Future import/export must call the same API writes or share their validation;
it must not create rows through a second tree or a bulk client-side grid.
