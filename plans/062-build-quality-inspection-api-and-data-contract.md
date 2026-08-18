# Plan 062: Build the Quality Inspection database and API contract

> **Implementation instructions**: Read this complete plan before editing. This
> plan is the database authority for plans 063 and 064. Run every verification
> command. Before any `apps/web` edit in this slice, invoke the **Web UI Surface
> Reuse** skill. If a STOP condition occurs, report it; do not add a framework
> change, Todo, notification, or compatibility behavior. Update this plan row
> in `plans/README.md` only after implementation and review.
>
> **Drift check (run first)**: `git diff --stat 77b7f49..HEAD -- apps/api/src apps/api/drizzle apps/web/src/routes/'(authenticated)'/quality/pts docs/superpowers/specs/2026-08-18-quality-inspection-design.md`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `77b7f49`, 2026-08-18

## Why this matters

Quality Inspection needs a durable report snapshot and an atomic rejection to
PTS boundary. Legacy creates Quality Inspection and PTS records, but it does
not preserve all history or prevent duplicate open PTS records. This contract
keeps the legacy flow, applies the approved guard rules, and gives the web
plans a fixed API.

## Current state

- The approved source is `docs/superpowers/specs/2026-08-18-quality-inspection-design.md`:
  lines 24-47 define the first slice and deferred Todo/notifications; lines
  79-100 define steps, statuses, and final results; lines 142-217 define the
  report, row, snapshot, and schedule rules; lines 225-246 define permissions;
  and lines 303-338 define the PTS boundary.
- `apps/api/src/routes/qhsse-pts/qhsse-pts.entity.ts:12-62` owns PTS. It now
  requires `criteriaCode`, `imgBefore`, and `location`, and has no QI source or
  open-QI-PTS uniqueness guard. Those fields must be nullable only in storage;
  the existing manual create schema stays required.
- `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts:142-165` is the current
  PTS number allocator. Reuse its number-config rules in a narrow PTS-owned
  server helper. Do not create a second generic number service.
- `apps/api/src/routes/inspection-test-plans/inspection-test-plans.entity.ts:31-75`
  provides active ITPs, inspector assignments, and point values to snapshot.
- `apps/api/src/routes/index.ts:42-62,100-102` registers every domain in both
  `domainParts` and `installedRoutes`. `apps/api/AGENTS.md` requires both.
- Legacy visible navigation uses **Inspection/Test**. Keep the approved module
  name `Quality Inspection` in the permission catalog, but use legacy labels
  in all returned UI labels and plan 063/064 screens.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Generate migration | `pnpm --filter @southneuhof/api db:generate` | one new migration |
| Focused QI tests | `pnpm --filter @southneuhof/api test -- quality-inspection` | exit 0 |
| PTS regression | `pnpm --filter @southneuhof/api test -- qhsse-pts` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| API lint | `pnpm --filter @southneuhof/api lint` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Invoke `ads-hk-module-slice` for the colocated module path.
- Invoke `build-resource-form` for the resource contract and fields.
- Before any web file is edited for this plan or a dependent plan, invoke
  `web-ui-surface-reuse`; read the web architecture, framework README, and the
  nearest PTS route. In the handoff report state `Reused`, `Searched`, and
  `Gap`.
- Read `packages/sprindle/docs/reference.md` before defining routes.

## Scope

**In scope**:

- `apps/api/src/routes/quality-inspection/` (new entity, schemas, service,
  routes, composition, and server-only query helpers)
- `apps/api/src/routes/qhsse-pts/{qhsse-pts.entity.ts,qhsse-pts.schemas.ts,qhsse-pts.service.ts,qhsse-pts.routes.ts,qhsse-pts.ts}`
- `apps/api/src/routes/{index.ts,roles/roles.entity.ts}` and
  `apps/api/src/authorization/catalog.ts`
- `apps/api/src/__tests__/{quality-inspection.spec.ts,qhsse-pts.spec.ts}`
- one generated migration in `apps/api/drizzle/`

**Out of scope**:

- Todo state, notification writes, notification permissions, and `qhsse-control-plan`.
- IBPRP fields, schedule configuration CRUD, legacy data migration, import,
  export, Inspector Type or Inspection Point administration.
- Framework source and a generic workflow, schedule, snapshot, or number
  abstraction.

## Required database contract

Create these exact tables in `quality-inspection.entity.ts`. Use text UUID IDs,
foreign keys, and the normal user/time audit convention. Generate the migration;
do not hand-write SQL.

