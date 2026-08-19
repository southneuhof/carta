# Plan 070: Show the Quality Inspection schedule origin

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Do not create schedule CRUD in Quality Inspection.
> The schedule is a read-only origin owned by QHSSE Control Plan.
>
> **Drift check (run first)**: `git diff --stat 08b3028 -- apps/api/src/routes/quality-inspection apps/web/src/routes/(authenticated)/quality/quality-inspection`
> Stop if schedule fields are no longer stored on the QI report.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/069-align-quality-inspection-creation-form.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The approved QI design keeps the schedule ID and start/end date snapshots on a
report. The current scheduled form stores them, but users see only an English
description and no actual period. The report detail also needs to show the
origin so users can distinguish scheduled and manual reports.

## Current state

- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:261-267`
  derives project, root, category, schedule ID, and schedule date snapshots
  from an active schedule.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/schedules/index.route.vue:16-29`
  lists the source project, root work item, start date, and end date.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/schedules/[scheduleId]/create.route.vue:17-40`
  renders only target date, location, and selected rows. Its description says
  the schedule period is read-only but does not show the dates.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/quality-inspection.resource.ts:34-36`
  defines schedule ID and date fields, but the detail action does not select
  the schedule origin fields consistently.
- The legacy QI module does not own schedule configuration. The control-plan
  module owns schedule CRUD; keep that boundary.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| API focused test | `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/quality-inspection.spec.ts` | exit 0 |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- quality-inspection` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Invoke `web-ui-surface-reuse`.
- Reuse `FormView`, `DetailView`, `Detail`, `Card`, and existing date fields.
- Keep the schedule list as a route-owned custom collection because it is not
  a standard CRUD resource in this module.
- Do not edit framework source or QHSSE Control Plan routes.

## Scope

**In scope**:

- Scheduled create route origin summary.
- QI resource detail schedule fields and labels.
- QI detail origin display.
- Focused API/web tests.
- `plans/README.md` status row.

**Out of scope**:

- Schedule create/update/delete.
- Control Plan screens.
- Todo and notifications.
- New schedule tables or migrations.
- Mobile and framework source.

## Steps

### Step 1: Show schedule data on scheduled create

Use the existing `loadScheduleContext` result. Add a read-only origin block
above the form with project, work-item category, `Periode Mulai`, and
`Periode Selesai`. Keep target date editable and separate. Use framework
`Card` and text/detail presentation; do not add editable controls for origin
values.

**Verify**: the scheduled route test proves origin values are visible and the
form payload contains only schedule ID, target date, location, and selected
rows.

### Step 2: Show schedule origin on report detail

Select schedule ID, start date, and end date in the detail field set. Render a
clear `Asal Jadwal` section only for scheduled reports. Show the stored date
snapshots, not live schedule dates. Manual reports must not show an empty
schedule section.

**Verify**: detail tests cover both manual and scheduled records.

### Step 3: Align labels and errors

Replace the English schedule description and use the established labels:
`Jadwal`, `Periode Mulai`, `Periode Selesai`, and `Target Pelaksanaan`.
Preserve server errors for inactive schedules and inaccessible projects.

**Verify**: `rg -n "Target Pelaksanaan is entered|schedule period" apps/web/src/routes/(authenticated)/quality/quality-inspection` returns no unwanted English copy.

### Step 4: Verify the seeded scheduled path

Use the T3 preview to open the schedule list and scheduled create form. Confirm
the origin summary is read-only and the created report detail shows the stored
origin after creation if a test report is needed.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Extend the schedule route test for origin rendering and payload shape.
- Extend the QI detail route test for manual versus scheduled origin.
- Keep the existing API schedule context and creation tests.

## Done criteria

- [ ] Scheduled create shows project, root, and date period.
- [ ] Target date remains separate and editable.
- [ ] Scheduled report detail shows stored origin snapshots.
- [ ] Manual report detail has no false schedule section.
- [ ] No schedule CRUD or framework changes occur.
- [ ] All commands pass and browser behavior is checked or reported.
- [ ] `plans/README.md` marks Plan 070 DONE after review.

## STOP conditions

Stop and report if:

- the schedule context does not contain the data needed for the read-only
  summary;
- displaying live schedule dates would be required to satisfy the UI; or
- the change would require moving schedule ownership into Quality Inspection.

## Maintenance notes

The report's schedule date snapshot is the audit value. Future schedule edits
must not rewrite existing QI reports. Reviewers should check that the detail
page reads report snapshots and never silently replaces them with live data.
