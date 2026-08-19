# Plan 067: Align the Quality Inspection list with the legacy surface

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`. Record `Reused`,
> `Searched`, and `Gap` in the implementation report. Preserve unrelated
> working-tree changes. Do not add the recap Excel export in this plan; plan
> 068 records that deferred work. Do not replace the framework `Create`
> control here; plan 069 owns it.
>
> **Drift check (run first)**: `git diff --stat 08b3028 -- apps/api/src/routes/quality-inspection apps/api/src/__tests__/quality-inspection.spec.ts apps/web/src/routes/(authenticated)/quality/quality-inspection`
> If the current code differs from the state below, compare the live code and
> stop if the change alters the API or permission assumptions.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/062-build-quality-inspection-api-and-data-contract.md, plans/063-build-quality-inspection-resource-and-report-creation.md, plans/064-build-quality-inspection-detail-workflow-and-evidence.md, plans/065-correct-quality-inspection-entry-and-development-seed.md, plans/066-repair-quality-inspection-route-contract.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The legacy list is a working report-management surface, not only a table. It
has status filters, month filters, reporter data, documentation previews,
delete, and a card/table presentation. The current route uses a standard table
with only number, project, target date, status, and step. Users cannot find and
manage reports with the same information or actions.

## Current state

- `apps/web/src/routes/(authenticated)/quality/quality-inspection/index.route.vue:38-61`
  renders `ListView`, custom normal-create controls, and custom Edit/View row
  buttons. It has no status filter, month filter, grid presentation, or delete
  control.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/quality-inspection.resource.ts:41-48`
  selects only number, project, target date, status, and step for the list.
  The resource also defines a delete action, but the browser cannot use its
  project-scoped permission as a normal client permission.
- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:300-316`
  filters only project, status, step, and number search. It joins project and
  division only. It excludes soft-deleted rows by the approved design.
- The legacy list configuration at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/quality-inspection.ts:30-44`
  defines project, target date, work-item category, creator, created date, and
  start/end month filters.
- The legacy card at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/quality-inspection/layouts/QualityInspectionListView.vue:15-90`
  shows reporter identity, date, project, number, target, work-item category,
  location, status, and documentation previews.
- Use the existing PTS implementation as the web standard:
  `apps/web/src/routes/(authenticated)/quality/pts/index.route.vue:53-113`
  uses `ListView`, `ChipFilter`, `filters`, a table/grid switch, and the
  framework row delete surface. Its card is
  `apps/web/src/routes/(authenticated)/quality/pts/PtsCardGrid.vue:1-146`.

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

- Invoke `web-ui-surface-reuse` before editing the route.
- Reuse `ListView` `filters`, `presentation="custom"`, `ChipFilter`,
  `Table`, `Card`, `ImagePreview`, and the standard ListView delete dialog.
- Reuse the PTS card and list patterns. Create only a route-local
  `QualityInspectionCardGrid` if the PTS card cannot be adapted without domain
  coupling.
- Do not edit `packages/is-vue-framework`.

## Scope

**In scope**:

- QI list query schema, service joins, and response fields.
- QI resource list fields and filter field definitions.
- QI list route and one route-local QI card presentation if needed.
- QI API and web list tests.
- `plans/README.md` status row.

**Out of scope**:

- Recap Excel export; plan 068 defers it.
- Normal Create button replacement; plan 069 owns it.
- Schedule-origin display; plan 070 owns it.
- Detail workflow, documentation, PTS history, KPI, notifications, Todo,
  mobile, migrations, and framework source.
- Deleted-record browsing. The approved design excludes soft-deleted rows from
  normal QI lists.

## Steps

### Step 1: Extend the list query without changing report rules

Add only the legacy list filters that use existing data:

- `startMonth` and `endMonth`, interpreted as inclusive calendar months using
  the report `createdAt` value.
- Project and status filters already supported.
- Step filter already supported.
- Search across the report number and the joined legacy list fields that the
  current API can safely query. Do not invent a broad full-text index.

Batch-load or join project, division, work-item category, creator, and the four
documentation slots. Avoid one query per report. Return stable summary fields
for the card and table, including documentation file paths and creator name.
Keep `allowedOperations` server-owned and keep deleted rows excluded.

**Verify**: the focused API test exits 0 and includes month boundaries,
creator/category fields, documentation summaries, and project-scoped delete
operations.

### Step 2: Bind the resource to the list contract

Update the QI query schema and resource fields. Keep field references in
`defineFields`; do not create a second list field map. Add the legacy list
fields and exact labels. Use framework month renderers in the filter form.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` exits 0.