| Table | Required columns and constraints |
|---|---|
| `work_item_schedule` | `id`, `project_id`, `work_item_id`, nullable `start_date`/`end_date`, `active`, audit. It is a read-only QI origin in this slice; `work_item_id` must be an active project root when used. |
| `quality_inspection_number_counters` | primary key `(project_id, year)`, `last_number`; a QI counter separate from PTS. Use active Number Config rows with `form_name = 'QI'`. |
| `quality_inspection` | `id`, `division_id`, `project_id`, unique `number`, required `target_date`, `quality_work_category_id` → PTS work category, `work_item_category_id` → Work Item root, nullable `location_zone`, `inspection_point_code` → ITP point code, `work_method`, nullable `schedule_id`, `schedule_start_date`, `schedule_end_date`, `status_code` default `open`, `step_code` default `report`, nullable `result_code`/`verification_description`, audit and soft-delete fields. |
| `quality_inspection_work_item_itp` | report ID, work-item ID, positive decimal `volume`, current `status_code` default `waiting`, nullable current `verification_description`, `verified_by`/`verified_at`, nullable `qhsse_pts_id`, audit. Unique `(quality_inspection_id, work_item_id)`. |
| `quality_inspection_work_item_itp_snapshot` | selected row ID, source ITP ID, copied `type`, `criteria`, `procedure_code`, `specification`, `method`, `frequency`, `img_documentation`, `description`, audit. Unique `(quality_inspection_work_item_itp_id, type)`. |
| `quality_inspection_work_item_itp_snapshot_inspector` | snapshot ID, copied `inspector_type_code` and `inspector_type_name`, audit. Unique `(snapshot_id, inspector_type_code)`. |
| `quality_inspection_work_item_itp_snapshot_point` | snapshot-inspector ID, copied `inspection_point_code`, `inspection_point_name`, boolean `value`, audit. Unique `(snapshot_inspector_id, inspection_point_code)`. |
| `quality_inspection_work_item_itp_verification` | selected row ID, `result_code` (`approved` or `rejected`), nullable `description`, verifier ID/time. Append only. |
| `quality_inspection_documentations` | report ID, `name`, nullable retained-upload `file_attachment`, nullable description, audit. Check name is exactly `sudut 1`, `sudut 2`, `sudut 3`, or `sudut 4`; unique `(quality_inspection_id, name)`. |
| `quality_inspection_verification` | report ID, result code (`approved`, `rejected`, `repair`, `pending`), nullable description, resulting status/step, verifier ID/time. Append only. |
| `quality_inspection_pts_rejection` | report ID, selected row ID, PTS ID, nullable note, rejecting user/time. Append only. |

Add to `qhsse_pts`: nullable `source`; make `criteria_code`, `img_before`, and
`location` nullable in storage; add a partial unique index on `(project_id,
work_item_id)` where `source = 'qi-report'`, `status_code <> 'close'`, and
`deleted_at IS NULL`. Do not add `rejected_notes`: the append-only QI rejection
event is the approved history source. Keep `source` server-owned and absent
from all public manual PTS write payloads.

## Required API and authorization contract

Register one Quality Inspection system module with `view-quality-inspection`
and `show-quality-inspection`, and one project workflow module with exactly:
`create-quality-inspection`, `update-quality-inspection`,
`delete-quality-inspection`, `complete-report-quality-inspection`,
`verify-quality-inspection-work-item-itp`,
`submit-quality-inspection-documentations`, and `verify-quality-inspection`.
Use the exact legacy codes. System list/detail gates also require covered project
records; project writes require the named code and covered record.

Expose only these endpoints:

- `GET /quality-inspection` and `GET /quality-inspection/:id`;
- `POST /quality-inspection`, `PATCH /quality-inspection/:id`, and `DELETE /quality-inspection/:id`;
- `GET /quality-inspection/create-context?projectId=<id>` for active tree,
  active ITP types, and owner lookup values;
- `GET /quality-inspection/schedules` for active scheduled work-item origins,
  plus `GET /quality-inspection/schedules/:id/create-context`;
- `POST /quality-inspection/:id/actions/complete-report`;
- `POST /quality-inspection/:id/work-items/:workItemRowId/actions/verify`;
- `POST /quality-inspection/:id/actions/submit-documentations`; and
- `POST /quality-inspection/:id/actions/verify`.

The scheduled create payload contains only `scheduleId`, `targetDate`,
`locationZone`, and selected rows. The service derives division, project,
quality category, root work-item category, and stored period from the active
schedule. Manual create has no `scheduleId` and supplies the normal report
fields. In both cases the service checks active division/project, matching
division, active root category owned by the selected quality category, active
leaf descendants, selected active ITP types, one or more types, and volume
greater than zero. Copy all snapshots in the creation transaction.

## Steps

### Step 1: Define tables, catalog entries, schemas, and migration

