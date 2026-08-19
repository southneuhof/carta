# Plan 075: Restore the Quality Inspection documentation surface

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Reuse `Form`, `Card`, `ImagePreview`, `Button`, and
> the existing storage adapter. Do not create a native upload or image
> component.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/071-complete-quality-inspection-report-detail.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

Legacy shows the four fixed documentation images and descriptions after the
report reaches the documentation stage. The current route only renders the
form while the server allows the documentation action. After submission or
closure, users cannot view the photos in the detail page. The form also has an
`initial` prop that is not used by the route.

## Current state

- `apps/web/src/routes/(authenticated)/quality/quality-inspection/QualityInspectionDocumentationForm.vue:8-26`
  accepts an initial value but starts with an empty local model when the route
  does not pass one.
- The same component at lines 32-47 contains English instructions and previews
  only its local form model.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:90`
  renders the form only when `can('documentation')` is true. It has no
  read-only documentation gallery for submitted or closed reports.
- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:478-496`
  updates all four fixed rows and requires four retained upload paths.
- The legacy detail at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/quality-inspection/layouts/QualityInspectionDetail.vue:153-183`
  shows the form at `inspected` and existing image/description rows otherwise.

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
- Reuse `ImagePreview` from the framework and `fileUrl` from the storage
  adapter.
- Reuse `Form` for editing and `Card` for the route-local fixed-slot surface.
- Do not change framework upload behavior.

## Scope

**In scope**:

- QI documentation form initial data and labels.
- QI detail documentation gallery and edit visibility.
- Documentation route tests and API regression tests.
- `plans/README.md` status row.

**Out of scope**:

- Upload service or storage changes.
- Evidence export; plan 079 owns it.
- Workflow action placement; plan 076 owns it.
- KPI, Todo, notifications, mobile, migrations, and framework source.

## Steps

### Step 1: Normalize existing documentation into form data

Map `record.documentations` by the four fixed names into the form's initial
model, including retained file paths and descriptions. Pass that model through
the existing `initial` prop. Preserve current upload path validation and submit
all four slots.

**Verify**: a web test mounts the form with existing paths and descriptions and
asserts all four previews and notes are present.

### Step 2: Render the fixed documentation gallery

Create a route-local gallery in the detail route or the existing QI form file.
Show all four slots from `inspected` onward:

- At `inspected`, show the editable framework form and current previews.
- At `submitted` and `close`, show read-only image previews and descriptions.
- At earlier steps, do not show the documentation section.

Use the exact names `sudut 1` through `sudut 4`. Use an empty message only for
an incomplete pre-submit state; the backend still requires all four files.

**Verify**: detail tests cover inspected, submitted, closed, and incomplete
documentation data.

### Step 3: Align labels and messages

Replace English helper text and submit copy with the established labels,
including `Foto Sudut Pengambilan`, `Catatan`, and `Submit Inspection Data`.
Keep optional descriptions optional.

**Verify**: `rg -n "Upload the four|No file selected|Each Catatan" apps/web/src/routes/(authenticated)/quality/quality-inspection` returns no unwanted copy.

### Step 4: Verify image behavior in the browser

Use T3 preview to check file previews, fixed slot order, descriptions, and
read-only closed display. Do not upload a real external file unless the local
fixture requires it.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Extend the documentation form test for initial file paths and descriptions.
- Add detail route tests for stage-based form/gallery visibility.
- Keep the API four-slot validation test and add a retained-file regression if
  it is missing.

## Done criteria

- [ ] Existing documentation is prefilled during editing.
- [ ] Four photos and notes display after submission and closure.
- [ ] The form appears only at the documentation stage.
- [ ] All four fixed names and labels are correct.
- [ ] All commands pass and browser behavior is checked or reported.
- [ ] Storage and framework source remain unchanged.
- [ ] `plans/README.md` marks Plan 075 DONE after review.

## STOP conditions

Stop and report if:

- stored file paths cannot be converted to the existing `fileUrl` contract;
- a submitted report must be edited outside the approved documentation step;
- the framework image or form surface lacks a required capability; or
- showing a photo requires a storage migration.

## Maintenance notes

The fixed documentation names are part of the API contract. Reviewers should
check that a new photo slot cannot be silently added by the UI alone.
