# Plan 063: Build the Quality Inspection resource and report creation screens

> **Implementation instructions**: Start only after plan 062 is DONE. Invoke
> the **Web UI Surface Reuse** skill before editing `apps/web`; read its required
> architecture documents and record `Reused`, `Searched`, and `Gap` in the
> handoff. Use the API contract exactly as written. Do not modify framework
> source. Update this plan row in `plans/README.md` after implementation and
> review.
>
> **Drift check (run first)**: `git diff --stat 77b7f49..HEAD -- apps/web/src apps/api/src/routes/quality-inspection packages/is-vue-framework`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/062-build-quality-inspection-api-and-data-contract.md`
- **Category**: migration
- **Planned at**: commit `77b7f49`, 2026-08-18

## Why this matters

Users need the normal and scheduled legacy report entry paths without a second
client state machine. This plan uses the current resource system for ordinary
list/form work and keeps only the domain tree selector local.

## Current state

- The approved design requires `ListView` and `FormView` for standard surfaces
  and permits only a route-local recursive selector here
  (`quality-inspection-design.md:448-463`).
- `apps/web/src/routes/(authenticated)/quality/pts/` is the nearest resource,
  typed action, and standard report form example.
- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/[projectId]/detail.route.vue:211-256`
  uses exported `TreeTable` with route-owned union data. Reuse it for candidates;
  do not add tree behavior to the framework.
- `FormView` supports ordinary fields and route-owned form slots. Existing image
  fields already use the framework upload adapter; no new upload component is
  needed in this plan.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- quality-inspection` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- **Must invoke `web-ui-surface-reuse`** for ListView, FormView, TreeTable,
  Table, select, and dialog decisions.
- Invoke `build-resource-form` for schema-bound fields and route actions.
- Read `docs/architecture/web-application-architecture.md`,
  `packages/is-vue-framework/README.md`, the nearest PTS resource, and
  `apps/web/src/framework/inputs/registry.ts` before editing.

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/quality/quality-inspection/` (new schemas,
  actions, resource, list, create/edit routes, and route-local selector)
- authenticated navigation/route registration only as needed for this module
- focused tests next to these files

**Out of scope**:

- Detail workflow, evidence export, fixed-photo form, PTS action UI (plan 064).
- Framework components, generic selected-item editor, schedule CRUD, Todo,
  notifications, ITP/Work Items changes, and a compatibility route.

## Steps

### Step 1: Add the schema-bound resource and legacy navigation labels

Create typed action functions for plan 062 list, detail, create, update,
create-context, and schedules. Define a `defineSchema`/`fromZod` resource with
`defineFields`; use `ListView`, `DetailView` only where the standard resource
needs it, and `FormView` for create/edit. Register the authenticated navigation
label **Inspection/Test**. Use legacy report field labels exactly: `Divisi`,
`Proyek`, `Target Pelaksanaan`, `Kategori Pekerjaan`, `Jenis Pekerjaan`, and
`Area/Zona Kerja`.

The list shows number, project, target date, status (`Open`, `On Progress`,
`Closed`), step label, and allowed actions. It must use `view-quality-inspection`
for navigation/list and show links only when `show-quality-inspection` permits.

**Verify**: focused resource test proves exact field order/labels, status and
step mapping, permission-gated routes, and API payload mapping.

### Step 2: Build the route-local selected-work-item control

Create one route-local `QualityInspectionWorkItemSelector.vue`. Feed it the
server create context; it renders candidate hierarchy with `TreeTable` and a
selected-row table with framework `Table`, `Form`, `Checkbox`, `Input`, and
`Select` surfaces. A candidate is selectable only if it is an active leaf with
active ITP data. Each selected row edits a strictly positive volume and one or
more server-offered ITP types. It emits the complete selected-row payload.

This is a domain workflow component, not a framework input or generic tree
editor. Do not use native controls or local generic table/form/dialog wrappers.

**Verify**: focused tests cover leaf-only eligibility, selection, duplicate
prevention, positive-volume validation, type selection, and serialization.

### Step 3: Build manual and scheduled create/edit routes

Manual create loads its chosen project context and posts the normal payload.
Scheduled list uses `ListView` for active schedule origins and a row action
labelled `Buat Inspection/Test`; it opens the same form with `scheduleId` and
server-derived fields shown read-only. It must not display another target-date
source. The normal leaf selector stays available for scheduled reports.

Edit uses `FormView` only while server `allowedOperations` includes update. It
must preserve selected rows and snapshot choices from the API. After mutation,
use the existing route-local action-then-invalidate pattern; do not create a
global cache or local workflow store.

**Verify**: focused tests prove manual versus scheduled payloads, disabled
derived fields, no schedule CRUD action, update guards, and refresh after save.

## Test plan

Follow PTS resource/action tests. Test the API contract mapping and the
selector's domain rules only. Do not snapshot whole framework screens or
re-test framework TreeTable behavior.

## Done criteria

- [ ] The authenticated menu and screen say `Inspection/Test`; report labels use legacy Indonesian text.
- [ ] Standard list/create/edit reuse ListView/FormView and schema-bound fields.
- [ ] The only custom UI is the route-local selector; it reuses framework TreeTable/Table/Form controls.
- [ ] Scheduled creation reads origins but creates no schedule, Todo, or notification.
- [ ] Focused tests, web type/lint checks, API type check, and diff check pass.

## STOP conditions

- The plan 062 API differs from the payload or permission contract above.
- Framework controls cannot render the candidate/selected tables without a framework source edit.
- A requested scheduled action needs schedule configuration or Todo behavior.

## Maintenance notes

A later control-plan slice may own schedule writes. It must keep this create
route as a consumer of the read-only schedule origin, not duplicate report
creation logic.
