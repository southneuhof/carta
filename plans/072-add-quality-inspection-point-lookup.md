# Plan 072: Add the active Inspection Point selector

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Reuse the existing ITP template contract where its
> permission and response shape are valid. Do not add a native select or edit
> framework source.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/071-complete-quality-inspection-report-detail.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The legacy Complete Report dialog selects an active Inspection Point by radio.
The current dialog accepts arbitrary text and relies only on server validation.
That permits invalid input attempts and does not show the user the point name.

## Current state

- `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:30-35`
  defines `inspectionPointCode` as a required text renderer.
- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:427-436`
  validates the submitted code against active `itpInspectionPoints`.
- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/itp.actions.ts:12-14`
  already loads the project-scoped ITP template, including inspection points.
- `apps/api/src/routes/inspection-test-plans/inspection-test-plans.routes.ts:20-27`
  exposes that template with the existing authenticated project-view
  permission.
- Legacy uses a radio source in
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/quality-inspection/layouts/QualityInspectionDetail.vue:83-105`.

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
- Reuse `DialogForm` and the framework `Form` radio renderer.
- Reuse `itpActions.loadTemplate` if it returns the required active points.
- If authorization prevents that existing endpoint from serving a permitted
  QI viewer, stop before adding a new endpoint.

## Scope

**In scope**:

- QI detail action option loading.
- Complete Report dialog field source and loading/error state.
- Focused web/API contract tests if needed.
- `plans/README.md` status row.

**Out of scope**:

- Inspection Point master-data administration.
- Changes to the ITP template endpoint permission.
- Complete Report backend transition rules.
- Other workflow actions, evidence, KPI, Todo, notifications, mobile, and
  framework source.

## Steps

### Step 1: Load active point options from the existing contract

When the Complete Report action opens, load the existing project ITP template
for the report project and map `inspectionPoints` to `{ id: code, name }`.
Filter inactive points if the endpoint returns an active flag. Show a loading
state and a clear empty/error state. Do not fetch the list on every render.

**Verify**: an action test proves one template request per opening and correct
mapping of code and display name.

### Step 2: Use the framework radio renderer

Replace the text field with a `radio` field using the loaded options. Keep the
submitted value as the code required by the API. Keep `workMethod` as the
required framework textarea.

**Verify**: the route test proves the rendered control is a radio group and
the submitted payload still uses `inspectionPointCode`.

### Step 3: Preserve server validation

Keep the existing active-point server check. Add a regression test for an
inactive or unknown code. Do not duplicate the validation in a new endpoint.

**Verify**: the focused API test returns the existing validation error for an
invalid point and succeeds for an active point.

### Step 4: Verify the browser dialog

Use T3 preview to open Complete Report. Confirm the radio labels are readable,
the method field remains required, and the action still moves the report only
after a valid submission.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Add a route action test for option loading and payload mapping.
- Keep the existing API transition test and add one invalid-point case if it is
  missing.
- Test empty point options without adding brittle markup snapshots.

## Done criteria

- [ ] Complete Report uses a framework radio field.
- [ ] Options display active point names and submit codes.
- [ ] Loading and empty/error states are visible.
- [ ] Existing API permission and validation remain authoritative.
- [ ] All commands pass and browser behavior is checked or reported.
- [ ] No new master endpoint or framework change is added.
- [ ] `plans/README.md` marks Plan 072 DONE after review.

## STOP conditions

Stop and report if:

- the existing template endpoint does not return active point options for the
  QI user;
- using it requires widening an unrelated permission; or
- the point list cannot be loaded without a new master-data contract.

## Maintenance notes

Keep option loading tied to the report project. Do not use live point names to
rewrite the stored report code. Reviewers should check that the API remains the
final authority for active-point validity.