Implement the database contract above. Use database unique/check guards for
identity and the service for active/tree/state rules. Define specific Zod
schemas for report create/update, selected rows, report completion, item
verification, documentation submission, and final verification. Export only
read entity schemas where generic CRUD would expose server-owned data. Add the
two modules and exact permission codes to the catalog and register the domain
and model in both `routes/index.ts` arrays.

**Verify**: generate the migration. Inspect it for every listed table, child
unique constraint, four-name documentation check, and the QI PTS partial index.

### Step 2: Implement read and report-create transactions

Build one report-detail loader that returns current report data, immutable
snapshots, item and report events, linked PTS number/status, documentation,
and allowed operations. Exclude soft-deleted reports everywhere. Build the
tree from active project work items plus active ITPs; do not modify ITP or Work
Items routes. Build the schedule list only as a read-only QI entry point.

Create a QI number allocator by copying the small current PTS allocation rule
inside the QI service, with its own counter and `QI` form name. Do not extract a
shared number framework. Creation writes report, selected rows, full snapshot,
and activity log in one transaction. It does not write notifications or Todo.

**Verify**: focused test proves manual and schedule creates, rejected inactive/
non-leaf/non-descendant/type/volume input, exact snapshot copying, duplicate
row rejection, duplicate reports allowed, schedule period preserved, and
cross-project data hidden.

### Step 3: Implement the state machine and history

Use one transaction per action. Complete report requires active point code and
non-empty work method and moves to `complete-report`/`on-progress`. Item
verification accepts only `approved` or `rejected`, appends history, and after
the last result moves to `inspected` and inserts the four slots exactly once.
Documentation submit requires all four retained uploads and moves to
`submitted`/`on-progress`. Final verification at `submitted` applies the
approved description rules; `repair` resets all item current results to
`waiting` and returns the same record to `complete-report`; `pending` stays
submitted; the other two close. Append every report event; never update one.

`PATCH` and `DELETE` must fail after `report`. Snapshot rows are never editable.
All actions write activity logs, but no QI action writes notifications or Todo.

**Verify**: focused tests prove each allowed and denied transition, all four
documentation files, description rules, same-number repair, immutable events,
and update/delete guards.

### Step 4: Implement the narrow PTS integration

Keep PTS as the owner of PTS records. In `qhsse-pts.service.ts`, add an exported
server-only `createOrReuseQualityInspectionPts(tx, input)` helper and an action
`complete-qi-report`. The helper receives the QI transaction, locks the work
item, finds the unfinished QI-source PTS for that project/work item, and reuses
it. If absent it allocates a PTS number and inserts a `source = 'qi-report'`
record at `qi-report` step. On partial-unique conflict it re-reads and reuses.
It must not call PTS create routes or notification functions.

The QI rejected-item transaction calls this helper, saves the linked PTS ID,
and appends one QI rejection event with the optional note. It rolls back on any
PTS failure. Add PTS action code `complete-qi-report-qhsse-pts`; it is valid
only at `qi-report`, requires the current manual report-completion fields and
root causes, and moves to the normal PTS `report` step. Keep QI-derived
division/project/category/work item fixed. Record PTS activity but do not send
a notification for this transition; later existing PTS actions are unchanged.

**Verify**: QI and PTS tests prove atomic rollback, first create, same-row and
cross-report reuse, new PTS after close, repeated rejection events, server-only
source, and `complete-qi-report` validation and transition.

## Test plan

Add one integration spec based on `apps/api/src/__tests__/qhsse-pts.spec.ts`.
Use one project with a root category, leaves, active ITPs, schedule, and full
permissions. Test domain rules and transitions, not every schema field. Extend
the PTS spec only for the QI source helper and its new action.

## Done criteria

- [ ] The listed tables, keys, checks, and PTS partial index exist in one generated migration.
- [ ] API validates all trusts at the server boundary and snapshots ITP values atomically.
- [ ] Legacy step/result/permission codes are exact; legacy display labels remain available to web routes.
- [ ] QI-to-PTS creation/reuse and rejection history are atomic; manual PTS is still separate.
- [ ] No schedule CRUD, Todo, notification, IBPRP, legacy migration, or framework change exists.
- [ ] Focused tests, PTS regression, type check, lint, and diff check pass.

## STOP conditions

- The generated migration cannot express the partial unique index or check rule.
- Current Number Config data cannot generate a `QI` form name with the existing variables.
- A required response needs an ITP/Work Items API or framework modification rather than the local QI query.
- The plan requires storing or sending Todo or notification state.

## Maintenance notes

The schedule table is deliberately only a QI read origin. A later control-plan
slice owns schedule configuration. A later Todo/notification slice must attach
to QI events without changing stored QI workflow history.