### Step 3: Add the status/filter surface

Use the PTS route pattern:

- `ChipFilter` for `Open`, `On Progress`, and `Closed`.
- `ListView` `filters` for `Periode Mulai` and `Periode Selesai`.
- Preserve search and pagination query state.
- Reset to page 1 when a filter changes.

Do not add a Deleted tab. If a reviewer requests deleted browsing, stop and
report because it changes the approved read contract.

**Verify**: the QI route test proves each status updates the query and the two
month fields are visible through the framework filter surface.

### Step 4: Add the table/grid presentation

Use one `ListView` collection and switch between its table presentation and a
route-local custom card presentation. The card must show reporter, date,
project, number, target, work-item category, location, status, and the four
photo previews or the legacy empty message. Use framework `Card`, `Chip`,
`ImagePreview`, `Button`, and `Icon` components.

Keep the standard table for the same collection. Do not make the card grid
load data separately.

**Verify**: the web test covers table/grid switching and the card renders both
complete and empty documentation states.

### Step 5: Use the standard ListView delete surface

Because the QI delete permission is project-scoped, pass route-owned
`canDelete` and `deleteRecord` functions to `ListView` using each record's
server-provided `allowedOperations`. Call the existing QI delete action,
invalidate the record, and let the framework display its standard confirmation.
Do not build a local delete modal.

**Verify**: the route test proves a permitted report shows the standard Delete
button and a report without `delete` in `allowedOperations` does not.

### Step 6: Run the real UI check

Invoke the T3 preview tools. Check the status filters, month filters, table/grid
switch, card content, standard Create button placeholder behavior, and delete
visibility. The Create button itself is completed by plan 069; do not fix it
here.

**Verify**: browser check passes, or report the exact preview limitation.

## Test plan

- Extend `apps/api/src/__tests__/quality-inspection.spec.ts` for list filters,
  summary relations, documentation summary, and allowed operations.
- Extend `apps/web/src/routes/(authenticated)/quality/quality-inspection/index.route.spec.ts`
  for status filters, month filters, grid/table presentation, and delete
  visibility.
- If a card component is created, add one focused render test using the PTS
  card test pattern. Do not add snapshot tests.

## Done criteria

- [ ] The API returns all list fields required by the legacy card and table.
- [ ] Status and month filters change the server query.
- [ ] Table and grid use one collection load.
- [ ] Standard framework delete confirmation is used.
- [ ] No local normal Create button is added or changed in this plan.
- [ ] All commands in the command table pass.
- [ ] Browser behavior is verified or explicitly reported as unverified.
- [ ] No files outside the scope are modified.
- [ ] `plans/README.md` marks Plan 067 DONE after review.

## STOP conditions

Stop and report if:

- the needed creator, category, unit, or documentation data is not available
  in existing tables without a migration;
- the list requires a new framework component or framework source edit;
- the standard ListView delete surface cannot express the existing API action;
- month filtering requires a different timezone or business rule than the
  legacy `created_at` month range; or
- an unrelated dirty change overlaps the same code and its intent is unknown.

## Maintenance notes

Keep list summary loading bounded. Future filters should extend the QI query
schema and service together. Reviewers should check that card and table use the
same collection and that server `allowedOperations` remains the authority.
The recap Excel export remains deferred under plan 068.
