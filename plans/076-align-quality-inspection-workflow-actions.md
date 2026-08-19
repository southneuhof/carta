# Plan 076: Align Quality Inspection workflow action surfaces

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Reuse `DialogForm`, `Form`, `Button`, `Chip`, and the
> server-provided action map. Do not build a client state machine or a generic
> workflow component.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/072-add-quality-inspection-point-lookup.md, plans/075-restore-quality-inspection-documentation-surface.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The QI backend has the approved transition rules, but the route spreads action
labels, fields, visibility, and submission behavior across local code. The
legacy page presents a clear ordered workflow. This plan makes the existing
framework dialogs and server action map the single visible workflow surface.

## Current state

- `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:30-46`
  maps action labels and fields locally. Complete Report currently depends on
  the text Inspection Point field, fixed by plan 072.
- The same route at lines 56-75 submits report and item actions, while line 92
  places report actions at the bottom without a stage-specific grouping.
- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:427-514`
  enforces action permissions, stage, result, repair, pending, and closure.
- The approved design permits item notes to be optional and report result notes
  to be optional only for `approved`; keep this intentional difference from the
  legacy UI.
- The legacy action dialogs are in
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/quality-inspection/layouts/QualityInspectionDetail.vue:83-139`.

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
- Reuse `DialogForm` for all modal actions and `Form` renderers for action
  fields.
- Use `allowedActions` from the server. Do not infer permissions from the
  current step in the browser.
- Use the PTS detail action grouping as the nearest sibling pattern.

## Scope

**In scope**:

- QI detail action grouping, labels, fields, and submission state.
- Action visibility tests and transition regression tests.
- `plans/README.md` status row.

**Out of scope**:

- Server transition redesign.
- Inspection Point option source; plan 072.
- Documentation gallery; plan 075.
- PTS detail workflow; plan 077.
- Full actor history; plan 078.
- Evidence export, KPI, Todo, notifications, mobile, and framework source.

## Steps

### Step 1: Define one action presentation map

Keep action labels and field definitions in one QI route-local map. Use exact
labels:

- `Lengkapi Prosedur & Penyelesaian`
- `Verifikasi Item`
- `Submit Inspection Data`
- `Verifikasi Laporan`
- `Terima`
- `Tolak`

Use the framework renderer for radio, textarea, and image fields. Do not add
custom input elements.

**Verify**: web tests assert the action map contains only the approved action
names and labels.

### Step 2: Place actions beside their stage data

Show Complete Report beside Procedure and Resolution at `report`. Show item
actions in the item table only at `complete-report`. Show documentation submit
at `inspected`. Show final verification at `submitted`. Keep closed reports
read-only except for PTS actions in the PTS module.

Visibility must use `record.allowedActions` and each row's
`allowedActions`, not only status or step strings.

**Verify**: route tests cover each step and prove unavailable actions are not
rendered.

### Step 3: Preserve payload and loading behavior

Keep existing action functions and invalidation. Prevent duplicate submissions,
close the dialog only after success, and show the existing toast pattern.
Keep report-result description validation from the server. Do not require item
notes because the approved design makes them optional.

**Verify**: API tests cover complete report, all item results, documentation,
approved, rejected, repair, and pending transitions. Web tests cover dialog
close and error retention.

### Step 4: Verify the complete workflow in the browser

Use T3 preview with seeded or controlled records. Walk through action visibility
and dialogs without creating unrelated data. Confirm the stage order and labels
match the legacy flow.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Extend the QI detail route test with one record per workflow step.
- Keep focused API workflow coverage in
  `apps/api/src/__tests__/quality-inspection.spec.ts`.
- Add one duplicate-submit regression test if current route tests do not cover
  it.

## Done criteria

- [ ] Every action appears only at its allowed stage.
- [ ] Action labels and fields use framework surfaces and legacy vocabulary.
- [ ] Item notes remain optional.
- [ ] Report non-approved descriptions remain required by the server.
- [ ] Existing invalidation and transition rules remain unchanged.
- [ ] All commands pass and browser behavior is checked or reported.
- [ ] `plans/README.md` marks Plan 076 DONE after review.

## STOP conditions

Stop and report if:

- an action requires a client-side permission not returned by the server;
- the existing API state machine cannot support the approved UI order;
- a new shared workflow abstraction appears necessary; or
- a requested legacy validation conflicts with the approved design.

## Maintenance notes

The server action map is the authority. Future QI actions must add a server
action name, route mapping, field definition, and focused transition test
together.
