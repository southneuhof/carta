# Plan 055: Build the ITP database and API contract

> **Implementation instructions**: Implement this plan before plans 056 and
> 057. Run every verification command. If a STOP condition occurs, report it;
> do not change the framework or expand the approved scope. Update this plan's
> status row in `plans/README.md` after review.
>
> **Drift check (run first)**: `git diff --stat b0bf0c2..HEAD -- apps/api/src apps/api/drizzle docs/superpowers/specs/2026-08-18-itp-setup-design.md`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `b0bf0c2`, 2026-08-18

## Why this matters

ITP needs one reliable source for its tree, master data, and writes. The legacy
system lets duplicate rows and accepts a missing frequency at the API boundary.
This API replaces those weak rules with one transaction, project-scope checks,
and database constraints. It must not migrate legacy records or add Quality
Inspection, Excel, or master-data CRUD.

## Current state

- The approved contract is `docs/superpowers/specs/2026-08-18-itp-setup-design.md`.
  It requires Material, Process, and Product rows for leaf work items; six
  stable point codes; five stable inspector-type codes; soft delete; and one
  active `(workItemId, type)` row.
- Legacy evidence is
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/work-item-itp/layouts/WorkItemITPDetailUnder.vue:63-99`,
  which uses the retained fields and a required number input, and
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S18InspectionPoinSeeder.php:17-51`
  plus `S19InspectorTypesSeeder.php:17-45`, which define the approved labels.
- `apps/api/src/routes/work-items/work-items.ts:184-220` is the nearest
  scoped recursive-tree route. Do not change it: this slice owns a separate
  ITP tree endpoint.
- `apps/api/src/authorization.ts:125-227` provides `requireProjectCoverage`,
  `requireProjectRecord`, and `allowedProjectOperations`. Use them. The
  `apps/api/src/routes/qhsse-pts/` module is the transaction and test example.
- `apps/api/scripts/seed.ts` seeds catalog data with idempotent upserts. Add
  only the fixed ITP master records there.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Generate migration | `pnpm --filter @southneuhof/api db:generate` | one new `apps/api/drizzle/*` migration |
