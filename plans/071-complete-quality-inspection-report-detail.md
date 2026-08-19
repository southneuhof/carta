# Plan 071: Complete Quality Inspection report detail parity

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Use `DetailView`, `Detail`, `Card`, `Chip`, and
> existing resource field references. Do not create a generic detail
> component. Preserve the current server workflow and PTS boundary.
>
> **Drift check (run first)**: `git diff --stat 08b3028 -- apps/api/src/routes/quality-inspection apps/web/src/routes/(authenticated)/quality/quality-inspection`
> Stop if the detail response no longer returns `createdByUser` or the current
> action names have changed.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/070-show-quality-inspection-schedule-origin.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The legacy detail page identifies the reporter, report result, inspection
point, and work method. The current API already returns most of this data, but
the web route omits the reporter, inspection point, and report result. It also
renders the report detail twice. One complete standard detail surface will be
clearer and closer to the legacy page.

## Current state

- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:319-369`
  returns project, division, category, root work item, `createdByUser`, report
  result fields, work items, documentation, verification, PTS, and activity.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/quality-inspection.resource.ts:20-38`
  defines work method and inspection point fields but does not define a
  reporter display field or report verification description field.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:23-35`
  selects detail fields without reporter, result, inspection point, or result
  description.
- The same route renders a standard `DetailView` and a second custom
  `Detail` card at lines 80-86.
- The legacy detail at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/quality-inspection/layouts/QualityInspectionDetail.vue:28-81`
  shows status/result chips, reporter, report fields, and both inspection point
  and work method.

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
- Reuse the QI `defineFields` references and standard `DetailView`.
- Use `Chip` for status and result labels, as in the PTS detail route.
- Keep route-local workflow sections only where standard `DetailView` cannot
  express the domain table or action controls.

## Scope

**In scope**:

- QI resource report/detail fields.
- QI detail route report section and status/result display.
- Focused detail tests.
- `plans/README.md` status row.

**Out of scope**:

- Inspection Point option loading; plan 072 owns it.
- Criteria/snapshot table; plan 073 owns it.
- Item history, documentation, PTS history, evidence export, KPI, Todo,
  notifications, mobile, and framework source.

## Steps

### Step 1: Add field references for all report fields

Add field references for reporter name, result description, and any schedule
origin display required by plan 070. Read reporter name from the existing
`createdByUser` relation. Keep the exact labels:

- `Dilaporkan Oleh`
- `Hasil Inspeksi`
- `Catatan`
- `Inspection Point`
- `Prosedur / Metode Kerja`

Do not add report-level volume or unit. Legacy config comments those fields
out and the approved design stores volume per selected work-item row.

**Verify**: the resource test proves the field references are schema-bound and
selected by the detail action in the expected order.

### Step 2: Render one report detail surface

Use the standard `DetailView` report fields once. Remove the duplicate custom
report `Detail` card. Keep a route-local status/result header or controls slot
only when needed for the legacy chips and evidence action.

Show status, step, result, and result description. Use the existing schema
labels for `Diterima`, `Ditolak`, `Diperbaiki`, and `Ditunda`.

**Verify**: the detail route test proves each field appears once and result
chips are shown for records with a result.

### Step 3: Complete the procedure section

Render `Inspection Point` and `Prosedur / Metode Kerja` together. Show the
section only after the report has left the initial `report` step, matching the
legacy condition. Keep the Complete Report action location stable for plan
076.

**Verify**: detail tests cover initial report, complete-report, and closed
records.

### Step 4: Verify the real detail surface

Use T3 preview with a seeded or existing QI report. Confirm reporter, status,
result, Inspection Point, method, schedule origin, and evidence control use
the intended surfaces. Do not fix item tables or photos here.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Add or extend the QI detail route test for reporter, result, result
  description, inspection point, and method.
- Extend API detail coverage only if the current response lacks a field; do
  not duplicate existing service tests.
- Use semantic assertions, not full HTML snapshots.

## Done criteria

- [ ] Reporter, report result, result note, Inspection Point, and work method
  are visible with legacy labels.
- [ ] Report fields render once.
- [ ] Initial reports do not show completed procedure data.
- [ ] Result chips use the approved result options.
- [ ] All commands pass and browser behavior is checked or reported.
- [ ] No workflow or framework change occurs.
- [ ] `plans/README.md` marks Plan 071 DONE after review.

## STOP conditions

Stop and report if:

- the API does not return reporter or result data without a schema change;
- removing the duplicate detail card would remove a required workflow slot;
- the legacy result labels conflict with the approved state contract; or
- a framework component would need a new feature.

## Maintenance notes

Keep report fields in `defineFields` so list, detail, form, and export labels
remain consistent. Reviewers should reject a second report-detail renderer or
new local input controls.
