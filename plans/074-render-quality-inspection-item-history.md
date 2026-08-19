# Plan 074: Render Quality Inspection item verification history

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Reuse `Table`, `Card`, and `Timeline` patterns. Keep
> verification events append-only and keep the server action permission.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/073-render-quality-inspection-item-criteria.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The legacy item table shows who inspected each item, when the decision was
made, and the note. The approved design also requires every item result to
remain visible after a repair cycle. The current API stores item verification
events but the web page shows only the current row result.

## Current state

- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:338-360`
  loads item verification rows and returns them as `workItems[].verifications`.
- `apps/api/src/routes/quality-inspection/quality-inspection.entity.ts:116-123`
  stores result, description, verifier ID, and verification time.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:24-29`
  renders only item, volume, result, and PTS.
- The detail route at lines 91-92 renders report verification history, but not
  item verification history.
- Legacy renders result, actor, time, and note at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/quality-inspection/layouts/layouts/ChildDataQualityInspectionWorkItemITP.vue:45-98`.

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
- Reuse `Table`, `Card`, `Chip`, `Timeline`, and framework text components.
- Do not create an item-history framework or mutate existing events.

## Scope

**In scope**:

- API response actor names for item verification events.
- QI item current-result and history display.
- Focused API/web tests.
- `plans/README.md` status row.

**Out of scope**:

- Report verification history; plan 078 owns it.
- Workflow transition logic; plan 076 owns action controls.
- PTS history, evidence export, KPI, Todo, notifications, mobile, and
  framework source.

## Steps

### Step 1: Add verifier display data without changing events

Batch-load users referenced by item verification events and return a nested
display object or display name. Keep the raw verifier ID and event schema. Do
not change the append-only table or add a new user field.

**Verify**: API tests create two verifier events and assert both names and
times are returned in event order.

### Step 2: Show current item decision and event history

For each item, show the current result chip. Add the legacy text:

`Inspeksi dilakukan oleh <name> pada <datetime>`

Show the note or `Tidak ada catatan`. Render all historical events in time
order, including events after a repair. Keep `Terima` and `Tolak` actions only
when the row's server-provided action allows them.

**Verify**: web tests cover waiting, approved, rejected, and a repeated event
sequence.

### Step 3: Verify repair history

Use a fixture with an item accepted, report repaired, then item rejected. Prove
the page displays both item decisions and does not replace the first event.

**Verify**: focused API and web tests pass.

### Step 4: Verify the real page

Use T3 preview to check item result, actor, time, note, and action placement on
the detail page. Check a narrow viewport for readable history.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Extend `apps/api/src/__tests__/quality-inspection.spec.ts` with two actors and
  multiple item events.
- Add route tests for current state, no note, and repeated history.
- Use semantic text assertions; do not snapshot the whole page.

## Done criteria

- [ ] API returns actor names for item events.
- [ ] Current item result and all historical events are visible.
- [ ] Notes and empty-note text match the legacy behavior.
- [ ] Actions remain server-authorized.
- [ ] All commands pass and browser behavior is checked or reported.
- [ ] Events remain append-only.
- [ ] `plans/README.md` marks Plan 074 DONE after review.

## STOP conditions

Stop and report if:

- verifier names cannot be loaded from the existing users table;
- repair currently deletes event rows; or
- the requested display requires changing the event schema.

## Maintenance notes

New item result types must be added to both the server schema and the display
label map. Reviewers should check that the current row status is not used as a
replacement for event history.