| API tests | `pnpm --filter @southneuhof/api test -- inspection-test-plans` | exit 0 |
| Type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/api lint` | exit 0 |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `apps/api/src/routes/inspection-test-plans/` (new entity, schemas, service,
  routes, and module composition)
- `apps/api/src/routes/index.ts`
- `apps/api/src/authorization/catalog.ts`
- `apps/api/scripts/seed.ts`
- `apps/api/src/__tests__/inspection-test-plans.spec.ts` (new)
- one generated migration directory in `apps/api/drizzle/`

**Out of scope**:

- `apps/web`, `packages/is-vue-framework`, and the existing Work Items route.
- Quality Inspection runtime, imports, exports, legacy-data migration, and
  Inspector Type or Inspection Point CRUD.
- Compatibility endpoints, a generic tree abstraction, or a generic nested
  resource abstraction.

## Required contract

Create a new `/inspection-test-plans` API module. Use `inspectionTestPlans`
for the main table, `inspectionTestPlanInspectorTypes` for child inspector
records, and `inspectionTestPlanInspectorPoints` for selected-point rows.
Use these fixed master tables: `itpInspectorTypes` and `itpInspectionPoints`.

The main record has `id`, `workItemId`, `type`, nullable `criteria`,
`procedureCode`, `specification`, `method`, `imgDocumentation`, `description`,
required `frequency`, audit fields, and `active`. Do not add `projectId`,
`material`, or `product` columns.

Use these database guards:

- a partial unique index on `(work_item_id, type)` where `active = true`;
- unique `(inspection_test_plan_id, inspector_type_id)`;
- unique `(inspection_test_plan_inspector_type_id, inspection_point_code)`;
- foreign keys with cascade from the ITP row to its children; and
- normal foreign keys from children to their master data.

Seed active values idempotently: Inspector Types `SC/SubCon`, `HK/HK`,
`CONS/Konsultan`, `OWN/Owner`, and `AUTH/Authority`; Inspection Points
`P/Perform`, `R/Record`, `W/Witness`, `SW/Spot Witness`, `S/Surveillance`, and
`H/Hold Point`.

The write payload is the ITP fields plus an `inspectors` grid. Each grid entry
uses `inspectorTypeId` and a list of `{ inspectionPointCode, value }`. The
server requires an entry for every currently active inspector type and point;
all `value` fields may be `false`. This makes the template and saved grid have
one contract. The response returns the saved ITP record and grid.

Expose:

- `GET /inspection-test-plans/template?projectId=<id>` — active master grid;
- `GET /inspection-test-plans/project/:projectId/tree` — the complete active
  work-item hierarchy plus active ITP rows, leaf state, available ITP types,
  and per-row allowed operations;
- `POST /inspection-test-plans` — create;
- `GET /inspection-test-plans/:id` — detail with grid;
- `PATCH /inspection-test-plans/:id` — update; and
- `DELETE /inspection-test-plans/:id` — soft delete.

`template` and `tree` require project coverage. The normal project list remains
the existing `/projects/list` resource. Add only the project permissions
`create-work-item-itp`, `update-work-item-itp`, and `delete-work-item-itp` to
one project-realm ITP module in the authorization catalog. Read routes rely on
existing project coverage and existing project/work-item read grants.

## Steps

### Step 1: Add the tables, schemas, seed records, catalog entries, and migration

Follow the entity layout in `apps/api/src/routes/qhsse-pts/qhsse-pts.entity.ts`.
Use `text` UUID primary keys, audit columns, `boolean('active')`, and a Drizzle
partial `uniqueIndex`, as in `apps/api/src/routes/roles/roles.entity.ts:86-88`.
Define Zod create/update schemas separately from the raw entity schema so
`type` is exactly `material | process | product`, `frequency` is an integer
with minimum one, `description` has a maximum of 255, and the image is a
retained upload reference. Generate one migration; do not hand-edit it.

**Verify**: run `pnpm --filter @southneuhof/api db:generate`. Inspect its SQL
for both unique child constraints and the active main-row partial index.

### Step 2: Implement template, reads, and project checks

Build the template from active master rows only, ordered by the seeded codes.
Build the ITP tree in the new module, not in `workItemTree`. Read every active
work item for one covered project, make its hierarchy, attach active ITP rows
to leaf nodes, and calculate the missing type values from the server result.
Return `allowedOperations` on each ITP row from the three ITP permissions.

Detail must return the full active child grid, including unchecked points. A
request outside coverage and an ITP ID outside coverage both return not found.

**Verify**: focused tests prove nested tree shape, leaf state, active type
availability, inactive row omission, template labels/codes, and hidden
cross-project records.

### Step 3: Implement transactional create and update

In one transaction, lock or read the target work item, verify project coverage
and the operation permission, verify that it is active and has no active child,
then validate the active master grid. Reject unknown, inactive, duplicate, and
incomplete inspector/type/point input. Insert or upsert the ITP row and its
complete active grid. Re-read and return the saved detail shape.

For update, load and lock the existing active ITP row first. It keeps its work
item; do not accept a new `workItemId`. A type change checks the destination
type and lets the partial unique index win races. Translate its uniqueness error
to a clear conflict response. Keep all point values editable on update.

**Verify**: focused tests cover missing/zero/negative/decimal frequency,
non-leaf and wrong-project work items, inactive masters, no checked points,
duplicate creates, conflicting type changes, and one successful full-grid
update.

### Step 4: Implement soft delete and register the module

`DELETE` requires the delete permission and writes `active = false`, updater,
and updated time. It must not hard-delete the parent or child audit rows. A
later create of the same work item and type must succeed. Register the domain
and model in both arrays in `apps/api/src/routes/index.ts`, following
`apps/api/AGENTS.md`.

**Verify**: the focused test proves delete hides the row from tree/detail,
preserves child rows, and permits the replacement create. Run the full command
set in “Commands you will need”.

## Test plan

Use one integration spec following `apps/api/src/__tests__/qhsse-pts.spec.ts`.
Test only the domain boundaries: seeded template, coverage and permission,
leaf-only ownership, frequency, inactive masters, point editing, unique main
row/type, unique children, soft delete/recreate, and tree visibility. Use a
single fixture with a parent and leaf work item. Do not test each column or
duplicate Zod library tests.

## Done criteria

- [ ] Migration defines all five tables and the three required uniqueness guards.
- [ ] Seed is idempotent and uses the exact legacy labels and stable codes.
- [ ] Tree, template, detail, create, update, and soft delete are registered.
- [ ] All writes enforce coverage, leaf ownership, permissions, active masters,
  frequency, and duplicate conflict rules in a transaction.
- [ ] No `projectId`, `material`, `product`, QI, import, export, or migration
  behavior is added.
- [ ] Focused tests, type check, lint, and diff check pass.

## STOP conditions

- The current API cannot express a partial unique index or transaction lock.
- A route needs a new framework feature or a change to the Work Items module.
- The approved image adapter accepts a value other than a retained upload and
  the API cannot validate it with current code.
- The requested API shape must expose master-data CRUD or a legacy-data path.

## Maintenance notes

Later import/export must use the same three type values, stable codes, and one
active row/type rule. Any future master-data editor must preserve those codes;
it must not rewrite old child references.
