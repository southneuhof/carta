# Plan 077: Align the Quality Inspection PTS presentation

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Reuse the existing PTS detail route and framework
> links/chips. Do not change the approved PTS reuse rule.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/074-render-quality-inspection-item-history.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

Rejecting an item creates or reuses a PTS. The current QI page exposes only a
raw number and status string. Users need a clear linked record and the PTS
module already owns the next action, including `complete-qi-report`.

## Current state

- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:339-365`
  returns linked PTS number, status, step, and rejection events.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:28`
  renders `number · statusCode` as plain text.
- `apps/web/src/routes/(authenticated)/quality/pts/[ptsId]/detail.route.vue:31-75`
  already supports the QI PTS action and standard action display.
- PTS creation/reuse is implemented in
  `apps/api/src/routes/qhsse-pts/qhsse-pts.service.ts:184` and is an approved
  difference from legacy new-per-rejection behavior.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| API focused tests | `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/quality-inspection.spec.ts src/__tests__/qhsse-pts.spec.ts` | exit 0 |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- quality-inspection pts` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Invoke `web-ui-surface-reuse`.
- Reuse `RouterLink`, `Chip`, and PTS label helpers.
- Follow the PTS list/detail route action conventions.

## Scope

**In scope**:

- QI detail PTS display and link.
- QI PTS status/step labels.
- Focused QI/PTS tests.
- `plans/README.md` status row.

**Out of scope**:

- PTS creation/reuse service.
- PTS action state machine.
- Full PTS rejection actor history; plan 078 owns actor data.
- Evidence export, KPI, Todo, notifications, mobile, and framework source.

## Steps

### Step 1: Add a linked PTS display

Render each linked PTS as a link to `quality-pts-detail`. Show number, readable
status, and readable step. Do not expose raw status codes when a known label
exists. Keep an empty state for items without a PTS.

**Verify**: web tests cover linked and unlinked items and assert the route
parameters contain the PTS ID.

### Step 2: Keep the rejection relationship visible

For each linked PTS, show the QI rejection notes and dates already returned by
the QI API. Keep repeated rejection events. Do not add a second PTS creation
button to QI.

**Verify**: API and web tests cover reuse with two rejection events and one
linked PTS.

### Step 3: Verify the PTS handoff

Open the link in T3 preview and confirm the PTS detail displays the approved
`Lengkapi Laporan` action when available. Do not execute the action during this
plan unless needed for a non-destructive check.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Extend QI API tests for PTS reuse and linked response fields if needed.
- Add QI detail route tests for link target and labels.
- Keep existing PTS detail/action tests.

## Done criteria

- [ ] Every linked PTS is readable and clickable.
- [ ] PTS status and step use labels.
- [ ] Rejection history remains visible.
- [ ] No duplicate PTS creation path is added.
- [ ] All commands pass and browser behavior is checked or reported.
- [ ] `plans/README.md` marks Plan 077 DONE after review.

## STOP conditions

Stop and report if:

- the PTS detail route name or source contract differs;
- linking would bypass QI/PTS authorization; or
- PTS reuse behavior would need to change to match legacy.

## Maintenance notes

PTS remains an independent module. QI should show the relationship and send
users to PTS; it should not copy the PTS workflow into the QI route.
