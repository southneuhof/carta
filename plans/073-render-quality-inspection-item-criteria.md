# Plan 073: Render Quality Inspection item criteria and snapshots

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Use the framework `Table`, `Detail`, `Card`, and
> field/cell slots. Do not create a generic ITP table or change the immutable
> snapshot model.

## Status

- **Priority**: P0
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/071-complete-quality-inspection-report-detail.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

Inspection decisions use the acceptance criteria recorded when the report was
created. The current page shows a compressed ITP line with only type, criteria,
procedure code, and specification. The legacy page shows separate Material,
Process, and Product criteria columns, and the approved design requires the
full immutable snapshot to remain visible.

## Current state

- `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:24-29`
  defines an item table with item, volume, result, and PTS only.
- The same route at lines 88-89 renders snapshot type, criteria, procedure
  code, and specification as one list item.
- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:333-360`
  already loads snapshot fields, inspector snapshots, and point snapshots.
- Snapshot tables preserve method, frequency, image, description, inspector
  names, point names, and point values in
  `apps/api/src/routes/quality-inspection/quality-inspection.entity.ts:84-114`.
- Legacy renders separate criteria lists in
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/quality-inspection/layouts/layouts/ChildDataQualityInspectionWorkItemITP.vue:20-120`.

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
- Reuse `Table` with cell slots and `Card`/`Detail` for grouped snapshot
  content.
- Use a small route-local grouping function. Do not create a shared snapshot
  framework for one module.
- Use `ImagePreview` and the existing storage adapter for snapshot images.

## Scope

**In scope**:

- QI item table fields and criteria rendering.
- QI snapshot presentation.
- API response joins only if existing snapshot names are missing.
- Focused web/API tests.
- `plans/README.md` status row.

**Out of scope**:

- Snapshot writes or migration.
- Item verification history; plan 074 owns it.
- PTS, documentation, evidence export, KPI, Todo, notifications, mobile, and
  framework source.

## Steps

### Step 1: Define grouped item fields

Add columns for item, volume with unit, Material criteria, Proses criteria,
Product criteria, and current result/action. Keep row actions driven by the
server `allowedActions` value.

Group snapshot rows by `type`. Render each criterion as an ordered list and
render an empty marker when a type has no criteria. Use `Proses`, not
`Process`, for the legacy label.

**Verify**: web tests cover one item with all three types and one item with a
missing type.

### Step 2: Render the complete snapshot

For each selected item, show a readable snapshot section containing:

- Type and criteria.
- Procedure code.
- Specification.
- Method.
- Frequency.
- Inspector type.
- Inspection point and value.
- Documentation image when present.
- Description.

Use the stored snapshot names and values. Do not resolve current ITP records
for display because that would break historical meaning.

**Verify**: test data changes the current ITP after report creation and the
detail response/render still shows the stored snapshot values.

### Step 3: Add missing read-only joins only if required

Inspect the response before editing the API. The current snapshot tables store
inspector and point names. Only add a read-only response mapping if the web
contract cannot access those stored values. Do not add a migration.

**Verify**: API typecheck and focused detail test pass with the existing
snapshot fixtures.

### Step 4: Verify the real table

Use T3 preview at desktop and a narrow viewport. Confirm the grouped criteria
remain readable, the table does not hide row actions, and snapshot evidence
images do not break layout.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Extend QI API detail fixtures with Material, Proses, and Product snapshots,
  inspector points, and snapshot image/description.
- Add web tests for grouping, empty criteria, and all snapshot fields.
- Do not assert complete CSS or pixel snapshots.

## Done criteria

- [ ] Item table shows volume/unit and three criteria groups.
- [ ] Snapshot shows every stored snapshot field and nested point.
- [ ] Display uses immutable snapshot values.
- [ ] Item actions remain server-authorized.
- [ ] All commands pass and browser behavior is checked or reported.
- [ ] No snapshot migration or framework change occurs.
- [ ] `plans/README.md` marks Plan 073 DONE after review.

## STOP conditions

Stop and report if:

- the current database does not store a required snapshot value;
- showing a value requires reading the live ITP instead of the snapshot; or
- the table needs a new framework capability.

## Maintenance notes

New ITP fields must be added to snapshot storage before they are shown here.
Reviewers should reject any live ITP fallback in the closed-report detail.
