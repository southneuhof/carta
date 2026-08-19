# Plan 078: Complete the Quality Inspection audit history

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap`. Reuse `Timeline`, `Card`, `Chip`, and existing table
> surfaces. Keep every event append-only. Do not add notifications or Todo.

## Status

- **Priority**: P0
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/074-render-quality-inspection-item-history.md, plans/077-align-quality-inspection-pts-presentation.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

Quality Inspection is an auditable decision workflow. The current page shows
activity and report verification rows, but it does not show actor names and it
does not show item verification or PTS rejection actors. The approved design
requires a complete record of item results, report results, repair, pending,
and repeated rejection events.

## Current state

- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:320-330`
  loads report events, PTS rejection events, and activity logs, but returns raw
  rows without user display joins.
- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:338-365`
  returns item verification events and report events.
- `apps/api/src/routes/notifications/notifications.entity.ts:48-66`
  stores the activity actor in `actorUserId` and the event time in `createdAt`.
- `apps/api/src/routes/quality-inspection/quality-inspection.entity.ts:116-155`
  stores item verifier, report verifier, PTS rejecting user, descriptions, and
  event times.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/[qualityInspectionId]/detail.route.vue:91`
  renders only activity short descriptions/times and report result code,
  description, and time.
- The legacy workflow records activity after each action in the backend
  services, including item verification and final report verification.

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
- Reuse `Timeline` for activity and report events, and `Card`/`Table` for
  grouped item and PTS events.
- Add only QI route-local display helpers. Do not create a generic audit
  framework.

## Scope

**In scope**:

- API actor joins/mapping for QI activity, item events, report events, and PTS
  rejection events.
- QI detail complete history display.
- Focused API/web tests.
- `plans/README.md` status row.

**Out of scope**:

- Event schema changes unless an existing foreign key is missing.
- Notifications and Todo.
- PTS workflow, evidence export, KPI, mobile, and framework source.

## Steps

### Step 1: Return display actors in one detail contract

Batch-load distinct user IDs referenced by activity, item verification, report
verification, and PTS rejection rows. Return display names beside the raw IDs,
without changing event storage. Preserve event ordering and timestamps.

**Verify**: API tests create events from multiple actors and assert all actor
names are returned without extra per-event queries.

### Step 2: Build one complete history view

Render these groups in the QI detail page:

- Activity timeline.
- Item verification history.
- Report verification history.
- PTS rejection history.

Show action/result label, actor, date/time, and note. Include repair and pending
events. Keep repeated item rejection events. Use legacy labels while retaining
the approved result codes.

**Verify**: web tests cover a full sequence:

`Diterima → Diperbaiki → Ditolak → PTS rejection`

and prove no event is hidden.

### Step 3: Keep history immutable through repair

Confirm the repair operation resets current item state but does not delete
item or report history. If current behavior deletes events, stop; do not alter
the event model in this plan without a new migration decision.

**Verify**: API test checks event counts before and after repair.

### Step 4: Verify the history surface

Use T3 preview to confirm the history is readable, sorted, and complete on a
narrow viewport. Check that actor names and times are visible without opening
developer tools.

**Verify**: browser check passes or the exact limitation is reported.

## Test plan

- Extend `apps/api/src/__tests__/quality-inspection.spec.ts` with multiple
  actors and every event type.
- Add QI detail route tests for labels, actor names, ordering, and repeated
  events.
- Do not add pixel snapshots.

## Done criteria

- [ ] All four history groups are visible.
- [ ] Every event has actor, time, result/action, and note where available.
- [ ] Repair does not remove history.
- [ ] API actor loading is batched.
- [ ] All commands pass and browser behavior is checked or reported.
- [ ] No Todo/notification or generic audit framework is added.
- [ ] `plans/README.md` marks Plan 078 DONE after review.

## STOP conditions

Stop and report if:

- an event does not have a valid existing user reference;
- repair deletes append-only events;
- actor joins cause an unbounded query pattern; or
- complete history requires a new cross-module event architecture.

## Maintenance notes

New QI actions must write an activity record and, when a decision occurs, an
append-only event. Reviewers should check both storage and visible history for
every new action.
