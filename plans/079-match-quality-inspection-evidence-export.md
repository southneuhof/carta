# Plan 079: Match the closed Quality Inspection evidence export

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Reuse the existing Printable, QR, ImagePreview, and
> storage components. Do not implement the deferred recap Excel export.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/073-render-quality-inspection-item-criteria.md, plans/075-restore-quality-inspection-documentation-surface.md, plans/078-complete-quality-inspection-audit-history.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The legacy closed report has a printable evidence layout with report fields,
procedure, grouped acceptance criteria, reporter QR data, and four photos with
descriptions. The current export has the correct closed-only gate and a basic
QR code, but it omits several fields and uses a different QR payload.

## Current state

- `apps/web/src/routes/(authenticated)/quality/quality-inspection/QualityInspectionEvidenceExport.vue:1-57`
  renders a closed-only printable report with number, target, location, work
  method, item rows, a small snapshot subset, four images, and a JSON QR value.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:80-82`
  exposes the export control when a detail record exists; the component owns
  the closed-state check.
- Legacy export configuration at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/quality-inspection.ts:57-118`
  includes report detail, inspection point, work method, custom child item
  data, reporter/date QR content, page break, and documentation name/description.
- Legacy item export fields include grouped Material, Process, and Product
  criteria in
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/quality-inspection/layouts/layouts/ChildDataQualityInspectionWorkItemITP.vue:20-120`.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- quality-inspection` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API focused test | `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/quality-inspection.spec.ts` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Invoke `web-ui-surface-reuse`.
- Reuse `Printable`, `ImagePreview`, `Button`, `QRCode`, and `fileUrl`.
- Keep print-only layout route-local. Do not add a general export framework.

## Scope

**In scope**:

- QI closed evidence export component and its data mapping.
- API detail response fields only if existing stored data is not exposed.
- Focused web/API tests.
- `plans/README.md` status row.

**Out of scope**:

- List recap Excel export, plan 068.
- Open or in-progress evidence export.
- New file storage or QR dependency.
- KPI, Todo, notifications, mobile, and framework source.

## Steps

### Step 1: Match the report and procedure sections

Add report number, reporter name, report date, division, project, category,
root work item, target date, location, Inspection Point, and work method. Keep
the legacy section labels `Detail Laporan` and `Prosedur & Penyelesaian`.

**Verify**: component tests assert every field appears in print data.

### Step 2: Match item and snapshot sections

Render each selected item with volume/unit, current result, verification actor
and time where available, and grouped Material/Proses/Product criteria. Include
the stored snapshot fields required by plan 073.

**Verify**: tests cover all three criteria types and a missing type.

### Step 3: Match QR and documentation sections

Build the QR value from the legacy meaning: reporter and report date. Do not
use a JSON-only replacement. Keep a readable reporter/date text beside the QR.
Add a print page break before documentation. Render all four fixed photo names,
images, and descriptions.

**Verify**: tests assert the QR value contains reporter/date and all four photo
slots are present in order.

### Step 4: Keep the closed-only gate

Ensure the export button and print content are absent for `report`,
`complete-report`, `inspected`, and `submitted`. Keep them available for
`close` only.

**Verify**: web tests cover all five steps.

### Step 5: Verify print output in the browser

Use T3 preview to open a closed report and inspect the export content. Use the
browser print preview if available. Check page break, images, QR, and long
criteria text. Report any environment limitation.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Extend QI evidence export tests for fields, QR, four photos, descriptions,
  and closed-only visibility.
- Add API detail fields only when a test proves they are missing.
- Do not use pixel snapshots as the only test.

## Done criteria

- [ ] Closed export matches the legacy report sections.
- [ ] QR contains reporter/date meaning.
- [ ] Four photos and descriptions are printed.
- [ ] Grouped criteria are printed.
- [ ] Non-closed reports cannot export.
- [ ] All commands pass and browser print behavior is checked or reported.
- [ ] Recap Excel remains deferred.
- [ ] `plans/README.md` marks Plan 079 DONE after review.

## STOP conditions

Stop and report if:

- required reporter, verifier, or documentation data is not in the existing
  detail contract;
- the print component cannot create a page break without framework changes;
- closed-only permission behavior differs from the approved design; or
- the task begins to require recap Excel work.

## Maintenance notes

The evidence export is a historical document. It must use report snapshots and
stored event data, not live ITP data. Reviewers should check print layout with
long criteria and missing optional descriptions.
