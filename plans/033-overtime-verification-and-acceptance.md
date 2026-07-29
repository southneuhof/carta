# Plan 033: Complete overtime verification UI and acceptance flow

> **Implementation instructions:** Finish workflow parity only after Plans
> 030–032 pass. This plan may reset/seed a database, but only after proving the
> target is a disposable development database.
>
> **Drift check:** `git diff --stat 7700799..HEAD -- apps/api/src/routes/overtimes apps/api/src/routes/verification apps/api/src/__tests__ apps/web/src/routes/(authenticated)/hr/overtimes apps/web/src/framework apps/api/scripts`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** HIGH
- **Depends on:** plans/030-overtime-canonical-contract-and-schema.md, plans/031-overtime-api-lookups-and-filters.md, plans/032-overtime-web-field-and-route-parity.md
- **Category:** correctness
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Current API already has draft submission and transactional verification chain
routes, but the web resource does not expose the complete workflow and there is
no final parity acceptance pass with seeded data. HKA's screen provides
verification-side actions and status/detail feedback. This plan connects only
the existing authorized API behavior, then proves the full flow end to end.

## Current workflow evidence

- `apps/api/src/routes/overtimes/overtimes.model.ts:34-76` exposes create,
  update, submit, verify, and steps; no delete for submitted records.
- `apps/api/src/routes/overtimes/overtimes.routes.ts:58-90` permits only draft
  submission by applicant/all-scope and transitions to waiting transactionally.
- `apps/api/src/routes/overtimes/overtimes.routes.ts:144-179` verifies only
  waiting records, checks current chain step and section/job-position/recipient
  authorization, then advances transactionally.
- HKA view
  `/Users/gamer/Documents/projects/hka-trom/frontend/src/views/authenticated/hr/overtimes/overtimes.vue`
  projects verification actions beside detail.

## Scope

**In scope**

- route-owned overtime submit/approve/reject controls and detail timeline
- typed operations calls for existing submit/verify/steps endpoints
- API/web workflow tests
- development seed fixtures and documented acceptance commands

**Out of scope**

- changing authorization policy or chain algorithm
- adding legacy verification columns unless Plan 030 selected them
- shell, generic notification redesign, unrelated modules

## Steps

### Step 1: Confirm endpoint/RPC types

Read generated RPC types and ensure submit/verify/steps operations expose exact
request/response types. Add typed wrappers if missing; do not cast around the
RPC contract.

**Verify:** web type tests compile calls with approved/rejected and optional
description; invalid decisions fail type-check fixtures.

### Step 2: Add route-owned workflow controls

On detail route, show submit only for draft + eligible applicant; show
approve/reject only for waiting + API-authorized capability; show timeline from
steps endpoint. Keep controls out of resource definition. Invalidate/refetch
detail and steps after mutation; display server errors verbatim enough for user
action without leaking stack traces.

**Verify:** web component/route tests cover visibility by status, mutation
payload, invalidation, success/error state, and no controls for unauthorized
users.

### Step 3: Add API regression coverage

Extend `apps/api/src/__tests__/overtimes.spec.ts` for draft submit, duplicate
submit, unauthorized submit, waiting verify, wrong section/job position,
recipient exception, rejected/approved terminal states, duplicate verify race,
and timeline visibility.

**Verify:** focused API test file passes; all existing API tests remain green.

### Step 4: Prove disposable DB and refresh

Inspect `.env` and connection target. Stop if target cannot be proven development.
After operator confirmation, run `pnpm --filter @southneuhof/api db:refresh`,
seed sections/employees/job positions/users/configured chain/overtime rows for
all statuses, then run `db:smoke`.

**Verify:** smoke passes and seeded IDs are not production identifiers.

### Step 5: Execute acceptance matrix

Run list filters, create dependency form, draft edit, submit, notification,
authorized approve/reject, unauthorized denial, detail timeline, and final
status formatting. Record expected/actual result in a checked-in test or
acceptance note, not an untracked screenshot only.

**Verify:** API tests, web tests, web build/typecheck, and acceptance matrix all
pass.

## Test plan

- API workflow matrix from existing overtime tests.
- Web detail/control tests modeled after route tests and notification tests.
- Seed consistency test for required chain/configuration fixtures.

## Done criteria

- [ ] Typed submit/verify/steps operations wired.
- [ ] Route controls obey status and authorization; no client-only security.
- [ ] Full API/web regression suite passes.
- [ ] Confirmed dev DB refresh + smoke + acceptance matrix pass.
- [ ] No policy/schema/shell scope creep; index updated.

## STOP conditions

- RPC types do not expose existing endpoints without changing shared transport.
- UI capability cannot be derived without duplicating authorization logic.
- DB target is not provably disposable development DB.
- Acceptance reveals HKA policy conflict with current transactional chain.

## Maintenance notes

Keep API authorization authoritative. Any new workflow action needs a server
route, typed RPC proof, route-owned UI control, and unauthorized regression test.
