# Plan 031: Implement overtime API lookups and filters

> **Implementation instructions:** Build API/query behavior against Plan 030's
> canonical contract. Do not change schema naming or web presentation here.
>
> **Drift check:** `git diff --stat 7700799..HEAD -- apps/api/src/routes/overtimes apps/api/src/routes/organization apps/api/src/routes/employees apps/api/src/routes/index.ts apps/api/src/__tests__`

## Status

- **Priority:** P1
- **Effort:** M
- **Risk:** MED
- **Depends on:** `plans/030-overtime-canonical-contract-and-schema.md`
- **Category:** correctness
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

HKA's overtime list is not merely an unfiltered collection. It supports section,
employee, date-range, job-position, and status filters; applicant lookup is
dependent on selected section. Current scoped source/list behavior does not
expose this complete contract. Implementing it at the API boundary keeps
permissions and query semantics server-authoritative.

## Current/reference evidence

- Current source: `apps/api/src/routes/overtimes/overtimes.source.ts` scopes
  rows by organization identity and returns list data/total.
- Current model: `apps/api/src/routes/overtimes/overtimes.model.ts:24-33`
  wires list/detail/create/update and organization scoping.
- Reference config:
  `/Users/gamer/Documents/projects/hka-trom/frontend/src/app/configs/overtimes.ts:13-33`
  lists `section_id`, `employee_id`, `start_date`, `end_date`,
  `job_position_id`, `status_code`.
- Reference applicant dependency:
  `overtimes.ts:107-128` only shows applicant lookup after section selection
  and sends section plus `{ for: 'hr-applicant' }`.

## Scope

**In scope**

- overtime source/model/list query parsing
- organization/employee/job-position lookup endpoints or typed projections
  only where current API lacks required data
- API tests

**Out of scope**

- schema/field renames (030)
- Vue fields/forms/menu (032)
- verification UI/DB reset (033)
- generic lookup framework

## Steps

### Step 1: Trace query contract

Read Sprindle list query schemas and existing filtered sources. Define exact
serializable query keys, types, date inclusivity/timezone, empty-value handling,
and permission scope. Do not accept arbitrary SQL operators or raw column names.

**Verify:** type-only query contract rejects unknown keys and documents date
boundary behavior.

### Step 2: Add filters

Implement section, applicant/employee, job position, inclusive start/end date,
and status filters using Drizzle expressions and existing scope predicate.
Confirm filters compose with organization scope and pagination/sorting.
Use indexes only if schema evidence supports them; do not claim performance
improvement without query/schema review.

**Verify:** API tests cover each filter, combinations, empty result, pagination,
and cross-section denial.

### Step 3: Add typed lookup behavior

Expose section and applicant/job-position projections using current API
patterns. Applicant lookup must require/accept section scope and preserve
authorization. Match HKA display fields (`section_name`, `fullname`, job
position name) through typed responses, not client-side joins.

**Verify:** tests prove section-scoped applicant results and no data leakage.

### Step 4: Preserve create/update invariants

Ensure adding query support cannot make client-provided applicant, section, or
status authoritative. Re-run draft/update restrictions and organization scope
tests.

**Verify:** full API test suite passes and derived-field tests remain green.

## Test plan

Model tests after `apps/api/src/__tests__/overtimes.spec.ts` and
`seed-consistency.spec.ts`: filter matrix, lookup scope, pagination, invalid
dates/status, and unauthorized cross-section access.

## Done criteria

- [ ] All five HKA filter dimensions supported with documented semantics.
- [ ] Dependent applicant lookup is section-scoped and typed.
- [ ] Existing auth/ownership/status invariants unchanged.
- [ ] API tests/typecheck pass.
- [ ] No UI/schema scope creep; index updated.

## STOP conditions

- Existing list parser cannot represent date ranges without changing shared
  framework contract.
- Job-position relation is absent and adding it requires unrelated schema work.
- Query scope conflicts with current organization authorization.

## Maintenance notes

Keep query keys in operations/resource adapters synchronized with this API.
Future filters must add authorization tests, not only happy-path snapshots.
